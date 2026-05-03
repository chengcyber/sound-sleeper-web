import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { readFileSync } from 'fs'

const { version } = JSON.parse(readFileSync('./package.json', 'utf-8'))

// https://vite.dev/config/
export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(version),
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        // Precache all build artifacts (exclude mp3 — too large for precache)
        // Exclude favicon.png (source file, too large; SVG + sized icons are used at runtime)
        globPatterns: ['**/*.{js,css,html,svg,ico}', '**/icons/*.png'],
        // Cache audio files at runtime (CacheFirst) on first play,
        // so they are served from cache on subsequent visits / offline
        runtimeCaching: [
          {
            urlPattern: /\.mp3$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'audio-cache',
              expiration: {
                maxEntries: 20,
                maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
              },
              cacheableResponse: {
                statuses: [200],
              },
            },
          },
        ],
      },
      includeAssets: ['favicon.svg', 'icons/*.png'],
      manifest: {
        name: 'Sound Sleeper',
        short_name: 'Sound Sleeper',
        description: 'Soothing white noise for better baby sleep',
        theme_color: '#030712',
        background_color: '#030712',
        display: 'standalone',
        orientation: 'any',
        start_url: '/',
        icons: [
          {
            src: '/icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: '/icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
    }),
  ],
})
