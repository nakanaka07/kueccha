import { defineConfig, loadEnv, type UserConfig, type PluginOption } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA, type ManifestOptions, type VitePWAOptions } from 'vite-plugin-pwa';
import { resolve } from 'path';
import fs from 'fs';
import { visualizer } from 'rollup-plugin-visualizer';

// 最適化プラグインのインポート
import tsconfigPaths from 'vite-tsconfig-paths';
import checker from 'vite-plugin-checker';
import compression from 'vite-plugin-compression';
import { chunkSplitPlugin } from 'vite-plugin-chunk-split';
import mkcert from 'vite-plugin-mkcert';
import imagemin from 'vite-plugin-imagemin';
import inspect from 'vite-plugin-inspect';

// @utils/loggerを直接importするとESMの循環依存問題が発生するため、
// Vite設定ファイル専用の構造化ロガーを実装
const configLogger = (() => {
  type LogLevel = 'error' | 'warn' | 'info' | 'debug';
  type LogContext = Record<string, unknown>;

  const getPrefix = () => {
    const appName = process.env.VITE_APP_SHORT_NAME || 'App';
    const env = process.env.NODE_ENV || 'development';
    return `[${appName}:${env}]`;
  };

  const shouldLog = (level: LogLevel): boolean => {
    // 本番環境ではwarn, errorのみ出力
    if (process.env.NODE_ENV === 'production') {
      return ['error', 'warn'].includes(level);
    }
    return true;
  };

  // 構造化ログ出力
  const log = (level: LogLevel, message: string, context?: LogContext): void => {
    if (!shouldLog(level)) return;

    const timestamp = new Date().toISOString();
    const prefix = getPrefix();
    const contextStr = context ? ` ${JSON.stringify(context)}` : '';

    // eslint-disable-next-line no-console
    console[level](`${timestamp} ${prefix} ${message}${contextStr}`);
  };

  return {
    error: (message: string, context?: LogContext): void => log('error', message, context),
    warn: (message: string, context?: LogContext): void => log('warn', message, context),
    info: (message: string, context?: LogContext): void => log('info', message, context),
    debug: (message: string, context?: LogContext): void => log('debug', message, context),
  };
})();

/**
 * 依存関係の論理的グループ定義
 * @description コード分割とプリロードの最適化に使用
 */
const dependencies = {
  // Reactコア（基本レンダリング機能）
  react: ['react', 'react-dom', 'react-router-dom'],

  // 地図関連ライブラリ（地図機能に必要なものをグループ化）
  maps: ['@googlemaps/js-api-loader', '@googlemaps/markerclusterer', '@react-google-maps/api'],

  // UIコンポーネント（Material UIとスタイリングライブラリ）
  mui: ['@mui/material', '@mui/icons-material', '@emotion/react', '@emotion/styled'],

  // 状態管理（グローバル状態とストア関連）
  state: ['zustand', 'immer'],

  // ユーティリティ（日時処理、データ操作、APIなど）
  utils: ['dayjs', 'axios', 'lodash-es', 'csv-parse'],

  // ベンダーライブラリ（サードパーティ依存）
  vendor: ['uuid', 'query-string'],

  // データ可視化コンポーネント（遅延ロードに最適）
  charts: ['chart.js', 'react-chartjs-2'],

  // PWA関連の機能（オフラインサポートなど）
  pwa: ['workbox-window', 'workbox-routing', 'workbox-strategies', 'workbox-precaching'],
};

/**
 * ページ単位の動的インポート設定
 * @description ルートベースのコード分割のためのエントリポイント
 */
const pages = {
  // メインページエントリポイント
  main: 'src/main.tsx',
  // 将来的に他のエントリポイントを追加可能
};

/**
 * 型安全な環境変数アクセス
 * @description 環境変数を型安全に取得するユーティリティ
 */
function getEnvVar<T>({
  key,
  defaultValue,
  required = false,
  transform,
}: {
  key: string;
  defaultValue?: T;
  required?: boolean;
  transform?: (value: string) => T;
}): T {
  const value = process.env[key];

  if (value === undefined) {
    if (required) {
      throw new Error(`必須環境変数 "${key}" が未設定です`);
    }
    return defaultValue as T;
  }

  return transform ? transform(value) : (value as unknown as T);
}

