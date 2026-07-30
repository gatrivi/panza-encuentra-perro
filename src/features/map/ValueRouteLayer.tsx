import { CircleMarker, Polyline, Tooltip } from 'react-leaflet'
import type { GeoPoint } from '@/domain/schemas'
import {
  buildMaxValueRoute,
  markedValueSlots,
} from '@/lib/maxValueRoute'
import type { SignPoint } from '@/lib/martelliPosterGrid'

type Props = {
  myPoint: GeoPoint | null
  signPoints: readonly SignPoint[]
  minutes: number
}

function valueColor(v: number): string {
  if (v >= 8) return '#c45c26'
  if (v >= 6) return '#b45309'
  return '#a16207'
}

/** Puntos de valor abiertos + mejor ruta dinámica desde el user. */
export function ValueRouteLayer({ myPoint, signPoints, minutes }: Props) {
  const marks = markedValueSlots(signPoints, 5)
  const from = myPoint
    ? { lat: myPoint[1], lng: myPoint[0] }
    : { lat: -34.5505, lng: -58.5105 }
  const route = buildMaxValueRoute(from, signPoints, minutes)

  return (
    <>
      {marks.slice(0, 80).map((s) => (
        <CircleMarker
          key={s.id}
          center={[s.lat, s.lng]}
          radius={s.value >= 8 ? 6 : 4}
          pathOptions={{
            color: valueColor(s.value),
            fillColor: valueColor(s.value),
            fillOpacity: 0.55,
            weight: 1,
          }}
        >
          <Tooltip direction="top" offset={[0, -4]}>
            valor {s.value} · {s.id}
          </Tooltip>
        </CircleMarker>
      ))}
      {route.points.length > 1 ? (
        <Polyline
          positions={route.points}
          pathOptions={{
            color: '#c45c26',
            weight: 4,
            opacity: 0.9,
            dashArray: '8 6',
          }}
        >
          <Tooltip sticky>
            Mejor valor · {route.stops.length} paradas · Σ
            {Math.round(route.totalValue)}
          </Tooltip>
        </Polyline>
      ) : null}
      {route.stops.map((s, i) => (
        <CircleMarker
          key={`rv-${s.id}`}
          center={[s.lat, s.lng]}
          radius={7}
          pathOptions={{
            color: '#1a3a2a',
            fillColor: '#c45c26',
            fillOpacity: 0.9,
            weight: 2,
          }}
        >
          <Tooltip direction="top">
            #{i + 1} · v{s.value} · {Math.round(s.metersFromPrev)} m
          </Tooltip>
        </CircleMarker>
      ))}
    </>
  )
}
