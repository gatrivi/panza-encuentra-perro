import { MapContainer, TileLayer, Marker, Popup, Polyline, CircleMarker, useMap } from 'react-leaflet'
import L from 'leaflet'
import { useEffect } from 'react'
import type { SignStop } from '@/lib/panzaCase'
import type { LivePos } from './useLivePosition'
import 'leaflet/dist/leaflet.css'

function stopIcon(n: number, state: 'todo' | 'current' | 'done') {
  const bg = state === 'done' ? '#2f6b4f' : state === 'current' ? '#c45c26' : '#1a3a2a'
  const scale = state === 'current' ? 1.15 : 1
  return L.divIcon({
    className: 'sign-stop-marker',
    html: `<span style="display:flex;align-items:center;justify-content:center;width:${22 * scale}px;height:${22 * scale}px;border-radius:50%;background:${bg};color:#fff;font:700 11px/1 sans-serif;border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.35)">${n}</span>`,
    iconSize: [22 * scale, 22 * scale],
    iconAnchor: [11 * scale, 11 * scale],
  })
}

function Follow({
  pos,
  current,
  follow,
}: {
  pos: LivePos | null
  current: SignStop | null
  follow: boolean
}) {
  const map = useMap()
  useEffect(() => {
    if (!follow) return
    if (pos) {
      map.setView([pos.lat, pos.lng], Math.max(map.getZoom(), 16), { animate: true })
      return
    }
    if (current) {
      map.setView([current.lat, current.lng], 16, { animate: true })
    }
  }, [map, pos, current, follow])
  return null
}

function FitRoute({ stops }: { stops: readonly SignStop[] }) {
  const map = useMap()
  useEffect(() => {
    if (stops.length === 0) return
    const bounds = L.latLngBounds(stops.map((s) => [s.lat, s.lng] as [number, number]))
    map.fitBounds(bounds.pad(0.15))
  }, [map, stops])
  return null
}

export function SignRouteMap({
  stops,
  done,
  currentN,
  pos,
  follow,
}: {
  stops: readonly SignStop[]
  done: ReadonlySet<number>
  currentN: number | null
  pos: LivePos | null
  follow: boolean
}) {
  const line = stops.map((s) => [s.lat, s.lng] as [number, number])
  const current = stops.find((s) => s.n === currentN) ?? null

  return (
    <div className="sign-route-map">
      <MapContainer
        center={[-34.5633, -58.5152]}
        zoom={14}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitRoute stops={stops} />
        <Follow pos={pos} current={current} follow={follow} />
        <Polyline positions={line} pathOptions={{ color: '#1a3a2a', weight: 3, opacity: 0.45 }} />
        {stops.map((s) => {
          const state: 'todo' | 'current' | 'done' =
            done.has(s.n) ? 'done' : s.n === currentN ? 'current' : 'todo'
          return (
            <Marker key={s.n} position={[s.lat, s.lng]} icon={stopIcon(s.n, state)}>
              <Popup>
                <strong>
                  #{s.n} {s.label}
                </strong>
                <p style={{ margin: '0.25rem 0 0' }}>{s.why}</p>
              </Popup>
            </Marker>
          )
        })}
        {pos ? (
          <CircleMarker
            center={[pos.lat, pos.lng]}
            radius={8}
            pathOptions={{ color: '#1a73e8', fillColor: '#1a73e8', fillOpacity: 0.9, weight: 2 }}
          >
            <Popup>Estás acá (±{Math.round(pos.accuracy)} m)</Popup>
          </CircleMarker>
        ) : null}
      </MapContainer>
    </div>
  )
}
