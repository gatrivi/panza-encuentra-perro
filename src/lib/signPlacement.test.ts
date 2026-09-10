import { describe, expect, it } from 'vitest'
import type { GeoPoint, Sighting } from '@/domain/schemas'
import type { EffectivePoi } from '@/lib/poiCatalog'
import {
  clusterSightings,
  HOTSPOT_BOOST_M,
  rankSignSpots,
  sightingRecencyW,
  SIGN_CHECKLIST,
  SIGN_SUPPRESS_M,
  tierForScore,
} from './signPlacement'

const NOW = Date.parse('2026-09-09T12:00:00')

let seq = 0
function mkSighting(input: {
  point: GeoPoint
  ageH?: number
  confidence?: Sighting['confidence']
  direction?: Sighting['direction']
}): Sighting {
  seq += 1
  const ageH = input.ageH ?? 1
  return {
    id: `s${seq}`,
    caseId: 'c1',
    observedAt: new Date(NOW - ageH * 3_600_000),
    reportedAt: new Date(NOW - ageH * 3_600_000),
    point: input.point,
    direction: input.direction ?? 'unknown',
    movement: 'moving',
    confidence: input.confidence ?? 'confirmed',
    evidence: { leadIds: [], photos: [], sourceLinks: [] },
    description: '',
    createdByUid: 'paula',
    affectsOfficialZone: false,
  }
}

function mkPoi(input: Partial<EffectivePoi> & { id: string }): EffectivePoi {
  return {
    label: input.id,
    why: 'alto tránsito',
    lat: -34.55,
    lng: -58.51,
    defaultW: 5,
    kind: 'other',
    w: 5,
    on: true,
    ...input,
  }
}

const MARTELLI: GeoPoint = [-58.508, -34.551]

describe('signPlacement · recencia', () => {
  it('decae de 1 a 0.15', () => {
    expect(sightingRecencyW(new Date(NOW - 30 * 60_000), NOW)).toBe(1)
    expect(sightingRecencyW(new Date(NOW - 4 * 3_600_000), NOW)).toBe(0.85)
    expect(sightingRecencyW(new Date(NOW - 12 * 3_600_000), NOW)).toBe(0.65)
    expect(sightingRecencyW(new Date(NOW - 48 * 3_600_000), NOW)).toBe(0.4)
    expect(sightingRecencyW(new Date(NOW - 10 * 24 * 3_600_000), NOW)).toBe(0.15)
  })
})

describe('signPlacement · hotspots', () => {
  it('agrupa avistajes a ≤150 m en un solo hotspot', () => {
    const a = mkSighting({ point: MARTELLI })
    const b = mkSighting({ point: [-58.5088, -34.5512] }) // ~80 m
    const far = mkSighting({ point: [-58.53, -34.56] })
    const clusters = clusterSightings([a, b, far], NOW)
    expect(clusters).toHaveLength(2)
    const big = clusters.find((c) => c.members.length === 2)
    expect(big?.members.map((m) => m.id).sort()).toEqual([a.id, b.id].sort())
  })

  it('varios reportes suben el peso hasta el tope 1.5', () => {
    const a = mkSighting({ point: MARTELLI })
    const b = mkSighting({ point: MARTELLI, confidence: 'probable' })
    const c = mkSighting({ point: MARTELLI, confidence: 'unverified' })
    const [cluster] = clusterSightings([a, b, c], NOW)
    expect(cluster?.weight).toBe(1.5)
  })
})

