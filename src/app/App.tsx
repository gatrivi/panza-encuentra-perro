import { useState } from 'react'
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
  const { user, member, loading, error, signInGoogle, signInWithEmail } = useAuth()
  const copy = t()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)

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
        <p className="muted">{copy.auth.hint}</p>
        {error ? <p role="alert">{error}</p> : null}
        <form
          className="stack"
          style={{ marginTop: '1rem' }}
          onSubmit={(e) => {
            e.preventDefault()
            setBusy(true)
            void signInWithEmail(email, password).finally(() => setBusy(false))
          }}
        >
          <div className="field">
            <label htmlFor="login-email">{copy.auth.email}</label>
            <input
              id="login-email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="login-password">{copy.auth.password}</label>
            <input
              id="login-password"
              type="password"
              autoComplete="current-password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <button type="submit" className="btn btn-primary btn-block" disabled={busy}>
            {copy.actions.signIn}
          </button>
          <button
            type="button"
            className="btn btn-ghost btn-block"
            disabled={busy}
            onClick={() => void signInGoogle()}
          >
            {copy.actions.signInGoogle}
          </button>
          <Link to="/c/pancita" className="muted" style={{ textAlign: 'center' }}>
            Ir a la página pública
          </Link>
        </form>
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
