import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import a11y from 'eslint-plugin-jsx-a11y';
import importPlugin from 'eslint-plugin-import';

// 共通の除外パターン
const commonIgnores = [
  'node_modules/**',
  'dist/**',
  'dev-dist/**',
  'coverage/**',
  '.git/**',
];

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

// 開発環境か本番環境かを判断する定数
// NODE_ENVに依存せず、必要に応じて手動で変更
const isProduction = false; // 本番環境の場合はtrueに設定

// ESLint v9で使用するフラットな設定配列
export default [
  // 基本設定（すべてのファイルに適用）
  {
    ignores: commonIgnores,
    ...eslint.configs.recommended,
  },
  
  // TypeScript基本設定（型チェックなし）
  {
    files: ['**/*.{ts,tsx,js,jsx}'],
    ...tseslint.configs.recommended,
  },
  
  // TypeScript型チェック設定（特定のファイルのみ）
  {
    files: ['**/*.{ts,tsx}'],
    ignores: [
      ...configFiles,
      'env.d.ts',
      'dev-dist/**',
      'dist/**',
    ],
    ...tseslint.configs.recommendedTypeChecked,
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
  
  // React、JSX、一般的なJavaScript/TypeScriptルール
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
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
      // eslint-import-resolver-typescriptパッケージが必要
      'import/resolver': {
        typescript: {
          // 必要に応じてtsconfig.jsonのパスを指定
          project: './tsconfig.json',
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
      // process.env.NODE_ENV の代わりに明示的な変数を使用
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
    files: [
      ...configFiles,
      'dev-dist/**',
      'dist/**',
    ],
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
  }
];