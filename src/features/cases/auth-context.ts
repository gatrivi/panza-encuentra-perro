import { createContext } from 'react'
import type { Member } from '@/domain/schemas'

/** Local session user — username is the uid (no Firebase Auth). */
export type SessionUser = { uid: string }

export type AuthState = {
  user: SessionUser | null
  member: Member | null
  caseId: string | null
  loading: boolean
  error: string | null
  signInWithUsername: (username: string, password: string) => Promise<void>
  signOut: () => Promise<void>
}

export const AuthContext = createContext<AuthState | null>(null)
