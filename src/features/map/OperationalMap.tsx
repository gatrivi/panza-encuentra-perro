import { Circle, MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet'
import L from 'leaflet'
import { useEffect } from 'react'
import type { SearchZone, Sign, Sighting } from '@/domain/schemas'
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

function signIcon(sign: Sign) {
  const colors: Record<Sign['tier'], string> = {
    A: '#1a3a2a',
    B: '#2f6b4f',
    C: '#c45c26',
    D: '#8a6b55',
  }
  const opacity = sign.status === 'placed' ? 1 : 0.45
  return L.divIcon({
    className: `marker-sign marker-sign-${sign.tier.toLowerCase()}`,
    html: `<span style="display:flex;width:22px;height:22px;border-radius:5px;align-items:center;justify-content:center;background:${colors[sign.tier]};color:white;opacity:${opacity};border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,.35);font-size:11px;font-weight:800">${sign.tier}</span>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  })
}

function FitBounds({
  sightings,
  signs,
  zone,
}: {
  sightings: Sighting[]
  signs: Sign[]
  zone: SearchZone | null
}) {
  const map = useMap()
  useEffect(() => {
    if (sightings.length === 0 && signs.length === 0 && !zone) {
      map.setView([-34.512, -58.49], 14)
      return
    }
    const points = [
      ...sightings.map((s) => [s.point[1], s.point[0]] as [number, number]),
      ...signs.map((s) => [s.point[1], s.point[0]] as [number, number]),
    ]
    const bounds = points.length > 0
      ? L.latLngBounds(points)
      : L.latLngBounds([zone!.center[1], zone!.center[0]], [zone!.center[1], zone!.center[0]])
    if (zone) {
      bounds.extend(
        L.circle([zone.center[1], zone.center[0]], { radius: zone.radiusMeters }).getBounds(),
      )
    }
    map.fitBounds(bounds.pad(0.25))
  }, [map, sightings, signs, zone])
  return null
}

export function OperationalMap({
  sightings,
  signs,
  zone,
}: {
  sightings: Sighting[]
  signs: Sign[]
  zone: SearchZone | null
}) {
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
        <FitBounds sightings={sightings} signs={signs} zone={zone} />
        {zone ? (
          <Circle
            center={[zone.center[1], zone.center[0]]}
            radius={zone.radiusMeters}
            pathOptions={{ color: '#1a3a2a', fillColor: '#2f6b4f', fillOpacity: 0.1 }}
          >
            <Popup>
              <strong>Zona operativa</strong>
              <br />Radio: {(zone.radiusMeters / 1000).toLocaleString('es-AR')} km
              {zone.basisObservedAt ? <><br />Base: {zone.basisObservedAt.toLocaleString('es-AR')}</> : null}
            </Popup>
          </Circle>
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
        {signs.map((sign) => (
          <Marker key={sign.id} position={[sign.point[1], sign.point[0]]} icon={signIcon(sign)}>
            <Popup>
              <div className="sighting-popup">
                <h3>Cartel {sign.tier}</h3>
                <p><strong>{sign.placeName || 'Sin nombre'}</strong></p>
                <p>Estado: {sign.status} · {sign.staffPersonallyAlerted ? 'personal avisado' : 'aviso no confirmado'}</p>
                {sign.lastCheckedAt ? <p>Revisado: {sign.lastCheckedAt.toLocaleString('es-AR')}</p> : null}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
      <div className="map-legend" aria-label="Leyenda del mapa">
        <span><i className="legend-dot confirmed" /> avistaje confirmado</span>
        <span><i className="legend-square" /> cartel</span>
        <span><i className="legend-zone" /> zona operativa</span>
      </div>
    </div>
  )
}
