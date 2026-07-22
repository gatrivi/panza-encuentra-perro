import { Navigate, useParams } from 'react-router-dom'
import { defaultCaseSlug } from '@/lib/firebase/app'

/** QR posters land here; Milestone 1 routes to the public case page with poster attribution. */
export function PosterRedirect() {
  const { posterCode } = useParams()
  const slug = defaultCaseSlug
  return <Navigate to={`/c/${slug}?poster=${encodeURIComponent(posterCode || '')}`} replace />
}
