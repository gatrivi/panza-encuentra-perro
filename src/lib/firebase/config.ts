/**
 * Public Firebase web client config (safe to ship in the browser bundle).
 * Env vars override when set (local .env / CI).
 */
export const firebaseWebConfig = {
  apiKey:
    import.meta.env.VITE_FIREBASE_API_KEY ||
    'AIzaSyBK71QcMTPZk1bzy_-itP-eXAVnZ8Gwy-c',
  authDomain:
    import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'pancita-busca-perro.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'pancita-busca-perro',
  storageBucket:
    import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ||
    'pancita-busca-perro.firebasestorage.app',
  messagingSenderId:
    import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '228835710484',
  appId:
    import.meta.env.VITE_FIREBASE_APP_ID || '1:228835710484:web:1f50ba0ebe16f26f19f901',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
} as const
