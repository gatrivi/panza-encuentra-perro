import {
  CircleMarker,
  MapContainer,
  Marker,
  Polyline,
  Popup,
  useMap,
  useMapEvents,
} from 'react-leaflet'
import L from 'leaflet'
import { lazy, Suspense, useEffect, useMemo } from 'react'
import type {
  AvoidArea,
  CoverageCell,
  GeoPoint,
  Lead,
  Sighting,
  Sign,
} from '@/domain/schemas'
import { PANZA_SIGN_ROUTE, type SignStop } from '@/lib/panzaCase'
import { t } from '@/i18n/es-AR'
import { AvoidAreasLayer } from './AvoidAreasLayer'
import { SignsLayer } from './SignsLayer'
import { MyLocationMarker } from './MyLocationMarker'
import { DesktopPlaceClick } from './DesktopPlaceClick'
import { MapMobileChrome } from './MapMobileChrome'
import { DayRouteLayer } from './DayRouteLayer'
import { ValueRouteLayer } from './ValueRouteLayer'
import { calcLeadDecay, calcTipDecay } from '@/lib/geo/leadDecay'
import { PANZA_LATEST_SIGHTING, PANZA_MAP_CENTER } from '@/lib/panzaCase'
import {
  buildPosterAwareRoute,
  getRocaViasFieldOrigin,
  getRouteStart,
  ROCA_VIAS_EPICENTER,
  ROCA_VIAS_FIELD_BOUNDS,
  type PosterMode,
  type RouteOrigin,
  type RoutePlanId,
} from '@/lib/posterRoutes'
import 'leaflet/dist/leaflet.css'

const CoverageLayer = lazy(() =>
  import('./CoverageLayer').then((m) => ({ default: m.CoverageLayer })),
)

const confidenceColor: Record<Sighting['confidence'], string> = {
  unverified: '#8a8a8a',
  probable: '#c45c26',
  confirmed: '#1a3a2a',
  rejected: '#9b2c2c',
}

