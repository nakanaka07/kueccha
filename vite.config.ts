import fs from 'node:fs';
import path from 'node:path';

import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';
import compression from 'vite-plugin-compression';
import { VitePWA } from 'vite-plugin-pwa';
import tsconfigPaths from 'vite-tsconfig-paths';

import type { UserConfig } from 'vite';
import type { VitePWAOptions } from 'vite-plugin-pwa';

// ============================================================================
// 型定義
// ============================================================================

/**
 * 環境モードの定義
 */
enum EnvMode {
  Development = 'development',
  Production = 'production',
  Test = 'test',
  Analyze = 'analyze',
}

/**
 * アプリケーション定数の型定義
 */
interface AppConstants {
  readonly BASE_PATH: Record<string, string>;
  readonly OUTPUT_DIR: string;
  readonly PORT: {
    readonly DEFAULT: number;
    readonly MOBILE: number;
  };
  readonly CACHE_CONTROL: Record<string, string>;
}

/**
 * 環境変数の定義と検証用の型
 */
interface EnvVariables {
  readonly required: readonly string[];
  readonly optional: readonly string[];
}

/**
 * 環境変数の検証結果
 */
interface EnvValidationResult {
  readonly defineEnv: Record<string, string>;
  readonly missingOptional: readonly string[];
}

/**
 * HTTPS設定の型定義
 */
interface HttpsConfig {
  readonly config: Record<string, Buffer> | Record<string, never>;
  readonly hasHttps: boolean;
}

/**
 * サーバー設定の型定義
 */
interface ServerConfig {
  https?: Record<string, Buffer> | boolean;
  headers?: Record<string, string>;
  hmr?: Record<string, unknown>;
  cors?: boolean;
  open?: boolean | string;
  port?: number;
  strictPort?: boolean;
  host?: string | boolean;
  [key: string]: unknown;
}

/**
 * マニュアルチャンクの定義
 */
type ManualChunks = Record<string, string[]>;

// ============================================================================
// 定数定義
// ============================================================================

/**
 * アプリケーション全体で使用される定数
 */
const APP_CONSTANTS: AppConstants = {
  BASE_PATH: {
    PROD: '/kueccha/',
    DEV: '/',
  },
  OUTPUT_DIR: 'dist',
  PORT: {
    DEFAULT: 5173,
    MOBILE: 5174, // モバイルデバイスからのアクセス用
  },
  CACHE_CONTROL: {
    DEV: 'public, max-age=3600',
    PROD: 'public, max-age=31536000, immutable',
    ASSETS: 'public, max-age=31536000, immutable',
    FONTS: 'public, max-age=31536000, immutable',
    HTML: 'public, max-age=0, must-revalidate',
  },
} as const;

/**
 * 環境変数の定義
 */
const ENV_VARS: EnvVariables = {
  required: ['VITE_GOOGLE_MAPS_API_KEY'] as const,
  optional: [
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
  ] as const,
} as const;

/**
 * マニュアルチャンク定義
 */
const MANUAL_CHUNKS: ManualChunks = {
  'react-vendor': ['react', 'react-dom', 'react/jsx-runtime'],
  'maps-vendor': [
    '@googlemaps/js-api-loader',
    '@react-google-maps/api',
    '@googlemaps/markerclusterer',
  ],
  'ui-vendor': ['@emotion/react', '@emotion/styled'],
};

// ============================================================================
// 環境変数処理
// ============================================================================

/**
 * 環境変数の検証と処理
 *
 * @param env - 環境変数オブジェクト
 * @returns 検証結果と処理済み環境変数
 */
function validateEnvVariables(env: Record<string, string>): EnvValidationResult {
  // 必須変数の検証
  const missingRequired = ENV_VARS.required.filter((key) => !env[key]);
  if (missingRequired.length > 0) {
    throw new Error(
      `必須環境変数が設定されていません: ${missingRequired.join(', ')}\n.env ファイルを確認してください。`,
    );
  }

  // 任意変数の検証
  const missingOptional = ENV_VARS.optional.filter((key) => !env[key]);

  // define 用の環境変数オブジェクトを作成
  const allVars = [...ENV_VARS.required, ...ENV_VARS.optional];
  const defineEnv = allVars.reduce<Record<string, string>>((acc, key) => {
    if (env[key]) acc[`process.env.${key}`] = JSON.stringify(env[key]);
    return acc;
  }, {});

  return { defineEnv, missingOptional };
}

