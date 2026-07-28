import { CircleMarker, Marker, Polyline, Popup, Tooltip } from 'react-leaflet'
import L from 'leaflet'
import type { PosterMode } from '@/lib/posterRoutes'
import { buildPosterAwareRoute, PANZA_HOME_BASE } from '@/lib/posterRoutes'

const posterIcon = L.divIcon({
  className: 'poster-stop-icon',
  html: '<span style="display:block;width:12px;height:12px;background:#c45c26;border:2px solid #fff;border-radius:2px;box-shadow:0 1px 3px rgba(0,0,0,.4)"></span>',
  iconSize: [12, 12],
  iconAnchor: [6, 6],
})

/** Recorrido del día desde casa + paradas cartel según modo. */
export function DayRouteLayer({ mode }: { mode: PosterMode }) {
  const legs = buildPosterAwareRoute(mode)

  return (
    <>
      <CircleMarker
        center={[PANZA_HOME_BASE.lat, PANZA_HOME_BASE.lng]}
        radius={10}
        pathOptions={{ color: '#1a3a2a', fillColor: '#2d5a42', fillOpacity: 0.9, weight: 2 }}
      >
        <Popup>
          <strong>Salida</strong>
          <p>{PANZA_HOME_BASE.label}</p>
        </Popup>
      </CircleMarker>

      {legs.map((leg) => (
        <Polyline
          key={leg.id}
          positions={leg.points}
          pathOptions={{
            color: leg.color,
            weight: leg.posterStops.length ? 5 : 3,
            opacity: 0.85,
            dashArray: leg.dashArray,
          }}
        >
          <Tooltip sticky className="route-tooltip">
            {leg.label}
            {leg.posterStops.length ? ` · ${leg.posterStops.length} carteles` : ''}
          </Tooltip>
        </Polyline>
      ))}

      {legs.flatMap((leg) =>
        leg.posterStops.map((s) => (
          <Marker
            key={`${leg.id}-${s.label}`}
            position={[s.lat, s.lng]}
            icon={posterIcon}
          >
            <Popup>
              <strong>Cartel</strong>
              <p>
                {leg.label}: {s.label}
              </p>
            </Popup>
          </Marker>
        )),
      )}
    </>
  )
}
