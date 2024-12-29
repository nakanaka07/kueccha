import * as tsParser from '@typescript-eslint/parser';
import recommended from 'eslint-plugin-eslint-plugin/configs/recommended';
import prettierPlugin from 'eslint-plugin-prettier';
import tsPlugin from '@typescript-eslint/eslint-plugin';

const tsConfig = {
  plugins: {
    '@typescript-eslint': tsPlugin,
  },
  languageOptions: {
    parser: tsParser,
  },
  rules: {
    ...tsPlugin.configs.recommended.rules,
  },
};

export default [
  {
    ignores: ['dist', 'node_modules'],
    plugins: {
      '@typescript-eslint': tsPlugin,
      prettier: prettierPlugin,
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
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],
      '@typescript-eslint/no-explicit-any': 'warn',
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
  {
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
    ...tsConfig,
  },
];
