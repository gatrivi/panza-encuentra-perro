import { lazy, Suspense, useEffect, useState } from 'react'
import { useAuth } from '@/features/cases/useAuth'
import { subscribeSightings } from '@/lib/firebase/repos'
import type { Sighting } from '@/domain/schemas'
import { t } from '@/i18n/es-AR'

const OperationalMap = lazy(() =>
  import('./OperationalMap').then((m) => ({ default: m.OperationalMap })),
)

export function MapScreen() {
  const { caseId } = useAuth()
  const [sightings, setSightings] = useState<Sighting[]>([])
  const [showRejected, setShowRejected] = useState(false)
  const copy = t()

  useEffect(() => {
    if (!caseId) return
    return subscribeSightings(caseId, setSightings)
  }, [caseId])

  const visible = sightings.filter((s) =>
    showRejected ? true : s.confidence !== 'rejected',
  )

  return (
    <div className="map-screen">
      <div className="row" style={{ padding: '0.75rem 1rem' }}>
        <h1 style={{ flex: 1, fontSize: '1.15rem' }}>{copy.map.title}</h1>
        <label className="muted" style={{ fontSize: '0.85rem' }}>
          <input
            type="checkbox"
            checked={showRejected}
            onChange={(e) => setShowRejected(e.target.checked)}
          />{' '}
          Incluir rechazados
        </label>
      </div>
      {visible.length === 0 ? (
        <p className="muted" style={{ padding: '0 1rem' }}>
          {copy.map.noSightings}
        </p>
      ) : null}
      <Suspense fallback={<p style={{ padding: '1rem' }}>{copy.auth.loading}</p>}>
        <OperationalMap sightings={visible} />
      </Suspense>
    </div>
  )
}
