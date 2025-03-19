/**
 * ESLint構成ファイル
 * TypeScript 5.8.2、React 19、Vite 6.2.2環境に最適化
 */
import tsPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import importPlugin from 'eslint-plugin-import';
import jsxA11yPlugin from 'eslint-plugin-jsx-a11y';
import prettierPlugin from 'eslint-plugin-prettier';
import reactPlugin from 'eslint-plugin-react';
import reactHooksPlugin from 'eslint-plugin-react-hooks';

// ルールのカテゴリ別グループ化で設定を整理
const typescriptRules = {
  ...tsPlugin.configs.recommended.rules,
  ...tsPlugin.configs.strict.rules,
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
  '@typescript-eslint/consistent-type-imports': ['warn', {
    prefer: 'type-imports',
    disallowTypeAnnotations: true,
  }],
  '@typescript-eslint/no-non-null-assertion': 'warn',
};

const reactRules = {
  ...reactPlugin.configs.recommended.rules,
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
      checkKeyMustBeforeSpread: true,
    },
  ],
  'react/no-array-index-key': 'warn',
  'react/jsx-pascal-case': 'error',
  'react/self-closing-comp': 'error',
  'react/jsx-fragments': ['warn', 'syntax'],
  'react/no-unstable-nested-components': 'error',
  'react/jsx-no-leaked-render': ['error', {
    validStrategies: ['ternary', 'coerce']
  }],
  'react/jsx-no-useless-fragment': 'warn',
};

const reactHooksRules = {
  ...reactHooksPlugin.configs.recommended.rules,
  'react-hooks/exhaustive-deps': ['warn', {
    additionalHooks: '(use|useAction|useOptimistic|useFormStatus)'
  }],
};

const a11yRules = {
  ...jsxA11yPlugin.configs.recommended.rules,
  'jsx-a11y/anchor-is-valid': 'error',
  'jsx-a11y/alt-text': 'error',
  'jsx-a11y/aria-role': 'error',
  'jsx-a11y/aria-props': 'error',
  'jsx-a11y/aria-proptypes': 'error',
  'jsx-a11y/role-has-required-aria-props': 'error',
  'jsx-a11y/click-events-have-key-events': 'error',
  'jsx-a11y/no-static-element-interactions': 'warn',
};

const importRules = {
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
  'import/no-cycle': 'warn',
};

const generalRules = {
  'prettier/prettier': 'error',
  'camelcase': ['error', { properties: 'never' }],
  'id-length': ['warn', { min: 2, exceptions: ['i', 'j', 'k', 'x', 'y', 'z', '_', 'id'] }],
  'no-console': ['warn', { allow: ['warn', 'error', 'info'] }],
  'no-debugger': 'warn',
  'no-alert': 'warn',
  'complexity': ['warn', 10],
  'max-depth': ['warn', 4],
  'max-lines': ['warn', 500],
  'max-lines-per-function': ['warn', 100],
  'no-param-reassign': 'warn',
  'no-nested-ternary': 'warn',
  'no-process-env': 'off',
  'no-promise-executor-return': 'error',
  'prefer-promise-reject-errors': 'error',
};

export default [
  // グローバルな無視パターン
  {
    ignores: [
      'dist/**/*', 
      'node_modules/**/*', 
      'coverage/**/*', 
      '*.d.ts',
      '.vite/**/*',
      'public/**/*'
    ],
  },
  // メインのコードベース設定
  {
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
        version: '19',
        runtime: 'automatic',
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
    // カテゴリ別に整理されたルール
    rules: {
      ...typescriptRules,
      ...reactRules,
      ...reactHooksRules,
      ...a11yRules,
      ...importRules,
      ...generalRules,
    },
  },
  // テストファイル用の特別ルール
  {
    files: ['**/*.test.ts', '**/*.test.tsx', '**/*.spec.ts', '**/*.spec.tsx', '**/test/**', '**/tests/**', '**/mocks/**'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
      'max-lines': 'off',
      'max-lines-per-function': 'off',
      'react/display-name': 'off',
      'jsx-a11y/click-events-have-key-events': 'off',
      'jsx-a11y/no-static-element-interactions': 'off', // テスト環境でより自由に要素をテスト
    },
  },
  // GitHub Actions設定ファイル用の特別ルール
  {
    files: ['.github/**/*.yml', '.github/**/*.yaml'],
    rules: {
      'max-lines': 'off',
    },
  },
  // 環境設定ファイル用の特別ルール
  {
    files: ['*.config.js', '*.config.ts', 'vite.config.*'],
    rules: {
      'import/no-extraneous-dependencies': 'off',
      'max-lines': 'off',
    },
  },
];