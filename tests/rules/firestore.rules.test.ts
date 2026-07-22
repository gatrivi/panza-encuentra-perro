/**
 * Firestore rules tests — run with:
 *   firebase emulators:exec --only firestore "yarn vitest run --config vitest.rules.config.ts"
 */
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing'
import { doc, getDoc, setDoc, collection, getDocs } from 'firebase/firestore'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'

const PROJECT_ID = 'demo-pancite-rules'
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
    await setDoc(doc(db, 'publicCases', 'pancite'), {
      caseId: CASE_ID,
      status: 'active',
      animal: { name: 'Panza', aliases: [], photos: [] },
      publicContact: {},
      updatedAt: new Date(),
    })
    await setDoc(doc(db, 'cases', CASE_ID), {
      slug: 'pancite',
      status: 'active',
      animal: { name: 'Panza', aliases: [], photos: [] },
      mapCenter: [-58.49, -34.51],
      createdAt: new Date(),
      updatedAt: new Date(),
    })
  })
})

describe('firestore rules (open family MVP)', () => {
  it('anonymous can read public case and private leads', async () => {
    const anon = testEnv.unauthenticatedContext().firestore()
    await assertSucceeds(getDoc(doc(anon, 'publicCases', 'pancite')))
    await assertSucceeds(getDocs(collection(anon, 'cases', CASE_ID, 'leads')))
  })

  it('anonymous can create public_form lead', async () => {
    const anon = testEnv.unauthenticatedContext().firestore()
    await assertSucceeds(
      setDoc(doc(anon, 'cases', CASE_ID, 'leads', 'pub1'), {
        origin: 'public_form',
        rawText: 'LA ESTOY VIENDO',
        status: 'new',
        priority: 'high',
      }),
    )
  })

  it('loads rules file', () => {
    expect(readFileSync(resolve(root, 'firestore.rules'), 'utf8')).toContain('ponytail')
  })
})
