import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import './index.css'
import { store } from './app/store'
import App from './app/App'

// MSW runs in EVERY environment, prod included — the deployed demo has no
// real backend by design, MSW *is* its backend (see docs/decisions.md,
// 2026-07-23). `bypass` lets real external calls (OSRM, MapTiler) through.
async function enableMocking() {
  const { worker } = await import('./shared/mocks/browser')
  return worker.start({ onUnhandledRequest: 'bypass' })
}

enableMocking().then(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <Provider store={store}>
        <App />
      </Provider>
    </StrictMode>,
  )
})
