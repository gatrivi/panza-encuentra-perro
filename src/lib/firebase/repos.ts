import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  updateDoc,
  where,
  addDoc,
  setDoc,
  serverTimestamp,
  Timestamp,
  type Unsubscribe,
} from 'firebase/firestore'
import { db, defaultCaseSlug } from './app'
import { requireDate, toDate } from './converters'
import type { OPERATORS } from '../operators'
import {
  PANZA_ANIMAL,
  PANZA_CASE_ID,
  PANZA_CONTACT,
  PANZA_IG_LEAD_TEXT,
  PANZA_INSTRUCTIONS,
  PANZA_LATEST_SIGHTING,
  PANZA_MAP_CENTER,
  PANZA_SOURCES,
} from '../panzaCase'
import type {
  Case,
  Lead,
  LeadStatus,
  Member,
  PublicCase,
  Sighting,
  SightingConfidence,
  CompassDirection,
} from '@/domain/schemas'

export async function getPublicCase(slug: string): Promise<PublicCase | null> {
  const snap = await getDoc(doc(db, 'publicCases', slug))
  if (!snap.exists()) return null
  const d = snap.data()
  return {
    slug: snap.id,
    caseId: d.caseId,
    status: d.status,
    animal: d.animal,
    publicContact: d.publicContact ?? {},
    publicInstructions: d.publicInstructions,
    publicArea: d.publicArea,
    updatedAt: requireDate(d.updatedAt, 'updatedAt'),
  }
}

export async function getCase(caseId: string): Promise<Case | null> {
  const snap = await getDoc(doc(db, 'cases', caseId))
  if (!snap.exists()) return null
  const d = snap.data()
  return {
    id: snap.id,
    slug: d.slug,
    status: d.status,
    animal: d.animal,
    locale: d.locale ?? 'es-AR',
    distanceUnit: d.distanceUnit ?? 'km',
    mapCenter: d.mapCenter,
    publicContact: d.publicContact ?? {},
    publicInstructions: d.publicInstructions,
    zonePolicy: d.zonePolicy ?? { defaultRadius: 3, unit: 'km' },
    createdAt: requireDate(d.createdAt, 'createdAt'),
    updatedAt: requireDate(d.updatedAt, 'updatedAt'),
  }
}

export async function getMember(caseId: string, uid: string): Promise<Member | null> {
  const snap = await getDoc(doc(db, 'cases', caseId, 'members', uid))
  if (!snap.exists()) return null
  const d = snap.data()
  return {
    uid: snap.id,
    role: d.role,
    displayName: d.displayName,
    email: d.email,
    active: d.active,
    createdAt: requireDate(d.createdAt, 'createdAt'),
    lastSeenAt: toDate(d.lastSeenAt),
  }
}

function candidateSlugs(): string[] {
  const preferred = defaultCaseSlug
  return preferred === 'pancita'
    ? ['pancita', 'pancite', 'panza']
    : [preferred, 'pancita', 'pancite', 'panza']
}

/** Bootstrap Panza case + public projection if missing. */
export async function ensurePanzaCase(): Promise<string> {
  for (const caseSlug of candidateSlugs()) {
    const publicSnap = await getDoc(doc(db, 'publicCases', caseSlug))
    if (publicSnap.exists()) return publicSnap.data().caseId as string
  }

  const caseId = PANZA_CASE_ID
  const now = serverTimestamp()
  const publicPayload = {
    caseId,
    status: 'active',
    animal: PANZA_ANIMAL,
    publicContact: {
      displayPhone: PANZA_CONTACT.displayPhone,
      whatsapp: PANZA_CONTACT.whatsapp,
    },
    publicInstructions: PANZA_INSTRUCTIONS,
    updatedAt: now,
  }

  await setDoc(doc(db, 'cases', caseId), {
    slug: 'pancita',
    status: 'active',
    animal: PANZA_ANIMAL,
    locale: 'es-AR',
    distanceUnit: 'km',
    mapCenter: PANZA_MAP_CENTER,
    publicContact: publicPayload.publicContact,
    publicInstructions: PANZA_INSTRUCTIONS,
    zonePolicy: { defaultRadius: 3, unit: 'km' },
    createdAt: now,
    updatedAt: now,
  })
  await setDoc(doc(db, 'publicCases', 'pancita'), publicPayload)
  await setDoc(doc(db, 'publicCases', 'pancite'), publicPayload)
  await setDoc(doc(db, 'publicCases', 'panza'), publicPayload)
  return caseId
}

