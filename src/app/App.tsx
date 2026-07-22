import { Link, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from '@/features/cases/AuthProvider'
import { useAuth } from '@/features/cases/useAuth'
import { AppShell } from '@/app/AppShell'
import { MapScreen } from '@/features/map/MapScreen'
import { InboxScreen } from '@/features/leads/InboxScreen'
import { PlanScreen } from '@/features/coverage/PlanScreen'
import { PublicCasePage } from '@/features/public-report/PublicCasePage'
import { PosterRedirect } from '@/features/public-report/PosterRedirect'
import { t } from '@/i18n/es-AR'

function PrivateGate({ children }: { children: React.ReactNode }) {
  const { user, member, loading, error, signInGoogle, signInDemo } = useAuth()
  const copy = t()
  const useEmulators = import.meta.env.VITE_USE_EMULATORS === 'true'

  if (loading) {
    return (
      <div className="login-card">
        <p>{copy.auth.loading}</p>
      </div>
    )
  }

  if (!user || !member) {
    return (
      <div className="login-card">
        <h1>{copy.appName}</h1>
        <p className="muted">Mapa operativo privado — solo miembros invitados.</p>
        {error ? <p role="alert">{error}</p> : null}
        <div className="stack" style={{ marginTop: '1rem' }}>
          <button type="button" className="btn btn-primary btn-block" onClick={() => void signInGoogle()}>
            {copy.actions.signIn}
          </button>
          {useEmulators ? (
            <button
              type="button"
              className="btn btn-ghost btn-block"
              onClick={() => void signInDemo('owner@example.com', 'demo-pass-123')}
            >
              Demo local (owner)
            </button>
          ) : null}
          <Link to="/c/pancite" className="muted" style={{ textAlign: 'center' }}>
            Ir a la página pública
          </Link>
        </div>
      </div>
    )
  }

  return children
}

export function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/c/:slug" element={<PublicCasePage />} />
        <Route path="/p/:posterCode" element={<PosterRedirect />} />
        <Route
          path="/"
          element={
            <PrivateGate>
              <AppShell />
            </PrivateGate>
          }
        >
          <Route index element={<MapScreen />} />
          <Route path="bandeja" element={<InboxScreen />} />
          <Route path="plan" element={<PlanScreen />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  )
}
