import { NavLink, Outlet } from 'react-router-dom'
import { useState } from 'react'
import { t } from '@/i18n/es-AR'
import { useAuth } from '@/features/cases/useAuth'
import { ActionSheet } from '@/app/ActionSheet'

export function AppShell() {
  const { member, signOut } = useAuth()
  const [sheetOpen, setSheetOpen] = useState(false)
  const copy = t()

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="brand">{copy.appName}</div>
        <div className="row">
          <span className="muted" style={{ fontSize: '0.85rem' }}>
            {member?.displayName}
          </span>
          <button type="button" className="btn btn-ghost" onClick={() => void signOut()}>
            {copy.actions.signOut}
          </button>
        </div>
      </header>

      <Outlet />

      <nav className="bottom-nav" aria-label="Principal">
        <NavLink to="/" end>
          {copy.nav.map}
        </NavLink>
        <NavLink to="/bandeja">{copy.nav.inbox}</NavLink>
        <NavLink to="/plan">{copy.nav.plan}</NavLink>
      </nav>

      <div className="fab-wrap">
        <button
          type="button"
          className="btn btn-accent"
          aria-label="Nueva acción"
          onClick={() => setSheetOpen(true)}
        >
          +
        </button>
      </div>

      {sheetOpen ? <ActionSheet onClose={() => setSheetOpen(false)} /> : null}
    </div>
  )
}
