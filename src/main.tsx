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
  const register = () => {
    window.setTimeout(() => {
      void navigator.serviceWorker.register('/sw.js').catch(() => undefined)
    }, 8_000)
  }
  if (document.readyState === 'complete') register()
  else window.addEventListener('load', register, { once: true })
}
