/**
 * Salida: Fray Justo Sarmiento × Pelliza (Olivos / cementerio).
 * 3 modos de carteles → alteran qué tramos se marcan para pegar.
 */

export type PosterMode = 'dest_return' | 'full' | 'dest_only'

export const POSTER_MODES: {
  id: PosterMode
  label: string
  hint: string
}[] = [
  {
    id: 'dest_return',
    label: 'Destino+vuelta',
    hint: 'Default: carteles en zona destino y camino de regreso',
  },
  {
    id: 'full',
    label: 'Ida+dest+vuelta',
    hint: 'Carteles en ida, destino y regreso',
  },
  {
    id: 'dest_only',
    label: 'Solo destino',
    hint: 'Carteles solo en la zona destino; ida/vuelta sin paradas',
  },
]

export const POSTER_MODE_DEFAULT: PosterMode = 'dest_return'

/** Casa / salida patrulla */
export const PANZA_HOME_BASE = {
  label: 'Fray Justo Sarmiento × Pelliza',
  lat: -34.5154,
  lng: -58.5077,
} as const

type Stop = { label: string; lat: number; lng: number; poster?: boolean }

/** Ida casa → foco Gral Paz / Martelli (vía Florida / norte) */
const OUTBOUND: Stop[] = [
  { label: 'Salida · Fray Justo × Pelliza', lat: -34.5154, lng: -58.5077 },
  { label: 'Florida · Maipú / Mitre', lat: -34.532, lng: -58.492 },
  { label: 'Acercamiento Gral Paz', lat: -34.545, lng: -58.505 },
  { label: 'Foco banquina / Martelli', lat: -34.551, lng: -58.508 },
]

/** Zona destino — peinar + carteles */
const DEST: Stop[] = [
  { label: 'Pin 23/7 banquina', lat: -34.551, lng: -58.508 },
  { label: 'Plazoleta El Ombú', lat: -34.5492, lng: -58.5068 },
  { label: 'Zufriategui Norte', lat: -34.5528, lng: -58.5128 },
  { label: 'Zufriategui × Perú/Chile', lat: -34.5552, lng: -58.5142 },
  { label: 'Shell / paralelo', lat: -34.5578, lng: -58.5162 },
]

/** Vuelta distinta (más cuadras para carteles) → casa */
const INBOUND: Stop[] = [
  { label: 'Salida dest · Zufriategui', lat: -34.5538, lng: -58.5158 },
  { label: 'Munro / borde', lat: -34.54, lng: -58.52 },
  { label: 'Olivos · Ugarte', lat: -34.525, lng: -58.512 },
  { label: 'Casa · Fray Justo × Pelliza', lat: -34.5154, lng: -58.5077 },
]

export type RouteLeg = {
  id: 'outbound' | 'destination' | 'inbound'
  label: string
  color: string
  dashArray?: string
  points: [number, number][] // lat,lng for Leaflet
  posterStops: { lat: number; lng: number; label: string }[]
}

function latLngs(stops: Stop[]): [number, number][] {
  return stops.map((s) => [s.lat, s.lng])
}

function posters(
  stops: Stop[],
  enabled: boolean,
): { lat: number; lng: number; label: string }[] {
  if (!enabled) return []
  // skip first/last pure transit if many — mark middle + labeled stops
  return stops
    .filter((_, i) => i > 0 || stops.length <= 2)
    .map((s) => ({ lat: s.lat, lng: s.lng, label: s.label }))
}

/** Construye ida / destino / vuelta según modo de carteles. */
export function buildPosterAwareRoute(mode: PosterMode): RouteLeg[] {
  const outPosters = mode === 'full'
  const destPosters = true
  const inPosters = mode !== 'dest_only'

  return [
    {
      id: 'outbound',
      label: 'Ida',
      color: outPosters ? '#c45c26' : '#8a8a8a',
      dashArray: outPosters ? undefined : '4 8',
      points: latLngs(OUTBOUND),
      posterStops: posters(OUTBOUND.slice(1, -1), outPosters),
    },
    {
      id: 'destination',
      label: 'Destino',
      color: '#1a3a2a',
      points: latLngs(DEST),
      posterStops: posters(DEST, destPosters),
    },
    {
      id: 'inbound',
      label: 'Vuelta',
      color: inPosters ? '#c45c26' : '#8a8a8a',
      dashArray: inPosters ? undefined : '4 8',
      points: latLngs(INBOUND),
      posterStops: posters(INBOUND.slice(0, -1), inPosters),
    },
  ]
}

const MODE_KEY = 'panza.posterMode'

export function readPosterMode(): PosterMode {
  try {
    const v = localStorage.getItem(MODE_KEY) as PosterMode | null
    if (v === 'dest_return' || v === 'full' || v === 'dest_only') return v
  } catch {
    /* ignore */
  }
  return POSTER_MODE_DEFAULT
}

export function writePosterMode(mode: PosterMode) {
  try {
    localStorage.setItem(MODE_KEY, mode)
  } catch {
    /* ignore */
  }
}
