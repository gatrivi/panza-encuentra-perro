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
  'No la persigas. Observá la dirección, fotografiá con seguridad e informá al toque. Se escapó el 15/7 en Olivos, zona cementerio.'

export const PANZA_MAP_CENTER: [number, number] = [-58.49, -34.512]

export const PANZA_SOURCES = {
  facebook: 'https://www.facebook.com/share/p/1JsbccK79Q/',
  instagram: 'https://www.instagram.com/buscamos.a.panza/',
} as const

export const PANZA_FB_LEAD_TEXT = `Seguimos buscando a Panchi / Panza. Desde el domingo sin más novedades.
Puede haberse alejado mucho corriendo (Vicente López / Olivos) o haber sido retenida.
Ofrecemos recompensa. Grupo ZAGUATES DIFUNDE — Pau Trivi.
Fuente: ${PANZA_SOURCES.facebook}`

export const PANZA_IG_LEAD_TEXT = `Cuenta de difusión Instagram @buscamos.a.panza
BUSCAMOS A PANZA. Se escapó el 15/7 al final del partido por Olivos, zona cementerio.
Hembra, 4 años, collar violeta con chapita. Contacto paupocket / Rodrii Perez Schmidt.
Fuente: ${PANZA_SOURCES.instagram}`
