import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/login": "http://localhost:8080",
      "/register": "http://localhost:8080",
      "/forgot-password": "http://localhost:8080",
      "/reset-password": "http://localhost:8080",
      "/test-email": "http://localhost:8080",
      "/users": "http://localhost:8080",
      "/properties": "http://localhost:8080",
      "/requests": "http://localhost:8080",
      "/reviews": "http://localhost:8080",
      "/payments": "http://localhost:8080",
      "/notifications": "http://localhost:8080",
      "/search": "http://localhost:8080",
      "/images": "http://localhost:8080",
    },
  },
})