describe('signPlacement · ranking', () => {
  it('avistaje fresco confirmado = tier A con motivo de confianza', () => {
    const s = mkSighting({ point: MARTELLI })
    const out = rankSignSpots({
      pois: [],
      sightings: [s],
      activeSigns: [],
      now: NOW,
    })
    const hot = out.find((c) => c.id === `hot:${s.id}`)
    expect(hot).toBeDefined()
    expect(hot!.tier).toBe('A')
    expect(hot!.reasons[0]).toContain('Avistaje confirmado')
    expect(hot!.sightingIds).toContain(s.id)
  })

  it('dirección conocida entra como motivo', () => {
    const s = mkSighting({ point: MARTELLI, direction: 'NE' })
    const [hot] = rankSignSpots({
      pois: [],
      sightings: [s],
      activeSigns: [],
      now: NOW,
    })
    expect(hot?.reasons.join(' ')).toContain('iba al NE')
  })

  it('tip viejo sin verificar no genera hotspot', () => {
    const s = mkSighting({
      point: MARTELLI,
      ageH: 24 * 10,
      confidence: 'unverified',
    })
    const out = rankSignSpots({
      pois: [],
      sightings: [s],
      activeSigns: [],
      now: NOW,
    })
    expect(out.filter((c) => c.kind === 'hotspot')).toHaveLength(0)
  })

  it('cartel activo a ≤45 m suprime la sugerencia', () => {
    const s = mkSighting({ point: MARTELLI })
    const covered = rankSignSpots({
      pois: [],
      sightings: [s],
      activeSigns: [{ lat: MARTELLI[1], lng: MARTELLI[0] }],
      now: NOW,
    })
    expect(covered.filter((c) => c.kind === 'hotspot')).toHaveLength(0)

    const nearby = rankSignSpots({
      pois: [],
      sightings: [s],
      activeSigns: [
        {
          lat: MARTELLI[1] + SIGN_SUPPRESS_M * 4,
          lng: MARTELLI[0],
        },
      ],
      now: NOW,
    })
    expect(nearby.some((c) => c.kind === 'hotspot')).toBe(true)
  })

  it('POI cerca de avistaje fresco se potencia y supera al POI lejano', () => {
    const s = mkSighting({ point: MARTELLI })
    const near = mkPoi({ id: 'near', lat: MARTELLI[1], lng: MARTELLI[0], w: 9 })
    const farAway = mkPoi({
      id: 'far',
      lat: MARTELLI[1] + HOTSPOT_BOOST_M * 4,
      lng: MARTELLI[0],
      w: 9,
    })
    const out = rankSignSpots({
      pois: [farAway, near],
      sightings: [s],
      activeSigns: [],
      now: NOW,
    })
    const nearC = out.find((c) => c.id === 'poi:near')!
    expect(nearC).toBeDefined()
    expect(nearC.score).toBeGreaterThan(9 * 0.7)
    expect(nearC.reasons.join(' ')).toContain('avistaje hace')
    expect(nearC.reasons.join(' ')).toContain('alto tránsito')
    const farC = out.find((c) => c.id === 'poi:far')!
    expect(farC.score).toBeCloseTo(6.3, 5)
    expect(nearC.score).toBeGreaterThan(farC.score)
  })

  it('POI apagado no aparece', () => {
    const out = rankSignSpots({
      pois: [mkPoi({ id: 'off', on: false })],
      sightings: [],
      activeSigns: [],
      now: NOW,
    })
    expect(out.filter((c) => c.id === 'poi:off')).toHaveLength(0)
  })

  it('respeta el límite y ordena por score', () => {
    const s = mkSighting({ point: MARTELLI })
    const out = rankSignSpots({
      pois: [mkPoi({ id: 'a' }), mkPoi({ id: 'b' }), mkPoi({ id: 'c' })],
      sightings: [s],
      activeSigns: [],
      now: NOW,
      limit: 2,
    })
    expect(out).toHaveLength(2)
    for (let i = 1; i < out.length; i++) {
      expect(out[i]!.score).toBeLessThanOrEqual(out[i - 1]!.score)
    }
  })
})

describe('signPlacement · guía', () => {
  it('tier corta por score', () => {
    expect(tierForScore(9)).toBe('A')
    expect(tierForScore(7)).toBe('B')
    expect(tierForScore(3)).toBe('C')
  })

  it('checklist universal presente', () => {
    expect(SIGN_CHECKLIST.length).toBeGreaterThanOrEqual(5)
    expect(SIGN_CHECKLIST.join(' ')).toContain('1,5 m')
  })

  it('cada candidato trae su cómo', () => {
    const s = mkSighting({ point: MARTELLI })
    const out = rankSignSpots({
      pois: [mkPoi({ id: 'gas', kind: 'gas', why: 'nafta 24 h' })],
      sightings: [s],
      activeSigns: [],
      now: NOW,
    })
    for (const c of out) {
      expect(c.how.length).toBeGreaterThan(10)
    }
    const gas = out.find((c) => c.id === 'poi:gas')!
    expect(gas.how).toContain('permiso')
  })
})