/**
 * 真偽値変換関数
 * @description 文字列をブール値に変換
 */
function toBool(value: string): boolean {
  return value.toLowerCase() === 'true';
}

/**
 * 環境変数検証の型定義
 */
type EnvCheck = {
  name: string;
  validator: (value: string) => boolean;
  required: boolean;
  message?: string;
};

/**
 * 環境変数バリデーション
 * @description 必須の環境変数と値の形式を検証
 */
function validateEnv(env: Record<string, string>): void {
  // 検証ルール定義
  const envChecks: EnvCheck[] = [
    {
      name: 'VITE_GOOGLE_API_KEY',
      validator: value => typeof value === 'string' && value.length > 10,
      required: true,
      message: 'Google APIキーが設定されていないか無効です',
    },
    {
      name: 'VITE_GOOGLE_SPREADSHEET_ID',
      validator: value => typeof value === 'string' && value.length > 5,
      required: true,
      message: 'Google SpreadsheetIDが設定されていないか無効です',
    },
    {
      name: 'VITE_APP_NAME',
      validator: value => typeof value === 'string' && value.length > 0,
      required: false,
      message: 'アプリ名が設定されていません',
    },
    {
      name: 'VITE_GOOGLE_MAPS_MAP_ID',
      validator: value => typeof value === 'string',
      required: false,
      message: 'GoogleマップIDが正しい形式ではありません',
    },
    // 必要に応じて検証ルールを追加
  ];

  let isValid = true;
  const errors: string[] = [];
  const warnings: string[] = [];

  // 各環境変数の検証を実行
  envChecks.forEach(check => {
    try {
      const value = env[check.name];

      // 値が未定義の場合
      if (value === undefined) {
        if (check.required) {
          isValid = false;
          errors.push(`必須環境変数 "${check.name}" が未設定です`);
        } else {
          warnings.push(`任意環境変数 "${check.name}" が未設定です`);
        }
        return;
      }

      // 値の形式を検証
      const valid = check.validator(value);
      if (!valid) {
        if (check.required) {
          isValid = false;
          errors.push(check.message || `環境変数 "${check.name}" の値が無効です: ${value}`);
        } else {
          warnings.push(
            check.message || `環境変数 "${check.name}" の値が推奨される形式ではありません: ${value}`
          );
        }
      }
    } catch (error) {
      isValid = false;
      errors.push(`${check.name}: ${(error as Error).message}`);
    }
  });

  // 警告がある場合は出力（エラーではない）
  if (warnings.length > 0) {
    configLogger.warn('環境変数の警告', { warnings });
  }

  // エラーがある場合は処理
  if (!isValid) {
    configLogger.error('環境変数検証エラー', {
      errors,
      environment: env.NODE_ENV || 'development',
      timestamp: new Date().toISOString(),
    });

    // 本番環境では起動を中止
    if (env.NODE_ENV === 'production') {
      throw new Error('環境変数検証に失敗しました。本番環境の起動を中止します。');
    }
  } else {
    configLogger.info('環境変数検証に成功しました', {
      environment: env.NODE_ENV || 'development',
      validatedVars: envChecks.map(check => check.name),
    });
  }
}

/**
 * PWAマニフェスト設定生成
 * @description アプリ情報に基づいたPWAマニフェストを生成
 */
