import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Encaminha chamadas do frontend para o backend ARGOS local durante
      // o desenvolvimento (evita problemas de CORS e URLs hardcoded).
      // Ver backend/README / .env.example para como rodar o backend.
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
})
