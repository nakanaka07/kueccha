import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import os from 'os';

/**
 * プロジェクトのルートディレクトリからの相対パス解決を簡略化する関数
 * @param path 解決するパス
 * @returns 絶対パス
 */
const resolvePath = (path: string) => resolve(__dirname, path);

/**
 * シンプルなロガー実装（NodeJSコードでコンソール出力をラップ）
 * ESLint警告を回避するため、環境に応じて出力するかどうかを制御
 */
const configLogger = {
  info: (message: string, context?: Record<string, unknown>) => {
    if (process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.info(`[VITEST] ${message}`, context || '');
    }
  },
  debug: (message: string, context?: Record<string, unknown>) => {
    if (process.env.DEBUG === 'true') {
      // eslint-disable-next-line no-console
      console.debug(`[VITEST] ${message}`, context || '');
    }
  },
  warn: (message: string, context?: Record<string, unknown>) => {
    // eslint-disable-next-line no-console
    console.warn(`[VITEST] ${message}`, context || '');
  },
  error: (message: string, context?: Record<string, unknown>) => {
    // eslint-disable-next-line no-console
    console.error(`[VITEST] ${message}`, context || '');
  },
};

/**
 * 文字列をブール値に変換
 * @param value 変換する文字列
 * @returns ブール値
 */
function toBool(value: string | undefined): boolean {
  if (!value) return false;
  return ['true', '1', 'yes'].includes(value.toLowerCase());
}

/**
 * 環境変数の安全な取得
 * 環境変数管理ガイドラインに準拠
 */
const getTestEnvironment = () => {
  const isCI = toBool(process.env.CI);
  const isDebugMode = toBool(process.env.DEBUG);

  // 環境設定をログに出力
  configLogger.info('テスト環境設定を読み込みました', {
    CI: isCI,
    debugMode: isDebugMode,
    nodeEnv: process.env.NODE_ENV,
  });

  return {
    isCI,
    isDebugMode,
  };
};

/**
 * スレッド設定を環境に応じて最適化
 * @param env 現在の環境設定
 * @returns 最適化されたスレッド設定
 */
const getThreadOptions = (env: { isCI: boolean; isDebugMode: boolean }) => {
  // CI環境ではリソース節約、通常環境では最大活用
  const { isCI, isDebugMode } = env;

  if (isDebugMode) {
    configLogger.debug('デバッグモードが有効なため、単一スレッドで実行します');
    return { singleThread: true };
  }

  const cpuCount = os.cpus().length;
  const maxThreads = isCI ? 2 : Math.max(1, Math.floor(cpuCount * 0.75));
  const minThreads = isCI ? 1 : Math.max(1, Math.floor(cpuCount * 0.5));

  configLogger.debug('スレッド設定を構成しました', {
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
};

/**
 * テストカバレッジ設定を環境に応じて取得
 * 型エラーを避けるため、providerを明示的にリテラル型として指定
 */
const getCoverageConfig = () => {
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
};

export default defineConfig(() => {
  // 環境情報を取得
  const env = getTestEnvironment();
  const threadOptions = getThreadOptions(env);
  const coverageConfig = getCoverageConfig();

  // 設定構築時にログを出力
  configLogger.info('Vitestの設定を構築しています', {
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
});
