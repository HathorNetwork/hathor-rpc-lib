import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './polyfills' // Must be imported first to set up global polyfills
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
