import { useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { t } from '@/i18n/es-AR'
import { ActionSheet } from '@/app/ActionSheet'
import { OperatorSwitch } from '@/features/map/OperatorSwitch'

export function AppShell() {
  const [sheetOpen, setSheetOpen] = useState(false)
  const { pathname } = useLocation()
  const mapOnly = pathname === '/'
  const copy = t()

  return (
    <div className={`app-shell${mapOnly ? ' app-shell-map' : ''}`}>
      {mapOnly ? null : (
        <header className="app-header">
          <div className="brand">{copy.appName}</div>
          <OperatorSwitch />
        </header>
      )}

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