function markerIcon(s: Sighting) {
  const decay = calcLeadDecay(s.observedAt)
  // confidence shape + Sonnet age decay (unverified stays muted)
  const base = confidenceColor[s.confidence]
  const color =
    s.confidence === 'unverified'
      ? decay.color
      : s.confidence === 'rejected'
        ? base
        : decay.opacity >= 0.8
          ? base
          : decay.color
  const opacity =
    s.confidence === 'unverified'
      ? Math.min(decay.opacity, 0.55)
      : s.confidence === 'rejected'
        ? 0.4
        : decay.opacity

  const shape =
    s.confidence === 'confirmed'
      ? 'circle'
      : s.confidence === 'probable'
        ? 'diamond'
        : s.confidence === 'rejected'
          ? 'x'
          : 'square'

  const html =
    shape === 'circle'
      ? `<span style="display:block;width:16px;height:16px;border-radius:50%;background:${color};opacity:${opacity};border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.35)"></span>`
      : shape === 'diamond'
        ? `<span style="display:block;width:14px;height:14px;background:${color};opacity:${opacity};transform:rotate(45deg);border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.35)"></span>`
        : shape === 'x'
          ? `<span style="color:${color};font-weight:900;font-size:18px;opacity:${opacity}">×</span>`
          : `<span style="display:block;width:14px;height:14px;background:${color};opacity:${opacity};border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.35)"></span>`

  return L.divIcon({
    className: `marker-${s.confidence}`,
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

/** Tip crudo (lead sin promover): visible grisado, no mueve zona oficial. */
function tipIcon(lead: Lead) {
  const when = lead.claimedObservationAt ?? lead.capturedAt
  const { opacity, color } = calcTipDecay(when)
  const html = `<span style="display:block;width:12px;height:12px;border-radius:50%;background:${color};opacity:${opacity};border:1.5px dashed #fff;box-shadow:0 1px 3px rgba(0,0,0,.3)"></span>`
  return L.divIcon({
    className: 'marker-tip',
    html,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  })
}

/** Dock + tools — keep route readable above the bottom sheet. */
const FIELD_FIT_PAD = {
  paddingTopLeft: [12, 48] as [number, number],
  paddingBottomRight: [12, 200] as [number, number],
}

function fitRocaField(
  map: L.Map,
  posterMode: PosterMode,
  routeMinutes: number,
  skippedIds: readonly string[],
  routeOrigin: RouteOrigin | null,
) {
  map.invalidateSize({ pan: false })
  const { south, west, north, east } = ROCA_VIAS_FIELD_BOUNDS
  const field = L.latLngBounds([south, west], [north, east])
  // Soft cage around the ops area — OSM fills the rest of the phone.
  map.setMaxBounds(field.pad(0.35))
  map.options.maxBoundsViscosity = 0.4
  map.setMinZoom(13)

  const effectiveOrigin = getRocaViasFieldOrigin(routeOrigin)
  const routePts = buildPosterAwareRoute(posterMode, {
    plan: 'roca-vias',
    minutes: routeMinutes,
    skippedIds,
    origin: effectiveOrigin,
  }).flatMap((leg) => leg.points)
  const focusPts: [number, number][] =
    routePts.length > 0
      ? routePts
      : [[ROCA_VIAS_EPICENTER.lat, ROCA_VIAS_EPICENTER.lng]]
  map.fitBounds(L.latLngBounds(focusPts).pad(0.1), {
    animate: false,
    maxZoom: 16,
    ...FIELD_FIT_PAD,
  })
}

function FitBounds({
  sightings,
  tips,
  posterMode,
  signStops,
  routePlan,
  routeMinutes,
  skippedIds,
  routeOrigin,
}: {
  sightings: Sighting[]
  tips: Lead[]
  posterMode: PosterMode
  signStops: readonly SignStop[]
  routePlan: RoutePlanId
  routeMinutes: number
  skippedIds: readonly string[]
  routeOrigin: RouteOrigin | null
}) {
  const map = useMap()
  useEffect(() => {
    if (routePlan === 'roca-vias') {
      fitRocaField(map, posterMode, routeMinutes, skippedIds, routeOrigin)
      // Second pass after layout settles (first paint often has wrong size).
      const t = window.setTimeout(() => {
        fitRocaField(map, posterMode, routeMinutes, skippedIds, routeOrigin)
      }, 350)
      return () => window.clearTimeout(t)
    }
    map.setMaxBounds(undefined as unknown as L.LatLngBoundsExpression)
    map.setMinZoom(0)
    const effectiveOrigin = routeOrigin
    const routePts = buildPosterAwareRoute(posterMode, {
      plan: routePlan,
      minutes: routeMinutes,
      skippedIds,
      origin: effectiveOrigin,
    }).flatMap((leg) => leg.points)
    const routeStart = effectiveOrigin ?? getRouteStart(routePlan)
    const pts: [number, number][] = [
      [routeStart.lat, routeStart.lng],
      ...sightings.map((s) => [s.point[1], s.point[0]] as [number, number]),
      ...tips
        .filter((l) => l.claimedPoint)
        .map((l) => [l.claimedPoint![1], l.claimedPoint![0]] as [number, number]),
      ...signStops.map((s) => [s.lat, s.lng] as [number, number]),
      ...routePts,
    ]
    map.fitBounds(L.latLngBounds(pts).pad(0.12), {
      animate: false,
      maxZoom: 16,
      paddingTopLeft: [24, 24],
      paddingBottomRight: [24, 24],
    })
  }, [
    map,
    sightings,
    tips,
    posterMode,
    signStops,
    routePlan,
    routeMinutes,
    skippedIds,
    routeOrigin,
  ])
  return null
}

export type OperationalMapProps = {
  sightings: Sighting[]
  /** Leads con punto, aún no promovidos — Sonnet: visibles grisados */
  tipLeads?: Lead[]
  coverage: CoverageCell[]
  signs: Sign[]
  avoidAreas: AvoidArea[]
  myPoint: GeoPoint | null
  riskSweepIds: string[]
  suggestIds: string[]
  placeMode: boolean
  posterMode: PosterMode
  routePlan: RoutePlanId
  routeMinutes: number
  skippedIds: readonly string[]
  routeOrigin: RouteOrigin | null
  signPoints?: readonly { lat: number; lng: number }[]
  showSignRoute?: boolean
  /** Hex coverage / suggest clutter — off on field by default. */
  showCoverage?: boolean
  onPlaceSign: (point: GeoPoint) => void
  onLongPressHex: (cellId: string) => void
}

export function OperationalMap({
  sightings,
  tipLeads = [],
  coverage,
  signs,
  avoidAreas,
  myPoint,
  riskSweepIds,
  suggestIds,
  placeMode,
  posterMode,
  routePlan,
  routeMinutes,
  skippedIds,
  routeOrigin,
  signPoints = [],
  showSignRoute = true,
  showCoverage = false,
  onPlaceSign,
  onLongPressHex,
}: OperationalMapProps) {
  const copy = t()
  const signStops =
    showSignRoute && routePlan !== 'roca-vias' ? PANZA_SIGN_ROUTE : []
  const hasCoverage =
    coverage.length > 0 || riskSweepIds.length > 0 || suggestIds.length > 0
  const localArea = routePlan === 'roca-vias'
  const mapCenter: [number, number] = localArea
    ? [
        (ROCA_VIAS_FIELD_BOUNDS.south + ROCA_VIAS_FIELD_BOUNDS.north) / 2,
        (ROCA_VIAS_FIELD_BOUNDS.west + ROCA_VIAS_FIELD_BOUNDS.east) / 2,
      ]
    : [PANZA_MAP_CENTER[1], PANZA_MAP_CENTER[0]]
  const routePoints = useMemo(() => {
    if (routePlan !== 'roca-vias') return []
    const effectiveOrigin = getRocaViasFieldOrigin(routeOrigin)
    return buildPosterAwareRoute(posterMode, {
      plan: routePlan,
      minutes: routeMinutes,
      skippedIds,
      origin: effectiveOrigin,
    }).flatMap((leg) => leg.points)
  }, [posterMode, routePlan, routeMinutes, skippedIds, routeOrigin])

  return (
    <div className="map-container">
      <MapContainer
        center={mapCenter}
        zoom={localArea ? 14 : 15}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom
        zoomControl={false}
        touchZoom
        doubleClickZoom
        dragging
        preferCanvas
      >
        <MapMobileChrome
          myPoint={myPoint}
          localArea={localArea}
          routePoints={routePoints}
        />
        <ZoomBottomLeft />
        <FitBounds
          sightings={sightings}
          tips={tipLeads}
          posterMode={posterMode}
          signStops={signStops}
          routePlan={routePlan}
          routeMinutes={routeMinutes}
          skippedIds={skippedIds}
          routeOrigin={routeOrigin}
        />
        <DayRouteLayer
          mode={posterMode}
          plan={routePlan}
          minutes={routeMinutes}
          skippedIds={skippedIds}
          origin={routeOrigin}
        />
        <ValueRouteLayer
          myPoint={myPoint}
          signPoints={signPoints}
          minutes={routeMinutes}
          showMarks={false}
        />
        {routePlan === 'roca-vias' ? (
          <CircleMarker
            center={[ROCA_VIAS_EPICENTER.lat, ROCA_VIAS_EPICENTER.lng]}
            radius={14}
            pathOptions={{
              color: '#c45c26',
              fillColor: '#c45c26',
              fillOpacity: 0.3,
              weight: 3,
            }}
          >
            <Popup>
              <div className="sighting-popup">
                <h3>Último avistamiento confirmado</h3>
                <p>{ROCA_VIAS_EPICENTER.label}</p>
                <p>{ROCA_VIAS_EPICENTER.why}</p>
              </div>
            </Popup>
          </CircleMarker>
        ) : sightings.length === 0 && tipLeads.length === 0 ? (
          <CircleMarker
            center={[PANZA_LATEST_SIGHTING.point[1], PANZA_LATEST_SIGHTING.point[0]]}
            radius={14}
            pathOptions={{
              color: '#c45c26',
              fillColor: '#c45c26',
              fillOpacity: 0.25,
              weight: 2,
            }}
          >
            <Popup>
              <div className="sighting-popup">
                <h3>Foco 23/7</h3>
                <p>{PANZA_LATEST_SIGHTING.locationText}</p>
              </div>
            </Popup>
          </CircleMarker>
        ) : null}
        {hasCoverage && showCoverage ? (
          <Suspense fallback={null}>
            <CoverageLayer
              cells={coverage}
              riskSweepIds={riskSweepIds}
              suggestIds={suggestIds}
              onLongPressCell={onLongPressHex}
            />
          </Suspense>
        ) : null}
        {signStops.length > 0 ? (
          <Polyline
            positions={signStops.map((s) => [s.lat, s.lng] as [number, number])}
            pathOptions={{ color: '#1a3a2a', weight: 2, opacity: 0.35 }}
          />
        ) : null}
        {signStops.map((s) => (
          <Marker key={`sign-${s.n}`} position={[s.lat, s.lng]} icon={signIcon(s.n)}>
            <Popup>
              <strong>
                Cartel #{s.n} · {s.label}
              </strong>
              <p style={{ margin: '0.25rem 0 0' }}>{s.why}</p>
            </Popup>
          </Marker>
        ))}
        <AvoidAreasLayer areas={avoidAreas} />
        <SignsLayer signs={signs} />
        <MyLocationMarker point={myPoint} />
        <DesktopPlaceClick enabled={placeMode} onPlace={onPlaceSign} />
        <DeferredMapLongPress onLongPressHex={onLongPressHex} />
        {tipLeads.map((lead) =>
          lead.claimedPoint ? (
            <Marker
              key={`tip-${lead.id}`}
              position={[lead.claimedPoint[1], lead.claimedPoint[0]]}
              icon={tipIcon(lead)}
              opacity={0.9}
            >
              <Popup>
                <div className="sighting-popup">
                  <h3>Tip sin verificar · {lead.origin}</h3>
                  {lead.claimedLocationText ? <p>{lead.claimedLocationText}</p> : null}
                  {lead.rawText ? (
                    <p>{lead.rawText.slice(0, 220)}{lead.rawText.length > 220 ? '…' : ''}</p>
                  ) : null}
                  {lead.sourceUrl ? (
                    <p>
                      <a href={lead.sourceUrl} target="_blank" rel="noreferrer">
                        Fuente
                      </a>
                    </p>
                  ) : null}
                </div>
              </Popup>
            </Marker>
          ) : null,
        )}
        {sightings.map((s) => (
          <Marker
            key={s.id}
            position={[s.point[1], s.point[0]]}
            icon={markerIcon(s)}
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

function DeferredMapLongPress({
  onLongPressHex,
}: {
  onLongPressHex: (cellId: string) => void
}) {
  useMapEvents({
    contextmenu(e) {
      e.originalEvent.preventDefault()
      void import('@/lib/geo/h3Coverage').then(({ pointToCell }) => {
        onLongPressHex(pointToCell([e.latlng.lng, e.latlng.lat]))
      })
    },
  })
  return null
}

function ZoomBottomLeft() {
  const map = useMap()
  useEffect(() => {
    const z = L.control.zoom({ position: 'bottomleft' })
    z.addTo(map)
    return () => {
      z.remove()
    }
  }, [map])
  return null
}
