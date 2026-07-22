import { initializeApp } from 'firebase/app'
import { connectFirestoreEmulator, getFirestore } from 'firebase/firestore'
import { connectStorageEmulator, getStorage } from 'firebase/storage'
import { firebaseWebConfig } from './config'

export const app = initializeApp(firebaseWebConfig)
export const db = getFirestore(app)
export const storage = getStorage(app)

const useEmulators = import.meta.env.VITE_USE_EMULATORS === 'true'

let emulatorsConnected = false

export function connectEmulatorsIfNeeded() {
  if (!useEmulators || emulatorsConnected) return
  connectFirestoreEmulator(db, '127.0.0.1', 8080)
  connectStorageEmulator(storage, '127.0.0.1', 9199)
  emulatorsConnected = true
}

export const defaultCaseSlug = (import.meta.env.VITE_CASE_SLUG as string) || 'pancita'
