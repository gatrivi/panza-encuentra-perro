import { Navigate, Route, Routes } from 'react-router-dom'
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
  const { user, member, loading, error, signOut } = useAuth()
  const copy = t()

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
        <p role="alert">{error ?? copy.errors.generic}</p>
        <button type="button" className="btn btn-primary btn-block" onClick={() => void signOut()}>
          Reintentar
        </button>
      </div>
    )
  }

  return children
}

export function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/c/pancite" element={<Navigate to="/c/pancita" replace />} />
        <Route path="/c/panza" element={<Navigate to="/c/pancita" replace />} />
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
