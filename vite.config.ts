import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'node:path'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'Operativo Pancita',
        short_name: 'Pancita',
        description: 'Mapa operativo compartido para buscar a Pancita',
        theme_color: '#1a3a2a',
        background_color: '#f3efe6',
        display: 'standalone',
        lang: 'es-AR',
        start_url: '/',
        icons: [
          {
            src: 'pwa-192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'pwa-512.png',
            sizes: '512x512',
            type: 'image/png',
          },
        ],
      },
      workbox: {
        // Don't block first paint on huge precache of map vendors
        globPatterns: ['**/*.{js,css,html,svg,png,ico,webp}'],
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
      },
    }),
  ],
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
