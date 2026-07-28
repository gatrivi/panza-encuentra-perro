import { useEffect, useState } from 'react'
import { formatHm, formatTimeLeft, sunTimes } from '@/lib/solar'

/** HUD mínimo: sol + luz (+ riesgo si ON). */
export function FieldHud({ riskOn }: { riskOn: boolean }) {
  const [tick, setTick] = useState(() => sunTimes())

  useEffect(() => {
    const id = window.setInterval(() => setTick(sunTimes()), 60_000)
    return () => window.clearInterval(id)
  }, [])

  return (
    <div className="field-hud" role="status">
      <span>Sol {formatHm(tick.sunset)}</span>
      <span className={tick.afterSunset ? 'field-hud-warn' : 'field-hud-ok'}>
        {formatTimeLeft(tick.minutesLeft)}
      </span>
      {riskOn ? <span className="field-hud-risk">Riesgo ON</span> : null}
    </div>
  )
}
