import { describe, expect, it } from 'vitest'
import type { Lead } from '@/domain/schemas'
import {
  extractPhones,
  findDuplicateCandidates,
  normalizeText,
  scoreLeadPair,
  textSimilarity,
} from './leadDedupe'

function makeLead(overrides: Partial<Lead> & { id: string }): Lead {
  const now = new Date('2026-07-25T12:00:00Z')
  return {
    id: overrides.id,
    caseId: 'case_x',
    origin: 'facebook',
    rawText: undefined,
    attachmentPaths: [],
    capturedAt: now,
    reporter: {},
    parserSuggestions: { dates: [], locations: [], phones: [], keywords: [] },
    status: 'new',
    priority: 'normal',
    ...overrides,
  } as Lead
}

describe('normalizeText', () => {
  it('strips accents, case and punctuation', () => {
    expect(normalizeText('¡Perdida!! MARRÓN, con mancha')).toBe('perdida marron con mancha')
  })
})

describe('textSimilarity', () => {
  it('flags a repost with noise added around the original', () => {
    const original =
      'Se busca perra Panza marrón con collar violeta vista cerca del Parque Sarmiento'
    const repost = 'COMPARTIR!!! se busca perra panza marron con collar violeta vista cerca del parque sarmiento por favor'
    expect(textSimilarity(original, repost)).toBeGreaterThanOrEqual(0.6)
  })

  it('keeps unrelated posts apart', () => {
    expect(
      textSimilarity('Se busca perra marrón en Martelli', 'Encontré gato atigrado en Olivos'),
    ).toBeLessThan(0.2)
  })
})

describe('extractPhones', () => {
  it('normalizes separator noise and keeps last 10 digits', () => {
    expect(extractPhones('llamar al 11-5619-4761!!')).toEqual(['1156194761'])
    expect(extractPhones('tel 5491130400210')).toEqual(['1130400210'])
  })
})

describe('scoreLeadPair', () => {
  it('same phone in text flags the reason but alone is weak (owner number noise)', () => {
    const a = makeLead({ id: 'a', rawText: 'La vi, llamar al 11 5619 4761' })
    const b = makeLead({ id: 'b', rawText: 'Sigo viendo a la perra. 1156194761' })
    const m = scoreLeadPair(a, b)!
    expect(m).not.toBeNull()
    expect(m.reasons).toContain('same_phone')
    expect(m.score).toBeLessThan(0.6)
  })

  it('same reporter phone is a strong signal', () => {
    const a = makeLead({
      id: 'a',
      reporter: { name: 'Marta', phone: '1130400210' },
      claimedPoint: [-58.51, -34.563],
    })
    const b = makeLead({
      id: 'b',
      reporter: { name: 'Marta G.', phone: '+54 9 11 3040-0210' },
      claimedPoint: [-58.518, -34.56],
    })
    const m = scoreLeadPair(a, b)!
    expect(m.reasons).toContain('same_phone')
    expect(m.score).toBeGreaterThanOrEqual(0.6)
  })

  it('same sourceUrl is a match regardless of text', () => {
    const a = makeLead({ id: 'a', sourceUrl: 'https://facebook.com/groups/x/posts/1' })
    const b = makeLead({
      id: 'b',
      sourceUrl: 'https://facebook.com/groups/x/posts/1',
      rawText: 'otra cosa',
    })
    const m = scoreLeadPair(a, b)!
    expect(m.reasons).toContain('same_link')
    expect(m.score).toBeGreaterThanOrEqual(0.6)
  })

  it('same H3 cell within 3h counts, far apart does not', () => {
    const point: [number, number] = [-58.51, -34.563]
    const t = new Date('2026-07-25T10:00:00Z')
    const near = makeLead({
      id: 'near',
      claimedPoint: [-58.5101, -34.5631],
      claimedObservationAt: t,
    })
    const far = makeLead({
      id: 'far',
      claimedPoint: [-58.55, -34.6],
      claimedObservationAt: t,
    })
    const late = makeLead({
      id: 'late',
      claimedPoint: point,
      claimedObservationAt: new Date('2026-07-25T20:00:00Z'),
    })
    const base = makeLead({ id: 'base', claimedPoint: point, claimedObservationAt: t })
    expect(scoreLeadPair(base, near)?.reasons).toContain('same_place_time')
    expect(scoreLeadPair(base, far)?.reasons ?? []).not.toContain('same_place_time')
    expect(scoreLeadPair(base, late)?.reasons ?? []).not.toContain('same_place_time')
  })
})

describe('findDuplicateCandidates', () => {
  it('prefers non-duplicate anchors and returns strongest first', () => {
    const original = makeLead({
      id: 'orig',
      rawText: 'Panza vista en la banquina de Gral Paz cerca de Maipú, asustada',
      sourceUrl: 'https://facebook.com/groups/g/posts/100',
    })
    const dupOfOrig = makeLead({
      id: 'dup',
      status: 'duplicate',
      duplicateOf: 'orig',
      rawText: 'Panza vista en la banquina de Gral Paz cerca de Maipú',
    })
    const fresh = makeLead({
      id: 'fresh',
      rawText: 'COMPARTIR panza vista en la banquina de gral paz cerca de maipu asustada',
    })
    const matches = findDuplicateCandidates(
      fresh,
      [dupOfOrig, original],
      undefined,
      undefined,
      fresh.capturedAt.getTime(),
    )
    expect(matches.length).toBeGreaterThan(0)
    expect(matches[0]!.lead.id).toBe('orig')
  })

  it('ignores stale leads', () => {
    const old = makeLead({
      id: 'old',
      capturedAt: new Date('2026-06-01T00:00:00Z'),
      rawText: 'identico texto identico texto',
    })
    const fresh = makeLead({ id: 'fresh', rawText: 'identico texto identico texto' })
    expect(
      findDuplicateCandidates(fresh, [old], undefined, undefined, fresh.capturedAt.getTime()),
    ).toHaveLength(0)
  })
})
