import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import { useEffect } from 'react'
import type { Sighting } from '@/domain/schemas'
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

function FitBounds({ sightings }: { sightings: Sighting[] }) {
  const map = useMap()
  useEffect(() => {
    if (sightings.length === 0) {
      map.setView([-34.512, -58.49], 14)
      return
    }
    const bounds = L.latLngBounds(
      sightings.map((s) => [s.point[1], s.point[0]] as [number, number]),
    )
    map.fitBounds(bounds.pad(0.25))
  }, [map, sightings])
  return null
}

export function OperationalMap({ sightings }: { sightings: Sighting[] }) {
  const copy = t()

  return (
    <div className="map-container">
      <MapContainer
        center={[-34.512, -58.49]}
        zoom={14}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitBounds sightings={sightings} />
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
