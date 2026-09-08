import { latLngToCell } from 'h3-js'
import type { GeoPoint, Lead } from '@/domain/schemas'

/**
 * Deduplication of leads — the "same FB post pasted five times" problem.
 *
 * Signals (any strong one alone is enough to suggest a merge):
 * - normalized-text similarity (token Jaccard / containment — reposts often
 *   add "COMPARTIR!!" around the original text)
 * - same normalized phone anywhere in the text
 * - same sourceUrl
 * - same attachment (photo URL)
 * - same H3 cell (res 9, ~170m) within a few hours of claimed observation
 */

export const DUPLICATE_THRESHOLD = 0.6

const REPOST_NOISE = [
  'compartir',
  'comparte',
  'shared',
  'repost',
  'por favor',
  'please',
  'seguir compartiendo',
]

/** lowercase, sin acentos, sin puntuación, espacios colapsados */
export function normalizeText(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function tokens(text: string): string[] {
  const norm = normalizeText(text)
  if (!norm) return []
  return norm.split(' ').filter((w) => w.length > 2 && !REPOST_NOISE.includes(w))
}

/** Jaccard over token sets + containment (repost ⊂ original) */
export function textSimilarity(a: string, b: string): number {
  const ta = new Set(tokens(a))
  const tb = new Set(tokens(b))
  if (ta.size === 0 || tb.size === 0) return 0
  let inter = 0
  for (const t of ta) if (tb.has(t)) inter += 1
  const union = ta.size + tb.size - inter
  const jaccard = inter / union
  const containment = inter / Math.min(ta.size, tb.size)
  return Math.max(jaccard, containment * 0.9)
}

/** Keep the last 10 digits of any number ≥ 8 digits (AR mobiles are 10). */
export function extractPhones(text: string): string[] {
  const norm = normalizeText(text)
  const found = new Set<string>()
  // digits separated by spaces/dashes form one number: "11-5619-4761"
  for (const raw of norm.match(/\d[\d ]{6,}\d/g) ?? []) {
    const digits = raw.replace(/\D/g, '')
    if (digits.length >= 8) found.add(digits.slice(-10))
  }
  return [...found]
}

const DEDUP_H3_RES = 9
const DEDUP_TIME_WINDOW_MS = 3 * 60 * 60 * 1000

function samePlaceTime(a: Lead, b: Lead): boolean {
  if (!a.claimedPoint || !b.claimedPoint) return false
  const ta = a.claimedObservationAt?.getTime()
  const tb = b.claimedObservationAt?.getTime()
  if (ta == null || tb == null || Math.abs(ta - tb) > DEDUP_TIME_WINDOW_MS) return false
  return (
    latLngToCell(a.claimedPoint[1], a.claimedPoint[0], DEDUP_H3_RES) ===
    latLngToCell(b.claimedPoint[1], b.claimedPoint[0], DEDUP_H3_RES)
  )
}

export type DedupeReason =
  | 'same_text'
  | 'same_phone'
  | 'same_link'
  | 'same_photo'
  | 'same_place_time'

export type DedupeMatch = {
  lead: Lead
  score: number
  reasons: DedupeReason[]
}

function phonesOf(lead: Pick<Lead, 'rawText' | 'reporter'>): Set<string> {
  const set = new Set(lead.rawText ? extractPhones(lead.rawText) : [])
  if (lead.reporter?.phone) {
    const norm = lead.reporter.phone.replace(/\D/g, '').slice(-10)
    if (norm.length >= 8) set.add(norm)
  }
  return set
}

/** Score one existing lead against a candidate lead for "same report". */
export function scoreLeadPair(a: Lead, b: Lead): DedupeMatch | null {
  if (a.id === b.id) return null
  const reasons: DedupeReason[] = []

  if (a.sourceUrl && b.sourceUrl && a.sourceUrl === b.sourceUrl) reasons.push('same_link')

  const photoA = a.attachmentPaths[0]
  const photoB = b.attachmentPaths[0]
  if (photoA && photoB && photoA === photoB) reasons.push('same_photo')

  const pa = phonesOf(a)
  const pb = phonesOf(b)
  let sameReporterPhone = false
  let sameTextPhone = false
  const ra = a.reporter?.phone?.replace(/\D/g, '').slice(-10)
  const rb = b.reporter?.phone?.replace(/\D/g, '').slice(-10)
  if (ra && rb && ra.length >= 8 && ra === rb) sameReporterPhone = true
  if (!sameReporterPhone) {
    for (const p of pa) if (pb.has(p)) sameTextPhone = true
  }
  if (sameReporterPhone || sameTextPhone) reasons.push('same_phone')

  const sim =
    a.rawText && b.rawText ? textSimilarity(a.rawText, b.rawText) : 0
  if (sim >= 0.5) reasons.push('same_text')

  if (samePlaceTime(a, b)) reasons.push('same_place_time')

  if (reasons.length === 0) return null
  const score =
    Math.min(1, sim + 0.15) * (reasons.includes('same_text') ? 1 : 0.55) +
    // Reporter identity is strong; a shared number inside the text is weak
    // (lost-dog posts all quote the owner's phone).
    (sameReporterPhone ? 0.6 : sameTextPhone ? 0.15 : 0) +
    (reasons.includes('same_link') ? 0.6 : 0) +
    (reasons.includes('same_photo') ? 0.6 : 0) +
    (reasons.includes('same_place_time') ? 0.4 : 0)
  return { lead: b, score: Math.min(1, score), reasons }
}

/**
 * Best duplicate candidates for `lead` among `existing`, strongest first.
 * Anchors prefer leads that are not already marked duplicates themselves.
 */
export function findDuplicateCandidates(
  lead: Lead,
  existing: Lead[],
  threshold = DUPLICATE_THRESHOLD,
  maxAgeMs = 14 * 24 * 60 * 60 * 1000,
  now = Date.now(),
): DedupeMatch[] {
  return existing
    .filter((other) => {
      if (other.id === lead.id) return false
      const age = now - other.capturedAt.getTime()
      return age <= maxAgeMs
    })
    .map((other) => scoreLeadPair(lead, other))
    .filter((m): m is DedupeMatch => m !== null && m.score >= threshold)
    .sort((x, y) => {
      const dupAx = x.lead.status === 'duplicate' ? 1 : 0
      const dupAy = y.lead.status === 'duplicate' ? 1 : 0
      if (dupAx !== dupAy) return dupAx - dupAy
      return y.score - x.score
    })
}