async function seedSocialLeadsIfEmpty(caseId: string): Promise<void> {
  const existing = await getDocs(query(collection(db, 'cases', caseId, 'leads')))
  if (existing.empty) {
    await addDoc(collection(db, 'cases', caseId, 'leads'), {
      origin: 'instagram',
      sourceUrl: PANZA_SOURCES.instagram,
      rawText: PANZA_IG_LEAD_TEXT,
      attachmentPaths: [],
      capturedAt: serverTimestamp(),
      reporter: {},
      parserSuggestions: {
        dates: ['15/7'],
        locations: ['Olivos', 'cementerio'],
        phones: [PANZA_CONTACT.displayPhone, PANZA_CONTACT.secondaryPhone],
        keywords: ['collar violeta'],
      },
      status: 'new',
      priority: 'normal',
    })
  }

  await ensureLatestPanzaIntel(caseId)
}

/** Upsert 23/7 Gral Paz lead + probable sighting; recenter map. Idempotent by idKey. */
async function ensureLatestPanzaIntel(caseId: string): Promise<void> {
  const leadRef = doc(db, 'cases', caseId, 'leads', PANZA_LATEST_SIGHTING.idKey)
  const sightingRef = doc(db, 'cases', caseId, 'sightings', PANZA_LATEST_SIGHTING.idKey)
  const observedAt = Timestamp.fromDate(new Date(PANZA_LATEST_SIGHTING.observedLocal))

  const leadSnap = await getDoc(leadRef)
  if (!leadSnap.exists()) {
    await setDoc(leadRef, {
      origin: 'facebook',
      sourceUrl: PANZA_LATEST_SIGHTING.sourceUrl,
      rawText: PANZA_LATEST_SIGHTING.rawText,
      attachmentPaths: [PANZA_LATEST_SIGHTING.mapPhoto],
      capturedAt: serverTimestamp(),
      reporter: {},
      claimedLocationText: PANZA_LATEST_SIGHTING.locationText,
      claimedPoint: PANZA_LATEST_SIGHTING.point,
      claimedDirection: PANZA_LATEST_SIGHTING.direction,
      claimedObservationAt: observedAt,
      parserSuggestions: {
        dates: ['23/7', '15/7'],
        locations: ['Parque Sarmiento', 'Villa Martelli', 'Gral Paz'],
        phones: [PANZA_CONTACT.displayPhone, PANZA_CONTACT.secondaryPhone],
        keywords: ['banquina', 'asustada', 'chapita'],
      },
      status: 'promoted',
      priority: 'high',
      promotedSightingId: PANZA_LATEST_SIGHTING.idKey,
    })
  }

  const sightingSnap = await getDoc(sightingRef)
  if (!sightingSnap.exists()) {
    await setDoc(sightingRef, {
      observedAt,
      reportedAt: serverTimestamp(),
      point: PANZA_LATEST_SIGHTING.point,
      direction: PANZA_LATEST_SIGHTING.direction,
      movement: 'moving',
      confidence: PANZA_LATEST_SIGHTING.confidence,
      evidence: {
        leadIds: [PANZA_LATEST_SIGHTING.idKey],
        photos: [PANZA_LATEST_SIGHTING.mapPhoto],
        sourceLinks: [PANZA_LATEST_SIGHTING.sourceUrl],
      },
      description: PANZA_LATEST_SIGHTING.locationText,
      createdByUid: 'bootstrap',
      reviewedByUid: 'bootstrap',
      reviewedAt: serverTimestamp(),
      // probable ≠ confirmed → no mueve zona oficial sola; recentramos a mano abajo
      affectsOfficialZone: false,
    })
  }

  await updateDoc(doc(db, 'cases', caseId), {
    mapCenter: PANZA_MAP_CENTER,
    publicInstructions: PANZA_INSTRUCTIONS,
    updatedAt: serverTimestamp(),
  })

  // keep public projection in sync (instructions only; no exact pin)
  for (const slug of ['pancita', 'pancite', 'panza']) {
    const pubRef = doc(db, 'publicCases', slug)
    const pubSnap = await getDoc(pubRef)
    if (pubSnap.exists()) {
      await updateDoc(pubRef, {
        publicInstructions: PANZA_INSTRUCTIONS,
        updatedAt: serverTimestamp(),
      })
    }
  }
}

type Operator = (typeof OPERATORS)[keyof typeof OPERATORS]

