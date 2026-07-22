import { t } from '@/i18n/es-AR'

export function PlanScreen() {
  const copy = t()
  return (
    <div className="screen">
      <h1>{copy.plan.title}</h1>
      <p className="muted">{copy.plan.milestoneNote}</p>
    </div>
  )
}
