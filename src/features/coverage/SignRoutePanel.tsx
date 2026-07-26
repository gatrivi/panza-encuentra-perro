import { useState } from 'react'
import {
  PANZA_GMAPS_SIGN_IDA_URL,
  PANZA_GMAPS_SIGN_VUELTA_URL,
  PANZA_SIGN_STOPS_IDA,
  PANZA_SIGN_STOPS_VUELTA,
  PANZA_WAZE_SIGN_IDA_END_URL,
  PANZA_WAZE_SIGN_START_URL,
  loadSignsDone,
  saveSignDone,
  signStopMapsUrl,
  signStopWazeUrl,
  type SignStop,
} from '@/lib/panzaCase'
import { t } from '@/i18n/es-AR'

function StopList({
  stops,
  done,
  onToggle,
}: {
  stops: SignStop[]
  done: Set<number>
  onToggle: (n: number, checked: boolean) => void
}) {
  return (
    <ol className="sign-stop-list">
      {stops.map((stop) => (
        <li key={stop.n} className={done.has(stop.n) ? 'sign-stop-done' : ''}>
          <label className="sign-stop-row">
            <input
              type="checkbox"
              checked={done.has(stop.n)}
              onChange={(e) => onToggle(stop.n, e.target.checked)}
            />
            <span className="sign-stop-num">{stop.n}</span>
            <span className="sign-stop-body">
              <strong>{stop.label}</strong>
              <span className="muted small">{stop.street}</span>
              {stop.signs > 1 ? (
                <span className="sign-stop-badge">{stop.signs} carteles</span>
              ) : null}
            </span>
          </label>
          <div className="sign-stop-nav">
            <a href={signStopWazeUrl(stop)} target="_blank" rel="noreferrer" className="small">
              Waze
            </a>
            <a href={signStopMapsUrl(stop)} target="_blank" rel="noreferrer" className="small">
              Pin
            </a>
          </div>
        </li>
      ))}
    </ol>
  )
}

export function SignRoutePanel() {
  const copy = t()
  const [done, setDone] = useState(() => loadSignsDone())
  const idaCount = PANZA_SIGN_STOPS_IDA.length
  const vueltaCount = PANZA_SIGN_STOPS_VUELTA.length
  const doneIda = PANZA_SIGN_STOPS_IDA.filter((s) => done.has(s.n)).length
  const doneVuelta = PANZA_SIGN_STOPS_VUELTA.filter((s) => done.has(s.n)).length

  function toggle(n: number, checked: boolean) {
    saveSignDone(n, checked)
    setDone(loadSignsDone())
  }

  return (
    <>
      <p className="plan-urgency">{copy.plan.signsHeadline}</p>
      <p className="muted">{copy.plan.signsHint}</p>
      <p className="sign-progress">
        IDA {doneIda}/{idaCount} · VUELTA {doneVuelta}/{vueltaCount}
      </p>

      <p className="plan-half-label">{copy.plan.signIda}</p>
      <div className="plan-nav-actions">
        <a
          className="btn btn-accent plan-nav-btn"
          href={PANZA_WAZE_SIGN_START_URL}
          target="_blank"
          rel="noreferrer"
        >
          {copy.plan.wazeSignStart}
        </a>
        <a
          className="btn primary plan-nav-btn"
          href={PANZA_GMAPS_SIGN_IDA_URL}
          target="_blank"
          rel="noreferrer"
        >
          {copy.plan.mapsSignIda}
        </a>
        <a
          className="btn plan-nav-btn"
          href={PANZA_WAZE_SIGN_IDA_END_URL}
          target="_blank"
          rel="noreferrer"
        >
          {copy.plan.wazeIdaEnd}
        </a>
      </div>
      <StopList stops={PANZA_SIGN_STOPS_IDA} done={done} onToggle={toggle} />

      <p className="plan-half-label">{copy.plan.signVuelta}</p>
      <div className="plan-nav-actions">
        <a
          className="btn primary plan-nav-btn"
          href={PANZA_GMAPS_SIGN_VUELTA_URL}
          target="_blank"
          rel="noreferrer"
        >
          {copy.plan.mapsSignVuelta}
        </a>
      </div>
      <StopList stops={PANZA_SIGN_STOPS_VUELTA} done={done} onToggle={toggle} />
    </>
  )
}
