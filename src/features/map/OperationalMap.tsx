import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet'
import L from 'leaflet'
import { useEffect } from 'react'
import type { Sighting } from '@/domain/schemas'
import { PANZA_SIGN_ROUTE, type SignStop } from '@/lib/panzaCase'
import { t } from '@/i18n/es-AR'
import 'leaflet/dist/leaflet.css'

const confidenceColor: Record<Sighting['confidence'], string> = {
  unverified: '#8a8a8a',
  probable: '#c45c26',
  confirmed: '#1a3a2a',
  rejected: '#9b2c2c',
}

function markerIcon(confidence: Sighting['confidence']) {
  const color = confidenceColor[confidence]
  const shape =
    confidence === 'confirmed'
      ? 'circle'
      : confidence === 'probable'
        ? 'diamond'
        : confidence === 'rejected'
          ? 'x'
          : 'square'
  const opacity = confidence === 'unverified' ? 0.55 : 1
  const html =
    shape === 'circle'
      ? `<span style="display:block;width:16px;height:16px;border-radius:50%;background:${color};opacity:${opacity};border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.35)"></span>`
      : shape === 'diamond'
        ? `<span style="display:block;width:14px;height:14px;background:${color};opacity:${opacity};transform:rotate(45deg);border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.35)"></span>`
        : shape === 'x'
          ? `<span style="color:${color};font-weight:900;font-size:18px;opacity:${opacity}">×</span>`
          : `<span style="display:block;width:14px;height:14px;background:${color};opacity:${opacity};border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.35)"></span>`

  return L.divIcon({
    className: `marker-${confidence}`,
    html,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  })
}

function signIcon(n: number) {
  return L.divIcon({
    className: 'sign-stop-marker',
    html: `<span style="display:flex;align-items:center;justify-content:center;width:20px;height:20px;border-radius:50%;background:#1a3a2a;color:#fff;font:700 10px/1 sans-serif;border:2px solid #fff;box-shadow:0 1px 3px rgba(0,0,0,.3)">${n}</span>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  })
}

function FitBounds({
  sightings,
  signs,
}: {
  sightings: Sighting[]
  signs: readonly SignStop[]
}) {
  const map = useMap()
  useEffect(() => {
    const pts: [number, number][] = [
      ...sightings.map((s) => [s.point[1], s.point[0]] as [number, number]),
      ...signs.map((s) => [s.lat, s.lng] as [number, number]),
    ]
    if (pts.length === 0) {
      map.setView([-34.5633, -58.5152], 14)
      return
    }
    map.fitBounds(L.latLngBounds(pts).pad(0.2))
  }, [map, sightings, signs])
  return null
}

export function OperationalMap({
  sightings,
  showSigns = true,
}: {
  sightings: Sighting[]
  showSigns?: boolean
}) {
  const copy = t()
  const signs = showSigns ? PANZA_SIGN_ROUTE : []

  return (
    <div className="map-container">
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
        <FitBounds sightings={sightings} signs={signs} />
        {signs.length > 0 ? (
          <Polyline
            positions={signs.map((s) => [s.lat, s.lng] as [number, number])}
            pathOptions={{ color: '#1a3a2a', weight: 2, opacity: 0.35 }}
          />
        ) : null}
        {signs.map((s) => (
          <Marker key={`sign-${s.n}`} position={[s.lat, s.lng]} icon={signIcon(s.n)}>
            <Popup>
              <strong>
                Cartel #{s.n} · {s.label}
              </strong>
              <p style={{ margin: '0.25rem 0 0' }}>{s.why}</p>
            </Popup>
          </Marker>
        ))}
        {sightings.map((s) => (
          <Marker
            key={s.id}
            position={[s.point[1], s.point[0]]}
            icon={markerIcon(s.confidence)}
          >
            <Popup>
              <div className="sighting-popup">
                <h3>{copy.confidence[s.confidence]}</h3>
                <p>
                  <strong>{copy.map.seenAt}:</strong>{' '}
                  {s.observedAt.toLocaleString('es-AR')}
                </p>
                <p>
                  <strong>{copy.map.reportedAt}:</strong>{' '}
                  {s.reportedAt.toLocaleString('es-AR')}
                </p>
                <p>
                  Dirección: {s.direction}
                  {s.affectsOfficialZone ? ' · zona oficial' : ''}
                </p>
                {s.description ? <p>{s.description}</p> : null}
                {s.evidence.sourceLinks[0] ? (
                  <p>
                    <a href={s.evidence.sourceLinks[0]} target="_blank" rel="noreferrer">
                      Fuente
                    </a>
                  </p>
                ) : null}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  )
}
