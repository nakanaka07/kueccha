import fs from 'node:fs';
import path from 'node:path';

import react from '@vitejs/plugin-react';
import type { UserConfig } from 'vite';
import { defineConfig, loadEnv } from 'vite';
import compression from 'vite-plugin-compression';
import { VitePWA } from 'vite-plugin-pwa';
import tsconfigPaths from 'vite-tsconfig-paths';

// PWA設定とロガーをインポート
import { getPwaConfig } from './src/config/pwa.config';
import { logError, logInfo, logWarning } from './src/utils/logger';

// ============================================================================
// 型と定数 - GitHub Pages対応に最適化
// ============================================================================

/**
 * アプリケーション設定の型定義
 */
interface AppConfig {
  /** ベースパス設定（本番/開発） */
  BASE_PATH: { PROD: string; DEV: string };
  /** ビルド出力ディレクトリ */
  OUTPUT_DIR: string;
  /** サーバーポート設定 */
  PORT: { DEFAULT: number; MOBILE: number };
  /** 必須環境変数リスト */
  REQUIRED_ENV: string[];
  /** 任意環境変数リスト */
  OPTIONAL_ENV: string[];
  /** 環境変数のデフォルト値 */
  ENV_DEFAULTS: Record<string, string>;
}

/**
 * アプリケーション設定 - GitHub Pages用に最適化
 */
const APP_CONFIG: AppConfig = {
  BASE_PATH: { PROD: '/kueccha/', DEV: '/' },
  OUTPUT_DIR: 'dist',
  PORT: { DEFAULT: 5173, MOBILE: 5174 },
  REQUIRED_ENV: ['VITE_GOOGLE_API_KEY'], 
  OPTIONAL_ENV: [
    'VITE_GOOGLE_MAPS_MAP_ID',
    'VITE_GOOGLE_SPREADSHEET_ID',
    'VITE_EMAILJS_SERVICE_ID',
    'VITE_EMAILJS_TEMPLATE_ID',
    'VITE_EMAILJS_PUBLIC_KEY',
    'VITE_DEFAULT_ZOOM',
    'VITE_DEFAULT_CENTER_LAT',
    'VITE_DEFAULT_CENTER_LNG',
    'VITE_APP_TITLE',
  ],
  ENV_DEFAULTS: {
    VITE_DEFAULT_ZOOM: '12',
    VITE_DEFAULT_CENTER_LAT: '38.0503',
    VITE_DEFAULT_CENTER_LNG: '138.3716',
    VITE_APP_TITLE: '佐渡で食えっちゃ',
  },
};

// ============================================================================
// 環境変数管理 - GitHub Pages CI/CD対応
// ============================================================================

/**
 * 環境変数の検証と処理
 * @param env 環境変数オブジェクト
 * @returns 処理済み環境変数
 * @throws 必須環境変数が不足している場合にエラーをスロー
 */
function validateEnv(env: Record<string, string | undefined>): Record<string, string> {
  // GitHub ActionsからのBASE_PATH環境変数を優先
  if (env.BASE_PATH) {
    APP_CONFIG.BASE_PATH.PROD = env.BASE_PATH;
    logInfo('CONFIG', 'BASE_PATH', `ベースパスを環境変数から設定: ${env.BASE_PATH}`);
  }

  // 必須環境変数のチェック
  const missingRequired = APP_CONFIG.REQUIRED_ENV.filter((key) => !env[key]);
  if (missingRequired.length > 0) {
    throw new Error(
      `必須環境変数が設定されていません: ${missingRequired.join(', ')}\n` +
        `.env.exampleを確認し、開発環境では.envファイルに、本番環境ではGitHub Secretsに設定してください。`,
    );
  }

  // デフォルト値の適用
  Object.entries(APP_CONFIG.ENV_DEFAULTS).forEach(([key, defaultValue]) => {
    if (!env[key]) {
      logInfo(
        'CONFIG',
        'ENV_DEFAULT',
        `環境変数 ${key} にデフォルト値「${defaultValue}」を適用しました`,
      );
      env[key] = defaultValue;
    }
  });

  // Viteのdefine用に環境変数を整形
  return [...APP_CONFIG.REQUIRED_ENV, ...APP_CONFIG.OPTIONAL_ENV].reduce(
    (acc, key) => {
      if (env[key]) acc[`process.env.${key}`] = JSON.stringify(env[key]);
      return acc;
    },
    {} as Record<string, string>,
  );
}

