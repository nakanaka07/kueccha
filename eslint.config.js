/**
 * ESLint設定 - GitHub Pages静的サイト向け最適化（完全版）
 */
import tsPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import importPlugin from 'eslint-plugin-import';
import jsxA11yPlugin from 'eslint-plugin-jsx-a11y';
import reactPlugin from 'eslint-plugin-react';
import reactHooksPlugin from 'eslint-plugin-react-hooks';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// 現在のディレクトリを取得（ESMスタイル対応）
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// tsconfig.jsonの絶対パスを設定
const tsconfigPath = path.resolve(__dirname, './tsconfig.json');

export default [
  {
    ignores: [
      'dist/**',
      'node_modules/**',
      'coverage/**',
      '*.d.ts',
      '.vite/**',
      'public/**',
      // GitHub Pages用に不要なバックエンド関連ファイルを無視
      'server.ts',
      'localhost.key',
      'localhost.crt',
      'openssl.cnf',
    ],
  },

  // 設定ファイル自体に対する処理（JS構文のみでTypeScriptパーサーを使わない）
  {
    files: ['*.config.js', 'eslint.config.js', '.prettierrc.cjs'],
    languageOptions: {
      sourceType: 'module',
    },
  },

  // メイン設定
  {
    files: ['**/*.{ts,tsx}', 'src/**/*.{js,jsx}', 'scripts/**/*.ts'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: { jsx: true },
        project: tsconfigPath,
        tsconfigRootDir: __dirname,
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
      'jsx-a11y': jsxA11yPlugin,
      react: reactPlugin,
      'react-hooks': reactHooksPlugin,
      import: importPlugin,
    },
    settings: {
      react: { version: '19', runtime: 'automatic' },
      'import/resolver': {
        typescript: { 
          project: tsconfigPath,
          alwaysTryTypes: true, 
        },
        node: { extensions: ['.js', '.jsx', '.ts', '.tsx'] },
      },
      'import/parsers': {
        '@typescript-eslint/parser': ['.ts', '.tsx'],
      },
    },

    // GitHub Pages静的サイト向けに最適化したルール
    rules: {
      // TypeScript - 型安全性と不要コード削減
      ...tsPlugin.configs.recommended.rules,
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/consistent-type-imports': ['warn', { prefer: 'type-imports' }],
      '@typescript-eslint/no-unnecessary-condition': 'warn', // 不要な条件分岐を警告
      '@typescript-eslint/prefer-nullish-coalescing': 'warn', // null/undefinedチェックの最適化
      '@typescript-eslint/no-duplicate-imports': 'error', // 重複インポート防止

      // モバイル最適化のための追加ルール
      '@typescript-eslint/prefer-optional-chain': 'warn', // 長いプロパティチェーンの最適化

      // import/orderエラー用の緩和設定
      'import/no-unresolved': 'off',

      // React - パフォーマンスとアクセシビリティ
      ...reactPlugin.configs.recommended.rules,
      'react/jsx-key': ['error', { checkFragmentShorthand: true }],
      'react/no-array-index-key': 'warn',
      'react/self-closing-comp': 'error',
      'react/jsx-no-useless-fragment': 'warn', // 不要なフラグメントを警告
      'react/jsx-pascal-case': 'error', // コンポーネント名のPascalCase強制
      'react/no-unstable-nested-components': 'error', // レンダリングパフォーマンス向上

      // Hooks - メモリリークと不要再レンダリング防止
      ...reactHooksPlugin.configs.recommended.rules,
      'react-hooks/exhaustive-deps': 'warn',

      // アクセシビリティ - PWAとしての品質向上
      ...jsxA11yPlugin.configs.recommended.rules,
      'jsx-a11y/alt-text': 'error', // 画像代替テキスト必須
      'jsx-a11y/anchor-has-content': 'error', // リンクにコンテンツ必須
      'jsx-a11y/click-events-have-key-events': 'warn', // キーボードアクセシビリティ
      'jsx-a11y/interactive-supports-focus': 'warn', // フォーカス可能な要素

      // インポート順 - コード整理と一貫性
      'import/order': [
        'error',
        {
          groups: ['builtin', 'external', 'internal', ['parent', 'sibling'], 'index'],
          'newlines-between': 'always',
          alphabetize: { order: 'asc', caseInsensitive: true },
        },
      ],
      'import/no-duplicates': 'error', // 重複インポート防止

      // パフォーマンス関連 - GitHub Pages向け最適化
      'react/jsx-no-constructed-context-values': 'error', // レンダリング時のコンテキスト作成回避
      'react/no-inline-styles': 'warn', // インラインスタイル回避でバンドルサイズ削減

      // 不要コード削減
      'no-console': ['warn', { allow: ['warn', 'error', 'info'] }], // デバッグコード削減
      'no-debugger': 'error', // デバッガー文を禁止（本番環境向け）
      'no-unused-expressions': 'error', // 使われない式を禁止
      'max-lines-per-function': ['warn', 150], // 関数サイズ制限

      // コード品質向上
      'prefer-const': 'error', // 再代入されない変数はconstを強制
      'no-var': 'error', // var使用禁止
      'no-duplicate-imports': 'error', // モジュールの重複インポート禁止
    },
  },

  // テストファイル用
  {
    files: ['**/*.{test,spec}.{ts,tsx}', '**/test/**', '**/tests/**', '**/mocks/**'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      'max-lines-per-function': 'off',
      'jsx-a11y/click-events-have-key-events': 'off',
      'no-console': 'off', // テスト中のログ出力を許可
    },
  },

  // 設定ファイル用
  {
    files: ['*.config.{js,ts}', 'vite.config.*', 'scripts/**/*'],
    rules: {
      'import/no-extraneous-dependencies': 'off',
      'no-console': 'off', // スクリプトでのコンソール出力を許可
      'max-lines-per-function': 'off', // 設定ファイルは長くなりがち
    },
  },

  // GitHub Pages用特別設定 - ビルド後に実行される最適化スクリプト向け
  {
    files: ['scripts/optimize-assets.ts'],
    rules: {
      'no-console': 'off',
      '@typescript-eslint/no-explicit-any': 'off', // アセット最適化では柔軟性が必要
      'max-lines-per-function': 'off', // 最適化関数は複雑になりやすい
    },
  },
];