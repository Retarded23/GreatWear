import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig(() => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  return {
    plugins: [react(), tailwindcss()],
   server: {
    allowedHosts: 'all',
    host: '0.0.0.0',
    port: 5173
  }
  }
})
