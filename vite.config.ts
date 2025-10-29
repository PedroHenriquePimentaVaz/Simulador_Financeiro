import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    headers: {
      'Service-Worker-Allowed': '/',
      'Clear-Site-Data': '"cache", "cookies", "storage"'
    }
  },
  build: {
    rollupOptions: {
      output: {
        // Evitar problemas com service workers
        entryFileNames: 'assets/[name].js',
        chunkFileNames: 'assets/[name].js',
        assetFileNames: 'assets/[name].[ext]'
      }
    }
  }
})

