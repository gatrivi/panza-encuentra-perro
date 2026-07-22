import { z } from 'zod'

/** GeoJSON position: [longitude, latitude] */
export const GeoPointSchema = z.tuple([z.number(), z.number()])
export type GeoPoint = z.infer<typeof GeoPointSchema>

export const CaseStatusSchema = z.enum(['active', 'found', 'archived'])
export type CaseStatus = z.infer<typeof CaseStatusSchema>

export const MemberRoleSchema = z.enum(['owner', 'coordinator', 'searcher'])
export type MemberRole = z.infer<typeof MemberRoleSchema>

export const LeadOriginSchema = z.enum([
  'public_form',
  'facebook',
  'instagram',
  'whatsapp',
  'other',
])
export type LeadOrigin = z.infer<typeof LeadOriginSchema>

export const LeadStatusSchema = z.enum([
  'new',
  'needs_details',
  'duplicate',
  'rejected',
  'promoted',
])
export type LeadStatus = z.infer<typeof LeadStatusSchema>

export const SightingConfidenceSchema = z.enum([
  'unverified',
  'probable',
  'confirmed',
  'rejected',
])
export type SightingConfidence = z.infer<typeof SightingConfidenceSchema>

export const SightingMovementSchema = z.enum([
  'moving',
  'stationary',
  'hidden',
  'unknown',
])
export type SightingMovement = z.infer<typeof SightingMovementSchema>

export const CompassDirectionSchema = z.enum([
  'N',
  'NE',
  'E',
  'SE',
  'S',
  'SW',
  'W',
  'NW',
  'stationary',
  'unknown',
])
export type CompassDirection = z.infer<typeof CompassDirectionSchema>

export const TaskKindSchema = z.enum([
  'search',
  'sign',
  'contact',
  'camera',
  'feeding',
  'other',
])
export type TaskKind = z.infer<typeof TaskKindSchema>

export const TaskStatusSchema = z.enum(['open', 'claimed', 'done'])
export type TaskStatus = z.infer<typeof TaskStatusSchema>

export const TaskPrioritySchema = z.enum(['normal', 'high', 'urgent'])
export type TaskPriority = z.infer<typeof TaskPrioritySchema>

export const SignTierSchema = z.enum(['A', 'B', 'C', 'D'])
export type SignTier = z.infer<typeof SignTierSchema>

export const SignStatusSchema = z.enum([
  'planned',
  'placed',
  'missing',
  'damaged',
  'removed',
])
export type SignStatus = z.infer<typeof SignStatusSchema>

export const SignPlaceTypeSchema = z.enum([
  'service_station',
  'police',
  'security',
  'business_24h',
  'vet',
  'pet_shop',
  'groomer',
  'shelter',
  'supermarket',
  'transit',
  'pharmacy',
  'school',
  'club',
  'street',
  'other',
])
export type SignPlaceType = z.infer<typeof SignPlaceTypeSchema>

export const AnimalSchema = z.object({
  name: z.string().min(1),
  aliases: z.array(z.string()).default([]),
  species: z.string().default('dog'),
  breed: z.string().optional(),
  color: z.string().optional(),
  sex: z.enum(['female', 'male', 'unknown']).default('unknown'),
  size: z.string().optional(),
  distinguishingMarks: z.string().optional(),
  photos: z.array(z.string()).default([]),
})
export type Animal = z.infer<typeof AnimalSchema>

export const PublicContactSchema = z.object({
  displayPhone: z.string().optional(),
  whatsapp: z.string().optional(),
})
export type PublicContact = z.infer<typeof PublicContactSchema>

export const CaseSchema = z.object({
  id: z.string(),
  slug: z.string().min(1),
  status: CaseStatusSchema,
  animal: AnimalSchema,
  locale: z.string().default('es-AR'),
  distanceUnit: z.enum(['km', 'mi']).default('km'),
  mapCenter: GeoPointSchema,
  publicContact: PublicContactSchema.default({}),
  publicInstructions: z.string().optional(),
  zonePolicy: z
    .object({
      defaultRadius: z.number().positive().default(3),
      unit: z.enum(['km', 'mi']).default('km'),
    })
    .default({ defaultRadius: 3, unit: 'km' }),
  createdAt: z.date(),
  updatedAt: z.date(),
})
export type Case = z.infer<typeof CaseSchema>

export const PublicCaseSchema = z.object({
  slug: z.string(),
  caseId: z.string(),
  status: CaseStatusSchema,
  animal: AnimalSchema,
  publicContact: PublicContactSchema,
  publicInstructions: z.string().optional(),
  /** Deliberately coarse public area — never exact team data */
  publicArea: z
    .object({
      type: z.literal('Point'),
      coordinates: GeoPointSchema,
      radiusMeters: z.number().positive(),
    })
    .optional(),
  updatedAt: z.date(),
})
export type PublicCase = z.infer<typeof PublicCaseSchema>

export const MemberSchema = z.object({
  uid: z.string(),
  role: MemberRoleSchema,
  displayName: z.string(),
  email: z.string().email(),
  active: z.boolean(),
  createdAt: z.date(),
  lastSeenAt: z.date().optional(),
})
export type Member = z.infer<typeof MemberSchema>

