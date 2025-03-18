import tsPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import importPlugin from 'eslint-plugin-import';
import jsxA11yPlugin from 'eslint-plugin-jsx-a11y';
import prettierPlugin from 'eslint-plugin-prettier';
import reactPlugin from 'eslint-plugin-react';
import reactHooksPlugin from 'eslint-plugin-react-hooks';

export default [
  {
    // ビルド成果物の除外
    ignores: ['dist/**/*', 'node_modules/**/*', 'coverage/**/*', '*.d.ts'],
  },
  {
    // TypeScriptとJavaScriptファイルに適用するルール
    files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true,
        },
        project: './tsconfig.json',
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
      'jsx-a11y': jsxA11yPlugin,
      'prettier': prettierPlugin,
      'react': reactPlugin,
      'react-hooks': reactHooksPlugin,
      'import': importPlugin,
    },
    settings: {
      react: {
        version: '19',  // React 19を明示的に指定
        runtime: 'automatic',  // React JSX Transformの自動インポート
      },
      'import/resolver': {
        typescript: {
          alwaysTryTypes: true,
          project: './tsconfig.json',
        },
        node: {
          extensions: ['.js', '.jsx', '.ts', '.tsx'],
        },
      },
      'import/extensions': ['.js', '.jsx', '.ts', '.tsx'],
    },
    rules: {
      // 基本設定の継承 - ESLint v9との互換性を考慮した方法
      ...tsPlugin.configs.recommended.rules,
      ...tsPlugin.configs.strict.rules,
      ...reactPlugin.configs.recommended.rules,
      ...reactHooksPlugin.configs.recommended.rules,
      ...jsxA11yPlugin.configs.recommended.rules,

      // Prettierとの統合
      'prettier/prettier': 'error',

      // TypeScript関連の追加ルール
      '@typescript-eslint/explicit-module-boundary-types': 'warn',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
          destructuredArrayIgnorePattern: '^_',
        },
      ],
      '@typescript-eslint/no-unnecessary-condition': 'error',
      '@typescript-eslint/prefer-nullish-coalescing': 'warn',
      '@typescript-eslint/prefer-optional-chain': 'warn',
      '@typescript-eslint/consistent-type-imports': ['warn', { // 型インポートの一貫性
        prefer: 'type-imports',
        disallowTypeAnnotations: true,
      }],
      '@typescript-eslint/no-non-null-assertion': 'warn', // !演算子の使用を警告

      // React関連の追加ルール
      'react/jsx-no-bind': [
        'warn',
        {
          allowArrowFunctions: true,
          allowFunctions: false,
        },
      ],
      'react/jsx-key': [
        'error',
        {
          checkFragmentShorthand: true,
          checkKeyMustBeforeSpread: true, // スプレッド演算子の前にkeyを置くべきか検証
        },
      ],
      'react/no-array-index-key': 'warn',
      'react/jsx-pascal-case': 'error',
      'react/self-closing-comp': 'error',
      'react/jsx-fragments': ['warn', 'syntax'], // Fragmentの短縮構文を推奨

      // React 19固有のパフォーマンス最適化ルール
      'react/no-unstable-nested-components': 'error', // ネストされた不安定コンポーネントを検出
      'react/jsx-no-leaked-render': ['error', { // 条件付きレンダリングでのリーク防止
        validStrategies: ['ternary', 'coerce']
      }],
      'react/jsx-no-useless-fragment': 'warn', // 不要なフラグメントを検出

      // React Hooks関連の拡張ルール
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': ['warn', {
        additionalHooks: '(use|useAction|useOptimistic|useFormStatus)' // React 19の新hooks対応
      }],

      // アクセシビリティ関連のルール
      'jsx-a11y/anchor-is-valid': 'error',
      'jsx-a11y/alt-text': 'error',
      'jsx-a11y/aria-role': 'error',
      'jsx-a11y/aria-props': 'error',
      'jsx-a11y/aria-proptypes': 'error',
      'jsx-a11y/role-has-required-aria-props': 'error',
      'jsx-a11y/click-events-have-key-events': 'error', // クリックイベントにキーボードイベントも必要
      'jsx-a11y/no-static-element-interactions': 'warn', // 静的要素に対話的な属性を追加

      // 命名規則に関するルール
      'camelcase': ['error', { properties: 'never' }],
      'id-length': ['warn', { min: 2, exceptions: ['i', 'j', 'k', 'x', 'y', 'z', '_', 'id'] }], // 変数名の長さ

      // インポート順に関するルール
      'import/order': [
        'error',
        {
          groups: [
            'builtin',
            'external',
            'internal',
            ['parent', 'sibling'],
            'index',
            'object',
            'type',
          ],
          pathGroups: [
            {
              pattern: '@/**',
              group: 'internal',
              position: 'before',
            },
            {
              pattern: '*.{css,scss,less,sass}',
              group: 'index',
              position: 'after',
            },
          ],
          'newlines-between': 'always',
          pathGroupsExcludedImportTypes: ['css', 'scss', 'less', 'sass'],
          alphabetize: {
            order: 'asc',
            caseInsensitive: true,
          },
          warnOnUnassignedImports: true,
        },
      ],
      'import/newline-after-import': 'error',
      'import/no-duplicates': 'error',
      'import/no-unresolved': 'error',
      'import/no-cycle': 'warn', // 循環インポートを検出

      // コードスタイルとベストプラクティス
      'no-console': ['warn', { allow: ['warn', 'error', 'info'] }], // info も許可
      'no-debugger': 'warn',
      'no-alert': 'warn',
      'complexity': ['warn', 10],
      'max-depth': ['warn', 4],
      'max-lines': ['warn', 500],
      'max-lines-per-function': ['warn', 100], // 関数あたりの行数を制限
      'no-param-reassign': 'warn', // 引数の再代入を警告
      'no-nested-ternary': 'warn', // ネストされた三項演算子を警告

      // 環境変数・プラットフォーム固有の処理に関するルール
      'no-process-env': 'off', // 環境変数の直接参照を許可（Viteの環境変数処理を考慮）

      // Promise関連のルール
      'no-promise-executor-return': 'error', // Promise実行関数からの不正な戻り値を禁止
      'prefer-promise-reject-errors': 'error', // Promiseの拒否にはErrorオブジェクトを使用
    },
  },
  // テストファイル用の設定
  {
    files: ['**/*.test.ts', '**/*.test.tsx', '**/*.spec.ts', '**/*.spec.tsx', '**/test/**'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
      'max-lines': 'off',
      'max-lines-per-function': 'off',
      'react/display-name': 'off',
      'jsx-a11y/click-events-have-key-events': 'off', // テスト時はアクセシビリティ要件を緩和
    },
  },
  // GitHub Actions用のワークフロー設定
  {
    files: ['.github/**/*.yml', '.github/**/*.yaml'],
    rules: {
      'max-lines': 'off', // GitHub Actionsのワークフローファイルは長くなることが多い
    },
  },
];