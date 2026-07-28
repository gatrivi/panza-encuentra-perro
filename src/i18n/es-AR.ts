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
    showSigns: 'Carteles',
    gpsOn: 'GPS activo · patrulla',
    gpsWaiting: 'Esperando GPS…',
    coverageTitle: 'Cobertura',
    lastSeen: 'Última vista',
    hexWalked: 'Hex',
    signsCount: 'Carteles',
    avoidCount: 'Riesgo',
    suggestHint: 'Sugeridos (perímetro): ~{n} hex cerca de zonas a evitar',
    placeSignDesktop: 'Colocar cartel',
    placeModeOn: 'Click en el mapa…',
    riskHint:
      'Modo riesgo: caminás y marcás zonas a evitar. Al apagar, se guardan.',
  },
  plan: {
    title: 'Plan',
    signHeadline: 'Carteles · Constituyentes × Maipú',
    signHint:
      '30 paradas · ~2 h · bici/auto. Nav in-app con tu GPS (sin Maps). Prioridad: Tecnópolis, industriales, naftas, supers.',
    markPlaced: 'Cartel puesto →',
    skipStop: 'Saltar',
    followMe: 'Seguirme',
    unfollow: 'Dejar de seguir',
    gpsOn: 'GPS',
    quick45: 'Solo 45 min',
    waitingGps: 'Activá ubicación para ver distancia al stop',
    arrived: 'cerca',
    placed: 'puestos',
    reset: 'reiniciar',
    openWazeFallback: 'Waze · epicentro (backup)',
    showLegacy: 'Ver plan Gral Paz 24/7',
    hideLegacy: 'Ocultar plan Gral Paz',
    tomorrowHeadline: 'Mañana 24/7 — foco Gral Paz / Villa Martelli',
    tomorrowHint:
      'Foco: banquina Parque Sarmiento mano a Villa Martelli. Cansada, asustada, no se deja agarrar. Mejor con luz de día.',
    halfMartelli: 'Mitad 1 · Villa Martelli (oeste)',
    halfSarmiento: 'Mitad 2 · Parque Sarmiento (CABA)',
    openGmapsBike: 'Maps · Martelli bici',
    openWazeStart: 'Waze · inicio Martelli',
    openGmapsSarmiento: 'Maps · Parque Sarmiento bici',
    openWazeSarmiento: 'Waze · inicio Sarmiento',
    openGmapsPin: 'Maps · pin avistaje',
    openWazePin: 'Waze · pin avistaje',
    bikeNote:
      'Dos loops en el mapa (naranja Martelli / verde Sarmiento). No calzada Gral Paz.',
    milestoneNote:
      'Cobertura hex, carteles y modo riesgo ya están en el Mapa.',
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
