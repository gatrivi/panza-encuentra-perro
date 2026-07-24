import { PANZA_CONTACT, PANZA_SEARCH_PLAN_TOMORROW } from '@/lib/panzaCase'
import { t } from '@/i18n/es-AR'

export function PlanScreen() {
  const copy = t()
  return (
    <div className="screen">
      <h1>{copy.plan.title}</h1>
      <p className="plan-urgency">{copy.plan.tomorrowHeadline}</p>
      <p className="muted">{copy.plan.tomorrowHint}</p>
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
