import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import os from 'os';

// プロジェクトのルートディレクトリからの相対パス解決を簡略化する関数
const resolvePath = (path: string) => resolve(__dirname, path);

// 環境変数の取得
const isCI = Boolean(process.env.CI);

export default defineConfig({
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
    environment: 'jsdom', // ブラウザ環境をシミュレート
    globals: true, // グローバル関数（describe, it, expect）を使用可能に
    setupFiles: ['./src/setupTests.ts'],
    include: ['**/*.{test,spec}.{ts,tsx}'],
    exclude: ['**/node_modules/**', '**/dist/**', '**/.{idea,git,cache,output,temp}/**'],

    // パフォーマンス向上設定
    isolate: true, // テスト間の分離を確保
    reporters: ['default', 'html'],
    watch: false, // CI環境ではウォッチモードを無効化

    // カバレッジ設定
    coverage: {
      provider: 'v8', // より正確なカバレッジ情報
      reporter: ['text', 'json', 'html', 'lcov'], // LCOVレポート追加（CI/CD統合用）
      exclude: [
        'node_modules/**',
        'dist/**',
        '**/*.d.ts',
        '**/*.test.{ts,tsx}',
        'src/setupTests.ts',
        'vite.config.ts',
        'vitest.config.ts',
      ],
      // より詳細なカバレッジ設定を追加
      thresholds: {
        statements: 70,
        branches: 70,
        functions: 70,
        lines: 70,
      },
      // カバレッジレポートの出力先
      reportsDirectory: './coverage',
      // ソースマップを使用してカバレッジを正確に計測
      all: true,
      clean: true,
    },

    // 安定性設定
    testTimeout: 15000, // タイムアウトを15秒に延長（複雑な非同期テスト向け）
    retry: isCI ? 2 : 0, // CI環境では失敗したテストを再試行
    bail: isCI ? 1 : 0, // CI環境では最初のエラーで停止（早期フィードバック）

    // スレッド設定 - 環境に応じた最適化
    poolOptions: {
      threads: {
        maxThreads: isCI ? 2 : Math.max(1, Math.floor(os.cpus().length * 0.75)),
        minThreads: isCI ? 1 : Math.max(1, Math.floor(os.cpus().length * 0.5)),
        singleThread: process.env.DEBUG === 'true', // デバッグモード時は単一スレッドで実行
      },
    },

    // CSSサポート
    css: true,

    // JSDOMオプション
    environmentOptions: {
      jsdom: {
        resources: 'usable',
        runScripts: 'dangerously',
      },
    },

    // スナップショットテスト最適化
    snapshotFormat: {
      printBasicPrototype: false,
      escapeString: false,
    },
  },
});