// ============================================================================
// サーバー設定 - 開発効率化
// ============================================================================

/**
 * サーバー設定を生成（ローカル開発用）
 * @param isDev 開発モードかどうか
 * @param isMobile モバイル開発モードかどうか
 * @returns サーバー設定オブジェクト
 */
function getServerConfig(isDev: boolean, isMobile: boolean) {
  if (!isDev) return {};

  const port = isMobile ? APP_CONFIG.PORT.MOBILE : APP_CONFIG.PORT.DEFAULT;

  return {
    cors: true,
    open: !isMobile,
    port,
    host: isMobile ? true : 'localhost',
    // HTTPS設定（ローカル開発用SSL証明書が存在する場合）
    https: fs.existsSync('./localhost.key') && fs.existsSync('./localhost.crt')
      ? {
          key: fs.readFileSync('./localhost.key'),
          cert: fs.readFileSync('./localhost.crt'),
        }
      : undefined,
  };
}

// ============================================================================
// ビルド設定 - GitHub Pages最適化
// ============================================================================

/**
 * ビルド設定を生成
 * @param isProd 本番モードかどうか
 * @returns ビルド設定オブジェクト
 */
function getBuildConfig(isProd: boolean) {
  return {
    outDir: APP_CONFIG.OUTPUT_DIR,
    sourcemap: isProd ? 'hidden' : true,
    minify: isProd ? 'terser' : false,
    terserOptions: isProd
      ? {
          compress: {
            drop_console: true,
            drop_debugger: true,
            pure_funcs: ['console.log', 'console.debug'],
          },
          format: { comments: false },
        }
      : undefined,
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react/jsx-runtime'],
          'maps-vendor': [
            '@googlemaps/js-api-loader',
            '@react-google-maps/api',
            '@googlemaps/markerclusterer',
          ],
          'ui-vendor': ['@emotion/react', '@emotion/styled'],
          'data-vendor': ['lodash', 'date-fns'],
        },
        // GitHub Pages向けにアセットのファイル名パターンを最適化
        assetFileNames: (assetInfo) => {
          const extType = assetInfo.name?.split('.').at(1);
          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(extType || '')) {
            return 'assets/images/[name]-[hash][extname]';
          }
          if (/woff|woff2|eot|ttf|otf/i.test(extType || '')) {
            return 'assets/fonts/[name]-[hash][extname]';
          }
          return 'assets/[name]-[hash][extname]';
        },
        // GitHub Pages向けにチャンクの命名パターンを最適化
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
      },
    },
    // GitHub Pagesでのキャッシュ最適化
    reportCompressedSize: isProd,
    chunkSizeWarningLimit: 1000,
    // GitHub Actions経由でビルドする場合の最適化設定
    emptyOutDir: true,
  };
}

/**
 * エイリアス設定を生成
 * @returns パスエイリアス設定オブジェクト
 */
function getAliases() {
  // src直下のディレクトリを自動検出
  const srcBasePath = path.resolve(__dirname, './src');
  const baseDirectories = [
    'components',
    'hooks',
    'utils',
    'services',
    'constants',
    'adapters',
    'types',
    'contexts',
    'images',
    'styles',
    'config',
  ];

  try {
    // srcディレクトリの存在を確認
    if (fs.existsSync(srcBasePath)) {
      // 静的リストに加えて、自動的にディレクトリを検出
      const autoDetectedDirs = fs
        .readdirSync(srcBasePath, { withFileTypes: true })
        .filter((dirent) => dirent.isDirectory())
        .map((dirent) => dirent.name)
        .filter((name) => !name.startsWith('.') && !baseDirectories.includes(name));

      // 重複を除去して結合
      const allDirectories = [...new Set([...baseDirectories, ...autoDetectedDirs])];

      // 基本エイリアス設定
      const aliases: Record<string, string> = {
        '@': srcBasePath,
      };

      // ディレクトリベースのエイリアスを追加
      allDirectories.forEach((dir) => {
        const dirPath = path.resolve(srcBasePath, dir);
        if (fs.existsSync(dirPath)) {
          aliases[`@${dir}`] = dirPath;
        }
      });

      return aliases;
    }
  } catch (error) {
    logError('CONFIG', 'ALIAS_ERROR', 'エイリアス設定の生成中にエラーが発生しました', error);
  }

  // エラー時やsrcディレクトリが存在しない場合は基本設定のみ返す
  return { '@': srcBasePath };
}

