import { StrictMode, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import { Analytics } from '@vercel/analytics/react'
import './index.css'
import App from './App.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'
import OrientationGuard from './components/OrientationGuard.jsx'
import { restoreFromCookie } from './utils/gameStorage.js'
import { bootstrapPlatformIdentity } from './utils/platformIdentity.js'
import { syncCloudSave } from './utils/cloudSave.js'

restoreFromCookie() // Recover localStorage from cookie backup if needed
bootstrapPlatformIdentity()
  .then(() => syncCloudSave())
  .catch(error => console.warn('[identity/cloud] Bootstrap unavailable', error.message))

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <OrientationGuard />
      <Suspense fallback={<div role="status" style={{minHeight:'100vh',display:'grid',placeItems:'center',background:'#12052d',color:'#fff'}}>Loading…</div>}><App /></Suspense>
      <Analytics />
    </ErrorBoundary>
  </StrictMode>,
)
