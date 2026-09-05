import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    tailwindcss(),
    react()
  ],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:5000',
        changeOrigin: true
      },
      '/products': {
        target: 'http://127.0.0.1:5000',
        changeOrigin: true
      },
      '/categories': {
        target: 'http://127.0.0.1:5000',
        changeOrigin: true
      },
      '/master-products': {
        target: 'http://127.0.0.1:5000',
        changeOrigin: true
      },
      '/login': {
        target: 'http://127.0.0.1:5000',
        changeOrigin: true
      },
      '/register': {
        target: 'http://127.0.0.1:5000',
        changeOrigin: true
      },
      '/wishlist': {
        target: 'http://127.0.0.1:5000',
        changeOrigin: true
      },
      '/orders': {
        target: 'http://127.0.0.1:5000',
        changeOrigin: true
      },
      '/checkout': {
        target: 'http://127.0.0.1:5000',
        changeOrigin: true
      },
      '/rate-vendor': {
        target: 'http://127.0.0.1:5000',
        changeOrigin: true
      },
      '/vendor': {
        target: 'http://127.0.0.1:5000',
        changeOrigin: true
      },
      '/admin': {
        target: 'http://127.0.0.1:5000',
        changeOrigin: true
      }
    }
  }
})
