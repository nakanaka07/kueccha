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
      reportUnusedDisableDirectives: true, // 未使用のルール無効化ディレクティブを報告
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
        project: true, // tsconfig.jsonを使用
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
        version: 'detect', // Reactバージョンの自動検出
      },
      'import/resolver': {
        node: {
          extensions: ['.js', '.jsx', '.ts', '.tsx'],
        },
      },
    },
    rules: {
      // React関連のルール
      'react-hooks/rules-of-hooks': 'error', // フックのルールを厳格に適用
      'react-hooks/exhaustive-deps': 'warn', // 依存配列の不完全な指定を警告
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }], // Fast Refreshの最適化
      'react/prop-types': 'off', // TypeScriptを使用しているため不要
      'react/react-in-jsx-scope': 'off', // React 17以降では不要

      // コード品質関連のルール
      'no-console': isProduction ? 'error' : 'warn', // 本番環境ではconsole文を禁止
      'no-debugger': isProduction ? 'error' : 'warn', // 本番環境ではdebugger文を禁止
      'no-unused-vars': 'off', // TypeScriptのルールを優先
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }], // 未使用変数を警告（_で始まる引数は除外）
      '@typescript-eslint/explicit-function-return-type': 'off', // 戻り値の型は推論可能な場合は省略可
      '@typescript-eslint/no-explicit-any': 'warn', // any型の使用を警告
      '@typescript-eslint/no-non-null-assertion': 'warn', // 非nullアサーションの使用を警告

      // 複雑性の制限
      // 関数の循環的複雑度を制限（条件分岐が多すぎる関数を防止）
      complexity: ['warn', 15],
      // ネストされた条件やループの深さを制限（可読性とデバッグ容易性のため）
      'max-depth': ['warn', 4],
      // 関数あたりの行数を制限（長すぎる関数を分割促進）
      'max-lines-per-function': ['warn', { max: 100, skipBlankLines: true, skipComments: true }],

      // アクセシビリティルール（jsx-a11y）
      // 画像要素に代替テキストを必須にする（スクリーンリーダー対応）
      'jsx-a11y/alt-text': 'error',
      // アンカーには内容が必要（スクリーンリーダーが認識できるコンテンツ）
      'jsx-a11y/anchor-has-content': 'error',
      // ARIAプロパティが有効なものであることを確認
      'jsx-a11y/aria-props': 'error',
      // ARIAプロパティの値が正しいことを確認
      'jsx-a11y/aria-proptypes': [
        'error',
        {
          config: {
            // 'aria-expanded': ['true', 'false'], <- この行を削除しました
            'aria-selected': ['true', 'false'], // 選択状態を示すARIA属性
            'aria-pressed': ['true', 'false', 'mixed'], // ボタン状態を示すARIA属性
            'aria-checked': ['true', 'false', 'mixed'], // チェックボックス状態を示すARIA属性
            'aria-current': ['page', 'step', 'location', 'date', 'time', 'true', 'false'], // 現在地を示すARIA属性
          },
        },
      ],
      // role属性が有効な値であることを確認
      'jsx-a11y/aria-role': ['error', { ignoreNonDOM: true }], // 非DOMコンポーネントでは無視
      // ロールに必要なARIA属性が設定されていることを確認
      'jsx-a11y/role-has-required-aria-props': 'error',
      // クリック可能な要素がキーボード操作可能か確認
      'jsx-a11y/click-events-have-key-events': 'warn',
      // インタラクティブな要素に適切なロールがあるか確認
      'jsx-a11y/no-noninteractive-element-interactions': 'warn',
      // フォーカス可能な要素に適切なロールがあるか確認
      'jsx-a11y/interactive-supports-focus': 'warn',
      // tabIndexの使用を制限（キーボードナビゲーション順序の混乱防止）
      'jsx-a11y/tabindex-no-positive': 'warn',
      // 見出し要素の適切な階層を確認
      'jsx-a11y/heading-has-content': 'error',

      // インポート順序と整理
      'import/order': [
        'warn',
        {
          // インポートのグループ化とグループ間の改行
          'newlines-between': 'always',
          // グループの並び順
          groups: [
            'builtin', // Node.js組み込みモジュール
            'external', // npmパッケージ
            'internal', // エイリアスによる内部インポート
            'parent', // 親ディレクトリからのインポート
            'sibling', // 同じディレクトリからのインポート
            'index', // 同じディレクトリのインデックスファイル
            'object', // オブジェクトインポート
            'type', // 型インポート
          ],
          // 特定のパターンに対するカスタムグループ設定
          pathGroups: [
            // エイリアスパターンを内部モジュールとして扱う
            {
              pattern: '@/**',
              group: 'internal',
              position: 'after',
            },
            // アセットを最後に配置
            {
              pattern: '*.{css,scss,sass,less,styl}',
              group: 'object',
              patternOptions: { matchBase: true },
              position: 'after',
            },
            // 画像ファイルを最後に配置
            {
              pattern: '*.{png,jpg,jpeg,gif,svg}',
              group: 'object',
              patternOptions: { matchBase: true },
              position: 'after',
            },
          ],
          // アルファベット順に並び替え
          alphabetize: { order: 'asc', caseInsensitive: true },
        },
      ],
      // 重複インポートの禁止
      'import/no-duplicates': 'error',
      // 等価演算子の厳格な使用（==よりも===を推奨）
      eqeqeq: ['warn', 'always', { null: 'ignore' }],
      // 再代入不要な変数はconstを使用
      'prefer-const': 'warn',
      // varの使用禁止
      'no-var': 'error',
      // Promiseを返す関数の戻り値を無視しない
      '@typescript-eslint/no-floating-promises': 'warn',
      // 常に真または偽になる条件式を警告
      '@typescript-eslint/no-unnecessary-condition': 'warn',
      // null/undefinedチェックに??演算子を推奨
      '@typescript-eslint/prefer-nullish-coalescing': 'warn',
      // プロパティチェーンに?.演算子を推奨
      '@typescript-eslint/prefer-optional-chain': 'warn',
      // TypeScriptの不要なキャストを警告
      '@typescript-eslint/no-unnecessary-type-assertion': 'warn',
      // オブジェクトの値へのアクセスでbracket notationよりもdot notationを推奨
      'dot-notation': 'warn',
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
      '@typescript-eslint/no-explicit-any': 'off', // テストでは柔軟な型を許可
      'no-console': 'off', // テストでのコンソール出力を許可
      'max-lines-per-function': 'off', // テストは長くなる傾向がある
      'max-depth': 'off', // テストでは複雑なネストが必要な場合がある
      complexity: 'off', // テストでは複雑なケースを扱う必要がある
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
      '@typescript-eslint/no-floating-promises': 'off', // 設定ファイルではPromise処理を緩和
      '@typescript-eslint/no-unnecessary-condition': 'off', // 設定ファイルでは条件チェックを緩和
      '@typescript-eslint/prefer-nullish-coalescing': 'off', // 設定ファイルでは従来の記法も許可
      '@typescript-eslint/prefer-optional-chain': 'off', // 設定ファイルでは従来の記法も許可
      '@typescript-eslint/no-explicit-any': 'off', // 設定ファイルではany型を許可
      '@typescript-eslint/await-thenable': 'off', // 設定ファイルでは非Promise値のawaitを許可
      '@typescript-eslint/no-unused-vars': 'off', // 設定ファイルでは未使用変数を許可
      '@typescript-eslint/no-unnecessary-type-assertion': 'off', // この行を追加
      'import/order': 'off', // 設定ファイルではインポート順序を緩和
      'max-lines-per-function': 'off', // 設定ファイルでは関数の長さ制限を緩和
    },
  },

  // 型定義ファイル専用の設定（型チェックルールを無効化）
  {
    files: ['**/*.d.ts'],
    ignores: commonIgnores,
    plugins: {
      '@typescript-eslint': tseslint.plugin,
    },
    rules: {
      // 型定義ファイルでは不要な型チェックルールを無効化
      '@typescript-eslint/no-unnecessary-type-assertion': 'off',
      // 既存のルール設定があれば、それらもここに含める
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
