import { initializeApp } from 'firebase-admin/app'
import {
  getFirestore,
  FieldValue,
  Timestamp,
  type DocumentSnapshot,
} from 'firebase-admin/firestore'
import { onCall, HttpsError } from 'firebase-functions/v2/https'
import { z } from 'zod'

initializeApp()
const db = getFirestore()

const CASE_SLUG_ALIASES = ['pancita', 'pancite', 'panza'] as const
const DEFAULT_CASE_ID = 'case_pancita_demo'
const ACCESS_POLICY_VERSION = 'family-admin-v1'

const DEFAULT_ANIMAL = {
  name: 'Pancita',
  aliases: ['Panza', 'Pancite'],
  species: 'dog',
  breed: 'Caniche',
  color: 'Negro',
  sex: 'female',
  size: 'mediano',
  distinguishingMarks: 'Hembra, pelaje negro rizado',
  photos: [],
} as const

function normalizeSlug(value: unknown): string {
  const slug = String(value ?? '').trim().toLowerCase()
  return CASE_SLUG_ALIASES.includes(slug as (typeof CASE_SLUG_ALIASES)[number])
    ? 'pancita'
    : slug
}

function slugCandidates(value: unknown): string[] {
  const normalized = normalizeSlug(value)
  return normalized === 'pancita' ? [...CASE_SLUG_ALIASES] : [normalized]
}

async function resolvePublicCase(value: unknown) {
  for (const slug of slugCandidates(value)) {
    const snap = await db.collection('publicCases').doc(slug).get()
    if (snap.exists) return snap
  }
  return null
}

function normalizedEmail(value: unknown): string {
  return String(value ?? '').trim().toLowerCase()
}

function configuredAdminEmails(): Set<string> {
  const configured = String(process.env.ADMIN_EMAILS ?? '')
    .split(',')
    .map(normalizedEmail)
    .filter(Boolean)

  if (configured.length > 0) return new Set(configured)
  return process.env.FUNCTIONS_EMULATOR === 'true'
    ? new Set(['owner@example.com'])
    : new Set()
}

async function ensurePublicAliases(publicCase: DocumentSnapshot) {
  const data = publicCase.data()!
  const batch = db.batch()
  for (const alias of CASE_SLUG_ALIASES) {
    batch.set(
      db.collection('publicCases').doc(alias),
      { ...data, canonicalSlug: 'pancita' },
      { merge: true },
    )
  }
  await batch.commit()
  return db.collection('publicCases').doc('pancita').get()
}

