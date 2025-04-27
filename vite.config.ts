import fs from 'fs';
import { resolve } from 'path';

import { defineConfig, loadEnv, type UserConfig } from 'vite';

import { createBuildOptions } from './config/build';
import { configLogger } from './config/config-logger';
import { validateEnv } from './config/env-validator';
import { createPlugins } from './config/plugins';
import { getEnvVar } from './config/simple-core';

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
  const isAnalyze = process.env.ANALYZE === 'true';
  const isPreview = mode === 'preview'; // プレビューモード（本番相当の検証時）

  // ビルドパフォーマンス計測の開始時間を記録
  const buildStartTime = isProd ? Date.now() : undefined;

  // 設定情報のログ出力（詳細情報を追加）
  configLogger.info(`Vite設定を生成しています`, {
    mode,
    isProd,
    isPreview,
    isAnalyze,
    nodeEnv: process.env.NODE_ENV,
    component: 'vite-config',
    timestamp: new Date().toISOString(),
  });

  // 環境変数のバリデーション
  validateEnv(env);

  // GitHub PagesのベースパスはCI/CDで動的に設定
  // VITE_BASE_PATHを優先し、なければBASE_PATHを使用（互換性のため）
  const basePath =
    isProd || isPreview
      ? getEnvVar({
          key: 'VITE_BASE_PATH',
          defaultValue: getEnvVar({ key: 'BASE_PATH', defaultValue: '/kueccha/' }),
        })
      : '/';

  // プラグイン配列を構築（KISS原則に基づきシンプル化）
  const plugins = createPlugins(mode);

  // ビルド完了後のパフォーマンスログ出力プラグインを追加
  if (isProd && buildStartTime) {
    plugins.push({
      name: 'vite-build-time-reporter',
      closeBundle() {
        const buildTimeMs = Date.now() - buildStartTime;
        configLogger.info(`ビルド完了: ${buildTimeMs / 1000}秒`, {
          buildTimeMs,
          component: 'vite-build',
          timestamp: new Date().toISOString(),
        });
      },
    });
  } // 静的サイト前提の設定
  return {
    base: basePath,
    plugins, // ビルド設定はここでは行わず、下部で定義

    // サーバー設定（ローカル開発専用 - GitHub Pages等の静的ホスティングでは不要）
    server: {
      port: 5173,
      ...(mode === 'development'
        ? {
            https: {
              key: fs.readFileSync(resolve(__dirname, '.local/localhost.key')),
              cert: fs.readFileSync(resolve(__dirname, '.local/localhost.crt')),
            },
          }
        : {}),
      hmr: {
        overlay: true,
        clientPort: 5173,
      },
      cors: true,
      watch: {
        usePolling: true,
        interval: 1000,
      },

      // ソースマップの警告を抑制
      fs: {
        strict: false,
      },

      // 静的サイト前提の注意書き（コメントのみ）
      // GitHub Pages等の静的ホスティングでは、このsection以下の設定は無視されます。
      // ビルド成果物（dist）をそのままデプロイしてください。
    },

    // プレビューサーバー設定（GitHub Pages環境の模倣）
    preview: {
      port: 4173,
      strictPort: true,
      cors: true,
    },

    // ビルド設定（GitHub Pages等の静的ホスティング向け最適化）
    build: createBuildOptions(isProd),

    // パス別名（シンプル化）
    resolve: {
      alias: {
        '@': resolve(__dirname, './src'),
      },
    }, // 依存関係の最適化（YAGNI原則に基づき、必要な依存関係のみ含める）
    optimizeDeps: {
      // よく使われるコアライブラリと地図関連ライブラリのみ事前最適化
      include: [
        'react',
        'react-dom',
        '@googlemaps/js-api-loader',
        '@googlemaps/markerclusterer',
        '@react-google-maps/api',
        'csv-parse',
      ],
      esbuildOptions: {
        target: 'esnext',
        // 最新のJavaScript機能のサポート
        supported: {
          bigint: true,
          'dynamic-import': true,
          'import-meta': true,
        },
        // ソースマップの警告を抑制
        logOverride: {
          'missing-source-map': 'silent',
        },
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
