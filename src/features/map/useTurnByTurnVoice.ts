import { useEffect, useMemo, useRef, useState } from 'react'
import type { GeoPoint } from '@/domain/schemas'
import { bearingDeg } from '@/lib/geo'
import type {
  PosterMode,
  RouteOrigin,
  RoutePlanId,
} from '@/lib/posterRoutes'
import { announceNav } from '@/lib/voiceNav'
import {
  advanceIndex,
  cueForPosition,
  flattenRouteNodes,
  previewForIndex,
  type RoutePhase,
} from '@/lib/turnByTurn'

type Args = {
  enabled: boolean
  myPoint: GeoPoint | null
  posterMode: PosterMode
  phase: RoutePhase
  routePlan: RoutePlanId
  routeMinutes: number
  skippedIds: readonly string[]
  origin: RouteOrigin | null
}

/** Live GPS → voice cues; screen shows lastCue as secondary confirm. */
export function useTurnByTurnVoice({
  enabled,
  myPoint,
  posterMode,
  phase,
  routePlan,
  routeMinutes,
  skippedIds,
  origin,
}: Args) {
  const [index, setIndex] = useState(0)
  const [lastCue, setLastCue] = useState<string | null>(null)
  const [preview, setPreview] = useState('Ruta al último avistaje')
  const lastKey = useRef<string | null>(null)
  const prev = useRef<GeoPoint | null>(null)
  const speaking = useRef(false)
  const nodes = useMemo(
    () =>
      flattenRouteNodes(posterMode, phase, {
        plan: routePlan,
        minutes: routeMinutes,
        skippedIds,
        origin,
      }),
    [
      posterMode,
      phase,
      routePlan,
      routeMinutes,
      skippedIds,
      origin,
    ],
  )

  useEffect(() => {
    setIndex(0)
    lastKey.current = null
    setLastCue(null)
    setPreview(previewForIndex(nodes, 0))
  }, [nodes])

  useEffect(() => {
    if (!enabled || !myPoint) return
    const me = { lat: myPoint[1], lng: myPoint[0] }
    if (nodes.length === 0) return

    let heading: number | null = null
    if (prev.current) {
      const a = { lat: prev.current[1], lng: prev.current[0] }
      const moved = bearingDeg(a, me)
      const distEnough =
        Math.hypot(me.lat - a.lat, me.lng - a.lng) > 0.00005
      if (distEnough) heading = moved
    }
    prev.current = myPoint

    const nextI = advanceIndex(me, nodes, index)
    if (nextI !== index) setIndex(nextI)
    setPreview(previewForIndex(nodes, nextI))

    const cue = cueForPosition({
      me,
      headingDeg: heading,
      nodes,
      index: nextI,
    })
    if (!cue || cue.key === lastKey.current || speaking.current) return
    lastKey.current = cue.key
    setLastCue(cue.text)
    speaking.current = true
    void announceNav(cue.text).finally(() => {
      speaking.current = false
    })
  }, [enabled, myPoint, nodes, index])

  const currentPoster =
    nodes.slice(index).find((node) => node.poster) ?? null

  return { lastCue, preview, index, currentPoster }
}
