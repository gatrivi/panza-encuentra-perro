import { Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from '@/features/cases/AuthProvider'
import { AppShell } from '@/app/AppShell'
import { MapScreen } from '@/features/map/MapScreen'
import { InboxScreen } from '@/features/leads/InboxScreen'
import { PlanScreen } from '@/features/coverage/PlanScreen'
import { PublicCasePage } from '@/features/public-report/PublicCasePage'
import { PosterRedirect } from '@/features/public-report/PosterRedirect'

/** Street find → map. No login wall. */
export function App() {
  return (
    <AuthProvider>
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
    </AuthProvider>
  )
}
