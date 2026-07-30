/**
 * Puntos de valor (anclas de alto impacto) + ruta greedy desde GPS
 * que maximiza valor de cartel sin repetir slots ya cubiertos.
 */

import { haversineM } from '@/lib/geo'
import { ROCA_VIAS_STOPS } from '@/lib/posterRoutes'
import {
  coveredMartelliSlotIds,
  getMartelliPosterGrid,
  type MartelliSlot,
  type SignPoint,
} from '@/lib/martelliPosterGrid'

export type ValueAnchor = { lat: number; lng: number; w: number; label: string }

/** Lugares donde rinde más pegar — hardcode, no API. */
export const VALUE_ANCHORS: readonly ValueAnchor[] = [
  ...ROCA_VIAS_STOPS.map((s) => ({
    lat: s.lat,
    lng: s.lng,
    label: s.label,
    w: s.minMinutes <= 30 ? 10 : s.minMinutes <= 45 ? 8 : 6,
  })),
  {
    lat: -34.5633,
    lng: -58.5152,
    label: 'Constituyentes × Maipú',
    w: 10,
  },
  {
    lat: -34.5499,
    lng: -58.5013,
    label: 'Shell Gral Paz 3802',
    w: 9,
  },
  {
    lat: -34.5434,
    lng: -58.5006,
    label: 'Estación Padilla',
    w: 9,
  },
]

export type ValuedSlot = MartelliSlot & { value: number }

function scoreAt(lat: number, lng: number): number {
  let v = 1
  for (const a of VALUE_ANCHORS) {
    const d = haversineM({ lat, lng }, a)
    if (d <= 70) v = Math.max(v, a.w)
    else if (d <= 140) v = Math.max(v, a.w * 0.65)
    else if (d <= 220) v = Math.max(v, a.w * 0.35)
  }
  return Math.round(v * 10) / 10
}

let valuedCache: readonly ValuedSlot[] | null = null

export function getValuedMartelliSlots(): readonly ValuedSlot[] {
  if (valuedCache) return valuedCache
  valuedCache = getMartelliPosterGrid().map((s) => ({
    ...s,
    value: scoreAt(s.lat, s.lng),
  }))
  return valuedCache
}

/** Solo puntos que “marcan” en mapa (valor ≥ umbral). */
export function markedValueSlots(
  signs: readonly SignPoint[],
  minValue = 5,
): ValuedSlot[] {
  const covered = coveredMartelliSlotIds(signs)
  return getValuedMartelliSlots().filter(
    (s) => s.value >= minValue && !covered.has(s.id),
  )
}

export type MaxValueStop = ValuedSlot & { metersFromPrev: number }

export type MaxValueRoute = {
  stops: MaxValueStop[]
  totalValue: number
  totalMeters: number
  points: [number, number][]
}

/**
 * Desde `from`, elige siguientes huecos abiertos maximizando value/(dist+ε)
 * hasta agotar minutos (~120 m/min bici+paradas) o maxStops.
 */
export function buildMaxValueRoute(
  from: SignPoint,
  signs: readonly SignPoint[],
  minutes: number,
  maxStops = 20,
): MaxValueRoute {
  const covered = coveredMartelliSlotIds(signs)
  const open = getValuedMartelliSlots().filter((s) => !covered.has(s.id))
  let budget = Math.max(400, minutes * 120)
  let cur = from
  const stops: MaxValueStop[] = []
  const used = new Set<string>()

  while (stops.length < maxStops && budget > 0 && open.length > 0) {
    let best: ValuedSlot | null = null
    let bestScore = -1
    let bestD = 0
    for (const s of open) {
      if (used.has(s.id)) continue
      const d = haversineM(cur, s)
      if (d > budget) continue
      // max cartel value per meter of detour
      const score = s.value / (d + 50)
      if (score > bestScore) {
        bestScore = score
        best = s
        bestD = d
      }
    }
    if (!best) break
    used.add(best.id)
    stops.push({ ...best, metersFromPrev: bestD })
    budget -= bestD + 80 // pegar ≈ 80 m de “tiempo”
    cur = best
  }

  const totalValue = stops.reduce((n, s) => n + s.value, 0)
  const totalMeters = stops.reduce((n, s) => n + s.metersFromPrev, 0)
  const points: [number, number][] = [
    [from.lat, from.lng],
    ...stops.map((s) => [s.lat, s.lng] as [number, number]),
  ]
  return { stops, totalValue, totalMeters, points }
}
