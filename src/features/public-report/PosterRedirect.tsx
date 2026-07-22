import { Navigate, useParams } from 'react-router-dom'
import { defaultCaseSlug } from '@/lib/firebase/app'

/** QR posters land here and route to the canonical public case with attribution. */
export function PosterRedirect() {
  const { posterCode } = useParams()
  const slug = defaultCaseSlug
  return <Navigate to={`/c/${slug}?poster=${encodeURIComponent(posterCode || '')}`} replace />
}
