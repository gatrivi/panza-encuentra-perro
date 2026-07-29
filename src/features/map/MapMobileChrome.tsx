import { useEffect, useState } from 'react'
import { TileLayer, useMap } from 'react-leaflet'
import type { GeoPoint } from '@/domain/schemas'
import { LocalStreetLayer } from './LocalStreetLayer'

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
}: {
  myPoint: GeoPoint | null
  localArea?: boolean
}) {
  const map = useMap()
  const [sat, setSat] = useState(false)
  const [tilesEnabled, setTilesEnabled] = useState(false)
  const [tilesReady, setTilesReady] = useState(false)

  useEffect(() => {
    const bump = () => map.invalidateSize()
    bump()
    const t = window.setTimeout(bump, 200)
    window.addEventListener('resize', bump)
    window.addEventListener('orientationchange', bump)
    return () => {
      window.clearTimeout(t)
      window.removeEventListener('resize', bump)
      window.removeEventListener('orientationchange', bump)
    }
  }, [map])

  useEffect(() => {
    const enable = () => {
      window.requestAnimationFrame(() => setTilesEnabled(true))
    }
    if (document.readyState === 'complete') enable()
    else window.addEventListener('load', enable, { once: true })
    return () => window.removeEventListener('load', enable)
  }, [])

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
        <button
          type="button"
          className="map-ctl"
          disabled={!myPoint}
          onClick={() => {
            if (!myPoint) return
            map.flyTo([myPoint[1], myPoint[0]], Math.max(map.getZoom(), 16), {
              duration: 0.6,
            })
          }}
        >
          Mi ubicación
        </button>
      </div>
    </>
  )
}
