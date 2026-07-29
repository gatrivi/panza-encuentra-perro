import { useCallback, useEffect, useRef, useState } from 'react'
import type { GeoPoint } from '@/domain/schemas'
import { runOrEnqueue } from '@/lib/offline/fieldQueue'

const STOP_MS = 60_000
const STOP_SPEED_MPS = 0.8
/** Risk mode: tighter than outing “coarse” — bike skips hexes at 15–30s. */
const RISK_WATCH: PositionOptions = {
  enableHighAccuracy: true,
  maximumAge: 5_000,
  timeout: 15_000,
}
const PATROL_WATCH: PositionOptions = {
  enableHighAccuracy: true,
  maximumAge: 10_000,
  timeout: 20_000,
}

type H3Api = typeof import('@/lib/geo/h3Coverage')

type Args = {
  caseId: string | null
  actorUid: string | null
  riskMode: boolean
  onWalkedCells: (cellIds: string[]) => void
  onRiskCells: (cellIds: string[]) => void
  onStopPrompt: (point: GeoPoint) => void
}

export function usePatrolGps({
  caseId,
  actorUid,
  riskMode,
  onWalkedCells,
  onRiskCells,
  onStopPrompt,
}: Args) {
  const [point, setPoint] = useState<GeoPoint | null>(null)
  const [error, setError] = useState<string | null>(null)
  const lastPoint = useRef<GeoPoint | null>(null)
  const stopSince = useRef<number | null>(null)
  const promptedStop = useRef(false)
  const riskCells = useRef(new Set<string>())
  const walkedBuffer = useRef(new Set<string>())
  const flushTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const h3Ref = useRef<H3Api | null>(null)

  useEffect(() => {
    let cancelled = false
    void import('@/lib/geo/h3Coverage').then((m) => {
      if (!cancelled) h3Ref.current = m
    })
    return () => {
      cancelled = true
    }
  }, [])

  const flushWalked = useCallback(() => {
    if (!caseId || !actorUid || walkedBuffer.current.size === 0) return
    const ids = [...walkedBuffer.current]
    walkedBuffer.current.clear()
    onWalkedCells(ids)
    void runOrEnqueue({
      kind: 'coverage_paint',
      caseId,
      cellIds: ids,
      actorUid,
    })
  }, [actorUid, caseId, onWalkedCells])

  const handleFix = useCallback(
    (pos: GeolocationPosition) => {
      const next: GeoPoint = [pos.coords.longitude, pos.coords.latitude]
      setPoint(next)
      setError(null)

      const speed = pos.coords.speed
      const moving =
        speed != null ? speed > STOP_SPEED_MPS : lastPoint.current
          ? haversineQuick(lastPoint.current, next) > 8
          : false

      const h3 = h3Ref.current
      if (riskMode && h3) {
        promptedStop.current = false
        stopSince.current = null
        const path = lastPoint.current ? [lastPoint.current, next] : [next]
        const cells = h3.cellsAlongPath(path)
        for (const c of cells) riskCells.current.add(c)
        onRiskCells([...riskCells.current])
      } else if (!moving) {
        if (stopSince.current == null) stopSince.current = Date.now()
        else if (
          Date.now() - stopSince.current >= STOP_MS &&
          !promptedStop.current
        ) {
          promptedStop.current = true
          onStopPrompt(next)
        }
      } else {
        stopSince.current = null
        promptedStop.current = false
      }

      if (h3) {
        const walkCells = lastPoint.current
          ? h3.cellsAlongPath([lastPoint.current, next])
          : [h3.pointToCell(next)]
        for (const c of walkCells) walkedBuffer.current.add(c)
        if (flushTimer.current) clearTimeout(flushTimer.current)
        flushTimer.current = setTimeout(() => flushWalked(), 4_000)
      }

      lastPoint.current = next
    },
    [flushWalked, onRiskCells, onStopPrompt, riskMode],
  )

  useEffect(() => {
    if (!navigator.geolocation) {
      setError('Sin GPS')
      return
    }
    const opts = riskMode ? RISK_WATCH : PATROL_WATCH
    const id = navigator.geolocation.watchPosition(
      handleFix,
      () => setError('GPS falló'),
      opts,
    )
    return () => {
      navigator.geolocation.clearWatch(id)
      if (flushTimer.current) clearTimeout(flushTimer.current)
      flushWalked()
    }
  }, [handleFix, riskMode, flushWalked])

  const takeRiskCells = useCallback(() => {
    const ids = [...riskCells.current]
    riskCells.current.clear()
    onRiskCells([])
    return ids
  }, [onRiskCells])

  const addRiskCell = useCallback(
    (cellId: string) => {
      riskCells.current.add(cellId)
      onRiskCells([...riskCells.current])
    },
    [onRiskCells],
  )

  const dismissStopPrompt = useCallback(() => {
    promptedStop.current = true
    stopSince.current = Date.now()
  }, [])

  return { point, error, takeRiskCells, addRiskCell, dismissStopPrompt }
}

function haversineQuick(a: GeoPoint, b: GeoPoint): number {
  const R = 6_371_000
  const toRad = (d: number) => (d * Math.PI) / 180
  const dLat = toRad(b[1] - a[1])
  const dLng = toRad(b[0] - a[0])
  const lat1 = toRad(a[1])
  const lat2 = toRad(b[1])
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(h))
}
