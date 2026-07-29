import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useAuth } from '@/features/cases/useAuth'
import { subscribeLeads, subscribeSightings } from '@/lib/firebase/repos'
import {
  subscribeAvoidAreas,
  subscribeCoverage,
  subscribeSigns,
} from '@/lib/firebase/fieldRepos'
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
import {
  buildTocaRiesgoCache,
  pointToCell,
  sugerirCarteles,
  type HexState,
} from '@/lib/geo/h3Coverage'
import { announceNav, VOICE_NAV } from '@/lib/voiceNav'
import { FieldHud } from './FieldHud'
import { OperatorSwitch } from './OperatorSwitch'
import { OperationalMap } from './OperationalMap'
import { useTurnByTurnVoice } from './useTurnByTurnVoice'
import { gridDisk } from 'h3-js'
import {
  readPosterMode,
  writePosterMode,
  type PosterMode,
} from '@/lib/posterRoutes'
import type { RoutePhase } from '@/lib/turnByTurn'

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
  const [voiceNavOn, setVoiceNavOn] = useState(true)
  const [toolsOpen, setToolsOpen] = useState(false)
  const [phase, setPhase] = useState<RoutePhase>('out')
  const [posterMode] = useState<PosterMode>(() => {
    const m = readPosterMode()
    if (m !== 'dest_return') writePosterMode('dest_return')
    return 'dest_return'
  })
  const actorUid = member?.uid ?? null

  useEffect(() => {
    if (!caseId) return
    const u1 = subscribeSightings(caseId, setSightings)
    const u2 = subscribeCoverage(caseId, setCoverage)
    const u3 = subscribeSigns(caseId, setSigns)
    const u4 = subscribeAvoidAreas(caseId, setAvoidAreas)
    const u5 = subscribeLeads(caseId, setLeads)
    void flushFieldActions()
    const onOnline = () => void flushFieldActions()
    window.addEventListener('online', onOnline)
    return () => {
      u1()
      u2()
      u3()
      u4()
      u5()
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
    onWalkedCells,
    onRiskCells: setRiskSweepIds,
    onStopPrompt: setStopPromptPoint,
  })

  const { lastCue, preview } = useTurnByTurnVoice({
    enabled: voiceNavOn && !riskMode,
    myPoint,
    posterMode,
    phase,
  })

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

  const suggestIds = useMemo(() => {
    const activeAvoid = avoidAreas.filter((a) => a.active)
    if (activeAvoid.length === 0 && coverage.length === 0) return []

    const hexes = new Map<string, HexState>()
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
      for (const id of gridDisk(pointToCell(lastSeen.point), 3)) {
        pool.add(id)
      }
    }
    const hexIds = [...pool]
    const touching = buildTocaRiesgoCache(activeAvoid, hexIds)
    return sugerirCarteles(hexIds, touching, hexes).slice(0, 40)
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

  const goHome = useCallback(() => {
    setPhase('back')
    setVoiceNavOn(true)
    void announceNav(VOICE_NAV.goingHome)
  }, [])

  const placeHere = useCallback(() => {
    if (myPoint) void placeSignAt(myPoint)
  }, [myPoint, placeSignAt])

  return (
    <div className="map-screen map-only street-readable field-ops">
      <div className="map-layout">
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
          showSignRoute
          onPlaceSign={(p) => void placeSignAt(p)}
          onLongPressHex={(cellId) => {
            if (riskMode) addRiskCell(cellId)
          }}
        />
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
              onClick={() => setPhase('out')}
            >
              Volver a ida
            </button>
          ) : null}
          <Link className="btn btn-ghost" to="/plan">
            Plan
          </Link>
          <Link className="btn btn-ghost" to="/bandeja">
            Bandeja
          </Link>
          {gpsError ? <p className="map-gps-hint map-gps-warn">{gpsError}</p> : null}
        </div>
      ) : null}

      <div className="field-dock" role="region" aria-label="Navegación">
        <p className="field-cue" role="status">
          {lastCue ?? preview}
        </p>
        <p className="field-phase">
          {phase === 'out' ? 'Ida → avistaje' : 'Vuelta → casa + carteles'}
          {voiceNavOn ? ' · VOZ' : ' · silencio'}
        </p>
        <div className="field-actions">
          <button
            type="button"
            className="btn btn-accent field-btn"
            disabled={!myPoint}
            onClick={placeHere}
          >
            Cartel acá
          </button>
          {phase === 'out' ? (
            <button
              type="button"
              className="btn btn-primary field-btn"
              onClick={goHome}
            >
              Listo · vuelta
            </button>
          ) : (
            <button
              type="button"
              className="btn btn-primary field-btn"
              disabled={!myPoint}
              onClick={() => {
                if (myPoint) {
                  void announceNav(VOICE_NAV.continue)
                }
              }}
            >
              Seguí
            </button>
          )}
        </div>
      </div>

      <StopPosterPrompt
        open={Boolean(stopPromptPoint) && !riskMode}
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
