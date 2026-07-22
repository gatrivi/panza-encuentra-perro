import type { Member } from '@/domain/schemas'

/** ponytail: shared family password in client — no Firebase Auth / Blaze. */
export const FAMILY_PASSWORD = 'LasHeras413'

export const OPERATORS = {
  paula: {
    username: 'paula',
    displayName: 'Paula',
    role: 'owner' as const,
  },
  rodrigo: {
    username: 'rodrigo',
    displayName: 'Rodrigo',
    role: 'coordinator' as const,
  },
  gaston: {
    username: 'gaston',
    displayName: 'Gastón',
    role: 'coordinator' as const,
  },
} as const

export type OperatorUsername = keyof typeof OPERATORS

export function resolveOperator(username: string) {
  const key = username.trim().toLowerCase() as OperatorUsername
  return OPERATORS[key] ?? null
}

export function checkFamilyLogin(username: string, password: string) {
  const op = resolveOperator(username)
  if (!op) return null
  if (password !== FAMILY_PASSWORD) return null
  return op
}

export function roleForUsername(username: string): Member['role'] | null {
  return resolveOperator(username)?.role ?? null
}
