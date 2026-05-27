import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import './styles/index.css'
import 'leaflet/dist/leaflet.css'  // Map tiles need the upstream CSS to position correctly.
import './i18n'  // Side-effect: initialises i18next before any component renders.
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
