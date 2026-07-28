import { useMapEvents } from 'react-leaflet'
import type { GeoPoint } from '@/domain/schemas'

/** Desktop: click map to place a sign when placeMode is on. */
export function DesktopPlaceClick({
  enabled,
  onPlace,
}: {
  enabled: boolean
  onPlace: (point: GeoPoint) => void
}) {
  useMapEvents({
    click(e) {
      if (!enabled) return
      onPlace([e.latlng.lng, e.latlng.lat])
    },
  })
  return null
}
