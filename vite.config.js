import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(() => {

  return {
    plugins: [react(), tailwindcss()],
   server: {
    allowedHosts: 'all',
    host: '0.0.0.0',
    port: 5173
  }
  }
})