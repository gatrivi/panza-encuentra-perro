import { createContext } from 'react'
import type { User } from 'firebase/auth'
import type { Member } from '@/domain/schemas'

export type AuthState = {
  user: User | null
  member: Member | null
  caseId: string | null
  loading: boolean
  error: string | null
  rememberedUsername: string
  signInWithUsername: (username: string, password: string) => Promise<void>
  signOut: () => Promise<void>
}

export const AuthContext = createContext<AuthState | null>(null)
