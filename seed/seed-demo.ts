/**
 * Demo seed for Operativo Pancite (Milestone 1).
 * No private phones or reporter identities.
 *
 * Usage with emulators running:
 *   yarn seed
 */
import { initializeApp } from 'firebase/app'
import {
  connectFirestoreEmulator,
  doc,
  getFirestore,
  setDoc,
  Timestamp,
} from 'firebase/firestore'

const projectId = process.env.VITE_FIREBASE_PROJECT_ID || 'demo-pancite'
const CASE_ID = 'case_pancite_demo'
const SLUG = 'pancite'

const app = initializeApp({
  apiKey: 'demo',
  projectId,
})
const db = getFirestore(app)
connectFirestoreEmulator(db, '127.0.0.1', 8080)

async function main() {
  const now = Timestamp.now()

  await setDoc(doc(db, 'cases', CASE_ID), {
    slug: SLUG,
    status: 'active',
    animal: {
      name: 'Pancite',
      aliases: ['Panza'],
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
    // Olivos / Vicente López area — Cemetery of Olivos focus
    mapCenter: [-58.49, -34.512],
    publicContact: {
      displayPhone: '',
      whatsapp: '',
    },
    publicInstructions:
      'No la persigas. Observá la dirección, fotografiá con seguridad e informá al toque.',
    zonePolicy: { defaultRadius: 3, unit: 'km' },
    createdAt: now,
    updatedAt: now,
  })

  await setDoc(doc(db, 'publicCases', SLUG), {
    caseId: CASE_ID,
    status: 'active',
    animal: {
      name: 'Pancite',
      aliases: ['Panza'],
      species: 'dog',
      breed: 'Caniche',
      color: 'Negro',
      sex: 'female',
      size: 'mediano',
      distinguishingMarks: 'Hembra, pelaje negro rizado',
      photos: [],
    },
    publicContact: {
      displayPhone: '',
      whatsapp: '',
    },
    publicInstructions:
      'No la persigas. Observá la dirección, fotografiá con seguridad e informá al toque.',
    updatedAt: now,
  })

  // Main recorded sighting: San Ramón and Maipú, 17:30, heading toward 9 de Julio
  const observed = new Date()
  observed.setHours(17, 30, 0, 0)

  await setDoc(doc(db, 'cases', CASE_ID, 'sightings', 'sighting_san_ramon'), {
    observedAt: Timestamp.fromDate(observed),
    reportedAt: now,
    // Approximate San Ramón & Maipú, Olivos
    point: [-58.4885, -34.5155],
    direction: 'SE',
    movement: 'moving',
    confidence: 'confirmed',
    evidence: {
      leadIds: [],
      photos: [],
      sourceLinks: [],
    },
    description: 'San Ramón y Maipú, rumbo a 9 de Julio',
    createdByUid: 'seed',
    reviewedByUid: 'seed',
    reviewedAt: now,
    affectsOfficialZone: true,
  })

  // Earlier focus note as unverified historical marker near Cemetery of Olivos
  await setDoc(doc(db, 'cases', CASE_ID, 'sightings', 'sighting_cementerio'), {
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

  console.log('Seeded case', CASE_ID, 'slug', SLUG)
  console.log('Sign in as owner@example.com (VITE_OWNER_BOOTSTRAP_EMAIL) to bootstrap owner membership.')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
