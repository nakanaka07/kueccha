import recommended from 'eslint-plugin-eslint-plugin/configs/recommended';
import prettierPlugin from 'eslint-plugin-prettier';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';

const tsConfig = {
  files: ['**/*.{ts,tsx}'],
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
  },
  rules: {
    // TypeScriptの基本的なルールのみを設定
    '@typescript-eslint/no-unused-vars': [
      'error',
      {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
      },
    ],
    '@typescript-eslint/no-explicit-any': 'warn',
    // 必要に応じて他のルールを追加
  },
};

export default [
  {
    ignores: ['dist', 'node_modules'],
    plugins: {
      prettier: prettierPlugin,
      '@typescript-eslint': tsPlugin,
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
    rules: {
      'prettier/prettier': 'error',
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
    },
  },
  {
    files: ['**/*.{js,cjs,mjs}'],
    languageOptions: {
      globals: {
        window: true,
        document: true,
        navigator: true,
      },
      ecmaVersion: 'latest',
      sourceType: 'module',
    },
    ...recommended,
  },
  tsConfig,
];
