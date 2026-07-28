import { Polygon, Popup } from 'react-leaflet'
import type { AvoidArea } from '@/domain/schemas'

/** GeoJSON polygon rings are [lng,lat]; Leaflet wants [lat,lng]. */
function toLeafletRings(area: AvoidArea): [number, number][][] {
  return area.geometry.coordinates.map((ring) =>
    ring.map(([lng, lat]) => [lat, lng] as [number, number]),
  )
}

export function AvoidAreasLayer({ areas }: { areas: AvoidArea[] }) {
  const active = areas.filter((a) => a.active)
  return (
    <>
      {active.map((a) => (
        <Polygon
          key={a.id}
          positions={toLeafletRings(a)}
          pathOptions={{
            color: '#9b2c2c',
            fillColor: '#9b2c2c',
            fillOpacity: 0.22,
            weight: 2,
          }}
        >
          <Popup>
            <strong>{a.name}</strong>
            {a.reason ? <p>{a.reason}</p> : <p className="muted">Zona a evitar</p>}
          </Popup>
        </Polygon>
      ))}
    </>
  )
}