// ============================================================================
// サーバー設定
// ============================================================================

/**
 * 開発環境のHTTPS設定を構成
 *
 * @returns HTTPS設定オブジェクト
 */
function configureHttps(): HttpsConfig {
  const keyPath = path.resolve(__dirname, 'localhost.key');
  const certPath = path.resolve(__dirname, 'localhost.crt');

  try {
    if (fs.existsSync(keyPath) && fs.existsSync(certPath)) {
      return {
        config: {
          key: fs.readFileSync(keyPath),
          cert: fs.readFileSync(certPath),
        },
        hasHttps: true,
      };
    }
  } catch (error) {
    console.error(
      'SSL 証明書の読み込み中にエラーが発生しました:',
      error instanceof Error ? error.message : String(error),
    );
  }

  return { config: {}, hasHttps: false };
}

/**
 * 開発サーバーの設定を構成
 *
 * @param isDev - 開発モードかどうか
 * @param isMobile - モバイル開発モードかどうか
 * @returns サーバー設定オブジェクト
 */
function configureServer(isDev: boolean, isMobile = false): ServerConfig {
  if (!isDev) return {};

  const { config: httpsConfig, hasHttps } = configureHttps();
  const httpsEnabled = hasHttps && Object.keys(httpsConfig).length > 0;
  const port = isMobile ? APP_CONSTANTS.PORT.MOBILE : APP_CONSTANTS.PORT.DEFAULT;

  if (httpsEnabled) {
    console.log('✅ HTTPS 設定が有効化されました');
  } else {
    console.log('ℹ️ SSL 証明書が見つからないため HTTP で起動します');
  }

  return {
    https: httpsEnabled ? httpsConfig : false,
    headers: {
      'Cache-Control': APP_CONSTANTS.CACHE_CONTROL.DEV,
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
    },
    hmr: {
      protocol: httpsEnabled ? 'wss' : 'ws',
      host: 'localhost',
      port,
      clientPort: port,
      overlay: true,
      timeout: 5000,
    },
    cors: true,
    open: !isMobile, // モバイル開発モードでは自動でブラウザを開かない
    port,
    strictPort: false,
    host: isMobile ? true : 'localhost', // モバイル開発モードでは全てのネットワークインターフェースをリッスン
  };
}

// ============================================================================
// ビルド設定
// ============================================================================

/**
 * ビルド設定を構成
 *
 * @param mode - 環境モード
 * @returns ビルド設定オブジェクト
 */
function configureBuild(mode: string) {
  const isProd = mode === EnvMode.Production;
  const isAnalyze = mode === EnvMode.Analyze;

  return {
    outDir: APP_CONSTANTS.OUTPUT_DIR,
    sourcemap: isProd ? 'hidden' : true,
    minify: isProd || isAnalyze ? 'terser' : false,
    terserOptions:
      isProd || isAnalyze
        ? {
            compress: {
              drop_console: isProd, // 本番環境でのみconsole.*を削除
              drop_debugger: true,
              pure_funcs: isProd ? ['console.log', 'console.info', 'console.debug'] : [],
            },
            format: {
              comments: false,
            },
            mangle: {
              safari10: true,
            },
          }
        : undefined,
    cssCodeSplit: true,
    cssTarget: ['chrome80', 'safari13', 'firefox78', 'edge80'],
    assetsInlineLimit: 4096,
    reportCompressedSize: isProd || isAnalyze,
    chunkSizeWarningLimit: 1000, // KBでのチャンク警告サイズ制限
    rollupOptions: {
      output: {
        manualChunks: MANUAL_CHUNKS,
        entryFileNames: isProd ? 'assets/[name].[hash].js' : 'assets/[name].js',
        chunkFileNames: isProd ? 'assets/[name].[hash].js' : 'assets/[name].js',
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name || '';
          const extType = info.split('.').at(-1)?.toLowerCase() || '';

          if (/\.(woff2?|ttf|otf)$/i.test(info)) {
            return 'assets/fonts/[name].[hash][extname]';
          }

          if (/\.(png|jpe?g|gif|svg|webp|avif)$/i.test(info)) {
            return 'assets/images/[name].[hash][extname]';
          }

          return 'assets/[name].[hash][extname]';
        },
      },
      onwarn(warning, warn) {
        // ソースマップエラーとcircular dependencyを無視
        if (!['SOURCEMAP_ERROR', 'CIRCULAR_DEPENDENCY'].includes(warning.code || '')) {
          warn(warning);
        }
      },
    },
    target: ['es2020', 'edge80', 'firefox78', 'chrome80', 'safari13'],
  };
}

