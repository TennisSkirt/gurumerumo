import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// ぐるめるも PWA — 설치 가능 + 오프라인 캐시
export default defineConfig({
  // GitHub Pages 프로젝트 사이트: https://tennisskirt.github.io/gurumerumo/
  base: '/gurumerumo/',
  build: {
    chunkSizeWarningLimit: 900,
    rollupOptions: {
      output: {
        // 무거운 벤더를 별도 청크로 분리 → 병렬 다운로드 + 배포마다 앱코드만 바뀌어도 캐시 유지
        manualChunks(id) {
          if (!id.includes('node_modules')) return
          if (id.includes('firebase') || id.includes('@firebase') || id.includes('@grpc') || id.includes('protobufjs')) return 'firebase'
          if (id.includes('@vis.gl') || id.includes('@googlemaps')) return 'maps'
          if (id.includes('react-dom') || id.includes('/react/') || id.includes('scheduler')) return 'react'
        },
      },
    },
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      workbox: {
        // 지도 타일(OSM)은 런타임 캐시 — 다녀온 지역은 오프라인에서도 보임
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/[abc]\.tile\.openstreetmap\.org\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'osm-tiles',
              expiration: { maxEntries: 500, maxAgeSeconds: 60 * 60 * 24 * 30 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
      manifest: {
        name: 'ぐるめるも',
        short_name: 'ぐるめるも',
        description: '우리 가족이 먹고 즐긴 장소를 지도에 기록하는 미식 메모',
        theme_color: '#e8562c',
        background_color: '#fff7ef',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: 'icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
    }),
  ],
  server: { host: true, port: 5175, strictPort: true },
})
