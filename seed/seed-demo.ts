/**
 * Demo seed runner. The implementation lives beside Firebase Admin so the web
 * app does not ship privileged server dependencies.
 *
 * Usage with emulators running: yarn seed
 */
import { seedDemo } from '../functions/src/seedDemo'

seedDemo().catch((error: unknown) => {
  console.error(error)
  process.exit(1)
})
