import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
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
import { t } from '@/i18n/es-AR'
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
import { cattsHealth } from '@/lib/catts'
import { announceNav, VOICE_NAV } from '@/lib/voiceNav'
import { FieldHud } from './FieldHud'
import { PosterModeChips } from './PosterModeChips'
import { OperatorSwitch } from './OperatorSwitch'
import { OperationalMap } from './OperationalMap'
import { gridDisk } from 'h3-js'
import {
  readPosterMode,
  writePosterMode,
  type PosterMode,
} from '@/lib/posterRoutes'

/** Default = solo mapa. Tools detrás de un toggle. */
export function MapScreen() {
  const { caseId, member } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const [sightings, setSightings] = useState<Sighting[]>([])
  const [showRejected, setShowRejected] = useState(false)
  const [showSigns, setShowSigns] = useState(true)
  const [leads, setLeads] = useState<Lead[]>([])
  const [coverage, setCoverage] = useState<CoverageCell[]>([])
  const [signs, setSigns] = useState<Sign[]>([])
  const [avoidAreas, setAvoidAreas] = useState<AvoidArea[]>([])
  const [riskMode, setRiskMode] = useState(false)
  const [riskSweepIds, setRiskSweepIds] = useState<string[]>([])
  const [stopPromptPoint, setStopPromptPoint] = useState<GeoPoint | null>(null)
  const [placeMode, setPlaceMode] = useState(false)
  const [voiceBusy, setVoiceBusy] = useState(false)
  const [toolsOpen, setToolsOpen] = useState(false)
  const [posterMode, setPosterMode] = useState<PosterMode>(() => readPosterMode())
  const copy = t()
  const actorUid = member?.uid ?? null

  const setPoster = useCallback((m: PosterMode) => {
    writePosterMode(m)
    setPosterMode(m)
  }, [])

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

  const placeSignAt = useCallback(
    async (p: GeoPoint) => {
      if (!caseId || !actorUid) return
      await runOrEnqueue({
        kind: 'place_sign',
        caseId,
        point: p,
        actorUid,
      })
      setPlaceMode(false)
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

  const visible = sightings.filter(
    (s) => showRejected || s.confidence !== 'rejected',
  )

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

  const testVoice = useCallback(async () => {
    setVoiceBusy(true)
    try {
      const via = await announceNav(VOICE_NAV.searching)
      if (via === 'offline') {
        const h = await cattsHealth()
        void h
      }
    } catch (e) {
      console.error(e)
      window.alert(e instanceof Error ? e.message : 'Voz falló')
    } finally {
      setVoiceBusy(false)
    }
  }, [])

  return (
    <div className="map-screen map-only street-readable">
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
          placeMode={placeMode}
          posterMode={posterMode}
          showSignRoute={showSigns}
          onPlaceSign={(p) => void placeSignAt(p)}
          onLongPressHex={(cellId) => {
            if (riskMode) addRiskCell(cellId)
          }}
        />
      </div>

      <div className="map-float-top">
        <OperatorSwitch />
        <button
          type="button"
          className={`map-tools-toggle${toolsOpen ? ' map-tools-on' : ''}`}
          aria-expanded={toolsOpen}
          aria-label="Herramientas"
          onClick={() => setToolsOpen((v) => !v)}
        >
          {toolsOpen ? '×' : '···'}
        </button>
      </div>

      {toolsOpen ? (
        <div className="map-float-panel">
          <PosterModeChips mode={posterMode} onChange={setPoster} />
          <div className="row">
            <label className="muted">
              <input
                type="checkbox"
                checked={showSigns}
                onChange={(e) => setShowSigns(e.target.checked)}
              />{' '}
              {copy.map.showSigns}
            </label>
            <label className="muted">
              <input
                type="checkbox"
                checked={showRejected}
                onChange={(e) => setShowRejected(e.target.checked)}
              />{' '}
              Incluir rechazados
            </label>
          </div>
          <div className="map-chrome-actions">
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
              className="btn btn-ghost map-voice-btn"
              disabled={voiceBusy}
              onClick={() => void testVoice()}
              title="Voz"
            >
              {voiceBusy ? '…' : 'Voz'}
            </button>
          </div>
          {gpsError ? <p className="map-gps-hint map-gps-warn">{gpsError}</p> : null}
          {placeMode ? (
            <button
              type="button"
              className="btn btn-ghost place-mode-on"
              onClick={() => setPlaceMode(false)}
            >
              {copy.map.placeModeOn}
            </button>
          ) : null}
        </div>
      ) : null}
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