async function provisionDefaultCase() {
  const existing = await resolvePublicCase('pancita')
  if (existing) return ensurePublicAliases(existing)

  const now = Timestamp.now()
  const observed = new Date()
  observed.setHours(17, 30, 0, 0)

  const caseRef = db.collection('cases').doc(DEFAULT_CASE_ID)
  const caseSnap = await caseRef.get()
  const caseData = caseSnap.data()
  const animal = caseData?.animal ?? DEFAULT_ANIMAL
  const publicContact = caseData?.publicContact ?? { displayPhone: '', whatsapp: '' }
  const publicInstructions =
    caseData?.publicInstructions ??
    'No la persigas. Observá la dirección, fotografiá con seguridad e informá al toque.'

  const batch = db.batch()
  if (!caseSnap.exists) {
    batch.set(caseRef, {
      slug: 'pancita',
      status: 'active',
      animal,
      locale: 'es-AR',
      distanceUnit: 'km',
      mapCenter: [-58.49, -34.512],
      publicContact,
      publicInstructions,
      zonePolicy: { defaultRadius: 3, unit: 'km' },
      createdAt: now,
      updatedAt: now,
    })

    batch.set(caseRef.collection('sightings').doc('sighting_san_ramon'), {
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
    batch.set(caseRef.collection('sightings').doc('sighting_cementerio'), {
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
    batch.set(caseRef.collection('zones').doc('active'), {
      center: [-58.4885, -34.5155],
      radiusMeters: 3000,
      basisSightingId: 'sighting_san_ramon',
      basisObservedAt: Timestamp.fromDate(observed),
      updatedByUid: 'seed',
      createdAt: now,
      updatedAt: now,
    })
    batch.set(caseRef.collection('tasks').doc('task_demo_route'), {
      title: 'Recorrer Maipú entre San Ramón y 9 de Julio',
      kind: 'search',
      status: 'open',
      priority: 'high',
      notes: 'Trabajar de a dos y registrar calles ya cubiertas.',
      createdByUid: 'seed',
      createdAt: now,
      updatedAt: now,
    })
    batch.set(caseRef.collection('signs').doc('sign_demo_ypf'), {
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
  }

  const publicCase = {
    caseId: DEFAULT_CASE_ID,
    canonicalSlug: 'pancita',
    status: 'active',
    animal,
    publicContact,
    publicInstructions,
    publicArea: {
      type: 'Point',
      coordinates: [-58.49, -34.512],
      radiusMeters: 3000,
    },
    updatedAt: now,
  }
  for (const alias of CASE_SLUG_ALIASES) {
    batch.set(db.collection('publicCases').doc(alias), publicCase)
  }

  await batch.commit()
  return db.collection('publicCases').doc('pancita').get()
}

const PublicReportSchema = z.object({
  slug: z.string().min(1),
  mode: z.enum(['seeing_now', 'think_i_saw']),
  point: z.tuple([z.number(), z.number()]).optional(),
  direction: z
    .enum(['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW', 'stationary', 'unknown'])
    .optional(),
  phone: z.string().max(40).optional(),
  anonymous: z.boolean().default(false),
  photoBase64: z.string().max(2_000_000).optional(),
  posterCode: z.string().max(64).optional(),
  honeypot: z.string().max(0).optional(),
  claimedObservationAt: z.string().datetime().optional(),
})

const ClaimMembershipSchema = z.object({
  slug: z.string().min(1).max(80).default('pancita'),
})

const InviteMemberSchema = z.object({
  caseId: z.string().min(1).max(160),
  email: z.string().email().max(320),
  role: z.enum(['coordinator', 'searcher']),
})

/** Very small in-memory rate limit for emulator / single instance. */
const hits = new Map<string, { count: number; resetAt: number }>()

function rateLimit(key: string, max = 8, windowMs = 10 * 60 * 1000) {
  const now = Date.now()
  const cur = hits.get(key)
  if (!cur || cur.resetAt < now) {
    hits.set(key, { count: 1, resetAt: now + windowMs })
    return
  }
  cur.count += 1
  if (cur.count > max) {
    throw new HttpsError('resource-exhausted', 'Too many reports')
  }
}

export const submitPublicReport = onCall(
  { region: 'southamerica-east1' },
  async (request) => {
    const parsed = PublicReportSchema.safeParse(request.data)
    if (!parsed.success) {
      throw new HttpsError('invalid-argument', 'Invalid payload')
    }
    const data = parsed.data
    if (data.honeypot) {
      return { ok: true }
    }
    if (!data.anonymous && !data.phone) {
      throw new HttpsError('invalid-argument', 'Phone required unless anonymous')
    }

    const ip = request.rawRequest?.ip || 'unknown'
    rateLimit(`${normalizeSlug(data.slug)}:${ip}`)

    const publicSnap = await resolvePublicCase(data.slug)
    if (!publicSnap) {
      throw new HttpsError('not-found', 'Case not found')
    }
    const publicCase = publicSnap.data()!
    if (publicCase.status !== 'active') {
      throw new HttpsError('failed-precondition', 'Case not accepting reports')
    }
    const caseId = publicCase.caseId as string

    const leadRef = db.collection('cases').doc(caseId).collection('leads').doc()
    await leadRef.set({
      origin: 'public_form',
      rawText: data.mode === 'seeing_now' ? 'LA ESTOY VIENDO' : 'CREO QUE LA VI',
      attachmentPaths: [],
      capturedAt: FieldValue.serverTimestamp(),
      reporter: {
        phone: data.anonymous ? null : data.phone,
        preferredContact: data.anonymous ? 'anonymous' : 'whatsapp',
      },
      claimedPoint: data.point ?? null,
      claimedDirection: data.direction ?? null,
      claimedObservationAt: data.claimedObservationAt
        ? Timestamp.fromDate(new Date(data.claimedObservationAt))
        : Timestamp.now(),
      parserSuggestions: { dates: [], locations: [], phones: [], keywords: [] },
      status: 'new',
      priority: data.mode === 'seeing_now' ? 'high' : 'normal',
      posterCode: data.posterCode ?? null,
    })

    return { ok: true, leadId: leadRef.id }
  },
)

/**
 * The configured family accounts are equivalent administrators. Invited
 * volunteers can still receive narrower roles in forks of this public app.
 */
export const claimMembership = onCall(
  { region: 'southamerica-east1' },
  async (request) => {
    if (!request.auth?.uid || !request.auth.token.email) {
      throw new HttpsError('unauthenticated', 'Sign in required')
    }

    const parsed = ClaimMembershipSchema.safeParse(request.data ?? {})
    if (!parsed.success) {
      throw new HttpsError('invalid-argument', 'Invalid payload')
    }

    const email = normalizedEmail(request.auth.token.email)
    const isConfiguredAdmin = configuredAdminEmails().has(email)
    let publicSnap = await resolvePublicCase(
      parsed.data.slug || process.env.CASE_SLUG || 'pancita',
    )
    if (!publicSnap) {
      if (!isConfiguredAdmin) {
        throw new HttpsError('permission-denied', 'This account is not enabled')
      }
      publicSnap = await provisionDefaultCase()
    } else if (isConfiguredAdmin) {
      publicSnap = await ensurePublicAliases(publicSnap)
    }

    const caseId = publicSnap.data()!.caseId as string
    const caseRef = db.collection('cases').doc(caseId)
    const members = db.collection('cases').doc(caseId).collection('members')
    const memberRef = members.doc(request.auth.uid)
    const inviteRef = caseRef.collection('invites').doc(encodeURIComponent(email))

    const role = await db.runTransaction(async (transaction) => {
      const [caseSnap, existing, invite] = await Promise.all([
        transaction.get(caseRef),
        transaction.get(memberRef),
        transaction.get(inviteRef),
      ])

      if (!caseSnap.exists) {
        throw new HttpsError('not-found', 'Private case not found')
      }

      if (isConfiguredAdmin) {
        transaction.set(
          memberRef,
          {
            role: 'owner',
            displayName: request.auth!.token.name || email.split('@')[0] || email,
            email,
            active: true,
            accessPolicy: ACCESS_POLICY_VERSION,
            createdAt: existing.data()?.createdAt ?? FieldValue.serverTimestamp(),
            lastSeenAt: FieldValue.serverTimestamp(),
          },
          { merge: true },
        )
        if (invite.exists) transaction.delete(inviteRef)
        return 'owner'
      }

      if (existing.exists) {
        if (
          existing.data()!.active !== true ||
          existing.data()!.accessPolicy !== ACCESS_POLICY_VERSION
        ) {
          throw new HttpsError('permission-denied', 'Membership is inactive')
        }
        const existingRole = String(existing.data()!.role)
        transaction.update(memberRef, { lastSeenAt: FieldValue.serverTimestamp() })
        return existingRole
      }

      const invitedRole =
        invite.exists && invite.data()!.active === true ? String(invite.data()!.role) : null
      if (!['coordinator', 'searcher'].includes(invitedRole ?? '')) {
        throw new HttpsError('permission-denied', 'Ask the owner for an invitation')
      }

      const grantedRole = invitedRole!
      transaction.set(memberRef, {
        role: grantedRole,
        displayName: request.auth!.token.name || email.split('@')[0] || email,
        email,
        active: true,
        accessPolicy: ACCESS_POLICY_VERSION,
        createdAt: FieldValue.serverTimestamp(),
        lastSeenAt: FieldValue.serverTimestamp(),
      })
      if (invite.exists) transaction.delete(inviteRef)
      return grantedRole
    })

    return { ok: true, caseId, role }
  },
)

export const inviteMember = onCall(
  { region: 'southamerica-east1' },
  async (request) => {
    if (!request.auth?.uid) {
      throw new HttpsError('unauthenticated', 'Sign in required')
    }
    const parsed = InviteMemberSchema.safeParse(request.data)
    if (!parsed.success) {
      throw new HttpsError('invalid-argument', 'Invalid invitation')
    }

    const { caseId, role } = parsed.data
    const email = normalizedEmail(parsed.data.email)
    const caseRef = db.collection('cases').doc(caseId)
    const caller = await caseRef.collection('members').doc(request.auth.uid).get()
    if (
      !caller.exists ||
      caller.data()!.active !== true ||
      caller.data()!.accessPolicy !== ACCESS_POLICY_VERSION ||
      caller.data()!.role !== 'owner'
    ) {
      throw new HttpsError('permission-denied', 'Only the owner can invite members')
    }

    const existing = await caseRef
      .collection('members')
      .where('email', '==', email)
      .limit(1)
      .get()
    if (!existing.empty) {
      return { ok: true, alreadyMember: true }
    }

    await caseRef.collection('invites').doc(encodeURIComponent(email)).set({
      email,
      role,
      active: true,
      invitedByUid: request.auth.uid,
      createdAt: FieldValue.serverTimestamp(),
    })

    return { ok: true, alreadyMember: false }
  },
)

/** @deprecated compatibility aliases for v0.1 deployments. */
export const claimFirstOwner = claimMembership
export const claimOwnerBootstrap = claimMembership
export const joinCase = claimMembership
