import { defineConfig, loadEnv, type UserConfig, type PluginOption } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA, type ManifestOptions, type VitePWAOptions } from 'vite-plugin-pwa';
import { resolve } from 'path';
import fs from 'fs';
import { visualizer } from 'rollup-plugin-visualizer';

// 最適化プラグインのインポート
import tsconfigPaths from 'vite-tsconfig-paths';
import checker from 'vite-plugin-checker';
// compression プラグインのインポートを修正
import compression from 'vite-plugin-compression2';
// @ts-ignore - 型エラーを抑制するためのディレクティブ
const viteImagemin = require('vite-plugin-imagemin');
import inspect from 'vite-plugin-inspect';

/**
 * Vite設定専用のロガー
 * @description バンドル設定フェーズで使用するシンプルなロガー（循環依存を防止）
 */
const configLogger = (() => {
  // 標準ロガーと型定義を合わせる
  enum LogLevel {
    ERROR = 'error',
    WARN = 'warn',
    INFO = 'info',
    DEBUG = 'debug',
  }

  // 現在の環境に基づくログレベル判定
  const shouldLog = (level: LogLevel): boolean => {
    if (process.env.NODE_ENV === 'production') {
      return [LogLevel.ERROR, LogLevel.WARN].includes(level);
    }
    return true;
  };

  // ログメッセージのフォーマット
  const formatLogMessage = (
    level: LogLevel,
    message: string,
    context?: Record<string, unknown>
  ): string => {
    const timestamp = new Date().toISOString();
    const prefix = `${timestamp} [vite-config] [${level.toUpperCase()}]`;
    const contextStr = context ? ` ${JSON.stringify(context)}` : '';
    return `${prefix} ${message}${contextStr}`;
  };

  // 基本ロギング関数
  const log = (level: LogLevel, message: string, context?: Record<string, unknown>): void => {
    if (!shouldLog(level)) return;

    const formattedMessage = formatLogMessage(level, message, context);
    switch (level) {
      case LogLevel.ERROR:
        console.error(formattedMessage);
        break;
      case LogLevel.WARN:
        console.warn(formattedMessage);
        break;
      case LogLevel.INFO:
        console.info(formattedMessage);
        break;
      case LogLevel.DEBUG:
        console.debug(formattedMessage);
        break;
    }
  };

  // パフォーマンス測定のユーティリティ
  const measureTime = <T>(
    taskName: string,
    task: () => T,
    context?: Record<string, unknown>
  ): T => {
    const startTime = performance.now();
    const result = task();
    const duration = Math.round(performance.now() - startTime);

    log(LogLevel.DEBUG, `${taskName} completed in ${duration}ms`, {
      ...context,
      durationMs: duration,
      action: 'measure-time',
    });

    return result;
  };

  return {
    error: (message: string, context?: Record<string, unknown>) =>
      log(LogLevel.ERROR, message, context),
    warn: (message: string, context?: Record<string, unknown>) =>
      log(LogLevel.WARN, message, context),
    info: (message: string, context?: Record<string, unknown>) =>
      log(LogLevel.INFO, message, context),
    debug: (message: string, context?: Record<string, unknown>) =>
      log(LogLevel.DEBUG, message, context),
    measureTime,
    LogLevel,
  };
})();

/**
 * 依存関係の論理的グループ定義
 * @description コード分割とプリロードの最適化に使用
 */
const dependencies = {
  // Reactコア（基本レンダリング機能）
  react: ['react', 'react-dom', 'react-router-dom'],
  // 地図関連ライブラリ
  maps: ['@googlemaps/js-api-loader', '@googlemaps/markerclusterer', '@react-google-maps/api'],
  // UIコンポーネント
  mui: ['@mui/material', '@mui/icons-material', '@emotion/react', '@emotion/styled'],
  // 状態管理
  state: ['zustand', 'immer'],
  // ユーティリティ
  utils: ['dayjs', 'axios', 'lodash-es', 'csv-parse'],
  // ベンダーライブラリ
  vendor: ['uuid', 'query-string'],
  // データ可視化コンポーネント
  charts: ['chart.js', 'react-chartjs-2'],
  // PWA関連
  pwa: ['workbox-window', 'workbox-routing', 'workbox-strategies', 'workbox-precaching'],
};

/**
 * ページ単位の動的インポート設定
 */
const pages = {
  main: 'src/main.tsx',
};

/**
 * 環境変数検証の型定義
 */
interface EnvCheck {
  name: string;
  validator: (value: string) => boolean;
  required: boolean;
  message?: string;
}

