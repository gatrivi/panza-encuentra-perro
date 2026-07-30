import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  listPois,
  POI_KIND_LABEL,
  resetPoiOverrides,
  setPoiOn,
  setPoiWeight,
  type EffectivePoi,
} from '@/lib/poiCatalog'
import { invalidateValueCache } from '@/lib/maxValueRoute'

export function PoiScreen() {
  const [tick, setTick] = useState(0)
  const pois = useMemo(() => {
    void tick
    return listPois()
  }, [tick])
  const onCount = pois.filter((p) => p.on).length

  function bump() {
    invalidateValueCache()
    setTick((n) => n + 1)
  }

  return (
    <div className="screen poi-screen">
      <div className="poi-head">
        <h1>Puntos de interés</h1>
        <p className="muted">
          Elegí qué lugares entran a la ruta y cuánto pesan (1–10). Gasolineras,
          estaciones y paradas de colectivo que cruzan Martelli suelen ir arriba.
        </p>
        <p className="poi-summary">
          {onCount}/{pois.length} activos ·{' '}
          <Link to="/">ver mapa</Link>
        </p>
        <button
          type="button"
          className="btn btn-ghost"
          onClick={() => {
            resetPoiOverrides()
            bump()
          }}
        >
          Restablecer pesos
        </button>
      </div>

      <ul className="poi-list">
        {pois.map((p) => (
          <PoiRow key={p.id} poi={p} onChange={bump} />
        ))}
      </ul>
    </div>
  )
}

function PoiRow({
  poi,
  onChange,
}: {
  poi: EffectivePoi
  onChange: () => void
}) {
  return (
    <li className={`poi-row${poi.on ? '' : ' poi-off'}`}>
      <label className="poi-check">
        <input
          type="checkbox"
          checked={poi.on}
          onChange={(e) => {
            setPoiOn(poi.id, e.target.checked)
            onChange()
          }}
        />
        <span>
          <strong>{poi.label}</strong>
          <span className="muted poi-meta">
            {POI_KIND_LABEL[poi.kind]} · {poi.why}
          </span>
        </span>
      </label>
      <div className="poi-weight">
        <span className="poi-w-label">{poi.w}</span>
        <input
          type="range"
          min={1}
          max={10}
          step={1}
          value={poi.w}
          disabled={!poi.on}
          aria-label={`Peso de ${poi.label}`}
          onChange={(e) => {
            setPoiWeight(poi.id, Number(e.target.value))
            onChange()
          }}
        />
      </div>
    </li>
  )
}
