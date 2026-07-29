import { CircleMarker, Marker, Polyline, Popup, Tooltip } from 'react-leaflet'
import L from 'leaflet'
import {
  buildPosterAwareRoute,
  getRouteStart,
  type PosterMode,
  type RouteOrigin,
  type RoutePlanId,
} from '@/lib/posterRoutes'

const posterIcon = L.divIcon({
  className: 'poster-stop-icon',
  html: '<span style="display:block;width:12px;height:12px;background:#c45c26;border:2px solid #fff;border-radius:2px;box-shadow:0 1px 3px rgba(0,0,0,.4)"></span>',
  iconSize: [12, 12],
  iconAnchor: [6, 6],
})

type Props = {
  mode: PosterMode
  plan: RoutePlanId
  minutes: number
  skippedIds: readonly string[]
  origin: RouteOrigin | null
}

/** Recorrido del día + paradas, adaptado al tiempo y decisiones de campo. */
export function DayRouteLayer({
  mode,
  plan,
  minutes,
  skippedIds,
  origin,
}: Props) {
  const legs = buildPosterAwareRoute(mode, {
    plan,
    minutes,
    skippedIds,
    origin,
  })
  const routeStart = origin ?? getRouteStart(plan)
  const startLabel =
    origin && plan === 'roca-vias'
      ? 'Tu ubicación al recalcular'
      : getRouteStart(plan).label

  return (
    <>
      <CircleMarker
        center={[routeStart.lat, routeStart.lng]}
        radius={10}
        pathOptions={{ color: '#1a3a2a', fillColor: '#2d5a42', fillOpacity: 0.9, weight: 2 }}
      >
        <Popup>
          <strong>Salida</strong>
          <p>{startLabel}</p>
        </Popup>
      </CircleMarker>

      {legs.filter((leg) => leg.points.length > 1).map((leg) => (
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
            key={`${leg.id}-${s.id}`}
            position={[s.lat, s.lng]}
            icon={posterIcon}
          >
            <Popup>
              <strong>Cartel</strong>
              <p>
                {leg.label}: {s.label}
              </p>
              {s.why ? <p>{s.why}</p> : null}
            </Popup>
          </Marker>
        )),
      )}
    </>
  )
}
