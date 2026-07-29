import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'node:path'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: false,
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
        // Case photos are ~5 MB: cache them only if a user actually opens them.
        globPatterns: ['**/*.{js,css,html,svg,ico}', 'pwa-*.png'],
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
        runtimeCaching: [
          {
            urlPattern: /\/panza\/.*\.(?:png|jpe?g|webp)$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'panza-images',
              expiration: {
                maxEntries: 12,
                maxAgeSeconds: 7 * 24 * 60 * 60,
              },
            },
          },
        ],
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
