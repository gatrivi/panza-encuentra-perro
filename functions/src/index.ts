import { initializeApp } from 'firebase-admin/app'
import { getFirestore, FieldValue, Timestamp } from 'firebase-admin/firestore'
import { onCall, HttpsError } from 'firebase-functions/v2/https'
import { z } from 'zod'

initializeApp()
const db = getFirestore()

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
    rateLimit(`${data.slug}:${ip}`)

    const publicSnap = await db.collection('publicCases').doc(data.slug).get()
    if (!publicSnap.exists) {
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
      claimedObservationAt: Timestamp.now(),
      parserSuggestions: { dates: [], locations: [], phones: [], keywords: [] },
      status: 'new',
      priority: data.mode === 'seeing_now' ? 'high' : 'normal',
      posterCode: data.posterCode ?? null,
    })

    return { ok: true, leadId: leadRef.id }
  },
)

/**
 * First authenticated user becomes owner when the case has zero members.
 * Later members must be invited by the owner (UI in a later milestone).
 */
export const claimFirstOwner = onCall(
  { region: 'southamerica-east1' },
  async (request) => {
    if (!request.auth?.uid || !request.auth.token.email) {
      throw new HttpsError('unauthenticated', 'Sign in required')
    }
    const email = String(request.auth.token.email).toLowerCase()
    const slug = String(request.data?.slug || process.env.CASE_SLUG || 'pancite')
    const publicSnap = await db.collection('publicCases').doc(slug).get()
    if (!publicSnap.exists) {
      throw new HttpsError('not-found', 'Case not found')
    }
    const caseId = publicSnap.data()!.caseId as string
    const members = db.collection('cases').doc(caseId).collection('members')
    const memberRef = members.doc(request.auth.uid)
    const existing = await memberRef.get()
    if (existing.exists) {
      return { ok: true, caseId, already: true }
    }

    const anyMember = await members.limit(1).get()
    if (!anyMember.empty) {
      throw new HttpsError('permission-denied', 'Case already has an owner; ask for an invite')
    }

    await memberRef.set({
      role: 'owner',
      displayName: request.auth.token.name || email,
      email,
      active: true,
      createdAt: FieldValue.serverTimestamp(),
      lastSeenAt: FieldValue.serverTimestamp(),
    })

    return { ok: true, caseId }
  },
)

/** @deprecated use claimFirstOwner */
export const claimOwnerBootstrap = claimFirstOwner
