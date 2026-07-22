/**
 * Firestore rules tests — run with:
 *   firebase emulators:exec --only firestore "yarn vitest run --config vitest.rules.config.ts"
 *
 * When emulators are not available, these tests are skipped.
 */
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing'
import { doc, getDoc, setDoc, collection, getDocs } from 'firebase/firestore'
import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest'

const PROJECT_ID = 'demo-pancite-rules'
const CASE_ID = 'case_rules'

let testEnv: RulesTestEnvironment | null = null

async function tryInit(): Promise<RulesTestEnvironment | null> {
  try {
    return await initializeTestEnvironment({
      projectId: PROJECT_ID,
      firestore: {
        rules: readFileSync(resolve(__dirname, '../firestore.rules'), 'utf8'),
        host: '127.0.0.1',
        port: 8080,
      },
    })
  } catch {
    return null
  }
}

beforeAll(async () => {
  testEnv = await tryInit()
})

afterAll(async () => {
  await testEnv?.cleanup()
})

beforeEach(async () => {
  if (!testEnv) return
  await testEnv.clearFirestore()
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore()
    await setDoc(doc(db, 'publicCases', 'pancite'), {
      caseId: CASE_ID,
      status: 'active',
      animal: { name: 'Pancite', aliases: [], photos: [] },
      publicContact: {},
      updatedAt: new Date(),
    })
    await setDoc(doc(db, 'cases', CASE_ID), {
      slug: 'pancite',
      status: 'active',
      animal: { name: 'Pancite', aliases: [], photos: [] },
      mapCenter: [-58.49, -34.51],
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    await setDoc(doc(db, 'cases', CASE_ID, 'members', 'owner1'), {
      role: 'owner',
      displayName: 'Owner',
      email: 'owner@example.com',
      active: true,
      createdAt: new Date(),
    })
    await setDoc(doc(db, 'cases', CASE_ID, 'members', 'searcher1'), {
      role: 'searcher',
      displayName: 'Searcher',
      email: 'searcher@example.com',
      active: true,
      createdAt: new Date(),
    })
    await setDoc(doc(db, 'cases', CASE_ID, 'members', 'coord1'), {
      role: 'coordinator',
      displayName: 'Coord',
      email: 'coord@example.com',
      active: true,
      createdAt: new Date(),
    })
    await setDoc(doc(db, 'cases', CASE_ID, 'leads', 'lead1'), {
      origin: 'other',
      status: 'new',
      capturedAt: new Date(),
      attachmentPaths: [],
      reporter: { phone: 'PRIVATE' },
    })
  })
})

describe('firestore rules', () => {
  it('anonymous can read public case but not private leads', async ({ skip }) => {
    if (!testEnv) skip()
    const anon = testEnv!.unauthenticatedContext().firestore()
    await assertSucceeds(getDoc(doc(anon, 'publicCases', 'pancite')))
    await assertFails(getDocs(collection(anon, 'cases', CASE_ID, 'leads')))
    await assertFails(getDoc(doc(anon, 'cases', CASE_ID)))
  })

  it('searcher cannot create sightings', async ({ skip }) => {
    if (!testEnv) skip()
    const searcher = testEnv!.authenticatedContext('searcher1').firestore()
    await assertFails(
      setDoc(doc(searcher, 'cases', CASE_ID, 'sightings', 's1'), {
        confidence: 'confirmed',
        point: [-58.49, -34.51],
        observedAt: new Date(),
        reportedAt: new Date(),
        createdByUid: 'searcher1',
        evidence: { leadIds: [], photos: [], sourceLinks: [] },
        affectsOfficialZone: true,
      }),
    )
  })

  it('coordinator can create sightings', async ({ skip }) => {
    if (!testEnv) skip()
    const coord = testEnv!.authenticatedContext('coord1').firestore()
    await assertSucceeds(
      setDoc(doc(coord, 'cases', CASE_ID, 'sightings', 's1'), {
        confidence: 'probable',
        point: [-58.49, -34.51],
        observedAt: new Date(),
        reportedAt: new Date(),
        createdByUid: 'coord1',
        evidence: { leadIds: [], photos: [], sourceLinks: [] },
        affectsOfficialZone: false,
      }),
    )
  })

  it('archived member loses access', async ({ skip }) => {
    if (!testEnv) skip()
    await testEnv!.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'cases', CASE_ID, 'members', 'searcher1'), {
        role: 'searcher',
        displayName: 'Searcher',
        email: 'searcher@example.com',
        active: false,
        createdAt: new Date(),
      })
    })
    const searcher = testEnv!.authenticatedContext('searcher1').firestore()
    await assertFails(getDoc(doc(searcher, 'cases', CASE_ID)))
  })
})