/**
 * 型安全な環境変数アクセス
 * @description 環境変数管理ガイドラインに準拠した実装
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

  if (value === '') {
    if (required) {
      throw new Error(`必須環境変数 "${key}" が空です`);
    }
    configLogger.warn(`環境変数 "${key}" が空です。デフォルト値を使用します。`);
    return defaultValue as T;
  }

  if (transform) {
    try {
      return transform(value);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      configLogger.error(`環境変数 "${key}" の変換中にエラーが発生しました`, {
        error: errorMessage,
      });
      return defaultValue as T;
    }
  }

  return value as unknown as T;
}

/**
 * 真偽値変換関数
 */
function toBool(value: string): boolean {
  return value.toLowerCase() === 'true';
}

/**
 * 環境変数バリデーション
 * @description 必須の環境変数と値の形式を検証
 */
function validateEnv(env: Record<string, string>): boolean {
  // 検証結果を保存するための変数
  let isValid = true;
  const errors: string[] = [];
  const warnings: string[] = [];

  // APIと認証情報のカテゴリ検証
  function validateApiCredentials(): void {
    const apiChecks: EnvCheck[] = [
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
    ];

    for (const check of apiChecks) {
      validateSingleEnvVar(check, env[check.name]);
    }

    // APIキーのセキュリティ強化（ガイドラインに基づく）
    if (env.VITE_GOOGLE_API_KEY && !env.VITE_GOOGLE_API_KEY_RESTRICTIONS) {
      warnings.push(
        'Google APIキーにHTTPリファラ制限が設定されていない可能性があります。本番環境では必ず制限を設定してください'
      );
    }
  }

  // Googleマップ関連設定の検証
  function validateGoogleMapsSettings(): void {
    const mapChecks: EnvCheck[] = [
      {
        name: 'VITE_GOOGLE_MAPS_MAP_ID',
        // MapIDの検証強化（ガイドラインに基づく）
        validator: value => {
          if (!value) return true; // 未設定の場合は許容（任意項目）
          // 形式検証: 英数字、アンダースコア、ハイフンのみ許可、長さ4-100文字
          return /^[a-zA-Z0-9_-]{4,100}$/.test(value);
        },
        required: false,
        message:
          'GoogleマップIDが正しい形式ではありません（英数字、アンダースコア、ハイフンのみ使用可能）',
      },
      // WebGLレンダリングサポートに関連する設定
      {
        name: 'VITE_GOOGLE_MAPS_WEBGL',
        validator: value => ['true', 'false', ''].includes(value.toLowerCase()),
        required: false,
        message: 'Google Maps WebGLサポート設定が無効です。"true"または"false"を指定してください',
      },
    ];

    for (const check of mapChecks) {
      validateSingleEnvVar(check, env[check.name]);
    }

    // MapIDとWebGL設定の整合性チェック
    const mapId = env.VITE_GOOGLE_MAPS_MAP_ID;
    const webGLEnabled = env.VITE_GOOGLE_MAPS_WEBGL?.toLowerCase() === 'true';

    if (mapId && !webGLEnabled) {
      warnings.push(
        'MapIDが設定されていますが、WebGLレンダリングが無効化されています。最適なパフォーマンスのためにWebGLを有効にすることを推奨します'
      );
    }
  }

  // アプリケーション設定の検証
  function validateAppSettings(): void {
    const appChecks: EnvCheck[] = [
      {
        name: 'VITE_APP_NAME',
        validator: value => typeof value === 'string' && value.length > 0,
        required: false,
        message: 'アプリ名が設定されていません',
      },
      {
        name: 'VITE_APP_SHORT_NAME',
        validator: value => typeof value === 'string' && value.length > 0,
        required: false,
        message: 'アプリ短縮名が設定されていません',
      },
    ];

    for (const check of appChecks) {
      validateSingleEnvVar(check, env[check.name]);
    }
  }

  // 単一の環境変数を検証する共通ロジック
  function validateSingleEnvVar(check: EnvCheck, value: string | undefined): void {
    try {
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
  }

  // カテゴリごとの検証実行
  validateApiCredentials();
  validateGoogleMapsSettings();
  validateAppSettings();

  // 警告がある場合は出力
  if (warnings.length > 0) {
    configLogger.warn('環境変数の警告', {
      warnings,
      component: 'EnvValidator',
      action: 'validate_env_warnings',
    });
  }

  // エラーがある場合は処理
  if (!isValid) {
    configLogger.error('環境変数検証エラー', {
      errors,
      environment: env.NODE_ENV || 'development',
      component: 'EnvValidator',
      action: 'validate_env_errors',
      timestamp: new Date().toISOString(),
    });

    // 本番環境では起動を中止
    if (env.NODE_ENV === 'production') {
      throw new Error('環境変数検証に失敗しました。本番環境の起動を中止します。');
    }
  } else {
    configLogger.info('環境変数検証に成功しました', {
      environment: env.NODE_ENV || 'development',
      component: 'EnvValidator',
      action: 'validate_env_success',
    });
  }

  return isValid;
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
 * Google Maps APIのキャッシュ戦略を生成
 * @description Google Maps統合ガイドラインに準拠したキャッシング戦略
 */
function createGoogleMapsCachingStrategy(isOfflineEnabled: boolean) {
  // StrategyName型を明示的に使用して型の互換性を確保
  type StrategyName =
    | 'CacheFirst'
    | 'CacheOnly'
    | 'NetworkFirst'
    | 'NetworkOnly'
    | 'StaleWhileRevalidate';

  // Google Maps統合ガイドラインに基づくキャッシュ設定
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
      // Map Tiles - ガイドラインP580に基づく最適化
      urlPattern: /^https:\/\/maps\.gstatic\.com\/.*/i,
      handler: 'CacheFirst' as StrategyName,
      options: {
        cacheName: 'google-maps-tiles',
        expiration: {
          maxEntries: 1000, // ガイドライン推奨値：より多くのタイルをキャッシュ
          maxAgeSeconds: 60 * 60 * 24 * 14, // 2週間（P580推奨値）
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
      runtimeCaching: createGoogleMapsCachingStrategy(isOfflineEnabled),
    },
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

    // TypeScriptパスエイリアスのサポート
    tsconfigPaths(),
  ];

  // 開発時のみのプラグイン
  if (!isProd) {
    plugins.push(
      // 型チェックの高速化
      checker({
        typescript: true,
        eslint: {
          lintCommand: 'eslint "./src/**/*.{ts,tsx}"',
        },
        overlay: true,
      }),
      // Viteプラグインのデバッグ支援
      inspect()
    );
  }

  // 本番環境のみのプラグイン
  if (isProd) {
    // vite-plugin-compression2を使用してファイル圧縮
    try {
      plugins.push(
        // Brotli圧縮
        compression({
          algorithm: 'brotliCompress',
          filename: '[path][base].br',
          deleteOriginalAssets: false, // 元のファイルを保持
          threshold: 10240, // 10KB以上のファイルのみ圧縮
          compressionOptions: {
            params: {
              [require('zlib').constants.BROTLI_PARAM_QUALITY]: 11,
            },
          },
        }),
        // Gzip圧縮
        compression({
          algorithm: 'gzip',
          filename: '[path][base].gz',
          deleteOriginalAssets: false, // 元のファイルを保持
          threshold: 10240, // 10KB以上のファイルのみ圧縮
        })
      );
      configLogger.info('圧縮プラグインを設定しました（BrotliとGzip）', {
        component: 'vite-config',
        plugin: 'compression2',
      });
    } catch (error) {
      configLogger.error('vite-plugin-compression2プラグインの設定中にエラーが発生しました', {
        error: error instanceof Error ? error.message : String(error),
        component: 'vite-config',
      });
    }

    // 画像最適化プラグインの呼び出し
    if (typeof viteImagemin === 'function') {
      plugins.push(
        viteImagemin({
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
        })
      );
    } else if (viteImagemin && typeof viteImagemin.default === 'function') {
      plugins.push(
        viteImagemin.default({
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
        })
      );
    } else {
      configLogger.warn('vite-plugin-imageminプラグインが正しくロードできませんでした');
    }
  }

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
  // 環境変数ロード
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
  });

  // HTTPSオプションの取得
  const httpsOptions = getHttpsOptions(isProd);

  // プラグイン配列を構築
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

            // その他のベンダーライブラリ
            if (id.includes('node_modules')) {
              return 'vendor-common';
            }

            // ページ単位のコード分割
            for (const [pageName, entryPath] of Object.entries(pages)) {
              if (id.includes(entryPath)) {
                return `page-${pageName}`;
              }
            }

            return undefined;
          },
          entryFileNames: 'assets/[name].[hash].js',
          chunkFileNames: 'assets/[name].[hash].js',
          assetFileNames: 'assets/[name].[hash].[ext]',
        },
      },
    },

    // パス別名
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

    // 依存関係の最適化
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
          additionalData: '@import "./src/styles/variables.scss";',
        },
      },
    },
  };
});
