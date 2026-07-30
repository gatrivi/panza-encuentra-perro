import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { Link, Navigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '@/features/cases/useAuth'
import type {
  AvoidArea,
  CoverageCell,
  GeoPoint,
  Lead,
  Sighting,
  Sign,
} from '@/domain/schemas'
import { RiskModeChip } from './RiskModeChip'
import { StopPosterPrompt } from './StopPosterPrompt'
import { usePatrolGps } from './usePatrolGps'
import { runOrEnqueue, flushFieldActions } from '@/lib/offline/fieldQueue'
import { announceNav, VOICE_NAV } from '@/lib/voiceNav'
import { FieldHud } from './FieldHud'
import { OperatorSwitch } from './OperatorSwitch'
import { useTurnByTurnVoice } from './useTurnByTurnVoice'
import { preloadLocalMap } from '@/lib/localMap'
import {
  FIELD_TEAMS,
  teamForUsername,
} from '@/lib/fieldTeams'
import { buildMaxValueRoute } from '@/lib/maxValueRoute'
import {
  buildGmapsDirUrl,
  countRoutePosters,
  FIELD_ROUTE_DEFAULT_MINUTES,
  FIELD_ROUTE_MAX_MINUTES,
  FIELD_ROUTE_MIN_MINUTES,
  FIELD_ROUTE_STEP_MINUTES,
  getRocaViasStops,
  getRouteStart,
  normalizeRouteMinutes,
  readPosterMode,
  writePosterMode,
  type PosterMode,
  type RouteOrigin,
  type RoutePlanId,
} from '@/lib/posterRoutes'
import type { RoutePhase } from '@/lib/turnByTurn'

const OperationalMap = lazy(() =>
  import('./OperationalMap').then((module) => ({
    default: module.OperationalMap,
  })),
)

function FieldMapPreview() {
  return (
    <div className="map-container field-map-preview" role="status">
      <strong>Roca × vías</strong>
      <span>Ruta lista · preparando mapa local</span>
    </div>
  )
}

const SENSORS_KEY = 'panza.field.sensors'

function readSensorsGranted(): boolean {
  try {
    return localStorage.getItem(SENSORS_KEY) === '1'
  } catch {
    return false
  }
}

/** Field-first: voz guía, pantalla confirma, un dedo. */
export function MapScreen() {
  const { caseId, member } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const [sightings, setSightings] = useState<Sighting[]>([])
  const [leads, setLeads] = useState<Lead[]>([])
  const [coverage, setCoverage] = useState<CoverageCell[]>([])
  const [signs, setSigns] = useState<Sign[]>([])
  const [avoidAreas, setAvoidAreas] = useState<AvoidArea[]>([])
  const [riskMode, setRiskMode] = useState(false)
  const [riskSweepIds, setRiskSweepIds] = useState<string[]>([])
  const [stopPromptPoint, setStopPromptPoint] = useState<GeoPoint | null>(null)
  const [sensorsOn, setSensorsOn] = useState(() => readSensorsGranted())
  const [wantVoice, setWantVoice] = useState(true)
  const [voiceNavOn, setVoiceNavOn] = useState(false)
  const [toolsOpen, setToolsOpen] = useState(false)
  const [phase, setPhase] = useState<RoutePhase>('out')
  const [suggestIds, setSuggestIds] = useState<string[]>([])
  const [mapReady, setMapReady] = useState(false)
  const routePlan: RoutePlanId =
    searchParams.get('route') === 'home-martelli'
      ? 'home-martelli'
      : 'roca-vias'
  const routeMinutes = normalizeRouteMinutes(
    searchParams.get('minutes') ?? String(FIELD_ROUTE_DEFAULT_MINUTES),
  )
  const skippedParam = searchParams.get('skip') ?? ''
  const skippedIds = useMemo(
    () => skippedParam.split(',').filter(Boolean),
    [skippedParam],
  )
  const [routeOrigin, setRouteOrigin] = useState<RouteOrigin | null>(null)
  const [posterMode] = useState<PosterMode>(() => {
    const m = readPosterMode()
    if (m !== 'dest_return') writePosterMode('dest_return')
    return 'dest_return'
  })
  const actorUid = member?.uid ?? null
  const myTeam = FIELD_TEAMS[teamForUsername(actorUid)]
  const signPoints = useMemo(
    () =>
      signs
        .filter((s) => s.status === 'active')
        .map((s) => ({ lat: s.point[1], lng: s.point[0] })),
    [signs],
  )
  useEffect(() => {
    let cancelled = false
    void preloadLocalMap().then(() => {
      if (!cancelled) setMapReady(true)
    })
    return () => {
      cancelled = true
    }
  }, [])

  // Default sticky: Roca × vías (user can pedir home-martelli)
  useEffect(() => {
    if (searchParams.get('route')) return
    const next = new URLSearchParams(searchParams)
    next.set('route', 'roca-vias')
    next.set('minutes', String(FIELD_ROUTE_DEFAULT_MINUTES))
    setSearchParams(next, { replace: true })
  }, [searchParams, setSearchParams])

  useEffect(() => {
    if (!caseId) return
    let cancelled = false
    const unsubs: Array<() => void> = []
    let timer: number | null = null
    const subscribeAfterMap = () => {
      timer = window.setTimeout(() => {
        void (async () => {
          const [{ subscribeLeads, subscribeSightings }, field] =
            await Promise.all([
              import('@/lib/firebase/repos'),
              import('@/lib/firebase/fieldRepos'),
            ])
          if (cancelled) return
          unsubs.push(subscribeSightings(caseId, setSightings))
          unsubs.push(field.subscribeCoverage(caseId, setCoverage))
          unsubs.push(field.subscribeSigns(caseId, setSigns))
          unsubs.push(field.subscribeAvoidAreas(caseId, setAvoidAreas))
          unsubs.push(subscribeLeads(caseId, setLeads))
          void flushFieldActions()
        })()
      }, 3_000)
    }
    if (document.readyState === 'complete') subscribeAfterMap()
    else window.addEventListener('load', subscribeAfterMap, { once: true })
    const onOnline = () => void flushFieldActions()
    window.addEventListener('online', onOnline)
    return () => {
      cancelled = true
      if (timer != null) window.clearTimeout(timer)
      window.removeEventListener('load', subscribeAfterMap)
      for (const u of unsubs) u()
      window.removeEventListener('online', onOnline)
    }
  }, [caseId])

  const onWalkedCells = useCallback((cellIds: string[]) => {
    void cellIds
  }, [])

  const {
    point: myPoint,
    error: gpsError,
    takeRiskCells,
    addRiskCell,
    dismissStopPrompt,
  } = usePatrolGps({
    caseId,
    actorUid,
    riskMode,
    enabled: sensorsOn,
    onWalkedCells,
    onRiskCells: setRiskSweepIds,
    onStopPrompt: setStopPromptPoint,
  })

  const enableSensors = useCallback(() => {
    try {
      localStorage.setItem(SENSORS_KEY, '1')
    } catch {
      /* ignore */
    }
    setSensorsOn(true)
    setVoiceNavOn(wantVoice)
  }, [wantVoice])

  const valueRoute = useMemo(() => {
    const from = myPoint
      ? { lat: myPoint[1], lng: myPoint[0] }
      : { lat: -34.5505, lng: -58.5105 }
    return buildMaxValueRoute(from, signPoints, routeMinutes)
  }, [myPoint, signPoints, routeMinutes])

  const { lastCue, preview, currentPoster } = useTurnByTurnVoice({
    enabled: voiceNavOn && !riskMode,
    myPoint,
    posterMode,
    phase,
    routePlan,
    routeMinutes,
    skippedIds,
    origin: routeOrigin,
  })

  useEffect(() => {
    if (routePlan !== 'roca-vias' || !myPoint || routeOrigin) return
    setRouteOrigin({ lat: myPoint[1], lng: myPoint[0] })
  }, [routePlan, myPoint, routeOrigin])

  useEffect(() => {
    if (!stopPromptPoint || riskMode || !voiceNavOn) return
    void announceNav(VOICE_NAV.posterAsk)
  }, [stopPromptPoint, riskMode, voiceNavOn])

  const placeSignAt = useCallback(
    async (p: GeoPoint) => {
      if (!caseId || !actorUid) return
      await runOrEnqueue({
        kind: 'place_sign',
        caseId,
        point: p,
        actorUid,
      })
      setStopPromptPoint(null)
      dismissStopPrompt()
    },
    [actorUid, caseId, dismissStopPrompt],
  )

  useEffect(() => {
    if (searchParams.get('placeSign') !== '1') return
    if (!myPoint) return
    void placeSignAt(myPoint).then(() => {
      const next = new URLSearchParams(searchParams)
      next.delete('placeSign')
      setSearchParams(next, { replace: true })
    })
  }, [searchParams, myPoint, placeSignAt, setSearchParams])

  const visible = sightings.filter((s) => s.confidence !== 'rejected')

  const tipLeads = useMemo(
    () =>
      leads.filter(
        (l) =>
          Boolean(l.claimedPoint) &&
          l.status !== 'rejected' &&
          l.status !== 'duplicate' &&
          l.status !== 'promoted',
      ),
    [leads],
  )

  const lastSeen = useMemo(() => {
    const ok = sightings.filter((s) => s.confidence !== 'rejected')
    return ok[0] ?? null
  }, [sightings])

  const activeSignCount = useMemo(
    () => signs.filter((s) => s.status === 'active').length,
    [signs],
  )

  // h3/turf are heavy — defer suggest hexes off the first paint path
  useEffect(() => {
    const activeAvoid = avoidAreas.filter((a) => a.active)
    if (activeAvoid.length === 0 && coverage.length === 0) {
      setSuggestIds([])
      return
    }
    let cancelled = false
    void (async () => {
      const [{ buildTocaRiesgoCache, pointToCell, sugerirCarteles }, { gridDisk }] =
        await Promise.all([import('@/lib/geo/h3Coverage'), import('h3-js')])
      if (cancelled) return
      const hexes = new Map<
        string,
        { status: CoverageCell['status']; updatedAt: Date; posterAt: boolean }
      >()
      for (const c of coverage) {
        hexes.set(c.id, {
          status: c.status,
          updatedAt: c.updatedAt,
          posterAt: c.status === 'signed',
        })
      }
      for (const s of signs) {
        if (s.cellId && s.status === 'active') {
          const prev = hexes.get(s.cellId)
          hexes.set(s.cellId, {
            status: prev?.status ?? 'signed',
            updatedAt: prev?.updatedAt ?? s.updatedAt,
            posterAt: true,
          })
        }
      }
      const pool = new Set<string>([...hexes.keys()])
      if (lastSeen) {
        for (const id of gridDisk(pointToCell(lastSeen.point), 3)) pool.add(id)
      }
      const hexIds = [...pool]
      const touching = buildTocaRiesgoCache(activeAvoid, hexIds)
      if (!cancelled) {
        setSuggestIds(sugerirCarteles(hexIds, touching, hexes).slice(0, 40))
      }
    })()
    return () => {
      cancelled = true
    }
  }, [avoidAreas, coverage, signs, lastSeen])

  const toggleRisk = useCallback(async () => {
    if (!caseId || !actorUid) return
    if (riskMode) {
      const cells = takeRiskCells()
      setRiskMode(false)
      if (cells.length > 0) {
        await runOrEnqueue({
          kind: 'risk_sweep',
          caseId,
          cellIds: cells,
          actorUid,
        })
      }
    } else {
      setStopPromptPoint(null)
      setRiskMode(true)
    }
  }, [actorUid, caseId, riskMode, takeRiskCells])

  const routePosterCount = useMemo(
    () =>
      countRoutePosters(posterMode, {
        plan: routePlan,
        minutes: routeMinutes,
        skippedIds,
        origin: routeOrigin,
      }),
    [
      posterMode,
      routePlan,
      routeMinutes,
      skippedIds,
      routeOrigin,
    ],
  )

  const updateFieldRoute = useCallback(
    (minutes: number, nextSkipped: readonly string[]) => {
      const next = new URLSearchParams(searchParams)
      next.set('route', 'roca-vias')
      next.set('minutes', String(normalizeRouteMinutes(minutes)))
      if (nextSkipped.length > 0) {
        next.set('skip', nextSkipped.join(','))
      } else {
        next.delete('skip')
      }
      setSearchParams(next, { replace: true })
      if (myPoint) {
        setRouteOrigin({ lat: myPoint[1], lng: myPoint[0] })
      }
      setPhase('out')
    },
    [searchParams, setSearchParams, myPoint],
  )

  const changeRouteMinutes = useCallback(
    (delta: number) => {
      updateFieldRoute(routeMinutes + delta, skippedIds)
      void announceNav(
        `Ruta ajustada a ${normalizeRouteMinutes(routeMinutes + delta)} minutos`,
      )
    },
    [routeMinutes, skippedIds, updateFieldRoute],
  )

  const skipCurrentStop = useCallback(() => {
    if (!currentPoster || routePlan !== 'roca-vias') return
    const nextSkipped = [...new Set([...skippedIds, currentPoster.id])]
    updateFieldRoute(routeMinutes, nextSkipped)
    void announceNav(`Omitido ${currentPoster.label}. Recalculando`)
  }, [
    currentPoster,
    routePlan,
    skippedIds,
    routeMinutes,
    updateFieldRoute,
  ])

  const restoreStops = useCallback(() => {
    updateFieldRoute(routeMinutes, [])
    void announceNav('Paradas repuestas. Recalculando')
  }, [routeMinutes, updateFieldRoute])

  const goHome = useCallback(() => {
    if (routePlan === 'roca-vias' && myPoint) {
      setRouteOrigin({ lat: myPoint[1], lng: myPoint[0] })
    }
    setPhase('back')
    setVoiceNavOn(true)
    void announceNav(VOICE_NAV.goingHome)
  }, [routePlan, myPoint])

  const placeHere = useCallback(() => {
    if (myPoint) void placeSignAt(myPoint)
  }, [myPoint, placeSignAt])

  const askMartelli = useCallback(() => {
    const next = new URLSearchParams(searchParams)
    next.set('route', 'home-martelli')
    next.delete('skip')
    setSearchParams(next, { replace: true })
    setPhase('out')
    void announceNav('Ruta casa a Martelli')
  }, [searchParams, setSearchParams])

  const askRoca = useCallback(() => {
    updateFieldRoute(routeMinutes, skippedIds)
    void announceNav('Ruta Roca por la vía')
  }, [updateFieldRoute, routeMinutes, skippedIds])

  const askCasa = useCallback(() => {
    if (myPoint) {
      setRouteOrigin({ lat: myPoint[1], lng: myPoint[0] })
    }
    setPhase('back')
    setVoiceNavOn(true)
    void announceNav(VOICE_NAV.goingHome)
  }, [myPoint])

  const gmapsUrl = useMemo(() => {
    const start = routeOrigin ?? getRouteStart(routePlan)
    if (routePlan === 'roca-vias') {
      const stops = getRocaViasStops(routeMinutes, skippedIds)
      return buildGmapsDirUrl(start, stops, 'driving')
    }
    // Martelli / casa: epicenter pin as single destination
    const dest = getRouteStart('home-martelli')
    return buildGmapsDirUrl(start, [dest], 'driving')
  }, [routePlan, routeMinutes, skippedIds, routeOrigin])

  const openGmaps = useCallback(() => {
    if (!gmapsUrl) return
    window.open(gmapsUrl, '_blank', 'noopener,noreferrer')
  }, [gmapsUrl])

  // Sin itinerario usable → Plan
  if (routePlan === 'roca-vias' && routePosterCount < 1) {
    return <Navigate to="/plan" replace />
  }

  return (
    <div className="map-screen map-only street-readable field-ops">
      <div className="map-layout">
        {mapReady ? (
          <Suspense fallback={<FieldMapPreview />}>
            <OperationalMap
              sightings={visible}
              tipLeads={tipLeads}
              coverage={coverage}
              signs={signs}
              avoidAreas={avoidAreas}
              myPoint={myPoint}
              riskSweepIds={riskSweepIds}
              suggestIds={suggestIds}
              placeMode={false}
              posterMode={posterMode}
              routePlan={routePlan}
              routeMinutes={routeMinutes}
              skippedIds={skippedIds}
              routeOrigin={routeOrigin}
              signPoints={signPoints}
              showSignRoute
              showCoverage={toolsOpen}
              onPlaceSign={(p) => void placeSignAt(p)}
              onLongPressHex={(cellId) => {
                if (riskMode) addRiskCell(cellId)
              }}
            />
          </Suspense>
        ) : (
          <FieldMapPreview />
        )}
      </div>

      <button
        type="button"
        className={`map-tools-toggle field-tools-btn${toolsOpen ? ' map-tools-on' : ''}`}
        aria-expanded={toolsOpen}
        aria-label="Más"
        onClick={() => setToolsOpen((v) => !v)}
      >
        {toolsOpen ? '×' : '···'}
      </button>

      {toolsOpen ? (
        <div className="map-float-panel">
          <OperatorSwitch />
          <p className="field-route-summary">
            {myTeam.label} · max valor · {valueRoute.stops.length} paradas · Σ
            {Math.round(valueRoute.totalValue)}
            {valueRoute.stops[0]
              ? ` · 1º ${valueRoute.stops[0].id} (~${Math.round(valueRoute.stops[0].metersFromPrev)} m)`
              : ''}
          </p>
          <FieldHud riskOn={riskMode} />
          <RiskModeChip
            active={riskMode}
            onToggle={() => {
              void (async () => {
                const turningOn = !riskMode
                await toggleRisk()
                void announceNav(turningOn ? VOICE_NAV.riskOn : VOICE_NAV.riskOff)
              })()
            }}
            sweeping={riskSweepIds.length > 0}
            cellCount={riskSweepIds.length}
          />
          {routePlan === 'roca-vias' ? (
            <>
              <p className="field-route-summary">
                Roca × vías · {routeMinutes} min · {routePosterCount} paradas
                {skippedIds.length > 0
                  ? ` · ${skippedIds.length} omitidas`
                  : ''}
              </p>
              {skippedIds.length > 0 ? (
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={restoreStops}
                >
                  Reponer paradas
                </button>
              ) : null}
              <button type="button" className="btn btn-ghost" onClick={askMartelli}>
                Pedir Martelli
              </button>
            </>
          ) : (
            <button type="button" className="btn btn-ghost" onClick={askRoca}>
              Pedir Roca × vía
            </button>
          )}
          <button
            type="button"
            className={`btn btn-ghost map-voice-btn${voiceNavOn ? ' map-voice-on' : ''}`}
            aria-pressed={voiceNavOn}
            onClick={() => setVoiceNavOn((v) => !v)}
          >
            {voiceNavOn ? 'Voz ON' : 'Voz OFF'}
          </button>
          {phase === 'back' ? (
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => {
                if (myPoint) {
                  setRouteOrigin({ lat: myPoint[1], lng: myPoint[0] })
                }
                setPhase('out')
              }}
            >
              Volver a ruta
            </button>
          ) : null}
          <Link className="btn btn-ghost" to="/puntos">
            Puntos / pesos
          </Link>
          <Link className="btn btn-ghost" to="/plan">
            Plan
          </Link>
          <Link className="btn btn-ghost" to="/bandeja">
            Bandeja
          </Link>
          {gpsError ? <p className="map-gps-hint map-gps-warn">{gpsError}</p> : null}
        </div>
      ) : null}

      {sensorsOn ? (
      <div className="field-dock" role="region" aria-label="Navegación">
        <p className="field-cue" role="status">
          {currentPoster
            ? `Próximo · ${currentPoster.label}`
            : (lastCue ?? preview)}
        </p>
        <div className="poster-mode-row field-dest-chips" role="group" aria-label="Voy a">
          <button
            type="button"
            className={`poster-mode-chip${routePlan === 'roca-vias' && phase === 'out' ? ' poster-mode-on' : ''}`}
            aria-pressed={routePlan === 'roca-vias' && phase === 'out'}
            onClick={askRoca}
          >
            Roca × vía
          </button>
          <button
            type="button"
            className={`poster-mode-chip${routePlan === 'home-martelli' ? ' poster-mode-on' : ''}`}
            aria-pressed={routePlan === 'home-martelli'}
            onClick={askMartelli}
          >
            Martelli
          </button>
          <button
            type="button"
            className={`poster-mode-chip${phase === 'back' ? ' poster-mode-on' : ''}`}
            aria-pressed={phase === 'back'}
            onClick={askCasa}
          >
            Casa
          </button>
        </div>
        <p className="field-phase">
          {routePlan === 'roca-vias'
            ? phase === 'out'
              ? `Roca × vías · ${routePosterCount} paradas`
              : 'Cierre → último avistamiento'
            : phase === 'out'
              ? 'Ida → avistaje'
              : 'Vuelta → casa + carteles'}
          {voiceNavOn ? ' · VOZ' : ' · silencio'}
          {activeSignCount > 0 ? ` · ${activeSignCount} carteles` : ''}
        </p>
        {routePlan === 'roca-vias' && phase === 'out' ? (
          <div className="field-time-controls" aria-label="Tiempo de recorrido">
            <button
              type="button"
              disabled={routeMinutes <= FIELD_ROUTE_MIN_MINUTES}
              onClick={() =>
                changeRouteMinutes(-FIELD_ROUTE_STEP_MINUTES)
              }
            >
              −15
            </button>
            <strong>{routeMinutes} min</strong>
            <button
              type="button"
              disabled={routeMinutes >= FIELD_ROUTE_MAX_MINUTES}
              onClick={() =>
                changeRouteMinutes(FIELD_ROUTE_STEP_MINUTES)
              }
            >
              +15
            </button>
          </div>
        ) : null}
        <div
          className={`field-actions${
            routePlan === 'roca-vias' && phase === 'out'
              ? ' field-actions-adaptive'
              : ''
          }`}
        >
          <button
            type="button"
            className="btn btn-accent field-btn"
            disabled={!myPoint}
            onClick={placeHere}
          >
            Cartel acá
          </button>
          <button
            type="button"
            className="btn btn-ghost field-btn"
            disabled={!gmapsUrl}
            onClick={openGmaps}
            title="Abrir en Google Maps"
          >
            Maps
          </button>
          {routePlan === 'roca-vias' && phase === 'out' ? (
            <button
              type="button"
              className="btn btn-ghost field-btn field-skip-btn"
              disabled={!currentPoster}
              onClick={skipCurrentStop}
            >
              Saltar
            </button>
          ) : null}
          {phase === 'out' ? (
            <button
              type="button"
              className="btn btn-primary field-btn"
              onClick={goHome}
            >
              {routePlan === 'roca-vias' ? 'Cerrar ruta' : 'Listo · vuelta'}
            </button>
          ) : (
            <button
              type="button"
              className="btn btn-primary field-btn"
              disabled={!myPoint}
              onClick={() => {
                if (myPoint) void announceNav(VOICE_NAV.continue)
              }}
            >
              Seguí
            </button>
          )}
        </div>
      </div>
      ) : null}

      {!sensorsOn ? (
        <div className="field-perm-gate" role="dialog" aria-labelledby="field-perm-title">
          <div className="field-perm-card">
            <h2 id="field-perm-title">Permisos para el operativo</h2>
            <p>
              Primero mirá el mapa. Cuando quieras salir a pegar carteles, activá
              ubicación (y voz si querés). El teléfono va a pedir permiso recién
              al tocar el botón.
            </p>
            <label className="field-perm-voice">
              <input
                type="checkbox"
                checked={wantVoice}
                onChange={(e) => setWantVoice(e.target.checked)}
              />{' '}
              Incluir guía por voz
            </label>
            <button
              type="button"
              className="btn btn-accent field-btn"
              onClick={enableSensors}
            >
              Activar y continuar
            </button>
            <p className="muted field-perm-note">
              Sin esto igual ves la ruta; no podés marcar “Cartel acá” ni
              navegación en vivo.
            </p>
          </div>
        </div>
      ) : null}

      <StopPosterPrompt
        open={Boolean(stopPromptPoint) && !riskMode && sensorsOn}
        onYes={() => {
          if (stopPromptPoint) void placeSignAt(stopPromptPoint)
        }}
        onNo={() => {
          setStopPromptPoint(null)
          dismissStopPrompt()
        }}
      />
    </div>
  )
}
