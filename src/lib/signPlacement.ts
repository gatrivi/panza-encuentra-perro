/**
 * Asesor de carteles — dónde pegar ahora y cómo pegarlo bien.
 * Puro y testeable (sin Firebase): la UI alimenta avistajes, POIs del
 * catálogo, carteles activos y el reloj.
 *
 * Prioridad = gravedad de avistajes recientes (confianza × recencia)
 *           + peso estático de POIs de alto tránsito (potenciado si hay
 *             avistaje fresco a menos de un par de cuadras)
 *           − supresión de puntos que ya tienen cartel activo cerca.
 */

import { haversineM } from '@/lib/geo'
import { formatAge } from '@/i18n/es-AR'
import type { EffectivePoi, PoiKind } from '@/lib/poiCatalog'
import type { SignTier, Sighting, SightingConfidence } from '@/domain/schemas'

export type SignPointLike = { lat: number; lng: number }

export type SignCandidateKind = PoiKind | 'hotspot'

export type SignCandidate = {
  id: string
  label: string
  kind: SignCandidateKind
  point: SignPointLike
  /** 0–12. Deterministic given the same inputs + now. */
  score: number
  tier: SignTier
  reasons: string[]
  /** Cómo pegarlo en ese tipo de lugar (es-AR). */
  how: string
  sightingIds: string[]
}

/** Un cartel activo dentro de este radio suprime la sugerencia. */
export const SIGN_SUPPRESS_M = 45
/** Avistajes a ≤ este radio se agrupan como un solo hotspot. */
export const HOTSPOT_MERGE_M = 150
/** Un POI se potencia si hay hotspot a menos de esta distancia. */
export const HOTSPOT_BOOST_M = 400

const CONFIDENCE_W: Record<SightingConfidence, number> = {
  confirmed: 1,
  probable: 0.8,
  unverified: 0.45,
  rejected: 0,
}

const CONFIDENCE_LABEL: Record<SightingConfidence, string> = {
  confirmed: 'Avistaje confirmado',
  probable: 'Avistaje probable',
  unverified: 'Tip sin verificar',
  rejected: '',
}

/** Recencia 1 → 0.15 según edad del observado (no del ingreso). */
export function sightingRecencyW(observedAt: Date, now: number): number {
  const ageH = Math.max(0, (now - observedAt.getTime()) / 3_600_000)
  if (ageH <= 2) return 1
  if (ageH <= 6) return 0.85
  if (ageH <= 24) return 0.65
  if (ageH <= 72) return 0.4
  return 0.15
}

function sightingW(s: Sighting, now: number): number {
  return CONFIDENCE_W[s.confidence] * sightingRecencyW(s.observedAt, now)
}

export type SightingHotspot = {
  center: SignPointLike
  /** Σ confianza×recencia, tope 1.5 (varios reportes = más prioridad). */
  weight: number
  /** Ordenados por peso desc — [0] es el reporte fresco. */
  members: Sighting[]
}

/** Greedy: el reporte más pesado funda el grupo; los ≤150 m se le suman. */
export function clusterSightings(
  sightings: readonly Sighting[],
  now: number,
): SightingHotspot[] {
  const weighted = sightings
    .map((s) => ({ s, w: sightingW(s, now) }))
    .filter((x) => x.w > 0)
    .sort((a, b) => b.w - a.w)
  const clusters: SightingHotspot[] = []
  for (const { s, w } of weighted) {
    const p = { lat: s.point[1], lng: s.point[0] }
    const hit = clusters.find((c) => haversineM(c.center, p) <= HOTSPOT_MERGE_M)
    if (hit) {
      hit.weight = Math.min(1.5, hit.weight + w)
      hit.members.push(s)
    } else {
      clusters.push({ center: p, weight: w, members: [s] })
    }
  }
  return clusters
}

function isCovered(point: SignPointLike, signs: readonly SignPointLike[]): boolean {
  return signs.some((s) => haversineM(s, point) <= SIGN_SUPPRESS_M)
}

/** tiers por score: ≥8 A (A4 grande), ≥5.5 B, resto C. */
export function tierForScore(score: number): SignTier {
  if (score >= 8) return 'A'
  if (score >= 5.5) return 'B'
  return 'C'
}

function directionHint(d: Sighting['direction']): string | null {
  if (!d || d === 'unknown' || d === 'stationary') return null
  return `iba al ${d}`
}

