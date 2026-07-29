/**
 * In-app turn-by-turn over poster route waypoints.
 * ponytail: no Maps SDK — bearing + haversine only.
 */

import { bearingDeg, haversineM } from '@/lib/geo'
import {
  buildPosterAwareRoute,
  type PosterMode,
} from '@/lib/posterRoutes'
import { VOICE_NAV, voiceMeters } from '@/lib/voiceNav'

export type RoutePhase = 'out' | 'back'

export type RouteNode = {
  lat: number
  lng: number
  label: string
  poster: boolean
}

const NEAR_M = 90
const ARRIVE_M = 35

export function flattenRouteNodes(
  mode: PosterMode,
  phase: RoutePhase = 'out',
): RouteNode[] {
  const legs = buildPosterAwareRoute(mode).filter((leg) =>
    phase === 'back' ? leg.id === 'inbound' : true,
  )
  const out: RouteNode[] = []
  const seen = new Set<string>()
  for (const leg of legs) {
    for (const [lat, lng] of leg.points) {
      const k = `${lat.toFixed(4)},${lng.toFixed(4)}`
      if (seen.has(k)) continue
      seen.add(k)
      const hit = leg.posterStops.find(
        (p) => Math.abs(p.lat - lat) < 1e-4 && Math.abs(p.lng - lng) < 1e-4,
      )
      out.push({
        lat,
        lng,
        label: hit?.label ?? leg.label,
        poster: Boolean(hit),
      })
    }
  }
  return out
}

/** Advance past nodes already within ARRIVE_M. */
export function advanceIndex(
  me: { lat: number; lng: number },
  nodes: readonly RouteNode[],
  from: number,
): number {
  let i = Math.max(0, Math.min(from, nodes.length - 1))
  while (i < nodes.length - 1 && haversineM(me, nodes[i]!) < ARRIVE_M) i++
  return i
}

export function relativeTurn(
  headingDeg: number,
  bearingToDeg: number,
): 'left' | 'right' | 'straight' {
  const d = ((bearingToDeg - headingDeg + 540) % 360) - 180
  if (Math.abs(d) < 28) return 'straight'
  return d > 0 ? 'right' : 'left'
}

export type NavCue = {
  text: string
  /** Dedup key: node + phase */
  key: string
}

/** Preview line for the screen (voice is primary). */
export function previewForIndex(
  nodes: readonly RouteNode[],
  index: number,
): string {
  if (nodes.length === 0) return 'Sin ruta'
  const i = Math.min(index, nodes.length - 1)
  const n = nodes[i]!
  const left = nodes.length - i
  if (n.poster) return `Próximo cartel · ${n.label} · ${left} pts`
  return `Seguí · ${n.label} · ${left} pts`
}

/** One cue per GPS tick; caller dedups by key. */
export function cueForPosition(args: {
  me: { lat: number; lng: number }
  headingDeg: number | null
  nodes: readonly RouteNode[]
  index: number
}): NavCue | null {
  const { me, headingDeg, nodes } = args
  if (nodes.length === 0) return null
  const i = advanceIndex(me, nodes, args.index)
  const target = nodes[i]!
  const dist = haversineM(me, target)
  const last = i >= nodes.length - 1

  if (dist <= ARRIVE_M) {
    if (target.poster) {
      return {
        text: `${VOICE_NAV.stop}. Cartel: ${target.label}`,
        key: `poster-${i}`,
      }
    }
    if (last) {
      return { text: VOICE_NAV.arrive, key: `arrive-${i}` }
    }
    return null
  }

  if (dist > NEAR_M || headingDeg == null) return null

  const bearing = bearingDeg(me, target)
  const turn = relativeTurn(headingDeg, bearing)
  return {
    text: voiceMeters(dist, turn),
    key: `near-${i}-${turn}`,
  }
}