/**
 * 圧縮プラグインの生成 - GitHub Pages向け最適化
 * @param isProd 本番モードかどうか
 * @returns 圧縮プラグインの配列
 */
function getCompressionPlugins(isProd: boolean) {
  if (!isProd) return [];

  // GitHub Pages向けに両方のアルゴリズムでプリコンプレッション
  return [
    compression({ algorithm: 'gzip', ext: '.gz' }),
    compression({ algorithm: 'brotliCompress', ext: '.br' }),
  ];
}

// ============================================================================
// メイン設定 - GitHub Pages対応
// ============================================================================

export default defineConfig(({ mode, command }): UserConfig => {
  try {
    const env = loadEnv(mode, process.cwd(), '');
    const isProd = mode === 'production';
    const isDev = command === 'serve';
    const isMobile = env.VITE_MOBILE === 'true';

    // 環境変数の検証
    const defineEnv = validateEnv(env);
    const appVersion = process.env.npm_package_version || '0.0.0';
    const buildTime = new Date().toISOString();

    logInfo('CONFIG', 'APP_VERSION', `アプリケーションバージョン: ${appVersion} (${mode}モード)`);
    logInfo('CONFIG', 'BUILD_TIME', `ビルド時刻: ${buildTime}`);

    // モバイルモードのログ
    if (isMobile) {
      logInfo('CONFIG', 'MOBILE_MODE', 'モバイル開発モードが有効です');
    }

    const basePath = isProd ? APP_CONFIG.BASE_PATH.PROD : APP_CONFIG.BASE_PATH.DEV;
    logInfo('CONFIG', 'BASE_PATH', `ベースパス: ${basePath}`);

    return {
      base: basePath,
      plugins: [
        react({
          fastRefresh: isDev,
          babel: { plugins: isProd ? ['transform-remove-console'] : [] },
          jsxImportSource: '@emotion/react',
        }),
        tsconfigPaths(),
        VitePWA(getPwaConfig(isProd, basePath)), // basePath引数を追加
        ...getCompressionPlugins(isProd),
      ],
      build: getBuildConfig(isProd),
      optimizeDeps: {
        include: ['react', 'react-dom', '@googlemaps/js-api-loader', '@react-google-maps/api'],
        exclude: ['workbox-window', 'virtual:pwa-register'],
      },
      define: {
        ...defineEnv,
        __APP_VERSION__: JSON.stringify(appVersion),
        __BUILD_TIME__: JSON.stringify(buildTime),
        __DEV__: !isProd,
        __BASE_PATH__: JSON.stringify(basePath),
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
      // エラーハンドリングと警告設定
      logLevel: isProd ? 'error' : 'info',
      clearScreen: false,
      // ビルド後処理のガイダンス
      esbuild: {
        legalComments: isProd ? 'none' : 'eof',
        drop: isProd ? ['console', 'debugger'] : [],
      },
    };
  } catch (error) {
    // より構造化されたエラーログ
    logError('CONFIG', 'FATAL_ERROR', '設定処理中に致命的なエラーが発生しました', error);
    console.error(`スタックトレース: ${(error as Error).stack}`);
    process.exit(1);
  }
});

// app.config.ts用にエクスポート (scripts/optimize-assets.tsなどで使用)
export { APP_CONFIG };