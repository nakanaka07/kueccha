/* eslint-disable security/detect-object-injection */
import fs from 'node:fs';
import path from 'node:path';

import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv, type UserConfig, type BuildOptions, type ServerOptions } from 'vite';
import compression from 'vite-plugin-compression';
import { VitePWA } from 'vite-plugin-pwa';
import tsconfigPaths from 'vite-tsconfig-paths';

// PWA設定とロガーをインポート
import { getPwaConfig } from './src/config/pwa.config';
import { logError, logInfo, type LogCode } from './src/utils/logger';

// ============================================================================
// 型と定数 - GitHub Pages対応に最適化
// ============================================================================

// 独自ログコード（LogCode型拡張用）
const CONFIG_LOG_CODES = {
  CONFIG_UPDATE: 'ENV_DEFAULT' as LogCode,
  CONFIG_ERROR: 'ENV_ERROR' as LogCode,
  CONFIG_INFO: 'ENV_CHECK' as LogCode,
} as const;

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
  REQUIRED_ENV: readonly string[];
  /** 任意環境変数リスト */
  OPTIONAL_ENV: readonly string[];
  /** 環境変数のデフォルト値 */
  ENV_DEFAULTS: Readonly<Record<string, string>>;
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
  if ('BASE_PATH' in env && env.BASE_PATH) {
    APP_CONFIG.BASE_PATH.PROD = env.BASE_PATH;
    logInfo('CONFIG', CONFIG_LOG_CODES.CONFIG_UPDATE, `ベースパスを環境変数から設定: ${env.BASE_PATH}`);
  }

  // 必須環境変数のチェック - セキュリティ向上
  const missingRequired = APP_CONFIG.REQUIRED_ENV.filter((key) => {
    // 安全なプロパティ確認（Object.prototype.hasOwnProperty.call を使用）
    if (!Object.prototype.hasOwnProperty.call(env, key)) {
      return true;
    }
    // 存在を確認後に安全にアクセス
    const value = env[key];
    return value === undefined;
  });
  
  if (missingRequired.length > 0) {
    throw new Error(
      `必須環境変数が設定されていません: ${missingRequired.join(', ')}\n` +
        `.env.exampleを確認し、開発環境では.envファイルに、本番環境ではGitHub Secretsに設定してください。`,
    );
  }

  // デフォルト値の適用 - セキュアなアプローチ
  const processedEnv = { ...env };
  
  // 安全なデフォルト値適用 - ホワイトリストベースのアクセス
  APP_CONFIG.OPTIONAL_ENV.forEach((key) => {
    const hasDefault = Object.prototype.hasOwnProperty.call(APP_CONFIG.ENV_DEFAULTS, key);
    const hasEnvValue = Object.prototype.hasOwnProperty.call(processedEnv, key);
    
    // 安全なアクセス - 存在確認後のみ値を取得
    const defaultValue = hasDefault ? APP_CONFIG.ENV_DEFAULTS[key] : undefined;
    const currentValue = hasEnvValue ? processedEnv[key] : undefined;
    
    if (defaultValue && !currentValue && hasEnvValue) {
      // 安全なプロパティ代入
      processedEnv[key] = defaultValue;
      logInfo(
        'CONFIG',
        CONFIG_LOG_CODES.CONFIG_UPDATE,
        `環境変数 ${key} にデフォルト値「${defaultValue}」を適用しました`,
      );
    }
  });

  // Viteのdefine用に環境変数を整形 - セキュアな方法
  const defineEnv: Record<string, string> = {};
  
  // 許可された環境変数のみを処理（型安全な方法）
  [...APP_CONFIG.REQUIRED_ENV, ...APP_CONFIG.OPTIONAL_ENV].forEach((key) => {
    if (Object.prototype.hasOwnProperty.call(processedEnv, key)) {
      // 存在確認後に安全にアクセス
      const value = processedEnv[key];
      if (value) {
        defineEnv[`process.env.${key}`] = JSON.stringify(value);
      }
    }
  });

  return defineEnv;
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
function getServerConfig(isDev: boolean, isMobile: boolean): ServerOptions {
  if (!isDev) return {};

  const port = isMobile ? APP_CONFIG.PORT.MOBILE : APP_CONFIG.PORT.DEFAULT;
  
  // 基本設定を作成 - セキュリティ対応済み
  const serverConfig: ServerOptions = {
    cors: true,
    open: !isMobile,
    port,
    host: isMobile ? true : 'localhost',
  };

  // HTTPS設定（ローカル開発用SSL証明書が存在する場合）
  try {
    const keyPath = './localhost.key';
    const certPath = './localhost.crt';
    
    if (fs.existsSync(keyPath) && fs.existsSync(certPath)) {
      // 型安全な設定
      serverConfig.https = {
        key: fs.readFileSync(keyPath),
        cert: fs.readFileSync(certPath),
      };
      logInfo(
        'CONFIG',
        CONFIG_LOG_CODES.CONFIG_INFO,
        'ローカル開発用HTTPSが有効化されました'
      );
    }
  } catch (error) {
    // エラー耐性の向上
    logError(
      'CONFIG',
      CONFIG_LOG_CODES.CONFIG_ERROR,
      'HTTPS設定の読み込みに失敗しました',
      error
    );
  }

  return serverConfig;
}