/** Upsert member doc keyed by username; seed social leads once. */
export async function ensureOperatorMember(
  caseId: string,
  op: Operator,
): Promise<Member> {
  const memberRef = doc(db, 'cases', caseId, 'members', op.username)
  const existing = await getDoc(memberRef)
  if (existing.exists()) {
    await updateDoc(memberRef, { active: true, lastSeenAt: serverTimestamp() })
  } else {
    await setDoc(memberRef, {
      role: op.role,
      displayName: op.displayName,
      email: `${op.username}@panza.local`,
      active: true,
      createdAt: serverTimestamp(),
      lastSeenAt: serverTimestamp(),
    })
  }
  await seedSocialLeadsIfEmpty(caseId)
  const member = await getMember(caseId, op.username)
  if (!member) throw new Error('member write failed')
  return member
}

export async function submitPublicReport(input: {
  slug: string
  mode: 'seeing_now' | 'think_i_saw'
  point?: [number, number]
  direction?: CompassDirection
  phone?: string
  anonymous: boolean
  honeypot?: string
  posterCode?: string
}): Promise<{ ok: true; leadId: string }> {
  if (input.honeypot) return { ok: true, leadId: 'honeypot' }
  if (!input.anonymous && !input.phone) {
    throw new Error('Phone required unless anonymous')
  }

  const publicSnap = await getDoc(doc(db, 'publicCases', input.slug))
  if (!publicSnap.exists()) throw new Error('Case not found')
  const pub = publicSnap.data()
  if (pub.status !== 'active') throw new Error('Case not accepting reports')
  const caseId = pub.caseId as string

  const ref = await addDoc(collection(db, 'cases', caseId, 'leads'), {
    origin: 'public_form',
    rawText: input.mode === 'seeing_now' ? 'LA ESTOY VIENDO' : 'CREO QUE LA VI',
    attachmentPaths: [],
    capturedAt: serverTimestamp(),
    reporter: {
      phone: input.anonymous ? null : input.phone,
      preferredContact: input.anonymous ? 'anonymous' : 'whatsapp',
    },
    claimedPoint: input.point ?? null,
    claimedDirection: input.direction ?? null,
    claimedObservationAt: Timestamp.now(),
    parserSuggestions: { dates: [], locations: [], phones: [], keywords: [] },
    status: 'new',
    priority: input.mode === 'seeing_now' ? 'high' : 'normal',
    posterCode: input.posterCode ?? null,
  })
  return { ok: true, leadId: ref.id }
}

function mapLead(id: string, caseId: string, d: Record<string, unknown>): Lead {
  return {
    id,
    caseId,
    origin: d.origin as Lead['origin'],
    sourceUrl: d.sourceUrl as string | undefined,
    rawText: d.rawText as string | undefined,
    attachmentPaths: (d.attachmentPaths as string[]) ?? [],
    sourcePublishedAt: toDate(d.sourcePublishedAt),
    capturedAt: requireDate(d.capturedAt, 'capturedAt'),
    capturedByUid: d.capturedByUid as string | undefined,
    reporter: (d.reporter as Lead['reporter']) ?? {},
    claimedObservationAt: toDate(d.claimedObservationAt),
    claimedLocationText: d.claimedLocationText as string | undefined,
    claimedPoint: d.claimedPoint as Lead['claimedPoint'],
    claimedDirection: d.claimedDirection as Lead['claimedDirection'],
    parserSuggestions: (d.parserSuggestions as Lead['parserSuggestions']) ?? {
      dates: [],
      locations: [],
      phones: [],
      keywords: [],
    },
    status: d.status as LeadStatus,
    duplicateOf: d.duplicateOf as string | undefined,
    reviewNotes: d.reviewNotes as string | undefined,
    promotedSightingId: d.promotedSightingId as string | undefined,
    priority: (d.priority as Lead['priority']) ?? 'normal',
    posterCode: d.posterCode as string | undefined,
  }
}

export function subscribeLeads(
  caseId: string,
  onChange: (leads: Lead[]) => void,
): Unsubscribe {
  const q = query(collection(db, 'cases', caseId, 'leads'))
  return onSnapshot(q, (snap) => {
    const leads = snap.docs.map((docSnap) => mapLead(docSnap.id, caseId, docSnap.data()))
    leads.sort((a, b) => b.capturedAt.getTime() - a.capturedAt.getTime())
    onChange(leads)
  })
}