function createPWAManifest(basePath: string): Partial<ManifestOptions> {
  return {
    name: getEnvVar({ key: 'VITE_APP_NAME', defaultValue: 'Sadode Kueccha' }),
    short_name: getEnvVar({ key: 'VITE_APP_SHORT_NAME', defaultValue: 'Kueccha' }),
    description: getEnvVar({
      key: 'VITE_APP_DESCRIPTION',
      defaultValue: 'Sadode Kueccha Application',
    }),
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
}

/**
 * PWAキャッシュ戦略を生成
 * @description オフラインモードの有無に応じた最適なキャッシュ戦略を生成
 */
function createPWACachingStrategy(isOfflineEnabled: boolean) {
  // StrategyName型を明示的に使用して型の互換性を確保
  type StrategyName =
    | 'CacheFirst'
    | 'CacheOnly'
    | 'NetworkFirst'
    | 'NetworkOnly'
    | 'StaleWhileRevalidate';

  return [
    {
      // Google Fontsスタイルシート
      urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
      handler: 'CacheFirst' as StrategyName,
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
      handler: 'CacheFirst' as StrategyName,
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
      handler: (isOfflineEnabled ? 'CacheFirst' : 'StaleWhileRevalidate') as StrategyName,
      options: {
        cacheName: 'google-maps-cache',
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 60 * 60 * 24 * (isOfflineEnabled ? 30 : 7), // オフラインモード時は30日、それ以外は1週間
        },
        cacheableResponse: {
          statuses: [0, 200],
        },
      },
    },
    {
      // Map Tiles
      urlPattern: /^https:\/\/maps\.gstatic\.com\/.*/i,
      handler: 'CacheFirst' as StrategyName,
      options: {
        cacheName: 'google-maps-tiles',
        expiration: {
          maxEntries: 500, // タイル数を増加
          maxAgeSeconds: 60 * 60 * 24 * 30, // 30日
        },
        cacheableResponse: {
          statuses: [0, 200],
        },
      },
    },
    {
      // 位置情報データAPI
      urlPattern: ({ url }: { url: URL }) => url.pathname.startsWith('/api/'),
      handler: (isOfflineEnabled ? 'CacheFirst' : 'NetworkFirst') as StrategyName,
      options: {
        cacheName: 'api-cache',
        expiration: {
          maxEntries: 100,
          maxAgeSeconds: 60 * 60 * (isOfflineEnabled ? 24 * 7 : 24), // オフラインモード時は1週間、それ以外は24時間
        },
        networkTimeoutSeconds: 10,
        cacheableResponse: {
          statuses: [0, 200],
        },
      },
    },
    {
      // CSVデータファイル
      urlPattern: /\.csv$/i,
      handler: 'CacheFirst' as StrategyName,
      options: {
        cacheName: 'csv-data-cache',
        expiration: {
          maxEntries: 20,
          maxAgeSeconds: 60 * 60 * 24 * 7, // 1週間
        },
        cacheableResponse: {
          statuses: [0, 200],
        },
      },
    },
  ];
}

/**
 * PWA設定ファクトリー
 * @description PWA設定を環境に応じて生成
 */
function createPWAConfig(basePath: string): VitePWAOptions {
  // オフラインモードの設定
  const isOfflineEnabled = getEnvVar<boolean>({
    key: 'VITE_ENABLE_OFFLINE_MODE',
    defaultValue: false,
    transform: toBool,
  });

  configLogger.info('PWA設定を生成しています', {
    basePath,
    offlineMode: isOfflineEnabled,
  });

  return {
    registerType: 'autoUpdate',
    includeAssets: ['favicon.ico', 'robots.txt', 'apple-touch-icon.png'],
    manifest: createPWAManifest(basePath),
    devOptions: {
      enabled: true,
      type: 'module',
    },
    workbox: {
      globPatterns: ['**/*.{js,css,html,ico,png,svg,json,woff2}'],
      navigateFallback: 'index.html',
      maximumFileSizeToCacheInBytes: 3 * 1024 * 1024, // 3MB
      // オフラインモードに応じたキャッシュ戦略を適用
      runtimeCaching: createPWACachingStrategy(isOfflineEnabled),
    },
    // VitePWAOptionsに必要なプロパティ
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
      configLogger.error(`HTTPS証明書の読み込みに失敗しました`, {
        error: (error as Error).message,
        component: 'vite-config',
      });
      return undefined;
    }
  }

  return undefined;
}

/**
 * プラグイン設定を生成
 * @description 環境に応じた最適なプラグイン設定を生成
 */
