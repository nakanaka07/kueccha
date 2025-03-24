import { defineConfig, loadEnv, type UserConfig, type PluginOption } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA, type ManifestOptions } from 'vite-plugin-pwa';
import { resolve } from 'path';
import fs from 'fs';
import { visualizer } from 'rollup-plugin-visualizer';

/**
 * 環境変数バリデーション
 * 必須の環境変数が設定されているか確認
 */
function validateEnv(env: Record<string, string>): void {
  // 環境変数名を.env.exampleに合わせる
  const requiredVars = ['VITE_GOOGLE_API_KEY', 'VITE_GOOGLE_SPREADSHEET_ID'];
  const missingVars = requiredVars.filter(name => !env[name]);
  
  if (missingVars.length > 0) {
    console.warn(`警告: 次の環境変数が未設定です: ${missingVars.join(', ')}`);
    console.warn('本番環境では、これらの環境変数がGitHub Secretsから自動的に取得されます');
  }
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
  // GitHub Actions: リポジトリ名から自動生成 (deploy-vite-app.yml参照)
  const basePath = mode === 'development' ? '/' : (env.BASE_PATH || '/kueccha/');

  /**
   * 依存関係の定義 - コード分割とプリロードに使用
   */
  const dependencies = {
    // Reactコア
    react: ['react', 'react-dom'],
    // 地図関連ライブラリ
    maps: [
      '@googlemaps/js-api-loader',
      '@googlemaps/markerclusterer',
      '@react-google-maps/api',
    ],
    // UIコンポーネント
    ui: ['@mui/material', '@emotion/react', '@emotion/styled'],
    // 共通ユーティリティ
    utils: ['dayjs', 'axios', 'lodash-es', 'zustand'],
  };

  /**
   * PWAマニフェスト設定
   */
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

  // 開発サーバー用HTTPS証明書 - 本番デプロイには影響なし
  const httpsOptions = !isProd
    ? {
        key: fs.existsSync('.local/localhost.key') ? fs.readFileSync('.local/localhost.key') : undefined,
        cert: fs.existsSync('.local/localhost.crt') ? fs.readFileSync('.local/localhost.crt') : undefined,
      }
    : undefined;

  // プラグイン配列を型安全に構築
  const plugins: PluginOption[] = [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'robots.txt', 'apple-touch-icon.png'],
      manifest: pwaManifest,
      devOptions: {
        // 開発環境でもPWA機能をテスト可能に
        enabled: true,
        type: 'module',
      },
      workbox: {
        // 静的リソースのキャッシュパターン拡張
        globPatterns: ['**/*.{js,css,html,ico,png,svg,json,woff2}'],
        // ナビゲーションリクエストをキャッシュ
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
    }),
  ];

  // 条件付きプラグイン追加
  if (process.env.ANALYZE === 'true') {
    plugins.push(visualizer({ open: true }) as PluginOption);
  }

  return {
    base: basePath,

    plugins,

    // 開発サーバー設定 - GitHub Pagesデプロイには影響しない
    server: {
      https: httpsOptions,
      port: 5173,
      hmr: {
        overlay: true,
        // Windows で WSL2 を使用する場合のための設定
        clientPort: 5173,
      },
      // クロスオリジンの問題を防ぐ
      cors: true,
      // ホットリロードが効かない場合のフォールバック
      watch: {
        usePolling: true,
        interval: 1000,
      },
    },

    build: {
      target: 'esnext',
      outDir: 'dist',
      assetsDir: 'assets',
      // ソースマップ設定（開発環境のみ有効化するよう最適化）
      sourcemap: !isProd,
      // チャンクサイズ警告の閾値
      chunkSizeWarningLimit: 1000,
      // CSSの最適化
      cssCodeSplit: true,
      // HTML圧縮設定
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: isProd,
          drop_debugger: isProd,
        },
      },
      rollupOptions: {
        output: {
          // コードの論理的なグループごとにチャンク分割 - dependencies変数から取得
          manualChunks: dependencies,
          // アセットのファイル名パターン（キャッシュバスティング）
          entryFileNames: 'assets/[name].[hash].js',
          chunkFileNames: 'assets/[name].[hash].js',
          assetFileNames: 'assets/[name].[hash].[ext]',
        },
      },
    },

    // パス別名 - インポート簡略化
    resolve: {
      alias: {
        '@': resolve(__dirname, './src'),
        '@assets': resolve(__dirname, './src/assets'),
        '@components': resolve(__dirname, './src/components'),
        '@constants': resolve(__dirname, './src/constants'),
        '@hooks': resolve(__dirname, './src/hooks'),
        '@types': resolve(__dirname, './src/types'),
        '@utils': resolve(__dirname, './src/utils'),
      },
    },

    // 型チェックの最適化
    optimizeDeps: {
      // ビルド時に事前にバンドルする依存関係 - dependenciesオブジェクトから平坦化して取得
      include: Object.values(dependencies).flat(),
      // 動的インポートの最適化
      esbuildOptions: {
        target: 'esnext',
      },
    },
    
    css: {
      // CSSモジュールのサポートを有効化
      modules: {
        localsConvention: 'camelCase',
      },
      // CSSプリプロセッサーのオプション
      preprocessorOptions: {
        // 必要に応じてSassやLessなどのオプションを追加
      },
    },
  };
});