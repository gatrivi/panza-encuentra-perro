import { useEffect, useState } from 'react'
import { TileLayer, useMap } from 'react-leaflet'
import type { GeoPoint } from '@/domain/schemas'
import { LocalStreetLayer } from './LocalStreetLayer'
import { ROCA_VIAS_FIELD_BOUNDS } from '@/lib/posterRoutes'
import L from 'leaflet'

const OSM = {
  // One HTTP/2 connection. OSM explicitly requires this host (not a/b/c).
  url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
  attr:
    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
}

/** Esri World Imagery — sin API key (atribución requerida). */
const SAT = {
  url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
  attr: 'Tiles &copy; Esri',
}

/** Fix Leaflet size + local streets + touch controls. */
export function MapMobileChrome({
  myPoint,
  localArea = false,
  routePoints = [],
}: {
  myPoint: GeoPoint | null
  localArea?: boolean
  routePoints?: readonly [number, number][]
}) {
  const map = useMap()
  const [sat, setSat] = useState(false)
  // Local rasters are preloaded before MapScreen mounts — show immediately.
  const [tilesEnabled, setTilesEnabled] = useState(localArea)
  const [tilesReady, setTilesReady] = useState(false)

  useEffect(() => {
    const bump = () => map.invalidateSize({ pan: false })
    bump()
    const t = window.setTimeout(bump, 200)
    const t2 = window.setTimeout(bump, 600)
    window.addEventListener('resize', bump)
    window.addEventListener('orientationchange', bump)
    return () => {
      window.clearTimeout(t)
      window.clearTimeout(t2)
      window.removeEventListener('resize', bump)
      window.removeEventListener('orientationchange', bump)
    }
  }, [map])

  useEffect(() => {
    if (localArea) {
      setTilesEnabled(true)
      return
    }
    const enable = () => {
      window.requestAnimationFrame(() => setTilesEnabled(true))
    }
    if (document.readyState === 'complete') enable()
    else window.addEventListener('load', enable, { once: true })
    return () => window.removeEventListener('load', enable)
  }, [localArea])

  return (
    <>
      {tilesEnabled && localArea && !sat ? (
        <LocalStreetLayer onReady={() => setTilesReady(true)} />
      ) : tilesEnabled ? (
        <TileLayer
          key={sat ? 'sat' : 'osm'}
          attribution={sat ? SAT.attr : OSM.attr}
          url={sat ? SAT.url : OSM.url}
          maxZoom={19}
          eventHandlers={{
            loading: () => setTilesReady(false),
            load: () => setTilesReady(true),
          }}
        />
      ) : null}
      {!tilesReady ? (
        <div className="map-base-status" role="status">
          Ruta lista · cargando calles
        </div>
      ) : null}
      <div className="map-mobile-controls" role="toolbar" aria-label="Controles del mapa">
        <button
          type="button"
          className={`map-ctl${sat ? ' map-ctl-on' : ''}`}
          aria-pressed={sat}
          onClick={() => {
            setTilesReady(false)
            setSat((v) => !v)
          }}
        >
          {sat ? 'Calles' : 'Satélite'}
        </button>
        {localArea ? (
          <button
            type="button"
            className="map-ctl"
            onClick={() => {
              map.invalidateSize({ pan: false })
              const pts =
                routePoints.length > 0
                  ? routePoints
                  : ([
                      [ROCA_VIAS_FIELD_BOUNDS.south, ROCA_VIAS_FIELD_BOUNDS.west],
                      [ROCA_VIAS_FIELD_BOUNDS.north, ROCA_VIAS_FIELD_BOUNDS.east],
                    ] as [number, number][])
              map.fitBounds(L.latLngBounds([...pts]).pad(0.06), {
                animate: true,
                maxZoom: 16,
                paddingTopLeft: [20, 56],
                paddingBottomRight: [20, 210],
              })
            }}
          >
            Ver ruta
          </button>
        ) : null}
      </div>
      <button
        type="button"
        className="map-ctl map-locate-btn"
        disabled={!myPoint}
        onClick={() => {
          if (!myPoint) return
          map.flyTo([myPoint[1], myPoint[0]], Math.max(map.getZoom(), 16), {
            duration: 0.55,
          })
        }}
      >
        Mi ubicación
      </button>
    </>
  )
}
