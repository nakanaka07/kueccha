import path from 'node:path';
import fs from 'node:fs';
import { defineConfig, loadEnv, UserConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import compression from 'vite-plugin-compression';
import tsconfigPaths from 'vite-tsconfig-paths';

// PWA設定をインポート
import { getPwaConfig } from './src/config/pwa.config';

// ============================================================================
// 型と定数
// ============================================================================
interface AppConfig {
  BASE_PATH: { PROD: string; DEV: string };
  OUTPUT_DIR: string;
  PORT: { DEFAULT: number; MOBILE: number };
  REQUIRED_ENV: string[];
  OPTIONAL_ENV: string[];
  ENV_DEFAULTS: Record<string, string>;
}

const APP_CONFIG: AppConfig = {
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
  ENV_DEFAULTS: {
    VITE_DEFAULT_ZOOM: '12',
    VITE_DEFAULT_CENTER_LAT: '38.0503',
    VITE_DEFAULT_CENTER_LNG: '138.3716',
    VITE_APP_TITLE: '佐渡で食えっちゃ',
  }
};

// ============================================================================
// 設定関数
// ============================================================================

/**
 * 環境変数の検証と処理
 */
function validateEnv(env: Record<string, string | undefined>): Record<string, string> {
  // 必須環境変数のチェック
  const missingRequired = APP_CONFIG.REQUIRED_ENV.filter(key => !env[key]);
  if (missingRequired.length > 0) {
    throw new Error(
      `必須環境変数が設定されていません: ${missingRequired.join(', ')}\n` +
      `開発環境では.envファイルに、本番環境ではGitHub Secretsに設定してください。`
    );
  }

  // デフォルト値の適用
  Object.entries(APP_CONFIG.ENV_DEFAULTS).forEach(([key, defaultValue]) => {
    if (!env[key]) {
      env[key] = defaultValue;
    }
  });

  // Viteのdefine用に環境変数を整形
  const defineEnv = [...APP_CONFIG.REQUIRED_ENV, ...APP_CONFIG.OPTIONAL_ENV].reduce((acc, key) => {
    if (env[key]) acc[`process.env.${key}`] = JSON.stringify(env[key]);
    return acc;
  }, {} as Record<string, string>);

  return defineEnv;
}

/**
 * サーバー設定を生成
 */
function getServerConfig(isDev: boolean, isMobile: boolean) {
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
    console.info('開発用SSL証明書が見つからないため、HTTP接続を使用します。');
    console.info('HTTPS接続を有効にするには、localhost.keyとlocalhots.crtファイルをプロジェクトルートに配置してください。');
  } catch (error) {
    console.error('SSL証明書の読み込みエラー:', error instanceof Error ? error.message : String(error));
    console.info('SSL設定なしで続行します。本番環境では適切なSSL証明書を使用してください。');
  }

  return { enabled: false, config: {} };
}

/**
 * ビルド設定を生成
 */
function getBuildConfig(isProd: boolean) {
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

/**
 * 圧縮プラグインの生成
 */
function getCompressionPlugins(isProd: boolean) {
  if (!isProd) return [];
  
  return [
    compression({ algorithm: 'gzip', ext: '.gz' }),
    compression({ algorithm: 'brotliCompress', ext: '.br' })
  ];
}

// ============================================================================
// メイン設定
// ============================================================================
export default defineConfig(({ mode, command }): UserConfig => {
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