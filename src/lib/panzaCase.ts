/** Shared Panza case payload — client bootstrap + seed. */

export const PANZA_CASE_ID = 'case_panza'
export const PANZA_SLUG = 'pancita'

export const PANZA_PHOTOS = [
  '/panza/pnan2.jpg',
  '/panza/panrec.png',
  '/panza/panz.jpg',
] as const

export const PANZA_ANIMAL = {
  name: 'Panza',
  aliases: ['Pancita', 'Panchi', 'Pancite'],
  species: 'dog' as const,
  breed: 'Caniche / cruza',
  color: 'Negro / gris',
  sex: 'female' as const,
  size: 'mediana/pequeña',
  distinguishingMarks:
    'Pelaje negro rizado, cola larga, collar violeta con chapita de cerámica (dice PANZA) y 2 teléfonos. Mimosa, miedosa y rápida. 4 años, castrada.',
  photos: [...PANZA_PHOTOS],
}

export const PANZA_CONTACT = {
  displayPhone: '1156194761',
  whatsapp: '5491156194761',
  secondaryPhone: '1130400210',
}

export const PANZA_INSTRUCTIONS =
  'No la persigas ni la agarres. Solo la familia puede retenerla. Seguíla a distancia, avisá YA. Chapita PANZA. Último: 23/7 banquina Gral Paz → Villa Martelli (Parque Sarmiento).'

/** Banquina Gral Paz, Parque Sarmiento / mano Villa Martelli (GeoJSON lng,lat) */
export const PANZA_MAP_CENTER: [number, number] = [-58.508, -34.551]

export const PANZA_SOURCES = {
  facebook: 'https://www.facebook.com/share/p/1BgkXzFdgY/',
  facebookPrev: 'https://www.facebook.com/share/p/1JsbccK79Q/',
  instagram: 'https://www.instagram.com/buscamos.a.panza/',
} as const

/** 23/7 noche — Eva Buscando Huellas / Perros PERDIDOS ZONA NORTE */
export const PANZA_LATEST_SIGHTING = {
  idKey: 'fb_gralpaz_2026_07_23',
  sourceUrl: PANZA_SOURCES.facebook,
  observedLocal: '2026-07-23T21:00:00-03:00',
  point: [-58.508, -34.551] as [number, number],
  direction: 'NW' as const,
  confidence: 'probable' as const,
  locationText:
    'Banquina Av. Gral Paz cerca Parque Sarmiento, mano Villa Martelli (Pista Miguel Sánchez / Plazoleta El Ombú)',
  mapPhoto: '/panza/avistaje-gralpaz-2026-07-23.png',
  rawText: `URGENTE 23/7 — la vieron caminando por la banquina cerca de Parque Sarmiento yendo para Villa Martelli.
Cansada y desorientada. No se deja agarrar, está asustada y corre. Tiene chapita identificatoria.
NO AGARRARLA: seguirla a distancia y llamar a la familia. Solo los dueños pueden retenerla.
Contactos flyer: ${PANZA_CONTACT.displayPhone} / ${PANZA_CONTACT.secondaryPhone}.
Grupos: Perros PERDIDOS ZONA NORTE · Eva Buscando Huellas (Martelli y Florida, Vicente López).
Fuente: ${PANZA_SOURCES.facebook}`,
} as const

/** Mañana 24/7 — focos a pie (amanecer / atardecer) */
export const PANZA_SEARCH_PLAN_TOMORROW = [
  {
    title: 'Banquina Gral Paz → Villa Martelli',
    detail:
      'Tramo Parque Sarmiento / Pista Miguel Sánchez. Ambos lados. Ella va cansada por la banquina.',
  },
  {
    title: 'Verde: Plazoleta El Ombú + borde Parque Sarmiento',
    detail: 'Perros asustados se meten en pastizal / sombra. No empujar hacia la autopista.',
  },
  {
    title: 'Villa Martelli (lado provincia)',
    detail: 'Zufriategui y calles perpendiculares (Perú, Chile, Venezuela) pegadas a Gral Paz.',
  },
  {
    title: 'Shell / YPF de esa banquina',
    detail: 'Olfato a comida. Si la ven: no rodear — un solo contacto a distancia + llamada.',
  },
] as const

/**
 * Loop bici ~4–5 km. Calles paralelas (Zufriategui / borde parque).
 * No entra a la calzada de Gral Paz — mirás banquina desde el costado.
 * Coords Maps = lat,lng
 */
export const PANZA_BIKE_LOOP = [
  { label: 'Inicio · acceso Parque Sarmiento / Gral Paz', lat: -34.5508, lng: -58.5055 },
  { label: 'Borde parque · pista / Plazoleta El Ombú', lat: -34.5492, lng: -58.5068 },
  { label: 'Pin avistaje 23/7 (mirar banquina)', lat: -34.551, lng: -58.508 },
  { label: 'Zufriategui (Martelli) Norte', lat: -34.5528, lng: -58.5128 },
  { label: 'Zufriategui × Chile / Perú', lat: -34.5552, lng: -58.5142 },
  { label: 'Zona Shell (desde paralelo)', lat: -34.5578, lng: -58.5162 },
  { label: 'Cierre · Plaza Intendentes', lat: -34.5538, lng: -58.5158 },
] as const

function mapsLatLng(p: { lat: number; lng: number }) {
  return `${p.lat},${p.lng}`
}

const bikeOrigin = PANZA_BIKE_LOOP[0]
const bikeDest = PANZA_BIKE_LOOP[PANZA_BIKE_LOOP.length - 1]
const bikeWaypoints = PANZA_BIKE_LOOP.slice(1, -1)
  .map(mapsLatLng)
  .join('|')

/** Google Maps · modo bici · multi-parada */
export const PANZA_GMAPS_BIKE_URL =
  `https://www.google.com/maps/dir/?api=1` +
  `&origin=${mapsLatLng(bikeOrigin)}` +
  `&destination=${mapsLatLng(bikeDest)}` +
  `&waypoints=${bikeWaypoints}` +
  `&travelmode=bicycling`

/** Waze · navegar al inicio del loop */
export const PANZA_WAZE_START_URL =
  `https://waze.com/ul?ll=${mapsLatLng(bikeOrigin)}&navigate=yes&zoom=17`

/** Solo el pin del avistaje (Waze / Maps) */
export const PANZA_WAZE_SIGHTING_URL =
  `https://waze.com/ul?ll=${PANZA_LATEST_SIGHTING.point[1]},${PANZA_LATEST_SIGHTING.point[0]}&navigate=yes&zoom=18`

export const PANZA_GMAPS_SIGHTING_URL =
  `https://www.google.com/maps/search/?api=1&query=${PANZA_LATEST_SIGHTING.point[1]},${PANZA_LATEST_SIGHTING.point[0]}`

export const PANZA_FB_LEAD_TEXT = PANZA_LATEST_SIGHTING.rawText

export const PANZA_IG_LEAD_TEXT = `Cuenta de difusión Instagram @buscamos.a.panza
BUSCAMOS A PANZA. Se escapó el 15/7 al final del partido por Olivos, zona cementerio.
Hembra, 4 años, collar violeta con chapita. Contacto paupocket / Rodrii Perez Schmidt.
Último foco: Gral Paz / Parque Sarmiento → Villa Martelli (23/7).
Fuente: ${PANZA_SOURCES.instagram}`
