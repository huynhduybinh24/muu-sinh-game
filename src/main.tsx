import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { isNativeAndroid } from './services/platform'
import './native.css'

if (isNativeAndroid()) document.documentElement.classList.add('native-android')

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
