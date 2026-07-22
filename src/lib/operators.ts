import type { Member } from '@/domain/schemas'

/** Synthetic emails — UI only shows username. Firebase Auth still needs an email. */
export const OPERATORS = {
  paula: {
    username: 'paula',
    email: 'paula@panza.local',
    displayName: 'Paula',
    role: 'owner' as const,
  },
  rodrigo: {
    username: 'rodrigo',
    email: 'rodrigo@panza.local',
    displayName: 'Rodrigo',
    role: 'coordinator' as const,
  },
  gaston: {
    username: 'gaston',
    email: 'gaston@panza.local',
    displayName: 'Gastón',
    role: 'coordinator' as const,
  },
} as const

export type OperatorUsername = keyof typeof OPERATORS

export function resolveOperator(username: string) {
  const key = username.trim().toLowerCase() as OperatorUsername
  return OPERATORS[key] ?? null
}

export function operatorByEmail(email: string): (typeof OPERATORS)[OperatorUsername] | null {
  const normalized = email.trim().toLowerCase()
  return Object.values(OPERATORS).find((o) => o.email === normalized) ?? null
}

export function roleForEmail(email: string): Member['role'] | null {
  return operatorByEmail(email)?.role ?? null
}
