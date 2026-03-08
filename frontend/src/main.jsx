import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('ServiceWorker registration successful with scope: ', registration.scope);
    } catch (err) {
      if (err.name === 'AbortError') {
        console.warn('ServiceWorker registration aborted (likely storage/private mode issue):', err);
      } else {
        console.error('ServiceWorker registration failed: ', err);
      }
    }
  });
}
