/**
 * Curated subset of jivoi/awesome-osint (MIT) — industry-standard OSINT catalog.
 * @see https://github.com/jivoi/awesome-osint
 * Engine architecture inspired by OpenOSINT/OpenOSINT (MIT).
 * @see https://github.com/OpenOSINT/OpenOSINT
 */

export type OsintCategory =
  | 'geospatial'
  | 'image'
  | 'social'
  | 'search'
  | 'phone'
  | 'local'

export type OsintTool = {
  id: string
  name: string
  url: string
  category: OsintCategory
  description: string
  /** Build a search URL from a query string */
  searchUrl?: (query: string) => string
  tags: string[]
}

export const OSINT_CORE_REPOS = {
  catalog: {
    name: 'awesome-osint',
    url: 'https://github.com/jivoi/awesome-osint',
    stars: '48k+',
    role: 'Tool registry — curated links for investigators',
  },
  engine: {
    name: 'OpenOSINT',
    url: 'https://github.com/OpenOSINT/OpenOSINT',
    stars: '1.1k+',
    role: 'Investigation engine pattern — modular tools, MCP, dork chaining',
  },
} as const

/** Lost-pet / geolocation OSINT toolkit — hand-picked from awesome-osint */
export const OSINT_TOOLS: OsintTool[] = [
  {
    id: 'google-dorks',
    name: 'Google Dorks',
    url: 'https://github.com/jivoi/awesome-osint',
    category: 'search',
    description: 'Búsqueda avanzada con operadores site:, intext:, after:',
    searchUrl: (q) =>
      `https://www.google.com/search?q=${encodeURIComponent(q)}`,
    tags: ['dork', 'facebook', 'instagram'],
  },
  {
    id: 'google-maps',
    name: 'Google Maps',
    url: 'https://maps.google.com',
    category: 'geospatial',
    description: 'Satélite, Street View, medición de distancias',
    searchUrl: (q) =>
      `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`,
    tags: ['map', 'streetview'],
  },
  {
    id: 'google-earth',
    name: 'Google Earth Pro',
    url: 'https://www.google.com/earth/versions/#earth-pro',
    category: 'geospatial',
    description: 'Terreno 3D, medición, capas históricas',
    tags: ['satellite', 'terrain'],
  },
  {
    id: 'osm-overpass',
    name: 'Overpass Turbo',
    url: 'https://overpass-turbo.eu',
    category: 'geospatial',
    description: 'Consultar OpenStreetMap: parques, estacionamientos, vías',
    tags: ['osm', 'poi'],
  },
  {
    id: 'bellingcat-osm',
    name: 'Bellingcat OSM Search',
    url: 'https://osm-search.bellingcat.com',
    category: 'geospatial',
    description: 'Búsqueda geográfica asistida para geolocalización',
    tags: ['geoint', 'verify'],
  },
  {
    id: 'geohints',
    name: 'GeoHints',
    url: 'https://geohints.com',
    category: 'geospatial',
    description: 'Pistas visuales por país: señales, postes, marcas viales',
    tags: ['geolocation', 'photo'],
  },
  {
    id: 'google-lens',
    name: 'Google Lens',
    url: 'https://lens.google.com',
    category: 'image',
    description: 'Búsqueda inversa desde foto (lugar, objeto)',
    tags: ['reverse-image'],
  },
  {
    id: 'tineye',
    name: 'TinEye',
    url: 'https://tineye.com',
    category: 'image',
    description: 'Búsqueda inversa de imágenes',
    tags: ['reverse-image'],
  },
  {
    id: 'yandex-images',
    name: 'Yandex Images',
    url: 'https://yandex.com/images',
    category: 'image',
    description: 'Reverse search — a veces mejor que Google para AR',
    searchUrl: (q) =>
      `https://yandex.com/images/search?rpt=imageview&url=${encodeURIComponent(q)}`,
    tags: ['reverse-image'],
  },
  {
    id: 'fb-search',
    name: 'Facebook Search',
    url: 'https://www.facebook.com/search/posts',
    category: 'social',
    description: 'Buscar publicaciones públicas',
    searchUrl: (q) =>
      `https://www.facebook.com/search/posts?q=${encodeURIComponent(q)}`,
    tags: ['facebook', 'lost-pet'],
  },
  {
    id: 'fb-groups',
    name: 'Facebook Groups',
    url: 'https://www.facebook.com/groups',
    category: 'social',
    description: 'Grupos de mascotas perdidas zona norte',
    tags: ['facebook', 'groups'],
  },
  {
    id: 'ig-search',
    name: 'Instagram Search',
    url: 'https://www.instagram.com/explore/tags/',
    category: 'social',
    description: 'Hashtags: #perroperdido #zonanorte #vicentelopez',
    searchUrl: (tag) =>
      `https://www.instagram.com/explore/tags/${encodeURIComponent(tag.replace(/^#/, ''))}/`,
    tags: ['instagram'],
  },
  {
    id: 'telegram-osint',
    name: 'Telegram Search',
    url: 'https://tgstat.com/search',
    category: 'social',
    description: 'Canales/grupos de mascotas perdidas',
    searchUrl: (q) =>
      `https://tgstat.com/search?q=${encodeURIComponent(q)}`,
    tags: ['telegram'],
  },
  {
    id: 'reddit-search',
    name: 'Reddit Search',
    url: 'https://www.reddit.com/search',
    category: 'social',
    description: 'r/argentina, r/BuenosAires, lost pet subs',
    searchUrl: (q) =>
      `https://www.reddit.com/search/?q=${encodeURIComponent(q)}`,
    tags: ['reddit'],
  },
  {
    id: 'twitter-search',
    name: 'X / Twitter Search',
    url: 'https://x.com/search',
    category: 'social',
    description: 'Búsqueda en tiempo real',
    searchUrl: (q) =>
      `https://x.com/search?q=${encodeURIComponent(q)}&f=live`,
    tags: ['twitter', 'realtime'],
  },
  {
    id: 'whatsap-groups',
    name: 'Grupos WhatsApp (manual)',
    url: 'https://github.com/jivoi/awesome-osint',
    category: 'social',
    description: 'Pegar capturas en Bandeja — no hay API pública',
    tags: ['whatsapp', 'manual'],
  },
  {
    id: 'truecaller',
    name: 'Truecaller Web',
    url: 'https://www.truecaller.com/search/ar/',
    category: 'phone',
    description: 'Lookup teléfono de quien reportó (si lo dejó)',
    searchUrl: (q) =>
      `https://www.truecaller.com/search/ar/${encodeURIComponent(q)}`,
    tags: ['phone'],
  },
  {
    id: 'mercadolibre',
    name: 'MercadoLibre',
    url: 'https://listado.mercadolibre.com.ar',
    category: 'local',
    description: 'Avisos de mascotas encontradas / venta',
    searchUrl: (q) =>
      `https://listado.mercadolibre.com.ar/${encodeURIComponent(q)}`,
    tags: ['marketplace', 'found'],
  },
  {
    id: 'zonaprop',
    name: 'Zonaprop / depósitos',
    url: 'https://www.zonaprop.com.ar',
    category: 'local',
    description: 'Predios industriales donde puede esconderse',
    searchUrl: (q) =>
      `https://www.zonaprop.com.ar/${encodeURIComponent(q)}`,
    tags: ['industrial', 'hiding'],
  },
]

export const PANZA_WATCH_QUERIES = [
  'panza perro perdido',
  'caniche negro perdido olivos',
  'perro perdido villa martelli',
  'perro perdido vicente lopez',
  'perro perdido general paz',
  'perro perdido zona norte buenos aires',
  'pancita perro',
  'caniche negro chapita',
] as const

export function toolsByCategory(category: OsintCategory): OsintTool[] {
  return OSINT_TOOLS.filter((t) => t.category === category)
}

export function findTool(id: string): OsintTool | undefined {
  return OSINT_TOOLS.find((t) => t.id === id)
}
