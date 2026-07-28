import { lazy, Suspense, useEffect, useMemo, useState } from 'react'
import {
  PANZA_CONTACT,
  PANZA_GMAPS_FROM_HOME_URL,
  PANZA_GMAPS_SIGHTING_URL,
  PANZA_SEARCH_PLAN_TOMORROW,
  PANZA_SIGN_QUICK45,
  PANZA_SIGN_ROUTE,
  PANZA_WAZE_HOME_URL,
  PANZA_WAZE_SIGHTING_URL,
  PANZA_WAZE_SIGN_START_URL,
  type SignStop,
} from '@/lib/panzaCase'
import {
  bearingDeg,
  cardinalFromBearing,
  formatDistanceM,
  haversineM,
} from '@/lib/geo'
import {
  POSTER_MODES,
  readPosterMode,
  writePosterMode,
  type PosterMode,
} from '@/lib/posterRoutes'
import {
  campaignDayIndex,
  SIGNS_CAMPAIGN,
  signsProgress,
} from '@/lib/signsCampaign'
import { useAuth } from '@/features/cases/useAuth'
import { subscribeSigns } from '@/lib/firebase/fieldRepos'
import { t } from '@/i18n/es-AR'
import { useLivePosition } from './useLivePosition'

const SignRouteMap = lazy(() =>
  import('./SignRouteMap').then((m) => ({ default: m.SignRouteMap })),
)

const DONE_KEY = 'panza.signRoute.done'
const CUR_KEY = 'panza.signRoute.current'

function loadDone(): Set<number> {
  try {
    const raw = localStorage.getItem(DONE_KEY)
    if (!raw) return new Set()
    const arr = JSON.parse(raw) as number[]
    return new Set(arr.filter((n) => typeof n === 'number'))
  } catch {
    return new Set()
  }
}

function saveDone(done: Set<number>) {
  localStorage.setItem(DONE_KEY, JSON.stringify([...done]))
}

function firstOpen(done: Set<number>): number {
  const hit = PANZA_SIGN_ROUTE.find((s) => !done.has(s.n))
  return hit?.n ?? PANZA_SIGN_ROUTE[0]!.n
}

