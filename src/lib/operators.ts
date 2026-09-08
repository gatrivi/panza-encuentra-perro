import type { Member } from '@/domain/schemas'

/**
 * Family password is injected at build time via VITE_FAMILY_PASSWORD
 * (see .env.example). Never hardcode it here — this file ships in the bundle.
 */
export const FAMILY_PASSWORD = (import.meta.env.VITE_FAMILY_PASSWORD as
  | string
  | undefined) ?? ''

export const OPERATORS = {
  paula: {
    username: 'paula',
    short: 'P',
    displayName: 'Pau Trivi',
    role: 'owner' as const,
    /** User will drop avatars under public/operators/ */
    avatar: '/operators/p.jpg',
  },
  gaston: {
    username: 'gaston',
    short: 'G',
    displayName: 'G Alejandro Trivi',
    role: 'coordinator' as const,
    avatar: '/operators/g.jpg',
  },
  rodrigo: {
    username: 'rodrigo',
    short: 'R',
    displayName: 'Rodrii Perez Schmidt',
    role: 'coordinator' as const,
    avatar: '/operators/r.jpg',
  },
} as const

export type OperatorUsername = keyof typeof OPERATORS

const SHORT_TO_USER: Record<string, OperatorUsername> = {
  p: 'paula',
  g: 'gaston',
  r: 'rodrigo',
}

export const OPERATOR_ORDER: OperatorUsername[] = ['paula', 'gaston', 'rodrigo']

export function resolveOperator(username: string) {
  const key = username.trim().toLowerCase()
  if (key in OPERATORS) return OPERATORS[key as OperatorUsername]
  const fromShort = SHORT_TO_USER[key]
  return fromShort ? OPERATORS[fromShort] : null
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
