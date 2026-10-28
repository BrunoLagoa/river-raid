import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(`./sw.js?v=${encodeURIComponent(__BUILD_VERSION__)}`).catch((err) => {
      console.warn('Service worker registration failed:', err)
    })
  })
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

