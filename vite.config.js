import fs from 'fs';
import path from 'path';

import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig(({ mode, command }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const isProd = mode === 'production';
  const isDev = command === 'serve';

  // 環境変数の構成
  const envVariables = {
    required: ['VITE_GOOGLE_MAPS_API_KEY'],
    optional: [
      'VITE_GOOGLE_MAPS_MAP_ID',
      'VITE_GOOGLE_SHEETS_API_KEY',
      'VITE_GOOGLE_SPREADSHEET_ID',
      'VITE_EMAILJS_SERVICE_ID',
      'VITE_EMAILJS_TEMPLATE_ID',
      'VITE_EMAILJS_PUBLIC_KEY',
    ],
  };

  // 必須環境変数のバリデーション
  const missingRequired = envVariables.required.filter((key) => !env[key]);
  if (missingRequired.length > 0) {
    console.error(`Missing required environment variables: ${missingRequired.join(', ')}`);
    process.exit(1);
  }

  // オプション環境変数のバリデーション（警告のみ）
  const missingOptional = envVariables.optional.filter((key) => !env[key]);
  if (missingOptional.length > 0) {
    console.warn(`Missing optional environment variables: ${missingOptional.join(', ')}`);
  }

  // 全ての環境変数をdefineに設定
  const allEnvVars = [...envVariables.required, ...envVariables.optional];
  const defineEnv = allEnvVars.reduce((acc, key) => {
    if (env[key]) {
      acc[`process.env.${key}`] = JSON.stringify(env[key]);
    }
    return acc;
  }, {});

  // SSL証明書の安全な読み込み
  let httpsConfig = {};
  if (isDev) {
    try {
      const keyPath = path.resolve(__dirname, 'localhost.key');
      const certPath = path.resolve(__dirname, 'localhost.crt');

      if (fs.existsSync(keyPath) && fs.existsSync(certPath)) {
        httpsConfig = {
          key: fs.readFileSync(keyPath),
          cert: fs.readFileSync(certPath),
        };
      } else {
        console.warn('SSL certificates not found. Running in HTTP mode.');
      }
    } catch (error) {
      console.error('Error loading SSL certificates:', error.message);
    }
  }

  // サーバー設定
  const serverConfig = isDev
    ? {
        https: Object.keys(httpsConfig).length ? httpsConfig : false,
        headers: {
          'Cache-Control': 'public, max-age=3600',
        },
        hmr: {
          protocol: Object.keys(httpsConfig).length ? 'wss' : 'ws',
          host: 'localhost',
          port: 5173,
          clientPort: 5173,
          overlay: false,
          timeout: 5000,
        },
      }
    : {};

  // Google Maps関連の依存関係を整理
  const googleMapsPackages = [
    '@googlemaps/js-api-loader',
    '@react-google-maps/api',
    // 以下のどちらかのみ使用する（プロジェクトの実際の使用状況に基づいて選択）
    '@react-google-maps/marker-clusterer',
    // '@googlemaps/markerclusterer',
  ];

  return {
    base: isProd ? '/kueccha/' : '/',
    plugins: [react(), tsconfigPaths()],
    build: {
      outDir: 'dist',
      sourcemap: isProd ? 'hidden' : true, // 本番環境でも限定的にソースマップを生成
      rollupOptions: {
        output: {
          entryFileNames: '[name].[hash].js',
          chunkFileNames: '[name].[hash].js',
          assetFileNames: '[name].[hash].[ext]',
        },
        onwarn(warning, warn) {
          if (warning.code === 'SOURCEMAP_ERROR') return;
          warn(warning);
        },
      },
    },
    optimizeDeps: {
      include: googleMapsPackages,
      esbuildOptions: {
        sourcemap: true,
        logOverride: {
          'this-is-undefined-in-esm': 'silent',
        },
      },
    },
    define: defineEnv,
    server: serverConfig,
  };
});
