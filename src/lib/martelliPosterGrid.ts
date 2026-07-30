/**
 * Grilla hardcode Villa Martelli — 1200 slots para cubrir progresivamente.
 * No API/DB: centros de celda ~espaciados en bbox del barrio.
 */

import { haversineM } from '@/lib/geo'

export const MARTELLI_POSTER_TARGET = 1200

/** Bbox Villa Martelli (aprox. Constituyentes–Padilla / oeste–Gral Paz). */
export const MARTELLI_BOUNDS = {
  south: -34.5608,
  west: -58.5245,
  north: -34.5402,
  east: -58.4968,
} as const

export type MartelliSector = 'NO' | 'NE' | 'SO' | 'SE'

export type MartelliSlot = {
  id: string
  n: number
  lat: number
  lng: number
  sector: MartelliSector
  row: number
  col: number
}

const ROWS = 40
const COLS = 30 // 40×30 = 1200

function sectorFor(lat: number, lng: number): MartelliSector {
  const { south, west, north, east } = MARTELLI_BOUNDS
  const midLat = (south + north) / 2
  const midLng = (west + east) / 2
  const northSide = lat >= midLat
  const eastSide = lng >= midLng
  if (northSide && !eastSide) return 'NO'
  if (northSide && eastSide) return 'NE'
  if (!northSide && !eastSide) return 'SO'
  return 'SE'
}

let cached: readonly MartelliSlot[] | null = null

/** Deterministic 1200 poster slots covering Villa Martelli. */
export function getMartelliPosterGrid(): readonly MartelliSlot[] {
  if (cached) return cached
  const { south, west, north, east } = MARTELLI_BOUNDS
  const slots: MartelliSlot[] = []
  let n = 1
  for (let row = 0; row < ROWS; row++) {
    const lat = north - ((row + 0.5) / ROWS) * (north - south)
    for (let col = 0; col < COLS; col++) {
      const lng = west + ((col + 0.5) / COLS) * (east - west)
      slots.push({
        id: `vm-${String(n).padStart(4, '0')}`,
        n,
        lat,
        lng,
        sector: sectorFor(lat, lng),
        row,
        col,
      })
      n += 1
    }
  }
  cached = slots
  return slots
}

export type SignPoint = { lat: number; lng: number }

/** Match active signs → nearest open slot within radius (1 sign = 1 slot). */
export function coveredMartelliSlotIds(
  signs: readonly SignPoint[],
  maxMeters = 45,
): Set<string> {
  const grid = getMartelliPosterGrid()
  const covered = new Set<string>()
  for (const sign of signs) {
    let best: MartelliSlot | null = null
    let bestD = maxMeters
    for (const slot of grid) {
      if (covered.has(slot.id)) continue
      const d = haversineM(sign, slot)
      if (d <= bestD) {
        bestD = d
        best = slot
      }
    }
    if (best) covered.add(best.id)
  }
  return covered
}

export type MartelliGridProgress = {
  total: number
  covered: number
  pct: number
  bySector: Record<MartelliSector, { total: number; covered: number }>
}

export function martelliGridProgress(
  signs: readonly SignPoint[],
): MartelliGridProgress {
  const grid = getMartelliPosterGrid()
  const covered = coveredMartelliSlotIds(signs)
  const bySector: MartelliGridProgress['bySector'] = {
    NO: { total: 0, covered: 0 },
    NE: { total: 0, covered: 0 },
    SO: { total: 0, covered: 0 },
    SE: { total: 0, covered: 0 },
  }
  for (const slot of grid) {
    bySector[slot.sector].total += 1
    if (covered.has(slot.id)) bySector[slot.sector].covered += 1
  }
  const coveredN = covered.size
  return {
    total: grid.length,
    covered: coveredN,
    pct: Math.min(100, Math.round((coveredN / grid.length) * 100)),
    bySector,
  }
}

/** Next open slots nearest to a field position (demo / itinerario). */
export function nearestOpenMartelliSlots(
  from: SignPoint,
  covered: Set<string>,
  limit = 20,
): MartelliSlot[] {
  return getMartelliPosterGrid()
    .filter((s) => !covered.has(s.id))
    .map((s) => ({ s, d: haversineM(from, s) }))
    .sort((a, b) => a.d - b.d)
    .slice(0, limit)
    .map((x) => x.s)
}
