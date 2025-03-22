import type { VitePWAOptions } from 'vite-plugin-pwa';

/**
 * PWA設定を生成
 * @param isProd 本番環境かどうか
 * @returns PWA設定オブジェクト
 */
export function getPwaConfig(isProd: boolean): Partial<VitePWAOptions> {
  // BASE_PATHを取得（vite.config.tsのAPP_CONFIG.BASE_PATH.PRODと同期）
  const BASE_PATH = isProd ? '/kueccha/' : '/';

  return {
    registerType: 'prompt',
    includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'],
    manifest: {
      name: '佐渡で食えっちゃ',
      short_name: '佐渡で食えっちゃ',
      description:
        '佐渡島内の飲食店、駐車場、公共トイレの位置情報を網羅。オフラインでも使える観光支援アプリ。',
      id: 'sado-kueecha-app',
      lang: 'ja',
      start_url: BASE_PATH,
      scope: BASE_PATH,
      theme_color: '#4a6da7',
      background_color: '#ffffff',
      display: 'standalone',
      display_override: ['minimal-ui'],
      orientation: 'any',
      icons: [
        {
          src: `${BASE_PATH}icons/icon-192x192.png`,
          sizes: '192x192',
          type: 'image/png',
          purpose: 'any maskable',
        },
        {
          src: `${BASE_PATH}icons/icon-512x512.png`,
          sizes: '512x512',
          type: 'image/png',
          purpose: 'any maskable',
        },
      ],
      categories: ['food', 'travel', 'navigation'],
      shortcuts: [
        {
          name: '飲食店を探す',
          short_name: '飲食店',
          url: `${BASE_PATH}?category=restaurant`,
          icons: [
            {
              src: `${BASE_PATH}icons/restaurant-192x192.png`,
              sizes: '192x192',
              type: 'image/png',
            },
          ],
        },
        {
          name: '駐車場を探す',
          short_name: '駐車場',
          url: `${BASE_PATH}?category=parking`,
          icons: [
            {
              src: `${BASE_PATH}icons/parking-192x192.png`,
              sizes: '192x192',
              type: 'image/png',
            },
          ],
        },
        {
          name: 'トイレを探す',
          short_name: 'トイレ',
          url: `${BASE_PATH}?category=toilet`,
          icons: [
            {
              src: `${BASE_PATH}icons/toilet-192x192.png`,
              sizes: '192x192',
              type: 'image/png',
            },
          ],
        },
      ],
      serviceworker: {
        src: `${BASE_PATH}service-worker.js`,
        scope: BASE_PATH,
      },
      offline_enabled: true,
    },
    workbox: {
      // 既存のworkbox設定をそのまま維持
      skipWaiting: true,
      clientsClaim: true,
      runtimeCaching: [
        // 既存のキャッシュ設定を維持
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
