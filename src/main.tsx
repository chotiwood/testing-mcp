import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@btech/tokens/styles.css'
import '@btech/tokens/utilities.css'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
