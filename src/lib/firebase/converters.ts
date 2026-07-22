import {
  Timestamp,
  type DocumentData,
  type FirestoreDataConverter,
  type QueryDocumentSnapshot,
  type SnapshotOptions,
} from 'firebase/firestore'

function toDate(value: unknown): Date | undefined {
  if (!value) return undefined
  if (value instanceof Timestamp) return value.toDate()
  if (value instanceof Date) return value
  if (typeof value === 'string' || typeof value === 'number') return new Date(value)
  return undefined
}

function requireDate(value: unknown, field: string): Date {
  const d = toDate(value)
  if (!d) throw new Error(`Missing date field: ${field}`)
  return d
}

export function dateToTimestamp(d: Date | undefined): Timestamp | undefined {
  return d ? Timestamp.fromDate(d) : undefined
}

export function createConverter<T extends { id: string }>(
  fromFirestore: (id: string, data: DocumentData) => T,
  toFirestore: (model: T) => DocumentData,
): FirestoreDataConverter<T> {
  return {
    toFirestore(model) {
      const { id: _id, ...rest } = model as T & { id: string }
      void _id
      return toFirestore(rest as T)
    },
    fromFirestore(snapshot: QueryDocumentSnapshot, options: SnapshotOptions): T {
      return fromFirestore(snapshot.id, snapshot.data(options))
    },
  }
}

export { toDate, requireDate }
