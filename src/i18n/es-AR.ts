export const esAR = {
  appName: 'Buscamos a Panza',
  nav: {
    map: 'Mapa',
    inbox: 'Bandeja',
    plan: 'Plan',
  },
  actions: {
    possibleSighting: 'Posible avistaje',
    pastePost: 'Pegar publicación',
    placeSign: 'Cartel colocado',
    startOuting: 'Empezar recorrido',
    save: 'Guardar',
    saved: 'Guardado',
    cancel: 'Cancelar',
    promote: 'Promover',
    locate: 'Ubicar',
    discard: 'Descartar',
    signIn: 'Entrar',
    signInGoogle: 'Entrar con Google',
    signOut: 'Salir',
    submit: 'Enviar',
  },
  inbox: {
    title: 'Bandeja',
    pasteHint: 'Pegá o compartí cualquier cosa',
    pasteSub: 'Texto, enlace, captura o foto',
    empty: 'Sin pendientes. Pegá una publicación o esperá un reporte público.',
    captureAge: 'Hace {age}',
  },
  map: {
    title: 'Mapa operativo',
    noSightings: 'Todavía no hay avistajes verificados.',
    seenAt: 'Visto',
    reportedAt: 'Informado',
    confidence: 'Confianza',
  },
  plan: {
    title: 'Plan',
    tomorrowHeadline: 'Mañana 24/7 — foco Gral Paz / Villa Martelli',
    tomorrowHint:
      'Avistaje 23/7: banquina Parque Sarmiento mano a Villa Martelli. Cansada, asustada, no se deja agarrar. Mejor amanecer y atardecer.',
    openGmapsBike: 'Google Maps · loop bici',
    openWazeStart: 'Waze · ir al inicio',
    openGmapsPin: 'Maps · pin avistaje',
    openWazePin: 'Waze · pin avistaje',
    bikeNote:
      'Loop ~4–5 km por Zufriategui / borde parque. No circules por la calzada de Gral Paz: mirá la banquina desde el costado.',
    milestoneNote:
      'Cobertura, carteles y recorridos llegan en el próximo hito. Por ahora usá Mapa y Bandeja.',
  },
  public: {
    seeingNow: 'LA ESTOY VIENDO',
    thinkISaw: 'CREO QUE LA VI',
    call: 'Llamar',
    whatsapp: 'WhatsApp',
    guidance:
      'No la persigas. Observá la dirección, fotografiá con seguridad e informá al toque.',
    thanks: 'Gracias. El equipo ya recibió el aviso.',
    phoneLabel: 'Teléfono o WhatsApp',
    anonymous: 'Prefiero no dejar contacto',
    directionLabel: '¿Para dónde iba?',
    stationary: 'Quieta / no sé',
    allowLocation: 'Usar mi ubicación',
    submitting: 'Enviando…',
  },
  promote: {
    title: 'Promover a avistaje',
    observedAt: 'Hora en que la vieron',
    confidence: 'Confianza',
    notes: 'Notas',
  },
  confidence: {
    unverified: 'Sin verificar',
    probable: 'Probable',
    confirmed: 'Confirmado',
    rejected: 'Rechazado',
  },
  auth: {
    needInvite: 'Usuario no autorizado. Usá paula, rodrigo o gaston.',
    loading: 'Cargando…',
    email: 'Email',
    username: 'Usuario',
    password: 'Contraseña',
    unknownUser: 'Usuario desconocido. Probá paula, rodrigo o gaston.',
    badPassword: 'Contraseña incorrecta.',
    hint: 'Este dispositivo guarda la sesión. Si ya entraste, vas directo al mapa.',
  },
  errors: {
    generic: 'Algo falló. Probá de nuevo.',
    offline: 'Sin conexión. El borrador quedó guardado en el teléfono.',
    locationDenied: 'No se pudo obtener la ubicación.',
    rateLimited: 'Demasiados reportes. Esperá un momento.',
  },
} as const

export type Dictionary = typeof esAR

const current: Dictionary = esAR

export function t(): Dictionary {
  return current
}

export function formatAge(ms: number): string {
  const mins = Math.floor(ms / 60000)
  if (mins < 1) return 'recién'
  if (mins < 60) return `${mins} min`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours} h`
  const days = Math.floor(hours / 24)
  return `${days} d`
}
