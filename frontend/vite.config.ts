import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/auth': {
        target: 'https://task-running-api.onrender.com',
        changeOrigin: true,
        secure: true,
      },
      '/api': {
        target: 'https://task-running-api.onrender.com',
        changeOrigin: true,
        secure: true,
      },
    },
  },
})
