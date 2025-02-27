// TypeScript用のESLintプラグインをインポート
import tsPlugin from '@typescript-eslint/eslint-plugin';
// TypeScript用のESLintパーサーをインポート
import tsParser from '@typescript-eslint/parser';
// インポート順序を管理するESLintプラグインをインポート
import importPlugin from 'eslint-plugin-import';
// Prettierと連携するESLintプラグインをインポート
import prettierPlugin from 'eslint-plugin-prettier';
// React用のESLintプラグインをインポート
import reactPlugin from 'eslint-plugin-react';

export default [
  {
    // distディレクトリ内のファイルを無視する設定
    ignores: ['dist/**/*'],
  },
  {
    // 対象とするファイルのパターンを指定
    files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
    languageOptions: {
      // TypeScript用のパーサーを設定
      parser: tsParser,
      parserOptions: {
        // ECMAScriptのバージョンを最新に設定
        ecmaVersion: 'latest',
        // モジュールとしてソースコードを解釈
        sourceType: 'module',
        ecmaFeatures: {
          // JSX構文を有効にする
          jsx: true,
        },
        // TypeScriptのプロジェクト設定ファイルを指定
        project: './tsconfig.json',
      },
    },
    plugins: {
      // TypeScript用のESLintプラグインを設定
      '@typescript-eslint': tsPlugin,
      // Prettier用のESLintプラグインを設定
      prettier: prettierPlugin,
      // React用のESLintプラグインを設定
      react: reactPlugin,
      // インポート順序管理用のESLintプラグインを設定
      import: importPlugin,
    },
    settings: {
      react: {
        // Reactのバージョンを自動検出
        version: 'detect',
      },
      'import/resolver': {
        typescript: {
          // 型情報を常に試みる設定
          alwaysTryTypes: true,
          // TypeScriptのプロジェクト設定ファイルを指定
          project: './tsconfig.json',
        },
      },
    },
    rules: {
      // TypeScript用の推奨ルールを適用
      ...tsPlugin.configs.recommended.rules,
      // React用の推奨ルールを適用
      ...reactPlugin.configs.recommended.rules,
      // Prettierのルールをエラーとして扱う
      'prettier/prettier': 'error',
      // 未使用の変数をエラーとして扱うが、特定のパターンは無視
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],
      // インポート順序のルールを設定
      'import/order': [
        'error',
        {
          groups: [
            'builtin', // 組み込みモジュール
            'external', // 外部モジュール
            'internal', // 内部モジュール
            ['parent', 'sibling'], // 親・兄弟モジュール
            'index', // インデックスモジュール
            'object', // オブジェクトモジュール
            'type', // 型定義モジュール
          ],
          pathGroups: [
            {
              pattern: '*.css', // CSSファイルのパターン
              group: 'index', // インデックスグループに配置
              position: 'after', // 後に配置
            },
          ],
          pathGroupsExcludedImportTypes: ['css'], // CSSファイルを除外
          'newlines-between': 'never', // インポート間の改行を禁止
          alphabetize: {
            order: 'asc', // アルファベット順に並べる
            caseInsensitive: true, // 大文字小文字を区別しない
          },
          warnOnUnassignedImports: true, // 未割り当てのインポートに警告
        },
      ],
      // インポート後に改行を強制
      'import/newline-after-import': 'error',
    },
  },
];
