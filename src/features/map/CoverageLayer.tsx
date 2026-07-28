import { Polygon, useMapEvents } from 'react-leaflet'
import type { CoverageCell } from '@/domain/schemas'
import { cellToLatLngRing, coverageFillColor } from '@/lib/geo/h3Coverage'

type Props = {
  cells: CoverageCell[]
  riskSweepIds?: string[]
  suggestIds?: string[]
  onLongPressCell?: (cellId: string) => void
}

export function CoverageLayer({
  cells,
  riskSweepIds = [],
  suggestIds = [],
  onLongPressCell,
}: Props) {
  const suggestSet = new Set(suggestIds)
  const riskSet = new Set(riskSweepIds)

  return (
    <>
      {cells.map((c) => (
        <Polygon
          key={c.id}
          positions={cellToLatLngRing(c.id)}
          pathOptions={{
            color: 'transparent',
            fillColor: coverageFillColor(c.updatedAt, c.status),
            fillOpacity: 1,
            weight: 0,
          }}
          eventHandlers={
            onLongPressCell
              ? {
                  contextmenu: (e) => {
                    e.originalEvent.preventDefault()
                    onLongPressCell(c.id)
                  },
                }
              : undefined
          }
        />
      ))}
      {[...riskSet].map((id) => (
        <Polygon
          key={`risk-${id}`}
          positions={cellToLatLngRing(id)}
          pathOptions={{
            color: '#9b2c2c',
            fillColor: 'rgba(155, 44, 44, 0.35)',
            fillOpacity: 1,
            weight: 1,
          }}
        />
      ))}
      {suggestIds.slice(0, 24).map((id) =>
        suggestSet.has(id) && !riskSet.has(id) ? (
          <Polygon
            key={`sug-${id}`}
            positions={cellToLatLngRing(id)}
            pathOptions={{
              color: '#c45c26',
              dashArray: '4 6',
              fillColor: 'rgba(196, 92, 38, 0.12)',
              fillOpacity: 1,
              weight: 1.5,
            }}
          />
        ) : null,
      )}
    </>
  )
}

/** Long-press empty map → resolve nearest painted cell via parent GPS hex. */
export function MapLongPress({ onLongPress }: { onLongPress: (lat: number, lng: number) => void }) {
  useMapEvents({
    contextmenu(e) {
      e.originalEvent.preventDefault()
      onLongPress(e.latlng.lat, e.latlng.lng)
    },
  })
  return null
}
