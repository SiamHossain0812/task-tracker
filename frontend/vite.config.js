import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
  ],
  server: {
    host: true,
  },
  publicDir: 'public', // Ensure public files (including serviceWorker.js) are served
})
