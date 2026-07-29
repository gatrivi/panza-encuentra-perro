import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { App } from '@/app/App'
import '@/styles/global.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)

if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  const wasControlled = Boolean(navigator.serviceWorker.controller)
  let reloading = false

  if (wasControlled) {
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (reloading) return
      reloading = true
      window.location.reload()
    })
  }

  const register = () => {
    void navigator.serviceWorker
      .register('/sw.js', { updateViaCache: 'none' })
      .then((registration) => registration.update())
      .catch(() => undefined)
  }

  if (wasControlled) {
    // Returning field devices get the current route without a hard refresh.
    window.setTimeout(register, 1_000)
  } else {
    // First visit: keep service-worker work out of the critical map path.
    const registerAfterLoad = () => window.setTimeout(register, 8_000)
    if (document.readyState === 'complete') registerAfterLoad()
    else window.addEventListener('load', registerAfterLoad, { once: true })
  }
}
