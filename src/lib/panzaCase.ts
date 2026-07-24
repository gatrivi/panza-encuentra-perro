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
 * Dos mitades. No entrar a calzada Gral Paz.
 * Coords Maps = lat,lng
 */
export const PANZA_BIKE_LOOP_MARTELLI = [
  { label: 'Inicio · acceso Parque Sarmiento / Gral Paz', lat: -34.5508, lng: -58.5055 },
  { label: 'Borde parque · pista / Plazoleta El Ombú', lat: -34.5492, lng: -58.5068 },
  { label: 'Pin avistaje 23/7 (mirar banquina)', lat: -34.551, lng: -58.508 },
  { label: 'Zufriategui (Martelli) Norte', lat: -34.5528, lng: -58.5128 },
  { label: 'Zufriategui × Chile / Perú', lat: -34.5552, lng: -58.5142 },
  { label: 'Zona Shell (desde paralelo)', lat: -34.5578, lng: -58.5162 },
  { label: 'Cierre · Plaza Intendentes', lat: -34.5538, lng: -58.5158 },
] as const

/** Mitad CABA: Parque Sarmiento, bordes, accesos (sin cruzar a calzada) */
export const PANZA_BIKE_LOOP_SARMIENTO = [
  { label: 'Inicio · acceso peatonal Gral Paz / El Ombú', lat: -34.5505, lng: -58.505 },
  { label: 'Pista Miguel Sánchez · borde oeste', lat: -34.5518, lng: -58.5025 },
  { label: 'Norte parque · hacia Lugones', lat: -34.5472, lng: -58.5005 },
  { label: 'Miller / borde NE (mirá Dot)', lat: -34.544, lng: -58.498 },
  { label: 'Entrada Balbín 4750', lat: -34.5548, lng: -58.4968 },
  { label: 'Sur parque · juegos / tenis', lat: -34.5568, lng: -58.5005 },
  { label: 'Borde Gral Paz sur (banquina CABA)', lat: -34.5535, lng: -58.5055 },
  { label: 'Cierre · acceso peatonal El Ombú', lat: -34.5508, lng: -58.5048 },
] as const

/** @deprecated alias — loop corto original */
export const PANZA_BIKE_LOOP = PANZA_BIKE_LOOP_MARTELLI

function mapsLatLng(p: { lat: number; lng: number }) {
  return `${p.lat},${p.lng}`
}

function gmapsBikeUrl(
  loop: ReadonlyArray<{ lat: number; lng: number }>,
): string {
  const origin = loop[0]
  const dest = loop[loop.length - 1]
  const waypoints = loop
    .slice(1, -1)
    .map(mapsLatLng)
    .join('|')
  return (
    `https://www.google.com/maps/dir/?api=1` +
    `&origin=${mapsLatLng(origin)}` +
    `&destination=${mapsLatLng(dest)}` +
    `&waypoints=${waypoints}` +
    `&travelmode=bicycling`
  )
}

function wazeUrl(p: { lat: number; lng: number }) {
  return `https://waze.com/ul?ll=${mapsLatLng(p)}&navigate=yes&zoom=17`
}

/** Google Maps · Martelli (oeste Gral Paz) */
export const PANZA_GMAPS_BIKE_URL = gmapsBikeUrl(PANZA_BIKE_LOOP_MARTELLI)

/** Google Maps · Parque Sarmiento (este / CABA) */
export const PANZA_GMAPS_BIKE_SARMIENTO_URL = gmapsBikeUrl(PANZA_BIKE_LOOP_SARMIENTO)

export const PANZA_WAZE_START_URL = wazeUrl(PANZA_BIKE_LOOP_MARTELLI[0])
export const PANZA_WAZE_SARMIENTO_URL = wazeUrl(PANZA_BIKE_LOOP_SARMIENTO[0])

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
