import { Suspense, lazy } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from '@/features/cases/AuthProvider'
import { AppShell } from '@/app/AppShell'
import { MapScreen } from '@/features/map/MapScreen'

const InboxScreen = lazy(() =>
  import('@/features/leads/InboxScreen').then((m) => ({ default: m.InboxScreen })),
)
const PlanScreen = lazy(() =>
  import('@/features/coverage/PlanScreen').then((m) => ({ default: m.PlanScreen })),
)
const PublicCasePage = lazy(() =>
  import('@/features/public-report/PublicCasePage').then((m) => ({
    default: m.PublicCasePage,
  })),
)
const PosterRedirect = lazy(() =>
  import('@/features/public-report/PosterRedirect').then((m) => ({
    default: m.PosterRedirect,
  })),
)

function Boot() {
  return (
    <div className="boot-splash" role="status">
      Mapa…
    </div>
  )
}

/** Street find → map. No login wall. Lazy routes = fast first paint. */
export function App() {
  return (
    <AuthProvider>
      <Suspense fallback={<Boot />}>
        <Routes>
          <Route path="/c/pancite" element={<Navigate to="/c/pancita" replace />} />
          <Route path="/c/panza" element={<Navigate to="/c/pancita" replace />} />
          <Route path="/c/:slug" element={<PublicCasePage />} />
          <Route path="/p/:posterCode" element={<PosterRedirect />} />
          <Route path="/" element={<AppShell />}>
            <Route index element={<MapScreen />} />
            <Route path="bandeja" element={<InboxScreen />} />
            <Route path="plan" element={<PlanScreen />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </AuthProvider>
  )
}
