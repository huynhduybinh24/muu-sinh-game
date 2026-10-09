import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt',
      devOptions: { enabled: false },
      manifest: {
        name: 'MƯU SINH – Mỗi Ngày Một Nghề',
        short_name: 'MƯU SINH',
        description: 'Đi làm, kiếm tiền, nâng cấp cuộc sống. Khám phá 26 nghề trong phố nhỏ Việt Nam.',
        lang: 'vi',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'portrait-primary',
        theme_color: '#FFF5DF',
        background_color: '#FFF5DF',
        icons: [
          {
            src: '/pwa-icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/pwa-icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/pwa-maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        clientsClaim: true,
        cleanupOutdatedCaches: true,
        globPatterns: ['**/*.{html,js,css,svg,png,webmanifest}'],
        navigateFallback: 'index.html',
      },
    }),
  ],
})
