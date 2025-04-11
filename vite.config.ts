import { resolve } from 'path';

import { defineConfig, loadEnv, type UserConfig } from 'vite';

import { createBuildOptions } from './config/build';
import { validateEnv } from './config/env-validator';
import { configLogger } from './config/logger';
import { createPlugins } from './config/plugins';
import { getEnvVar } from './src/utils/env/core';

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
  // プラグイン配列を構築（KISS原則に基づきシンプル化）
  const plugins = createPlugins(mode);

  return {
    base: basePath,
    plugins,

    // 開発サーバー設定
    server: {
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
    build: createBuildOptions(isProd),

    // パス別名（シンプル化）
    resolve: {
      alias: {
        '@': resolve(__dirname, './src'),
      },
    },

    // 依存関係の最適化（YAGNI原則に基づき、必要な依存関係のみ含める）
    optimizeDeps: {
      // よく使われるコアライブラリと地図関連ライブラリのみ事前最適化
      include: [
        'react',
        'react-dom',
        'react-router-dom',
        '@googlemaps/js-api-loader',
        '@googlemaps/markerclusterer',
        '@react-google-maps/api',
        'zustand',
        'csv-parse',
      ],
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