// ============================================================================
// 依存関係の最適化
// ============================================================================

/**
 * 依存関係の最適化設定
 */
function configureOptimizeDeps() {
  return {
    include: [
      'react',
      'react-dom',
      'react/jsx-runtime',
      '@googlemaps/js-api-loader',
      '@react-google-maps/api',
      '@googlemaps/markerclusterer',
    ],
    exclude: ['workbox-window', 'virtual:pwa-register'],
    esbuildOptions: {
      target: 'es2020',
      sourcemap: true,
      supported: {
        'top-level-await': true,
      },
      logOverride: {
        'this-is-undefined-in-esm': 'silent',
      },
    },
  };
}

// ============================================================================
// PWA設定
// ============================================================================

/**
 * PWA設定を構成
 *
 * @param isProd - 本番モードかどうか
 * @returns PWA設定オブジェクト
 */
function configurePwa(isProd: boolean): VitePWAOptions {
  return {
    registerType: 'autoUpdate',
    includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'],
    manifest: {
      name: '佐渡で食えっちゃ',
      short_name: '佐渡で食えっちゃ',
      description:
        '佐渡島内の飲食店、駐車場、公共トイレの位置情報を網羅。オフラインでも使える観光支援アプリ。',
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
        },
      ],
      categories: ['food', 'travel', 'navigation'],
      screenshots: [
        {
          src: '/screenshots/mobile-screenshot1.webp',
          sizes: '750x1334',
          type: 'image/webp',
          platform: 'narrow',
          label: 'モバイル表示のマップ画面',
        },
      ],
    },
    workbox: {
      // キャッシュ戦略の設定
      runtimeCaching: [
        {
          urlPattern: /^https:\/\/maps\.googleapis\.com\/.*/i,
          handler: 'CacheFirst',
          options: {
            cacheName: 'google-maps',
            expiration: {
              maxEntries: 50,
              maxAgeSeconds: 60 * 60 * 24 * 7, // 1週間
            },
            cacheableResponse: {
              statuses: [0, 200],
            },
          },
        },
        {
          urlPattern: /^https:\/\/sheets\.googleapis\.com\/.*/i,
          handler: 'NetworkFirst',
          options: {
            cacheName: 'google-sheets',
            expiration: {
              maxEntries: 20,
              maxAgeSeconds: 60 * 60 * 24, // 1日
            },
            networkTimeoutSeconds: 10,
          },
        },
        {
          urlPattern: /\.(js|css)$/,
          handler: 'StaleWhileRevalidate',
          options: {
            cacheName: 'static-resources',
            expiration: {
              maxEntries: 100,
              maxAgeSeconds: 60 * 60 * 24 * 30, // 30日
            },
          },
        },
        {
          urlPattern: /\.(png|jpg|jpeg|svg|gif|webp|avif|ico)$/,
          handler: 'CacheFirst',
          options: {
            cacheName: 'images',
            expiration: {
              maxEntries: 150,
              maxAgeSeconds: 60 * 60 * 24 * 30, // 30日
            },
          },
        },
        {
          urlPattern: /\.(woff2?|ttf|otf)$/,
          handler: 'CacheFirst',
          options: {
            cacheName: 'fonts',
            expiration: {
              maxEntries: 10,
              maxAgeSeconds: 60 * 60 * 24 * 365, // 1年
            },
          },
        },
      ],
      navigateFallback: 'index.html',
      navigateFallbackDenylist: [/^\/api/, /\.(json|xml|csv|webmanifest|txt)$/],
      cleanupOutdatedCaches: true,
      globPatterns: ['**/*.{js,css,html,png,jpg,jpeg,gif,svg,ico,webp,woff,woff2,ttf,otf}'],
      maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // 5MB
      debug: !isProd,
    },
    devOptions: {
      enabled: !isProd, // 開発環境でも PWA を有効化
      type: 'module',
      navigateFallback: 'index.html',
    },
    injectRegister: 'auto',
    minify: isProd,
    includeManifestIcons: true,
  };
}

