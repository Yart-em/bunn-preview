import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { IS_IOS } from './lib/platform'

/* iOS Safari renders backdrop-filter "liquid glass" incorrectly /
 * jankily, so disable it there (see the `html.no-glass` rules in
 * index.css). Set the flag before first paint to avoid a flash of
 * mis-rendered glass. */
if (IS_IOS) document.documentElement.classList.add('no-glass')

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
