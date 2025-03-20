import path from 'node:path';
import fs from 'node:fs';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import compression from 'vite-plugin-compression';
import tsconfigPaths from 'vite-tsconfig-paths';

// ============================================================================
// 型と定数
// ============================================================================
const APP_CONFIG = {
  BASE_PATH: { PROD: '/kueccha/', DEV: '/' },
  OUTPUT_DIR: 'dist',
  PORT: { DEFAULT: 5173, MOBILE: 5174 },
  REQUIRED_ENV: ['VITE_GOOGLE_MAPS_API_KEY'],
  OPTIONAL_ENV: [
    'VITE_GOOGLE_MAPS_MAP_ID',
    'VITE_GOOGLE_SHEETS_API_KEY',
    'VITE_GOOGLE_SPREADSHEET_ID',
    'VITE_EMAILJS_SERVICE_ID',
    'VITE_EMAILJS_TEMPLATE_ID',
    'VITE_EMAILJS_PUBLIC_KEY',
    'VITE_DEFAULT_ZOOM',
    'VITE_DEFAULT_CENTER_LAT',
    'VITE_DEFAULT_CENTER_LNG',
    'VITE_APP_TITLE',
  ],
};

// ============================================================================
// 設定関数
// ============================================================================

/**
 * 環境変数の検証
 */
function validateEnv(env) {
  const missingRequired = APP_CONFIG.REQUIRED_ENV.filter(key => !env[key]);
  if (missingRequired.length > 0) {
    throw new Error(`必須環境変数が設定されていません: ${missingRequired.join(', ')}`);
  }

  const defineEnv = [...APP_CONFIG.REQUIRED_ENV, ...APP_CONFIG.OPTIONAL_ENV].reduce((acc, key) => {
    if (env[key]) acc[`process.env.${key}`] = JSON.stringify(env[key]);
    return acc;
  }, {});

  return defineEnv;
}

/**
 * PWA設定を生成
 */
function getPwaConfig(isProd) {
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

/**
 * サーバー設定を生成
 */
function getServerConfig(isDev, isMobile) {
  if (!isDev) return {};

  const port = isMobile ? APP_CONFIG.PORT.MOBILE : APP_CONFIG.PORT.DEFAULT;
  const httpsConfig = getHttpsConfig();

  return {
    https: httpsConfig.enabled ? httpsConfig.config : false,
    headers: {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
    },
    hmr: {
      protocol: httpsConfig.enabled ? 'wss' : 'ws',
      host: 'localhost',
      port,
    },
    cors: true,
    open: !isMobile,
    port,
    host: isMobile ? true : 'localhost',
  };
}

/**
 * HTTPS設定を生成
 */
function getHttpsConfig() {
  const keyPath = path.resolve(__dirname, 'localhost.key');
  const certPath = path.resolve(__dirname, 'localhost.crt');

  try {
    if (fs.existsSync(keyPath) && fs.existsSync(certPath)) {
      return {
        enabled: true,
        config: {
          key: fs.readFileSync(keyPath),
          cert: fs.readFileSync(certPath),
        }
      };
    }
  } catch (error) {
    console.error('SSL証明書の読み込みエラー:', error instanceof Error ? error.message : String(error));
  }

  return { enabled: false, config: {} };
}

/**
 * ビルド設定を生成
 */
function getBuildConfig(isProd) {
  return {
    outDir: APP_CONFIG.OUTPUT_DIR,
    sourcemap: isProd ? 'hidden' : true,
    minify: isProd ? 'terser' : false,
    terserOptions: isProd ? {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info', 'console.debug'],
      },
      format: { comments: false },
    } : undefined,
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react/jsx-runtime'],
          'maps-vendor': ['@googlemaps/js-api-loader', '@react-google-maps/api', '@googlemaps/markerclusterer'],
        },
      },
    },
  };
}

/**
 * エイリアス設定を生成
 */
function getAliases() {
  return {
    '@': path.resolve(__dirname, './src'),
    '@components': path.resolve(__dirname, './src/components'),
    '@hooks': path.resolve(__dirname, './src/hooks'),
    '@utils': path.resolve(__dirname, './src/utils'),
    '@services': path.resolve(__dirname, './src/services'),
    '@constants': path.resolve(__dirname, './src/constants'),
    '@adapters': path.resolve(__dirname, './src/adapters'),
    '@types': path.resolve(__dirname, './src/types'),
    '@contexts': path.resolve(__dirname, './src/contexts'),
    '@images': path.resolve(__dirname, './src/images'),
    '@styles': path.resolve(__dirname, './src/styles'),
    '@locales': path.resolve(__dirname, './src/locales'),
  };
}

// ============================================================================
// メイン設定
// ============================================================================
export default defineConfig(({ mode, command }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const isProd = mode === 'production';
  const isDev = command === 'serve';
  const isMobile = env.VITE_MOBILE === 'true';
  
  try {
    const defineEnv = validateEnv(env);
    const appVersion = process.env.npm_package_version || '0.0.0';
    
    console.log(`🚀 アプリケーションバージョン: ${appVersion} (${mode}モード)`);

    return {
      base: isProd ? APP_CONFIG.BASE_PATH.PROD : APP_CONFIG.BASE_PATH.DEV,
      plugins: [
        react({
          fastRefresh: isDev,
          babel: { plugins: isProd ? ['transform-remove-console'] : [] },
          jsxImportSource: '@emotion/react',
        }),
        tsconfigPaths(),
        VitePWA(getPwaConfig(isProd)),
        isProd && compression({ algorithm: 'gzip', ext: '.gz' }),
        isProd && compression({ algorithm: 'brotliCompress', ext: '.br' }),
      ].filter(Boolean),
      build: getBuildConfig(isProd),
      optimizeDeps: {
        include: ['react', 'react-dom', '@googlemaps/js-api-loader', '@react-google-maps/api'],
        exclude: ['workbox-window', 'virtual:pwa-register'],
      },
      define: {
        ...defineEnv,
        __APP_VERSION__: JSON.stringify(appVersion),
        __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
      },
      server: getServerConfig(isDev, isMobile),
      resolve: { alias: getAliases() },
      css: {
        devSourcemap: true,
        modules: {
          localsConvention: 'camelCaseOnly',
          generateScopedName: isProd ? '[hash:base64:8]' : '[local]_[hash:base64:5]',
        },
      },
    };
  } catch (error) {
    console.error('⛔ 設定エラー:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
});