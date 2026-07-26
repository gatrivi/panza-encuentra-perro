import {
  PANZA_CONTACT,
  PANZA_GMAPS_BIKE_SARMIENTO_URL,
  PANZA_GMAPS_BIKE_URL,
  PANZA_GMAPS_SIGN_TRAMO_1_URL,
  PANZA_GMAPS_SIGN_TRAMO_2_URL,
  PANZA_GMAPS_SIGN_TRAMO_3_URL,
  PANZA_GMAPS_SIGHTING_URL,
  PANZA_SEARCH_PLAN_TOMORROW,
  PANZA_WAZE_SARMIENTO_URL,
  PANZA_WAZE_SIGN_START_URL,
  PANZA_WAZE_SIGHTING_URL,
  PANZA_WAZE_START_URL,
} from '@/lib/panzaCase'
import { t } from '@/i18n/es-AR'

export function PlanScreen() {
  const copy = t()
  return (
    <div className="screen">
      <h1>{copy.plan.title}</h1>

      <p className="plan-urgency">{copy.plan.signsHeadline}</p>
      <p className="muted">{copy.plan.signsHint}</p>
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
          href={PANZA_GMAPS_SIGN_TRAMO_1_URL}
          target="_blank"
          rel="noreferrer"
        >
          {copy.plan.signTramo1}
        </a>
        <a
          className="btn primary plan-nav-btn"
          href={PANZA_GMAPS_SIGN_TRAMO_2_URL}
          target="_blank"
          rel="noreferrer"
        >
          {copy.plan.signTramo2}
        </a>
        <a
          className="btn primary plan-nav-btn"
          href={PANZA_GMAPS_SIGN_TRAMO_3_URL}
          target="_blank"
          rel="noreferrer"
        >
          {copy.plan.signTramo3}
        </a>
      </div>

      <div className="plan-nav-actions">
        <a
          className="btn plan-nav-btn"
          href={PANZA_GMAPS_SIGHTING_URL}
          target="_blank"
          rel="noreferrer"
        >
          {copy.plan.openGmapsPin}
        </a>
        <a
          className="btn plan-nav-btn"
          href={PANZA_WAZE_SIGHTING_URL}
          target="_blank"
          rel="noreferrer"
        >
          {copy.plan.openWazePin}
        </a>
      </div>

      <details className="plan-details">
        <summary>Recorridos anteriores (Gral Paz / bici)</summary>
        <p className="plan-half-label">{copy.plan.halfMartelli}</p>
        <div className="plan-nav-actions">
          <a
            className="btn primary plan-nav-btn"
            href={PANZA_GMAPS_BIKE_URL}
            target="_blank"
            rel="noreferrer"
          >
            {copy.plan.openGmapsBike}
          </a>
          <a
            className="btn plan-nav-btn"
            href={PANZA_WAZE_START_URL}
            target="_blank"
            rel="noreferrer"
          >
            {copy.plan.openWazeStart}
          </a>
        </div>
        <p className="plan-half-label">{copy.plan.halfSarmiento}</p>
        <div className="plan-nav-actions">
          <a
            className="btn primary plan-nav-btn"
            href={PANZA_GMAPS_BIKE_SARMIENTO_URL}
            target="_blank"
            rel="noreferrer"
          >
            {copy.plan.openGmapsSarmiento}
          </a>
          <a
            className="btn plan-nav-btn"
            href={PANZA_WAZE_SARMIENTO_URL}
            target="_blank"
            rel="noreferrer"
          >
            {copy.plan.openWazeSarmiento}
          </a>
        </div>
        <img
          className="plan-route-img"
          src="/panza/recorrido-bici-gralpaz.png"
          alt="Esquema del loop en bici Parque Sarmiento / Villa Martelli"
        />
        <p className="muted plan-bike-note">{copy.plan.bikeNote}</p>
      </details>

      <ol className="plan-list">
        {PANZA_SEARCH_PLAN_TOMORROW.map((z) => (
          <li key={z.title}>
            <strong>{z.title}</strong>
            <p className="muted">{z.detail}</p>
          </li>
        ))}
      </ol>
      <p className="plan-call">
        Si la ves: no agarrar · seguir · llamar{' '}
        <a href={`tel:${PANZA_CONTACT.displayPhone}`}>{PANZA_CONTACT.displayPhone}</a>
        {' / '}
        <a href={`tel:${PANZA_CONTACT.secondaryPhone}`}>{PANZA_CONTACT.secondaryPhone}</a>
      </p>
    </div>
  )
}