export const ReporterSchema = z.object({
  name: z.string().optional(),
  phone: z.string().optional(),
  preferredContact: z.enum(['phone', 'whatsapp', 'anonymous']).optional(),
})
export type Reporter = z.infer<typeof ReporterSchema>

export const LeadSchema = z.object({
  id: z.string(),
  caseId: z.string(),
  origin: LeadOriginSchema,
  sourceUrl: z.string().url().optional(),
  rawText: z.string().optional(),
  attachmentPaths: z.array(z.string()).default([]),
  sourcePublishedAt: z.date().optional(),
  capturedAt: z.date(),
  capturedByUid: z.string().optional(),
  reporter: ReporterSchema.default({}),
  claimedObservationAt: z.date().optional(),
  claimedLocationText: z.string().optional(),
  claimedPoint: GeoPointSchema.optional(),
  claimedDirection: CompassDirectionSchema.optional(),
  parserSuggestions: z
    .object({
      dates: z.array(z.string()).default([]),
      locations: z.array(z.string()).default([]),
      phones: z.array(z.string()).default([]),
      keywords: z.array(z.string()).default([]),
    })
    .default({ dates: [], locations: [], phones: [], keywords: [] }),
  status: LeadStatusSchema,
  duplicateOf: z.string().optional(),
  reviewNotes: z.string().optional(),
  promotedSightingId: z.string().optional(),
  priority: z.enum(['normal', 'high']).default('normal'),
  posterCode: z.string().optional(),
})
export type Lead = z.infer<typeof LeadSchema>

export const SightingSchema = z.object({
  id: z.string(),
  caseId: z.string(),
  observedAt: z.date(),
  reportedAt: z.date(),
  point: GeoPointSchema,
  accuracyMeters: z.number().optional(),
  direction: CompassDirectionSchema.default('unknown'),
  movement: SightingMovementSchema.default('unknown'),
  confidence: SightingConfidenceSchema,
  evidence: z.object({
    leadIds: z.array(z.string()).default([]),
    photos: z.array(z.string()).default([]),
    sourceLinks: z.array(z.string()).default([]),
  }),
  description: z.string().default(''),
  createdByUid: z.string(),
  reviewedByUid: z.string().optional(),
  reviewedAt: z.date().optional(),
  affectsOfficialZone: z.boolean().default(false),
})
export type Sighting = z.infer<typeof SightingSchema>

export const SearchTaskSchema = z.object({
  id: z.string(),
  caseId: z.string(),
  title: z.string().min(1),
  kind: TaskKindSchema,
  status: TaskStatusSchema,
  priority: TaskPrioritySchema,
  notes: z.string().optional(),
  point: GeoPointSchema.optional(),
  assigneeUid: z.string().optional(),
  assigneeName: z.string().optional(),
  createdByUid: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
  completedAt: z.date().optional(),
})
export type SearchTask = z.infer<typeof SearchTaskSchema>

export const SignSchema = z.object({
  id: z.string(),
  caseId: z.string(),
  point: GeoPointSchema,
  placeName: z.string().optional(),
  tier: SignTierSchema,
  placeType: SignPlaceTypeSchema,
  status: SignStatusSchema,
  staffPersonallyAlerted: z.boolean(),
  notes: z.string().optional(),
  posterCode: z.string().optional(),
  createdByUid: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
  placedAt: z.date().optional(),
  lastCheckedAt: z.date().optional(),
})
export type Sign = z.infer<typeof SignSchema>

export const SearchZoneSchema = z.object({
  id: z.string(),
  caseId: z.string(),
  center: GeoPointSchema,
  radiusMeters: z.number().positive(),
  basisSightingId: z.string().optional(),
  basisObservedAt: z.date().optional(),
  updatedByUid: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
})
export type SearchZone = z.infer<typeof SearchZoneSchema>

export const AuditEventSchema = z.object({
  id: z.string(),
  actorUid: z.string(),
  action: z.string(),
  objectType: z.string(),
  objectId: z.string(),
  before: z.record(z.unknown()).optional(),
  after: z.record(z.unknown()).optional(),
  createdAt: z.date(),
})
export type AuditEvent = z.infer<typeof AuditEventSchema>

export const PublicReportInputSchema = z.object({
  slug: z.string().min(1),
  mode: z.enum(['seeing_now', 'think_i_saw']),
  point: GeoPointSchema.optional(),
  direction: CompassDirectionSchema.optional(),
  phone: z.string().optional(),
  anonymous: z.boolean().default(false),
  photoBase64: z.string().optional(),
  posterCode: z.string().optional(),
  honeypot: z.string().max(0).optional(),
  claimedObservationAt: z.string().datetime().optional(),
})
export type PublicReportInput = z.infer<typeof PublicReportInputSchema>

export function canPromoteSightings(role: MemberRole): boolean {
  return role === 'owner' || role === 'coordinator'
}

export function canManageMembers(role: MemberRole): boolean {
  return role === 'owner'
}

export function canManageZones(role: MemberRole): boolean {
  return role === 'owner' || role === 'coordinator'
}
