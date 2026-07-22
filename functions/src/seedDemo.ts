import { initializeApp } from 'firebase-admin/app'
import { getFirestore, Timestamp } from 'firebase-admin/firestore'

const CASE_ID = 'case_pancita_demo'
const SLUG = 'pancita'
const PUBLIC_ALIASES = ['pancita', 'pancite', 'panza'] as const

export async function seedDemo(): Promise<void> {
  process.env.FIRESTORE_EMULATOR_HOST ||= '127.0.0.1:8080'
  const projectId = process.env.VITE_FIREBASE_PROJECT_ID || 'demo-pancita'
  const app = initializeApp({ projectId }, `seed-${Date.now()}`)
  const db = getFirestore(app)
  const now = Timestamp.now()

  await db.doc(`cases/${CASE_ID}`).set({
    slug: SLUG,
    status: 'active',
    ownerUid: null,
    animal: {
      name: 'Pancita',
      aliases: ['Panza', 'Pancite'],
      species: 'dog',
      breed: 'Caniche',
      color: 'Negro',
      sex: 'female',
      size: 'mediano',
      distinguishingMarks: 'Hembra, pelaje negro rizado',
      photos: [],
    },
    locale: 'es-AR',
    distanceUnit: 'km',
    mapCenter: [-58.49, -34.512],
    publicContact: { displayPhone: '', whatsapp: '' },
    publicInstructions:
      'No la persigas. Observá la dirección, fotografiá con seguridad e informá al toque.',
    zonePolicy: { defaultRadius: 3, unit: 'km' },
    createdAt: now,
    updatedAt: now,
  })

  const publicCase = {
    caseId: CASE_ID,
    canonicalSlug: SLUG,
    status: 'active',
    animal: {
      name: 'Pancita',
      aliases: ['Panza', 'Pancite'],
      species: 'dog',
      breed: 'Caniche',
      color: 'Negro',
      sex: 'female',
      size: 'mediano',
      distinguishingMarks: 'Hembra, pelaje negro rizado',
      photos: [],
    },
    publicContact: { displayPhone: '', whatsapp: '' },
    publicInstructions:
      'No la persigas. Observá la dirección, fotografiá con seguridad e informá al toque.',
    updatedAt: now,
  }

  await Promise.all(
    PUBLIC_ALIASES.map((alias) => db.doc(`publicCases/${alias}`).set(publicCase)),
  )

  const observed = new Date()
  observed.setHours(17, 30, 0, 0)

  await db.doc(`cases/${CASE_ID}/sightings/sighting_san_ramon`).set({
    observedAt: Timestamp.fromDate(observed),
    reportedAt: now,
    point: [-58.4885, -34.5155],
    direction: 'SE',
    movement: 'moving',
    confidence: 'confirmed',
    evidence: { leadIds: [], photos: [], sourceLinks: [] },
    description: 'San Ramón y Maipú, rumbo a 9 de Julio',
    createdByUid: 'seed',
    reviewedByUid: 'seed',
    reviewedAt: now,
    affectsOfficialZone: true,
  })

  await db.doc(`cases/${CASE_ID}/sightings/sighting_cementerio`).set({
    observedAt: Timestamp.fromDate(new Date(observed.getTime() - 2 * 86400000)),
    reportedAt: now,
    point: [-58.495, -34.508],
    direction: 'unknown',
    movement: 'unknown',
    confidence: 'unverified',
    evidence: { leadIds: [], photos: [], sourceLinks: [] },
    description: 'Foco previo: Cementerio de Olivos y alrededores',
    createdByUid: 'seed',
    affectsOfficialZone: false,
  })

  await db.doc(`cases/${CASE_ID}/zones/active`).set({
    center: [-58.4885, -34.5155],
    radiusMeters: 3000,
    basisSightingId: 'sighting_san_ramon',
    basisObservedAt: Timestamp.fromDate(observed),
    updatedByUid: 'seed',
    createdAt: now,
    updatedAt: now,
  })

  await db.doc(`cases/${CASE_ID}/tasks/task_demo_route`).set({
    title: 'Recorrer Maipú entre San Ramón y 9 de Julio',
    kind: 'search',
    status: 'open',
    priority: 'high',
    notes: 'Trabajar de a dos y registrar calles ya cubiertas.',
    createdByUid: 'seed',
    createdAt: now,
    updatedAt: now,
  })

  await db.doc(`cases/${CASE_ID}/signs/sign_demo_ypf`).set({
    point: [-58.4892, -34.5148],
    placeName: 'Estación de servicio (demo)',
    tier: 'A',
    placeType: 'service_station',
    status: 'planned',
    staffPersonallyAlerted: false,
    posterCode: 'DEMO0001',
    createdByUid: 'seed',
    createdAt: now,
    updatedAt: now,
  })

  console.log('Seeded case', CASE_ID, 'canonical slug', SLUG)
  console.log('Public aliases:', PUBLIC_ALIASES.join(', '))
  console.log('Emulator owner bootstrap: owner@example.com')
}