function createPlugins(mode: string, env: Record<string, string>): PluginOption[] {
  const isProd = mode === 'production';
  const plugins: PluginOption[] = [
    // Reactの基本プラグイン
    react(),

    // PWA対応
    VitePWA(createPWAConfig(isProd ? env.BASE_PATH || '/kueccha/' : '/')),

    // TypeScriptパスエイリアスのサポート（tsconfig.jsonとの統合）
    tsconfigPaths(),

    // 開発時のみのプラグイン
    ...(!isProd
      ? [
          // 型チェックの高速化
          checker({
            typescript: true,
            eslint: {
              lintCommand: 'eslint "./src/**/*.{ts,tsx}"',
            },
            overlay: true,
          }),

          // 開発用HTTPSサポート
          mkcert(),

          // Viteプラグインのデバッグ支援
          inspect(),
        ]
      : []),

    // 本番環境のみのプラグイン
    ...(isProd
      ? [
          // コード圧縮
          compression({
            algorithm: 'brotliCompress',
            ext: '.br',
          }),
          compression({
            algorithm: 'gzip',
            ext: '.gz',
          }),

          // 画像最適化
          imagemin({
            gifsicle: {
              optimizationLevel: 3,
              interlaced: false,
            },
            optipng: {
              optimizationLevel: 5,
            },
            mozjpeg: {
              quality: 80,
            },
            pngquant: {
              quality: [0.7, 0.9],
              speed: 4,
            },
            svgo: {
              plugins: [
                {
                  name: 'removeViewBox',
                },
                {
                  name: 'removeEmptyAttrs',
                  active: false,
                },
              ],
            },
          }),

          // チャンクの最適分割
          chunkSplitPlugin({
            strategy: 'default',
            customSplitting: {
              // 依存関係定義を活用した分割戦略
              'react-vendor': dependencies.react,
              'maps-vendor': dependencies.maps,
              'mui-vendor': dependencies.mui,
              'utils-vendor': dependencies.utils,
            },
          }),
        ]
      : []),
  ];

  // バンドル分析を条件付きで追加
  if (process.env.ANALYZE === 'true') {
    configLogger.info('バンドル分析を有効化しています', {
      mode,
      timestamp: new Date().toISOString(),
    });
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

  configLogger.debug(`${plugins.length}個のプラグインを設定しました`, {
    plugins: plugins.map(p => (p as any)?.name || 'unknown').join(', '),
    mode,
  });

  return plugins;
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

  // 設定情報のログ出力
  configLogger.info(`Vite設定を生成しています`, {
    mode,
    isProd,
    component: 'vite-config',
    timestamp: new Date().toISOString(),
  });

  // 環境変数のバリデーション
  validateEnv(env);

  // GitHub PagesのベースパスはCI/CDで動的に設定
  const basePath = isProd ? getEnvVar({ key: 'BASE_PATH', defaultValue: '/kueccha/' }) : '/';

  configLogger.debug(`ベースパス設定`, {
    basePath,
    environment: mode,
    component: 'vite-config',
  });

  // HTTPSオプションの取得
  const httpsOptions = getHttpsOptions(isProd);

  // プラグイン配列を型安全に構築
  const plugins = createPlugins(mode, env);

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
          manualChunks: (id: string) => {
            // 依存関係グループを使用してチャンク分割を最適化
            for (const [groupName, packages] of Object.entries(dependencies)) {
              if (packages.some(pkg => id.includes(`/node_modules/${pkg}/`))) {
                return `vendor-${groupName}`;
              }
            }

            // その他のベンダーライブラリは一般的なベンダーチャンクに含める
            if (id.includes('node_modules')) {
              return 'vendor-common';
            }

            // ページ単位のコード分割（必要に応じて）
            for (const [pageName, entryPath] of Object.entries(pages)) {
              if (id.includes(entryPath)) {
                return `page-${pageName}`;
              }
            }

            // 明示的に割り当てられなかったものはundefinedを返す
            // (デフォルトのチャンク割り当てを使用)
            return undefined;
          },
          entryFileNames: 'assets/[name].[hash].js',
          chunkFileNames: 'assets/[name].[hash].js',
          assetFileNames: 'assets/[name].[hash].[ext]',
        },
      },
    },

    // パス別名 - 最適化されたエイリアス設定
    resolve: {
      alias: {
        '@': resolve(__dirname, './src'),
        '@/assets': resolve(__dirname, './src/assets'),
        '@/components': resolve(__dirname, './src/components'),
        '@/constants': resolve(__dirname, './src/constants'),
        '@/hooks': resolve(__dirname, './src/hooks'),
        '@/types': resolve(__dirname, './src/types'),
        '@/utils': resolve(__dirname, './src/utils'),
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
