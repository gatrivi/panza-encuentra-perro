/**
 * Firestore rules tests — run with:
 *   firebase emulators:exec --only firestore "yarn vitest run --config vitest.rules.config.ts"
 */
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing'
import { doc, getDoc, setDoc, collection, getDocs } from 'firebase/firestore'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'

const PROJECT_ID = 'demo-pancita-rules'
const CASE_ID = 'case_rules'
const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..')

let testEnv: RulesTestEnvironment

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: {
      rules: readFileSync(resolve(root, 'firestore.rules'), 'utf8'),
      host: '127.0.0.1',
      port: 8080,
    },
  })
}, 60000)

afterAll(async () => {
  await testEnv?.cleanup()
})

beforeEach(async () => {
  await testEnv.clearFirestore()
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore()
    await setDoc(doc(db, 'publicCases', 'pancita'), {
      caseId: CASE_ID,
      status: 'active',
      animal: { name: 'Pancita', aliases: ['Panza', 'Pancite'], photos: [] },
      publicContact: {},
      updatedAt: new Date(),
    })
    await setDoc(doc(db, 'cases', CASE_ID), {
      slug: 'pancita',
      status: 'active',
      animal: { name: 'Pancita', aliases: ['Panza', 'Pancite'], photos: [] },
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
  it('anonymous can read public case but not private leads', async () => {
    const anon = testEnv.unauthenticatedContext().firestore()
    await assertSucceeds(getDoc(doc(anon, 'publicCases', 'pancita')))
    await assertFails(getDocs(collection(anon, 'cases', CASE_ID, 'leads')))
    await assertFails(getDoc(doc(anon, 'cases', CASE_ID)))
  })

  it('searcher cannot create sightings', async () => {
    const searcher = testEnv.authenticatedContext('searcher1').firestore()
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

  it('coordinator can create sightings', async () => {
    const coord = testEnv.authenticatedContext('coord1').firestore()
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

  it('searcher can coordinate tasks and signs but cannot move the official zone', async () => {
    const searcher = testEnv.authenticatedContext('searcher1').firestore()
    await assertSucceeds(
      setDoc(doc(searcher, 'cases', CASE_ID, 'tasks', 'task1'), {
        title: 'Recorrer Maipú',
        kind: 'search',
        status: 'open',
        priority: 'normal',
        createdByUid: 'searcher1',
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
    )
    await assertSucceeds(
      setDoc(doc(searcher, 'cases', CASE_ID, 'signs', 'sign1'), {
        point: [-58.49, -34.51],
        tier: 'A',
        placeType: 'service_station',
        status: 'placed',
        staffPersonallyAlerted: true,
        createdByUid: 'searcher1',
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
    )
    await assertFails(
      setDoc(doc(searcher, 'cases', CASE_ID, 'zones', 'active'), {
        center: [-58.49, -34.51],
        radiusMeters: 3000,
        updatedByUid: 'searcher1',
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
    )
  })

  it('coordinator can move the official zone', async () => {
    const coord = testEnv.authenticatedContext('coord1').firestore()
    await assertSucceeds(
      setDoc(doc(coord, 'cases', CASE_ID, 'zones', 'active'), {
        center: [-58.49, -34.51],
        radiusMeters: 3000,
        updatedByUid: 'coord1',
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
    )
  })

  it('member invitation documents are inaccessible to clients', async () => {
    const owner = testEnv.authenticatedContext('owner1').firestore()
    const invite = doc(owner, 'cases', CASE_ID, 'invites', 'person%40example.com')
    await assertFails(getDoc(invite))
    await assertFails(setDoc(invite, { email: 'person@example.com', role: 'searcher' }))
  })

  it('archived member loses access', async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'cases', CASE_ID, 'members', 'searcher1'), {
        role: 'searcher',
        displayName: 'Searcher',
        email: 'searcher@example.com',
        active: false,
        createdAt: new Date(),
      })
    })
    const searcher = testEnv.authenticatedContext('searcher1').firestore()
    await assertFails(getDoc(doc(searcher, 'cases', CASE_ID)))
  })

  it('loads rules file', () => {
    expect(readFileSync(resolve(root, 'firestore.rules'), 'utf8')).toContain('publicCases')
  })
})
