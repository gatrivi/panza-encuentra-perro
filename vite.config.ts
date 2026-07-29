import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/firebase')) return 'firebase'
          if (id.includes('node_modules/leaflet') || id.includes('react-leaflet'))
            return 'leaflet'
          if (id.includes('node_modules/h3-js')) return 'h3'
          if (id.includes('node_modules/@turf')) return 'turf'
          if (id.includes('node_modules/react-dom') || id.includes('node_modules/react/'))
            return 'react'
          return undefined
        },
      },
    },
  },
  server: {
    host: '127.0.0.1',
    port: 8888,
    strictPort: true,
  },
})