export async function createLead(
  caseId: string,
  input: {
    origin: Lead['origin']
    rawText?: string
    sourceUrl?: string
    attachmentPaths?: string[]
    capturedByUid?: string
    priority?: Lead['priority']
    claimedPoint?: Lead['claimedPoint']
    claimedDirection?: Lead['claimedDirection']
    reporter?: Lead['reporter']
    posterCode?: string
  },
): Promise<string> {
  const ref = await addDoc(collection(db, 'cases', caseId, 'leads'), {
    origin: input.origin,
    rawText: input.rawText ?? null,
    sourceUrl: input.sourceUrl ?? null,
    attachmentPaths: input.attachmentPaths ?? [],
    capturedAt: serverTimestamp(),
    capturedByUid: input.capturedByUid ?? null,
    reporter: input.reporter ?? {},
    parserSuggestions: { dates: [], locations: [], phones: [], keywords: [] },
    status: 'new',
    priority: input.priority ?? 'normal',
    claimedPoint: input.claimedPoint ?? null,
    claimedDirection: input.claimedDirection ?? null,
    posterCode: input.posterCode ?? null,
  })
  return ref.id
}

export async function updateLeadStatus(
  caseId: string,
  leadId: string,
  status: LeadStatus,
  reviewNotes?: string,
): Promise<void> {
  await updateDoc(doc(db, 'cases', caseId, 'leads', leadId), {
    status,
    reviewNotes: reviewNotes ?? null,
  })
}

function mapSighting(id: string, caseId: string, d: Record<string, unknown>): Sighting {
  return {
    id,
    caseId,
    observedAt: requireDate(d.observedAt, 'observedAt'),
    reportedAt: requireDate(d.reportedAt, 'reportedAt'),
    point: d.point as Sighting['point'],
    accuracyMeters: d.accuracyMeters as number | undefined,
    direction: (d.direction as CompassDirection) ?? 'unknown',
    movement: (d.movement as Sighting['movement']) ?? 'unknown',
    confidence: d.confidence as SightingConfidence,
    evidence: (d.evidence as Sighting['evidence']) ?? {
      leadIds: [],
      photos: [],
      sourceLinks: [],
    },
    description: (d.description as string) ?? '',
    createdByUid: d.createdByUid as string,
    reviewedByUid: d.reviewedByUid as string | undefined,
    reviewedAt: toDate(d.reviewedAt),
    affectsOfficialZone: Boolean(d.affectsOfficialZone),
  }
}

export function subscribeSightings(
  caseId: string,
  onChange: (sightings: Sighting[]) => void,
): Unsubscribe {
  const q = query(collection(db, 'cases', caseId, 'sightings'))
  return onSnapshot(q, (snap) => {
    const items = snap.docs.map((docSnap) =>
      mapSighting(docSnap.id, caseId, docSnap.data()),
    )
    items.sort((a, b) => b.observedAt.getTime() - a.observedAt.getTime())
    onChange(items)
  })
}

export async function promoteLeadToSighting(params: {
  caseId: string
  lead: Lead
  actorUid: string
  observedAt: Date
  point: [number, number]
  direction: CompassDirection
  confidence: SightingConfidence
  description?: string
}): Promise<string> {
  const { caseId, lead, actorUid, observedAt, point, direction, confidence, description } =
    params

  const affectsOfficialZone = confidence === 'confirmed'

  const sightingRef = await addDoc(collection(db, 'cases', caseId, 'sightings'), {
    observedAt: Timestamp.fromDate(observedAt),
    reportedAt: Timestamp.fromDate(lead.capturedAt),
    point,
    direction,
    movement: direction === 'stationary' ? 'stationary' : 'unknown',
    confidence,
    evidence: {
      leadIds: [lead.id],
      photos: lead.attachmentPaths,
      sourceLinks: lead.sourceUrl ? [lead.sourceUrl] : [],
    },
    description: description ?? lead.rawText?.slice(0, 500) ?? '',
    createdByUid: actorUid,
    reviewedByUid: actorUid,
    reviewedAt: serverTimestamp(),
    affectsOfficialZone,
  })

  await updateDoc(doc(db, 'cases', caseId, 'leads', lead.id), {
    status: 'promoted',
    promotedSightingId: sightingRef.id,
  })

  await addDoc(collection(db, 'cases', caseId, 'audit'), {
    actorUid,
    action: 'sighting.promote',
    objectType: 'sighting',
    objectId: sightingRef.id,
    before: { leadStatus: lead.status },
    after: { confidence, affectsOfficialZone, leadId: lead.id },
    createdAt: serverTimestamp(),
  })

  return sightingRef.id
}

export async function listOpenLeads(caseId: string): Promise<Lead[]> {
  const q = query(
    collection(db, 'cases', caseId, 'leads'),
    where('status', 'in', ['new', 'needs_details']),
  )
  const snap = await getDocs(q)
  return snap.docs.map((d) => mapLead(d.id, caseId, d.data()))
}
