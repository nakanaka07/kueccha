import { resolve } from 'path';

import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

// config/logger.tsからconfigLoggerをインポート
import { configLogger as logger } from './config/logger';
// 環境変数ユーティリティをインポート
import { getEnvBool } from './src/utils/env';

/**
 * プロジェクトのルートディレクトリからの相対パス解決を簡略化する関数
 * @param path 解決するパス
 * @returns 絶対パス
 */
const resolvePath = (path: string) => resolve(__dirname, path);

/**
 * 環境変数の安全な取得（シンプル化）
 * 環境変数管理ガイドラインに準拠
 */
const getTestEnvironment = () => {
  // 環境変数をシンプルにブール値として取得 - KISS原則に基づくシンプル化
  const isCI = getEnvBool('CI', false);
  const isDebugMode = getEnvBool('DEBUG', false);

  return {
    isCI,
    isDebugMode,
  };
};

/**
 * スレッド設定を環境に応じて最適化（シンプル化）
 * @param env 現在の環境設定
 * @returns 最適化されたスレッド設定
 */
const getThreadOptions = (env: { isCI: boolean; isDebugMode: boolean }) => {
  const { isCI, isDebugMode } = env;

  // デバッグモード時は単一スレッド、それ以外はシンプルな設定
  if (isDebugMode) {
    return { singleThread: true };
  }

  // CI環境は制限付き、通常環境は適度なスレッド数
  return {
    maxThreads: isCI ? 2 : 4,
    minThreads: isCI ? 1 : 2,
    singleThread: false,
  };
};

/**
 * テストカバレッジ設定を環境に応じて取得（シンプル化）
 * 型エラーを避けるため、providerを明示的にリテラル型として指定
 */
const getCoverageConfig = () => {
  const isProd = process.env.NODE_ENV === 'production';

  return {
    provider: 'v8' as const,
    reporter: ['text', 'html'],
    exclude: [
      'node_modules/**',
      'dist/**',
      '**/*.d.ts',
      '**/*.test.{ts,tsx}',
      'src/setupTests.ts',
      '*.config.ts',
    ],
    thresholds: {
      statements: isProd ? 75 : 70,
      branches: isProd ? 75 : 70,
      functions: isProd ? 75 : 70,
      lines: isProd ? 75 : 70,
    },
    reportsDirectory: './coverage',
    all: true,
  };
};

export default defineConfig(() => {
  try {
    // 環境情報を取得
    const env = getTestEnvironment();
    const threadOptions = getThreadOptions(env);
    const coverageConfig = getCoverageConfig();

    // 設定構築時にログを出力
    logger.info('Vitestの設定を構築しています', {
      component: 'VitestConfig',
      action: 'build_config',
      environment: process.env.NODE_ENV,
      isCI: env.isCI,
      debugMode: env.isDebugMode,
    });

    return {
      plugins: [react()],

      // エイリアス設定 - tsconfig.jsonと完全に同期
      resolve: {
        alias: {
          '@': resolvePath('./src'),
          '@/assets': resolvePath('./src/assets'),
          '@/components': resolvePath('./src/components'),
          '@/constants': resolvePath('./src/constants'),
          '@/hooks': resolvePath('./src/hooks'),
          '@/types': resolvePath('./src/types'),
          '@/utils': resolvePath('./src/utils'),
        },
      },

      test: {
        // 環境設定
        environment: 'jsdom',
        globals: true,
        setupFiles: ['./src/setupTests.ts'],
        include: ['**/*.{test,spec}.{ts,tsx}'],
        exclude: ['**/node_modules/**', '**/dist/**', '**/.{idea,git,cache,output,temp}/**'],

        // パフォーマンス向上設定
        isolate: true,
        reporters: ['default', 'html'],
        watch: false,

        // カバレッジ設定 - 型安全に修正
        coverage: coverageConfig,

        // 安定性設定
        testTimeout: 15000,
        retry: env.isCI ? 2 : 0,
        bail: env.isCI ? 1 : 0,

        // スレッド設定 - 環境に応じた最適化
        poolOptions: {
          threads: threadOptions,
        },

        // CSSサポート
        css: true,

        // JSDOMオプション
        environmentOptions: {
          jsdom: {
            resources: 'usable' as const,
            runScripts: 'dangerously' as const,
          },
        },

        // スナップショットテスト最適化
        snapshotFormat: {
          printBasicPrototype: false,
          escapeString: false,
        },
      },
    };
  } catch (error) {
    // エラーハンドリング強化 - エラー発生時のフォールバック設定
    logger.error('Vitest設定構築中にエラーが発生しました', {
      component: 'VitestConfig',
      action: 'config_error',
      error: error instanceof Error ? error.message : String(error),
      errorStack: error instanceof Error ? error.stack : undefined,
    });

    // 最小限の設定でフォールバック
    return {
      plugins: [react()],
      test: {
        environment: 'jsdom',
        globals: true,
        setupFiles: ['./src/setupTests.ts'],
      },
    };
  }
});
