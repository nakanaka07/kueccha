import { defineConfig, loadEnv, type UserConfig, type PluginOption } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA, type ManifestOptions, type VitePWAOptions } from 'vite-plugin-pwa';
import { resolve } from 'path';
import fs from 'fs';
import { visualizer } from 'rollup-plugin-visualizer';

/**
 * ログユーティリティ - 環境変数を活用した動的プレフィックス対応ロガー
 * @description 環境に応じたログ出力を管理し、プロジェクト名に依存しない実装
 */
const logger = (() => {
  // プロジェクト名を環境変数から動的に取得（変更に強い実装）
  const getPrefix = () => {
    const appName = process.env.VITE_APP_SHORT_NAME || 'App';
    const env = process.env.NODE_ENV || 'development';
    return `[${appName}:${env}]`;
  };

  return {
    warn: (message: string): void => {
      if (process.env.NODE_ENV !== 'production') {
        // eslint-disable-next-line no-console
        console.warn(`${getPrefix()} ${message}`);
      }
    },
    error: (message: string): void => {
      // eslint-disable-next-line no-console
      console.error(`${getPrefix()} ${message}`);
    },
    info: (message: string): void => {
      if (process.env.NODE_ENV !== 'production') {
        // eslint-disable-next-line no-console
        console.info(`${getPrefix()} ${message}`);
      }
    },
  };
})();

/**
 * 依存関係の論理的グループ定義
 * @description コード分割とプリロードの最適化に使用
 */
const dependencies = {
  // Reactコア
  react: ['react', 'react-dom'],
  // 地図関連ライブラリ
  maps: ['@googlemaps/js-api-loader', '@googlemaps/markerclusterer', '@react-google-maps/api'],
  // UIコンポーネント
  ui: ['@mui/material', '@emotion/react', '@emotion/styled'],
  // 共通ユーティリティ
  utils: ['dayjs', 'axios', 'lodash-es', 'zustand'],
};

/**
 * 環境変数バリデーション
 * @description 必須の環境変数が設定されているか確認し、欠落があれば警告
 */
function validateEnv(env: Record<string, string>): void {
  const requiredVars = ['VITE_GOOGLE_API_KEY', 'VITE_GOOGLE_SPREADSHEET_ID'];
  const missingVars = requiredVars.filter(name => !env[name]);

  if (missingVars.length > 0) {
    logger.warn(`次の環境変数が未設定です: ${missingVars.join(', ')}`);
    logger.info('本番環境では、これらの環境変数がGitHub Secretsから自動的に取得されます');
  }
}

/**
 * PWA設定ファクトリー
 * @description PWA設定を環境に応じて生成
 */
function createPWAConfig(basePath: string, env: Record<string, string>): VitePWAOptions {
  const pwaManifest: Partial<ManifestOptions> = {
    name: env.VITE_APP_NAME || 'Sadode Kueccha',
    short_name: env.VITE_APP_SHORT_NAME || 'Kueccha',
    description: env.VITE_APP_DESCRIPTION || 'Sadode Kueccha Application',
    theme_color: '#ffffff',
    background_color: '#ffffff',
    display: 'standalone' as const,
    icons: [
      {
        src: '/android-chrome-192x192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/android-chrome-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any maskable',
      },
    ],
    start_url: basePath,
    scope: basePath,
  };

  return {
    registerType: 'autoUpdate',
    includeAssets: ['favicon.ico', 'robots.txt', 'apple-touch-icon.png'],
    manifest: pwaManifest,
    devOptions: {
      enabled: true,
      type: 'module',
    },
    workbox: {
      globPatterns: ['**/*.{js,css,html,ico,png,svg,json,woff2}'],
      navigateFallback: 'index.html',
      maximumFileSizeToCacheInBytes: 3 * 1024 * 1024, // 3MB
      runtimeCaching: [
        {
          // Google Fontsスタイルシート
          urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
          handler: 'CacheFirst',
          options: {
            cacheName: 'google-fonts-cache',
            expiration: {
              maxEntries: 10,
              maxAgeSeconds: 60 * 60 * 24 * 365, // 1年
            },
            cacheableResponse: {
              statuses: [0, 200],
            },
          },
        },
        {
          // Google Fontsのフォントファイル
          urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
          handler: 'CacheFirst',
          options: {
            cacheName: 'google-fonts-webfonts',
            expiration: {
              maxEntries: 20,
              maxAgeSeconds: 60 * 60 * 24 * 365, // 1年
            },
            cacheableResponse: {
              statuses: [0, 200],
            },
          },
        },
        {
          // Google Maps API
          urlPattern: /^https:\/\/maps\.googleapis\.com\/.*/i,
          handler: 'StaleWhileRevalidate',
          options: {
            cacheName: 'google-maps-cache',
            expiration: {
              maxEntries: 20,
              maxAgeSeconds: 60 * 60 * 24 * 7, // 1週間
            },
            cacheableResponse: {
              statuses: [0, 200],
            },
          },
        },
        {
          // Map Tiles
          urlPattern: /^https:\/\/maps\.gstatic\.com\/.*/i,
          handler: 'CacheFirst',
          options: {
            cacheName: 'google-maps-tiles',
            expiration: {
              maxEntries: 200,
              maxAgeSeconds: 60 * 60 * 24 * 30, // 30日
            },
            cacheableResponse: {
              statuses: [0, 200],
            },
          },
        },
        {
          // 位置情報データAPI
          urlPattern: ({ url }) => url.pathname.startsWith('/api/'),
          handler: 'NetworkFirst',
          options: {
            cacheName: 'api-cache',
            expiration: {
              maxEntries: 50,
              maxAgeSeconds: 60 * 60 * 24, // 24時間
            },
            networkTimeoutSeconds: 10,
            cacheableResponse: {
              statuses: [0, 200],
            },
          },
        },
      ],
    },
    // VitePWAOptionsに必要なプロパティを追加
    injectRegister: 'auto',
    minify: true,
    injectManifest: {}, // 空オブジェクトを設定（必須プロパティのため）
    includeManifestIcons: true,
    disable: false,
  };
}

