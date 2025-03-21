import { VitePWAOptions } from 'vite-plugin-pwa';

/**
 * PWA設定を生成
 * @param isProd 本番環境かどうか
 * @returns PWA設定オブジェクト
 */
export function getPwaConfig(isProd: boolean): Partial<VitePWAOptions> {
  return {
    registerType: 'prompt',
    includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'],
    manifest: {
      name: '佐渡で食えっちゃ',
      short_name: '佐渡で食えっちゃ',
      description: '佐渡島内の飲食店、駐車場、公共トイレの位置情報を網羅。オフラインでも使える観光支援アプリ。',
      lang: 'ja',
      theme_color: '#4a6da7',
      background_color: '#ffffff',
      display: 'standalone',
      orientation: 'any',
      icons: [
        {
          src: '/icons/icon-192x192.png',
          sizes: '192x192',
          type: 'image/png',
          purpose: 'any maskable',
        },
        {
          src: '/icons/icon-512x512.png',
          sizes: '512x512',
          type: 'image/png',
          purpose: 'any maskable',
        }
      ],
      categories: ['food', 'travel', 'navigation'],
    },
    workbox: {
      skipWaiting: true,
      clientsClaim: true,
      runtimeCaching: [
        {
          urlPattern: /^https:\/\/maps\.googleapis\.com\/.*/i,
          handler: 'CacheFirst',
          options: {
            cacheName: 'google-maps',
            expiration: { maxEntries: 50, maxAgeSeconds: 60 * 60 * 24 * 7 },
            cacheableResponse: { statuses: [0, 200] },
          },
        },
        {
          urlPattern: /^https:\/\/sheets\.googleapis\.com\/.*/i,
          handler: 'NetworkFirst',
          options: {
            cacheName: 'google-sheets',
            expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 },
            networkTimeoutSeconds: 10,
          },
        },
        {
          urlPattern: /\/api\/.*/i,
          handler: 'NetworkFirst',
          options: {
            cacheName: 'api-cache',
            networkTimeoutSeconds: 10,
            expiration: { maxEntries: 50, maxAgeSeconds: 24 * 60 * 60 },
          },
        },
        {
          urlPattern: /\.(js|css)$/,
          handler: 'StaleWhileRevalidate',
          options: {
            cacheName: 'static-resources',
            expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 * 30 },
          },
        },
        {
          urlPattern: /\.(?:png|jpg|jpeg|svg|gif)$/i,
          handler: 'CacheFirst',
          options: {
            cacheName: 'images-cache',
            expiration: { maxEntries: 100, maxAgeSeconds: 30 * 24 * 60 * 60 },
            cacheableResponse: { statuses: [0, 200] },
            matchOptions: { ignoreSearch: true },
          },
        },
        {
          urlPattern: /\.(woff2?|ttf|otf)$/,
          handler: 'CacheFirst',
          options: {
            cacheName: 'fonts',
            expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
          },
        },
      ],
      navigateFallback: 'index.html',
      navigateFallbackDenylist: [/^\/api/, /\.(json|xml|csv|webmanifest|txt)$/],
    },
    devOptions: {
      enabled: !isProd,
      type: 'module',
      navigateFallback: 'index.html',
    },
  };
}