const HOW_BY_KIND: Record<SignCandidateKind, string> = {
  hotspot:
    'Cartel en la esquina del avistaje, mirando a la calle por donde vino. Si se movió, cubrí la esquina hacia donde iba.',
  cross:
    'Uno por esquina del cruce, de cara al cruce: tiene que verse al doblar. A altura de ojos (~1,5 m).',
  gas:
    'Pedí permiso en el kiosco y pegá donde se hace la fila (surtidores / vidriera). Gente parada = gente que lee.',
  station:
    'Acceso del andén y la rampa, donde la gente espera mirando la calle. Evité la vía.',
  shop:
    'Vidriera o cartel interno con permiso del encargado: con permiso dura semanas, sin permiso lo bajan en horas.',
  plaza:
    'Entrada principal + entrada de paseadores, a la altura de ojos. Mañana y tarde son las horas pico.',
  health:
    'Veterinarias / CAPS: pegalo adentro si te lo permiten. Ahí entran justamente los que encuentran perros.',
  via:
    'Siempre sobre la calle paralela o vereda amplia, nunca sobre la calzada rápida. Poste a 1,5 m, sin tapar señales.',
  other:
    'Poste a ~1,5 m, de cara al tránsito lento o al peatón que espera. Sin tapar señalética.',
}

/** Cómo pegar bien — checklist universal (orden = orden de pegado). */
export const SIGN_CHECKLIST: readonly string[] = [
  'Altura de ojos (~1,5 m): se lee sin estirarse ni agacharse.',
  'De cara al tránsito o al peatón que espera, nunca de espaldas.',
  'No tapar señales, semáforos ni diferencias de paso: los sacan igual.',
  'Teléfono y QR bien grandes: el que la ve tiene que poder avisar sin pensar.',
  'Foto del cartel puesto: es el registro para saber cuándo reponerlo.',
  'Antes de irte de la zona, reponé los que viste caídos o despegados.',
]

export function howForKind(kind: SignCandidateKind): string {
  return HOW_BY_KIND[kind]
}

function hotspotCandidate(
  hotspot: SightingHotspot,
  activeSigns: readonly SignPointLike[],
  now: number,
): SignCandidate | null {
  if (isCovered(hotspot.center, activeSigns)) return null
  const fresh = hotspot.members[0]!
  const reasons = [
    `${CONFIDENCE_LABEL[fresh.confidence]} · hace ${formatAge(now - fresh.observedAt.getTime())}`,
  ]
  const dir = directionHint(fresh.direction)
  if (dir) reasons.push(dir)
  if (hotspot.members.length > 1) {
    reasons.push(`${hotspot.members.length} reportes en la misma cuadra`)
  }
  const score = 4 + 4 * hotspot.weight
  return {
    id: `hot:${fresh.id}`,
    label: 'Zona del último avistaje',
    kind: 'hotspot',
    point: hotspot.center,
    score: Math.round(score * 10) / 10,
    tier: tierForScore(score),
    reasons,
    how: HOW_BY_KIND.hotspot,
    sightingIds: hotspot.members.map((m) => m.id),
  }
}

function poiCandidate(
  poi: EffectivePoi,
  hotspots: readonly SightingHotspot[],
  activeSigns: readonly SignPointLike[],
  now: number,
): SignCandidate | null {
  if (!poi.on) return null
  if (isCovered(poi, activeSigns)) return null
  let boost = 0
  let boostReason: string | null = null
  for (const h of hotspots) {
    const d = haversineM(poi, h.center)
    if (d > HOTSPOT_BOOST_M) continue
    const b = h.weight * 3 * (1 - d / HOTSPOT_BOOST_M)
    if (b > boost) {
      boost = b
      boostReason = `avistaje hace ${formatAge(
        now - h.members[0]!.observedAt.getTime(),
      )} a ${Math.round(d)} m`
    }
  }
  const reasons = [poi.why]
  if (boostReason) reasons.push(boostReason)
  const score = Math.min(12, poi.w * 0.7 + boost)
  return {
    id: `poi:${poi.id}`,
    label: poi.label,
    kind: poi.kind,
    point: { lat: poi.lat, lng: poi.lng },
    score: Math.round(score * 10) / 10,
    tier: tierForScore(score),
    reasons,
    how: HOW_BY_KIND[poi.kind] ?? HOW_BY_KIND.other,
    sightingIds: [],
  }
}

export function rankSignSpots(input: {
  pois: readonly EffectivePoi[]
  sightings: readonly Sighting[]
  activeSigns: readonly SignPointLike[]
  now?: number
  limit?: number
}): SignCandidate[] {
  const now = input.now ?? Date.now()
  const hotspots = clusterSightings(
    input.sightings.filter((s) => s.confidence !== 'rejected'),
    now,
  )
  const candidates: SignCandidate[] = []
  for (const h of hotspots) {
    if (h.weight < 0.4) continue
    const c = hotspotCandidate(h, input.activeSigns, now)
    if (c) candidates.push(c)
  }
  for (const poi of input.pois) {
    const c = poiCandidate(poi, hotspots, input.activeSigns, now)
    if (c) candidates.push(c)
  }
  return candidates
    .sort((a, b) => b.score - a.score || a.label.localeCompare(b.label, 'es'))
    .slice(0, input.limit ?? 8)
}