/**
 * HTTPSオプション取得
 * @description 開発環境用のHTTPS証明書設定を安全に取得
 */
function getHttpsOptions(isProd: boolean): Record<string, any> | undefined {
  const keyPath = '.local/localhost.key';
  const certPath = '.local/localhost.crt';

  if (!isProd && fs.existsSync(keyPath) && fs.existsSync(certPath)) {
    try {
      return {
        key: fs.readFileSync(keyPath),
        cert: fs.readFileSync(certPath),
      };
    } catch (error) {
      logger.error(`HTTPS証明書の読み込みに失敗しました: ${(error as Error).message}`);
      return undefined;
    }
  }

  return undefined;
}

/**
 * 佐渡で食えっちゃアプリ向けVite設定
 * - 環境変数: GitHub Actionsでリポジトリ名から動的にベースパスを生成
 * - PWA対応: オフライン機能とキャッシュ最適化
 * - パフォーマンス: 効率的なコード分割と読み込み最適化
 */
export default defineConfig(({ mode }): UserConfig => {
  // 環境変数ロード - .envファイルまたはGitHub Actionsから注入された変数を取得
  const env = loadEnv(mode, process.cwd(), '');
  const isProd = mode === 'production';

  // 環境変数のバリデーション
  validateEnv(env);

  // GitHub PagesのベースパスはCI/CDで動的に設定
  const basePath = mode === 'development' ? '/' : env.BASE_PATH || '/kueccha/';

  // HTTPSオプションの取得
  const httpsOptions = getHttpsOptions(isProd);

  // プラグイン配列を型安全に構築
  const plugins: PluginOption[] = [react(), VitePWA(createPWAConfig(basePath, env))];

  // 条件付きプラグイン追加
  if (process.env.ANALYZE === 'true') {
    plugins.push(
      visualizer({
        open: true,
        filename: 'dist/stats.html',
        gzipSize: true,
        brotliSize: true,
        template: 'treemap',
      }) as unknown as PluginOption
    );
  }

  // returnキーワードの後に設定オブジェクトを正しく配置（波括弧を同じ行に）
  return {
    base: basePath,
    plugins,

    // 開発サーバー設定
    server: {
      ...(httpsOptions ? { https: httpsOptions } : {}),
      port: 5173,
      hmr: {
        overlay: true,
        clientPort: 5173,
      },
      cors: true,
      watch: {
        usePolling: true,
        interval: 1000,
      },
    },

    // ビルド設定
    build: {
      target: 'esnext',
      outDir: 'dist',
      assetsDir: 'assets',
      sourcemap: !isProd,
      chunkSizeWarningLimit: 1000,
      cssCodeSplit: true,
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: isProd,
          drop_debugger: isProd,
        },
      },
      rollupOptions: {
        output: {
          manualChunks: dependencies,
          entryFileNames: 'assets/[name].[hash].js',
          chunkFileNames: 'assets/[name].[hash].js',
          assetFileNames: 'assets/[name].[hash].[ext]',
        },
      },
    },

    // パス別名 - コード最適化ガイドラインに沿って設定
    resolve: {
      alias: {
        '@/': resolve(__dirname, './src'),
        '@/assets': resolve(__dirname, './src/assets'),
        '@/components': resolve(__dirname, './src/components'),
        '@/constants': resolve(__dirname, './src/constants'),
        '@/hooks': resolve(__dirname, './src/hooks'),
        '@/types': resolve(__dirname, './src/types'),
        '@/utils': resolve(__dirname, './src/utils'),
        '@/App': resolve(__dirname, './src/App'),
      },
    },

    // 型チェックと依存関係の最適化
    optimizeDeps: {
      include: Object.values(dependencies).flat(),
      esbuildOptions: {
        target: 'esnext',
      },
    },

    // CSS設定
    css: {
      modules: {
        localsConvention: 'camelCase',
      },
      preprocessorOptions: {
        scss: {
          // SCSSの正しいパスに修正
          additionalData: '@import "./src/styles/variables.scss";',
        },
      },
    },
  };
});