export function PlanScreen() {
  const copy = t()
  const [done, setDone] = useState<Set<number>>(() => loadDone())
  const [currentN, setCurrentN] = useState<number>(() => {
    const saved = Number(localStorage.getItem(CUR_KEY))
    if (Number.isFinite(saved) && saved >= 1) return saved
    return firstOpen(loadDone())
  })
  const [navOn, setNavOn] = useState(true)
  const [follow, setFollow] = useState(true)
  const [quickOnly, setQuickOnly] = useState(false)
  const [showLegacy, setShowLegacy] = useState(false)
  const { pos, error: gpsError } = useLivePosition(navOn)

  const stops = useMemo(() => {
    if (!quickOnly) return PANZA_SIGN_ROUTE
    const want = new Set<number>(PANZA_SIGN_QUICK45)
    return PANZA_SIGN_ROUTE.filter((s) => want.has(s.n))
  }, [quickOnly])

  const current: SignStop =
    stops.find((s) => s.n === currentN) ?? stops[0] ?? PANZA_SIGN_ROUTE[0]!

  const navHint = useMemo(() => {
    if (!pos) return null
    const d = haversineM(pos, current)
    const b = bearingDeg(pos, current)
    return {
      distance: formatDistanceM(d),
      cardinal: cardinalFromBearing(b),
      meters: d,
    }
  }, [pos, current])

  function persistCurrent(n: number) {
    setCurrentN(n)
    localStorage.setItem(CUR_KEY, String(n))
  }

  function markDone(n: number) {
    const next = new Set(done)
    next.add(n)
    setDone(next)
    saveDone(next)
    const after = stops.find((s) => s.n > n && !next.has(s.n))
      ?? stops.find((s) => !next.has(s.n))
    if (after) persistCurrent(after.n)
  }

  function resetProgress() {
    const empty = new Set<number>()
    setDone(empty)
    saveDone(empty)
    persistCurrent(stops[0]?.n ?? 1)
  }

  const doneCount = [...done].filter((n) => stops.some((s) => s.n === n)).length
  const { caseId } = useAuth()
  const [mode, setMode] = useState<PosterMode>(() => readPosterMode())
  const [activeSigns, setActiveSigns] = useState(0)

  useEffect(() => {
    if (!caseId) return
    return subscribeSigns(caseId, (signs) => {
      setActiveSigns(signs.filter((s) => s.status === 'active').length)
    })
  }, [caseId])

  const progress = signsProgress(activeSigns)
  const day = campaignDayIndex()

  return (
    <div className="screen plan-screen">
      <h1>{copy.plan.title}</h1>
      <p className="plan-urgency">{copy.plan.signHeadline}</p>
      <p className="muted">{copy.plan.signHint}</p>
      <p className="plan-campaign">
        Día {day + 1}/{SIGNS_CAMPAIGN.plannedDays} · 1 viaje/día · carteles{' '}
        <strong>
          {progress.active}/{progress.target}
        </strong>{' '}
        ({progress.pct}%)
        {progress.done ? ' · red completa' : ''}
      </p>
      <p className="muted">Salida: {SIGNS_CAMPAIGN.homeLabel}</p>

      <p className="plan-half-label">Carteles en el recorrido</p>
      <div className="poster-mode-row plan-poster-modes">
        {POSTER_MODES.map((m) => (
          <button
            key={m.id}
            type="button"
            title={m.hint}
            className={`poster-mode-chip${mode === m.id ? ' poster-mode-on' : ''}`}
            aria-pressed={mode === m.id}
            onClick={() => {
              writePosterMode(m.id)
              setMode(m.id)
            }}
          >
            {m.label}
          </button>
        ))}
      </div>
      <p className="muted">{POSTER_MODES.find((m) => m.id === mode)?.hint}</p>

      <p className="plan-urgency">{copy.plan.tomorrowHeadline}</p>

      <div className="plan-nav-hud">
        <div className="plan-nav-current">
          <span className="plan-nav-n">#{current.n}</span>
          <div>
            <strong>{current.label}</strong>
            <p className="muted">{current.why}</p>
          </div>
        </div>
        {navHint ? (
          <p className="plan-nav-distance">
            {navHint.distance} · {navHint.cardinal}
            {navHint.meters < 40 ? ` · ${copy.plan.arrived}` : ''}
          </p>
        ) : (
          <p className="muted plan-nav-distance">
            {gpsError ?? copy.plan.waitingGps}
          </p>
        )}
        <div className="row plan-nav-btns">
          <button type="button" className="btn primary" onClick={() => markDone(current.n)}>
            {copy.plan.markPlaced}
          </button>
          <button
            type="button"
            className="btn"
            onClick={() => {
              const i = stops.findIndex((s) => s.n === current.n)
              const next = stops[i + 1] ?? stops[0]
              if (next) persistCurrent(next.n)
            }}
          >
            {copy.plan.skipStop}
          </button>
          <button type="button" className="btn" onClick={() => setFollow((f) => !f)}>
            {follow ? copy.plan.unfollow : copy.plan.followMe}
          </button>
        </div>
        <div className="row plan-nav-toggles">
          <label className="muted">
            <input
              type="checkbox"
              checked={navOn}
              onChange={(e) => setNavOn(e.target.checked)}
            />{' '}
            {copy.plan.gpsOn}
          </label>
          <label className="muted">
            <input
              type="checkbox"
              checked={quickOnly}
              onChange={(e) => {
                setQuickOnly(e.target.checked)
                const list = e.target.checked
                  ? PANZA_SIGN_ROUTE.filter((s) =>
                      (PANZA_SIGN_QUICK45 as readonly number[]).includes(s.n),
                    )
                  : PANZA_SIGN_ROUTE
                const open = list.find((s) => !done.has(s.n)) ?? list[0]
                if (open) persistCurrent(open.n)
              }}
            />{' '}
            {copy.plan.quick45}
          </label>
        </div>
        <p className="muted plan-progress">
          {doneCount}/{stops.length} {copy.plan.placed}
          {' · '}
          <button type="button" className="btn-link" onClick={resetProgress}>
            {copy.plan.reset}
          </button>
        </p>
      </div>

      <Suspense fallback={<p className="muted">{copy.auth.loading}</p>}>
        <SignRouteMap
          stops={stops}
          done={done}
          currentN={current.n}
          pos={pos}
          follow={follow}
        />
      </Suspense>

      <ol className="plan-sign-list">
        {stops.map((s) => {
          const isDone = done.has(s.n)
          const isCur = s.n === current.n
          return (
            <li
              key={s.n}
              className={
                isDone ? 'done' : isCur ? 'current' : undefined
              }
            >
              <button
                type="button"
                className="plan-sign-item"
                onClick={() => persistCurrent(s.n)}
              >
                <span className="plan-sign-n">{s.n}</span>
                <span>
                  <strong>{s.label}</strong>
                  <span className="muted">{s.why}</span>
                </span>
              </button>
            </li>
          )
        })}
      </ol>

      <div className="plan-nav-actions">
        <a className="btn plan-nav-btn" href={PANZA_GMAPS_SIGHTING_URL} target="_blank" rel="noreferrer">
          {copy.plan.openGmapsPin}
        </a>
        <a className="btn plan-nav-btn" href={PANZA_WAZE_SIGHTING_URL} target="_blank" rel="noreferrer">
          {copy.plan.openWazePin}
        </a>
        <a className="btn plan-nav-btn" href={PANZA_GMAPS_FROM_HOME_URL} target="_blank" rel="noreferrer">
          Maps · ida casa→Martelli
        </a>
        <a className="btn plan-nav-btn" href={PANZA_WAZE_HOME_URL} target="_blank" rel="noreferrer">
          Waze · salida casa
        </a>
        <a className="btn plan-nav-btn" href={PANZA_WAZE_SIGN_START_URL} target="_blank" rel="noreferrer">
          {copy.plan.openWazeFallback}
        </a>
      </div>

      <p className="plan-call">
        Si la ves: no agarrar · seguir · llamar{' '}
        <a href={`tel:${PANZA_CONTACT.displayPhone}`}>{PANZA_CONTACT.displayPhone}</a>
        {' / '}
        <a href={`tel:${PANZA_CONTACT.secondaryPhone}`}>{PANZA_CONTACT.secondaryPhone}</a>
      </p>

      <button
        type="button"
        className="btn-link"
        onClick={() => setShowLegacy((v) => !v)}
      >
        {showLegacy ? copy.plan.hideLegacy : copy.plan.showLegacy}
      </button>

      {showLegacy ? (
        <div className="plan-legacy">
          <p className="plan-half-label">{copy.plan.tomorrowHeadline}</p>
          <ol className="plan-list">
            {PANZA_SEARCH_PLAN_TOMORROW.map((z) => (
              <li key={z.title}>
                <strong>{z.title}</strong>
                <p className="muted">{z.detail}</p>
              </li>
            ))}
          </ol>
        </div>
      ) : null}
    </div>
  )
}
