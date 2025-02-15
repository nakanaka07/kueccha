import tsPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import importPlugin from 'eslint-plugin-import';
import prettierPlugin from 'eslint-plugin-prettier';
import reactPlugin from 'eslint-plugin-react';

export default [
  {
    ignores: ['dist/**/*'], // distフォルダ内のファイルを無視
  },
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'], // 対象ファイルのパターン
    languageOptions: {
      parser: tsParser, // TypeScriptパーサーを使用
      parserOptions: {
        ecmaVersion: 'latest', // 最新のECMAScriptバージョンを使用
        sourceType: 'module', // モジュールとして解析
        ecmaFeatures: {
          jsx: true, // JSXをサポート
        },
        project: './tsconfig.json', // TypeScriptのプロジェクト設定ファイル
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin, // TypeScript用のESLintプラグイン
      prettier: prettierPlugin, // Prettierプラグイン
      react: reactPlugin, // React用のESLintプラグイン
      import: importPlugin, // インポート順序を管理するプラグイン
    },
    settings: {
      react: {
        version: 'detect', // インストールされているReactのバージョンを自動検出
      },
      'import/resolver': {
        typescript: {
          alwaysTryTypes: true, // 型定義ファイルも解決対象に含める
          project: './tsconfig.json', // TypeScriptのプロジェクト設定ファイル
        },
      },
    },
    rules: {
      ...tsPlugin.configs.recommended.rules, // TypeScript用の推奨ルール
      ...reactPlugin.configs.recommended.rules, // React用の推奨ルール
      'prettier/prettier': 'error', // Prettierのフォーマットに従わない場合はエラー
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_', // 使用されていない変数のうち、名前がアンダースコアで始まるものは無視
          varsIgnorePattern: '^_', // 使用されていない変数のうち、名前がアンダースコアで始まるものは無視
        },
      ],
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
              group: 'index', // インデックスグループに含める
              position: 'after', // インデックスグループの後に配置
            },
          ],
          pathGroupsExcludedImportTypes: ['css'], // CSSファイルのインポートを除外
          'newlines-between': 'never', // インポートグループ間に空行を入れる
          alphabetize: {
            order: 'asc', // アルファベット順にソート
            caseInsensitive: true, // 大文字小文字を区別しない
          },
          warnOnUnassignedImports: true, // 未割り当てのインポートに警告を表示
        },
      ],
      'import/newline-after-import': 'error', // インポート文の後に空行を入れる
    },
  },
];
