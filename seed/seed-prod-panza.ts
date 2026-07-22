/**
 * One-shot: ensure publicCases/pancita exists in prod Firestore.
 * yarn tsx seed/seed-prod-panza.ts
 */
import { readFileSync } from 'node:fs'
import { initializeApp } from 'firebase/app'
import { doc, getDoc, getFirestore, serverTimestamp, setDoc } from 'firebase/firestore'

function loadEnv() {
  const out: Record<string, string> = {}
  for (const line of readFileSync('.env', 'utf8').split(/\r?\n/)) {
    if (!line || line.startsWith('#')) continue
    const i = line.indexOf('=')
    if (i < 0) continue
    out[line.slice(0, i)] = line.slice(i + 1)
  }
  return out
}

const env = loadEnv()
const app = initializeApp({
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.VITE_FIREBASE_APP_ID,
})
const db = getFirestore(app)

const caseId = 'case_panza'
const animal = {
  name: 'Panza',
  aliases: ['Pancita', 'Panchi', 'Pancite'],
  species: 'dog',
  breed: 'Caniche / cruza',
  color: 'Negro / gris',
  sex: 'female',
  size: 'mediana/pequeña',
  distinguishingMarks:
    'Pelaje negro rizado, cola larga, collar violeta con chapita PANZA. 4 años, castrada.',
  photos: ['/panza/pnan2.jpg', '/panza/panrec.png', '/panza/panz.jpg'],
}
const contact = { displayPhone: '1156194761', whatsapp: '5491156194761' }
const instructions =
  'No la persigas. Observá la dirección, fotografiá con seguridad e informá al toque. Se escapó el 15/7 en Olivos, zona cementerio.'

async function main() {
  const existing = await getDoc(doc(db, 'publicCases', 'pancita'))
  if (existing.exists()) {
    console.log('already seeded', existing.data()?.caseId)
    return
  }
  const now = serverTimestamp()
  const pub = {
    caseId,
    status: 'active',
    animal,
    publicContact: contact,
    publicInstructions: instructions,
    updatedAt: now,
  }
  await setDoc(doc(db, 'cases', caseId), {
    slug: 'pancita',
    status: 'active',
    animal,
    locale: 'es-AR',
    distanceUnit: 'km',
    mapCenter: [-58.49, -34.512],
    publicContact: contact,
    publicInstructions: instructions,
    zonePolicy: { defaultRadius: 3, unit: 'km' },
    createdAt: now,
    updatedAt: now,
  })
  for (const s of ['pancita', 'pancite', 'panza']) {
    await setDoc(doc(db, 'publicCases', s), pub)
  }
  console.log('seeded', caseId)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
