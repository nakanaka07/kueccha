import { defineConfig } from 'eslint-define-config';
import js from '@eslint/js';
import reactPlugin from 'eslint-plugin-react';
import reactHooksPlugin from 'eslint-plugin-react-hooks';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import prettierPlugin from 'eslint-plugin-prettier';
import * as tsParser from '@typescript-eslint/parser';

export default defineConfig({
  ignores: ['dist', 'node_modules'],
  plugins: {
    react: reactPlugin,
    'react-hooks': reactHooksPlugin,
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
  overrides: [
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
      extends: ['eslint:recommended'],
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
      extends: ['plugin:@typescript-eslint/recommended'],
    },
  ],
});

