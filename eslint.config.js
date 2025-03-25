import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import a11y from 'eslint-plugin-jsx-a11y';
import importPlugin from 'eslint-plugin-import';

// 共通の除外パターン
const commonIgnores = ['node_modules/**', 'dist/**', 'dev-dist/**', 'coverage/**', '.git/**'];

// 設定ファイルパターン（型チェックから除外する）
const configFiles = [
  '*.config.js',
  '*.config.ts',
  '.*.js',
  'vite.config.ts',
  '.prettierrc.js',
  '.eslintrc.js',
  'jest.config.js',
];

// 環境変数から本番環境かどうかを判断する
const isProduction = process.env.NODE_ENV === 'production';

// typescript-eslintの設定
export default tseslint.config(
  // 基本設定（すべてのファイルに適用）
  {
    ignores: commonIgnores,
    linterOptions: {
      reportUnusedDisableDirectives: true,
    },
    rules: {
      ...eslint.configs.recommended.rules,
    },
  },

  // TypeScript基本設定（型チェックなし）
  {
    files: ['**/*.{ts,tsx,js,jsx}'],
    ignores: commonIgnores,
    extends: [tseslint.configs.recommended],
  },

  // TypeScript型チェック設定
  {
    files: ['**/*.{ts,tsx}'],
    ignores: [
      ...commonIgnores,
      ...configFiles, // 型チェックから設定ファイルを除外
      'env.d.ts',
      '**/*.d.ts', // すべての型定義ファイルを除外
    ],
    extends: [tseslint.configs.recommendedTypeChecked],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        project: true,
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
    },
    plugins: {
      '@typescript-eslint': tseslint.plugin,
    },
  },

  // React、JSX、その他のルール設定
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    ignores: commonIgnores,
    plugins: {
      '@typescript-eslint': tseslint.plugin,
      react: react,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      'jsx-a11y': a11y,
      import: importPlugin,
    },
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    settings: {
      react: {
        version: 'detect',
      },
      'import/resolver': {
        node: {
          extensions: ['.js', '.jsx', '.ts', '.tsx'],
        },
      },
    },
    rules: {
      // React関連のルール
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      'react/prop-types': 'off',
      'react/react-in-jsx-scope': 'off',

      // コード品質関連のルール
      'no-console': isProduction ? 'error' : 'warn',
      'no-debugger': isProduction ? 'error' : 'warn',
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-non-null-assertion': 'warn',

      // 複雑性の制限
      complexity: ['warn', 15],
      'max-depth': ['warn', 4],
      'max-lines-per-function': ['warn', { max: 100, skipBlankLines: true, skipComments: true }],

      // アクセシビリティルール
      'jsx-a11y/alt-text': 'error',
      'jsx-a11y/anchor-has-content': 'error',
      'jsx-a11y/aria-props': 'error',
      'jsx-a11y/aria-role': 'error',
      'jsx-a11y/role-has-required-aria-props': 'error',

      // インポート順序と整理
      'import/order': [
        'warn',
        {
          groups: [
            'builtin',
            'external',
            'internal',
            'parent',
            'sibling',
            'index',
            'object',
            'type',
          ],
          pathGroups: [
            {
              pattern: '@/**',
              group: 'internal',
              position: 'after',
            },
          ],
          alphabetize: { order: 'asc', caseInsensitive: true },
        },
      ],
      'import/no-duplicates': 'error',
      eqeqeq: ['warn', 'always', { null: 'ignore' }],
      'prefer-const': 'warn',
      'no-var': 'error',
      '@typescript-eslint/no-floating-promises': 'warn',
      '@typescript-eslint/no-unnecessary-condition': 'warn',
      '@typescript-eslint/prefer-nullish-coalescing': 'warn',
      '@typescript-eslint/prefer-optional-chain': 'warn',
    },
  },

  // テストファイル用の特別な設定
  {
    files: ['**/*.test.{js,jsx,ts,tsx}', '**/*.spec.{js,jsx,ts,tsx}'],
    ignores: commonIgnores,
    plugins: {
      '@typescript-eslint': tseslint.plugin,
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      'no-console': 'off',
      'max-lines-per-function': 'off',
      'max-depth': 'off',
      complexity: 'off',
    },
  },

  // 設定ファイルとビルド生成物用の設定
  {
    files: [...configFiles, 'dist/**'],
    ignores: commonIgnores,
    plugins: {
      '@typescript-eslint': tseslint.plugin,
    },
    rules: {
      '@typescript-eslint/no-floating-promises': 'off',
      '@typescript-eslint/no-unnecessary-condition': 'off',
      '@typescript-eslint/prefer-nullish-coalescing': 'off',
      '@typescript-eslint/prefer-optional-chain': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/await-thenable': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      'import/order': 'off',
      'max-lines-per-function': 'off',
    },
  },

  // 型定義ファイル専用の設定（型チェックルールを無効化）
  {
    files: ['**/*.d.ts'],
    ignores: commonIgnores,
    rules: {
      // 型情報を必要とするルールをすべて無効化
      '@typescript-eslint/no-floating-promises': 'off',
      '@typescript-eslint/no-unnecessary-condition': 'off',
      '@typescript-eslint/prefer-nullish-coalescing': 'off',
      '@typescript-eslint/prefer-optional-chain': 'off',
      '@typescript-eslint/await-thenable': 'off',
      '@typescript-eslint/no-misused-promises': 'off',
      '@typescript-eslint/require-await': 'off',
      '@typescript-eslint/return-await': 'off',
      '@typescript-eslint/strict-boolean-expressions': 'off',
      '@typescript-eslint/unbound-method': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
    },
  }
);