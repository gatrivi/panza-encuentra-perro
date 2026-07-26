import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet'
import L from 'leaflet'
import { useEffect } from 'react'
import type { Sighting } from '@/domain/schemas'
import { PANZA_SIGN_STOPS, type SignStop } from '@/lib/panzaCase'
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

function signStopIcon(stop: SignStop) {
  const bg = stop.leg === 'ida' ? '#c45c26' : '#1a3a2a'
  return L.divIcon({
    className: 'marker-sign-stop',
    html: `<span style="display:flex;align-items:center;justify-content:center;width:22px;height:22px;border-radius:50%;background:${bg};color:#fff;font-size:11px;font-weight:800;border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.35)">${stop.n}</span>`,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
  })
}

function FitBounds({
  sightings,
  showRoute,
}: {
  sightings: Sighting[]
  showRoute: boolean
}) {
  const map = useMap()
  useEffect(() => {
    const points: [number, number][] = sightings.map(
      (s) => [s.point[1], s.point[0]] as [number, number],
    )
    if (showRoute) {
      for (const stop of PANZA_SIGN_STOPS) {
        points.push([stop.lat, stop.lng])
      }
    }
    if (points.length === 0) {
      map.setView([-34.558, -58.512], 14)
      return
    }
    const bounds = L.latLngBounds(points)
    map.fitBounds(bounds.pad(0.12))
  }, [map, sightings, showRoute])
  return null
}

export function OperationalMap({
  sightings,
  showRoute = true,
}: {
  sightings: Sighting[]
  showRoute?: boolean
}) {
  const copy = t()
  const idaLine = PANZA_SIGN_STOPS.filter((s) => s.leg === 'ida').map(
    (s) => [s.lat, s.lng] as [number, number],
  )
  const vueltaLine = PANZA_SIGN_STOPS.filter((s) => s.leg === 'vuelta').map(
    (s) => [s.lat, s.lng] as [number, number],
  )

  return (
    <div className="map-container">
      <MapContainer
        center={[-34.558, -58.512]}
        zoom={14}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitBounds sightings={sightings} showRoute={showRoute} />
        {showRoute ? (
          <>
            <Polyline positions={idaLine} pathOptions={{ color: '#c45c26', weight: 4, opacity: 0.85 }} />
            <Polyline
              positions={vueltaLine}
              pathOptions={{ color: '#1a3a2a', weight: 4, opacity: 0.85, dashArray: '8 6' }}
            />
            {PANZA_SIGN_STOPS.map((stop) => (
              <Marker key={`sign-${stop.n}`} position={[stop.lat, stop.lng]} icon={signStopIcon(stop)}>
                <Popup>
                  <strong>
                    {stop.n}. {stop.label}
                  </strong>
                  <p className="small">{stop.street}</p>
                  <p className="small">{stop.signs > 1 ? `${stop.signs} carteles` : '1 cartel'}</p>
                </Popup>
              </Marker>
            ))}
          </>
        ) : null}
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