// ============================================================================
// メイン設定
// ============================================================================

export default defineConfig(({ mode, command }): UserConfig => {
  try {
    // 環境変数のロードと検証
    const env = loadEnv(mode, process.cwd(), '');
    const isProd = mode === EnvMode.Production;
    const isDev = command === 'serve';
    const isMobile = env.VITE_MOBILE === 'true'; // モバイル開発モード

    // 環境変数の検証
    const { defineEnv, missingOptional } = validateEnvVariables(env);

    // 任意の環境変数がない場合に詳細情報を表示
    if (missingOptional.length > 0) {
      console.warn('📝 以下の任意環境変数を設定することで追加機能が有効になります:');
      missingOptional.forEach((variable) => {
        console.warn(`  - ${variable}`);
      });
    }

    // バージョン情報の取得
    const appVersion = process.env.npm_package_version || '0.0.0';
    console.log(`🚀 アプリケーションバージョン: ${appVersion} (${mode}モード)`);

    return {
      base: isProd ? APP_CONSTANTS.BASE_PATH.PROD : APP_CONSTANTS.BASE_PATH.DEV,
      plugins: [
        react({
          fastRefresh: isDev,
          babel: {
            plugins: isProd ? ['transform-remove-console'] : [],
          },
          jsxImportSource: '@emotion/react', // Emotion JSX インポートソース
        }),
        tsconfigPaths(),
        // PWAプラグイン (開発環境でも有効に変更)
        VitePWA(configurePwa(isProd)),
        // 圧縮プラグイン (本番環境のみ)
        isProd &&
          compression({
            algorithm: 'gzip',
            ext: '.gz',
            filter: /\.(js|css|html|svg)$/,
            threshold: 10240, // 10KB以上のファイルのみ圧縮
          }),
        isProd &&
          compression({
            algorithm: 'brotliCompress',
            ext: '.br',
            filter: /\.(js|css|html|svg)$/,
            threshold: 10240, // 10KB以上のファイルのみ圧縮
          }),
      ].filter(Boolean),
      build: configureBuild(mode),
      optimizeDeps: configureOptimizeDeps(),
      define: {
        ...defineEnv,
        __APP_VERSION__: JSON.stringify(appVersion),
        __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
      },
      server: configureServer(isDev, isMobile),
      resolve: {
        alias: {
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
        },
      },
      experimental: {
        renderBuiltUrl(filename: string) {
          return isProd ? `${APP_CONSTANTS.BASE_PATH.PROD}${filename}` : `/${filename}`;
        },
      },
      css: {
        devSourcemap: true,
        modules: {
          localsConvention: 'camelCaseOnly',
          generateScopedName: isProd ? '[hash:base64:8]' : '[local]_[hash:base64:5]',
        },
      },
      // モバイルデバイス対応の向上
      preview: {
        port: APP_CONSTANTS.PORT.DEFAULT,
        host: true, // すべてのネットワークインターフェースでリッスン
      },
      // エラーレポーティングの改善
      logLevel: isDev ? 'info' : 'error',
      // 新たに追加：サーバー起動時のログ表示をわかりやすく
      clearScreen: false,
    };
  } catch (error) {
    // エラーハンドリングの強化
    console.error('⛔ 設定エラー:', error instanceof Error ? error.message : String(error));
    console.error('詳細:', error instanceof Error ? error.stack : '');
    process.exit(1);
  }
});