// ============================================================================
// ビルド設定 - GitHub Pages最適化
// ============================================================================

// 静的アセットタイプ定義
type AssetType = 'image' | 'font' | 'other';

/**
 * アセットタイプを判定する関数
 * @param extension ファイル拡張子
 * @returns アセットタイプ
 */
function getAssetType(extension: string): AssetType {
  if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(extension)) {
    return 'image';
  }
  if (/woff|woff2|eot|ttf|otf/i.test(extension)) {
    return 'font';
  }
  return 'other';
}

/**
 * ビルド設定を生成
 * @param isProd 本番モードかどうか
 * @returns ビルド設定オブジェクト
 */
function getBuildConfig(isProd: boolean): BuildOptions {
  // 基本設定を作成
  const buildConfig: BuildOptions = {
    outDir: APP_CONFIG.OUTPUT_DIR,
    sourcemap: isProd ? 'hidden' : true,
    minify: isProd ? 'terser' : false,
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
          // アセット情報がない場合のデフォルト値を設定
          const fileName = assetInfo.name ?? '';
          const extension = fileName.split('.').pop() ?? '';
          const assetType = getAssetType(extension);
          
          switch (assetType) {
            case 'image':
              return 'assets/images/[name]-[hash][extname]';
            case 'font':
              return 'assets/fonts/[name]-[hash][extname]';
            default:
              return 'assets/[name]-[hash][extname]';
          }
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

  // 本番環境のみterserOptionsを追加
  if (isProd) {
    buildConfig.terserOptions = {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.debug'],
      },
      format: { comments: false },
    };
  }

  return buildConfig;
}

/**
 * エイリアス設定を生成
 * @returns パスエイリアス設定オブジェクト
 */
function getAliases(): Record<string, string> {
  // src直下のディレクトリを自動検出
  const srcBasePath = path.resolve(__dirname, './src');
  
  // 標準ディレクトリのセット（読み取り専用）
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
  ] as const;

  // 基本エイリアス設定
  const aliases: Record<string, string> = {
    '@': srcBasePath,
  };

  try {
    // srcディレクトリの存在を確認
    if (fs.existsSync(srcBasePath)) {
      // 安全なディレクトリ走査
      const dirents = fs.readdirSync(srcBasePath, { withFileTypes: true });
      
      // 有効なディレクトリのみをフィルタリング
      const autoDetectedDirs = dirents
        .filter((dirent) => dirent.isDirectory())
        .map((dirent) => dirent.name)
        .filter((name) => {
          // 安全な比較 - 動的アクセスを避ける
          return !name.startsWith('.') && !baseDirectories.includes(name as typeof baseDirectories[number]);
        });

      // 重複を除去して結合（型安全）
      const allDirectories = [...new Set([...baseDirectories, ...autoDetectedDirs])];

      // ディレクトリベースのエイリアスを追加（安全なイテレーション）
      for (const dir of allDirectories) {
        const dirPath = path.resolve(srcBasePath, dir);
        if (fs.existsSync(dirPath)) {
          aliases[`@${dir}`] = dirPath;
        }
      }
    }
  } catch (error) {
    logError('CONFIG', CONFIG_LOG_CODES.CONFIG_ERROR, 'エイリアス設定の生成中にエラーが発生しました', error);
  }

  return aliases;
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
    const isMobile = 'VITE_MOBILE' in env && env.VITE_MOBILE === 'true';

    // 環境変数の検証
    const defineEnv = validateEnv(env);
    const appVersion = process.env.npm_package_version ?? '0.0.0';
    const buildTime = new Date().toISOString();

    logInfo('CONFIG', CONFIG_LOG_CODES.CONFIG_INFO, `アプリケーションバージョン: ${appVersion} (${mode}モード)`);
    logInfo('CONFIG', CONFIG_LOG_CODES.CONFIG_INFO, `ビルド時刻: ${buildTime}`);

    // モバイルモードのログ
    if (isMobile) {
      logInfo('CONFIG', CONFIG_LOG_CODES.CONFIG_INFO, 'モバイル開発モードが有効です');
    }

    const basePath = isProd ? APP_CONFIG.BASE_PATH.PROD : APP_CONFIG.BASE_PATH.DEV;
    logInfo('CONFIG', CONFIG_LOG_CODES.CONFIG_INFO, `ベースパス: ${basePath}`);

    return {
      base: basePath,
      plugins: [
        react({
          babel: { plugins: isProd ? ['transform-remove-console'] : [] },
          jsxImportSource: '@emotion/react',
        }),
        tsconfigPaths(),
        VitePWA(getPwaConfig(isProd)),
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
    logError('CONFIG', CONFIG_LOG_CODES.CONFIG_ERROR, '設定処理中に致命的なエラーが発生しました', error);
    console.error(`スタックトレース: ${(error instanceof Error) ? error.stack : '不明なエラー'}`);
    process.exit(1);
  }
});

// app.config.ts用にエクスポート (scripts/optimize-assets.tsなどで使用)
export { APP_CONFIG };