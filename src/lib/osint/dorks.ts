/** Google dork generator — OpenOSINT-style recon for lost pet cases. */

export type DorkTarget = 'facebook' | 'instagram' | 'web' | 'news' | 'marketplace'

export type GeneratedDork = {
  id: string
  target: DorkTarget
  query: string
  label: string
  rationale: string
}

const ZONE_TERMS = [
  'Villa Martelli',
  'Villa Maipú',
  'Vicente López',
  'Olivos',
  'General Paz',
  'Constituyentes',
  'Tecnópolis',
  'Florida',
] as const

function dork(
  target: DorkTarget,
  query: string,
  label: string,
  rationale: string,
): GeneratedDork {
  return {
    id: `${target}:${query.slice(0, 40)}`,
    target,
    query,
    label,
    rationale,
  }
}

/** Build investigation dorks for a lost dog case */
export function generatePanzaDorks(input?: {
  name?: string
  aliases?: string[]
  breed?: string
  color?: string
  zones?: string[]
}): GeneratedDork[] {
  const name = input?.name ?? 'Panza'
  const aliases = input?.aliases ?? ['Pancita', 'Pancite']
  const breed = input?.breed ?? 'caniche'
  const color = input?.color ?? 'negro'
  const zones = input?.zones ?? [...ZONE_TERMS]
  const names = [name, ...aliases].join(' OR ')
  const zone = zones.slice(0, 4).join(' OR ')

  return [
  dork(
    'facebook',
    `site:facebook.com ("perro perdido" OR "perdida") (${zone}) (${breed} OR ${color})`,
    'FB · perro perdido zona',
    'Grupos y posts públicos de mascotas perdidas',
  ),
  dork(
    'facebook',
    `site:facebook.com (${names}) (perdido OR perdida OR avistaje)`,
    'FB · nombre + avistaje',
    'Menciones directas del nombre o alias',
  ),
  dork(
    'facebook',
    `site:facebook.com "Perros PERDIDOS ZONA NORTE" (${breed} OR ${color}) after:2026-07-15`,
    'FB · grupo zona norte',
    'Grupo clave donde ya hubo avistajes',
  ),
  dork(
    'instagram',
    `site:instagram.com #perroperdido (${zone})`,
    'IG · hashtag zona',
    'Posts recientes con hashtag',
  ),
  dork(
    'instagram',
    `site:instagram.com buscamos.a.panza OR #panza OR (${names})`,
    'IG · cuenta y tags',
    'Cuenta propia y variaciones',
  ),
  dork(
    'web',
    `"${name}" perro perdido (${zone})`,
    'Web · nombre exacto',
    'Blogs, noticias, foros',
  ),
  dork(
    'web',
    `${breed} ${color} perdido chapita (${zone}) after:2026-07-15`,
    'Web · descripción física',
    'Coincidencia por raza/color/collar',
  ),
  dork(
    'news',
    `perro perdido vicente lopez OR villa martelli after:2026-07-15`,
    'Noticias locales',
    'Medios barriales y municipales',
  ),
  dork(
    'marketplace',
    `site:mercadolibre.com.ar caniche encontrado OR "perro encontrado" olivos`,
    'ML · encontrados',
    'Alguien puede haberla publicado como encontrada',
  ),
  dork(
    'web',
    `site:reddit.com perro perdido olivos OR "villa martelli"`,
    'Reddit AR',
    'Subreddits locales',
  ),
  dork(
    'web',
    `"Eva Buscando Huellas" OR "buscando huellas" (${breed} OR ${color})`,
    'Grupos de rastreo',
    'Red de rastreadores que ya participó',
  ),
  dork(
    'facebook',
    `site:facebook.com avistaje perro "General Paz" OR "Parque Sarmiento" after:2026-07-20`,
    'FB · corredor Gral Paz',
    'Último corredor de movimiento conocido',
  ),
  ]
}

export function dorkSearchUrl(query: string): string {
  return `https://www.google.com/search?q=${encodeURIComponent(query)}`
}
