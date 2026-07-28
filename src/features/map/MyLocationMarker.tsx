import { CircleMarker } from 'react-leaflet'
import type { GeoPoint } from '@/domain/schemas'

export function MyLocationMarker({ point }: { point: GeoPoint | null }) {
  if (!point) return null
  return (
    <CircleMarker
      center={[point[1], point[0]]}
      radius={8}
      pathOptions={{ color: '#1a3a2a', fillColor: '#2d5a42', fillOpacity: 0.9, weight: 2 }}
    />
  )
}
