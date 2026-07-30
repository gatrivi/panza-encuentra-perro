import { useState } from 'react'
import { useAuth } from '@/features/cases/useAuth'
import { OPERATOR_ORDER, OPERATORS } from '@/lib/operators'
import { FIELD_TEAMS, teamForUsername } from '@/lib/fieldTeams'

/** P / G / R en la barrita de arriba. Imágenes: public/operators/{p,g,r}.jpg */
export function OperatorSwitch() {
  const { member, switchOperator } = useAuth()
  const [broken, setBroken] = useState<Record<string, boolean>>({})
  const myTeam = FIELD_TEAMS[teamForUsername(member?.uid)]

  return (
    <div className="op-switch" role="group" aria-label="Operador">
      <span className="op-team-badge" title={myTeam.hint}>
        {myTeam.short}
      </span>
      {OPERATOR_ORDER.map((key) => {
        const op = OPERATORS[key]
        const on = member?.uid === op.username
        const showImg = !broken[key]
        const team = FIELD_TEAMS[teamForUsername(op.username)]
        return (
          <button
            key={key}
            type="button"
            className={`op-chip${on ? ' op-chip-on' : ''}`}
            aria-pressed={on}
            title={`${op.displayName} · ${team.label}`}
            onClick={() => void switchOperator(op.username)}
          >
            {showImg ? (
              <img
                src={op.avatar}
                alt=""
                className="op-avatar"
                onError={() => setBroken((b) => ({ ...b, [key]: true }))}
              />
            ) : null}
            <span>{op.short}</span>
          </button>
        )
      })}
    </div>
  )
}
