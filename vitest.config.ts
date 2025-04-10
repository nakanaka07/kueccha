import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import os from 'os';
import { ENV, getEnv } from './src/utils/env.ts';
import { logger, LogLevel } from './src/utils/logger.ts';

/**
 * プロジェクトのルートディレクトリからの相対パス解決を簡略化する関数
 * @param path 解決するパス
 * @returns 絶対パス
 */
const resolvePath = (path: string) => resolve(__dirname, path);

/**
 * 環境変数の安全な取得
 * 環境変数管理ガイドラインに準拠
 */
const getTestEnvironment = () => {
  return logger.measureTime(
    'テスト環境設定の取得',
    () => {
      // 環境変数ガイドラインに従った型安全な取得方法
      const isCI = getEnv<boolean>('CI', {
        defaultValue: false,
        transform: (value: string) => value === 'true' || value === '1',
      });

      const isDebugMode = getEnv<boolean>('DEBUG', {
        defaultValue: false,
        transform: (value: string) => value === 'true' || value === '1',
      });

      // 環境設定をログに出力
      logger.info('テスト環境設定を読み込みました', {
        component: 'VitestConfig',
        action: 'load_env',
        CI: isCI,
        debugMode: isDebugMode,
        nodeEnv: process.env.NODE_ENV,
      });

      return {
        isCI,
        isDebugMode,
      };
    },
    LogLevel.DEBUG,
    { component: 'VitestConfig' }
  );
};

/**
 * スレッド設定を環境に応じて最適化
 * @param env 現在の環境設定
 * @returns 最適化されたスレッド設定
 */
const getThreadOptions = (env: { isCI: boolean; isDebugMode: boolean }) => {
  return logger.measureTime(
    'スレッド設定の最適化',
    () => {
      // CI環境ではリソース節約、通常環境では最大活用
      const { isCI, isDebugMode } = env;

      if (isDebugMode) {
        logger.debug('デバッグモードが有効なため、単一スレッドで実行します', {
          component: 'VitestConfig',
          action: 'configure_threads',
        });
        return { singleThread: true };
      }

      const cpuCount = os.cpus().length;
      const maxThreads = isCI ? 2 : Math.max(1, Math.floor(cpuCount * 0.75));
      const minThreads = isCI ? 1 : Math.max(1, Math.floor(cpuCount * 0.5));

      logger.debug('スレッド設定を構成しました', {
        component: 'VitestConfig',
        action: 'configure_threads',
        cpuCount,
        maxThreads,
        minThreads,
        isCI,
      });

      return {
        maxThreads,
        minThreads,
        singleThread: false,
      };
    },
    LogLevel.DEBUG,
    { component: 'VitestConfig' }
  );
};

/**
 * テストカバレッジ設定を環境に応じて取得
 * 型エラーを避けるため、providerを明示的にリテラル型として指定
 */
const getCoverageConfig = () => {
  return logger.measureTime(
    'カバレッジ設定の構成',
    () => {
      const isProd = process.env.NODE_ENV === 'production';

      return {
        provider: 'v8' as const, // リテラル型として指定
        reporter: ['text', 'json', 'html', 'lcov'],
        exclude: [
          'node_modules/**',
          'dist/**',
          '**/*.d.ts',
          '**/*.test.{ts,tsx}',
          'src/setupTests.ts',
          'vite.config.ts',
          'vitest.config.ts',
        ],
        thresholds: {
          statements: isProd ? 75 : 70,
          branches: isProd ? 75 : 70,
          functions: isProd ? 75 : 70,
          lines: isProd ? 75 : 70,
        },
        reportsDirectory: './coverage',
        all: true,
        clean: true,
      };
    },
    LogLevel.DEBUG,
    { component: 'VitestConfig' }
  );
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
