// コアモジュールを最初にインポート
import fs from 'node:fs';
import path from 'node:path';

// ESLintとプラグイン関連のインポート
import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import importPlugin from 'eslint-plugin-import';

// Reactエコシステム関連のインポート
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import a11y from 'eslint-plugin-jsx-a11y';

// カスタムルールセットをインポート - モジュール分割
import { tsRules, typeDefinitionRules, testFileRules } from './rules/typescript.js';

// 環境変数アクセスの最適化 - utils/envからインポート
// （このファイルが読み込まれる時点ではESMのimport.metaは使えないためディレクティブインポートを使用）
import { getEnv, isDevEnvironment, isProdEnvironment } from './src/utils/env.js';

// 環境変数から本番環境かどうかを型安全に判断する
const isProduction =
  getEnv('NODE_ENV', {
    defaultValue: 'development',
    transform: value => value === 'production',
  }) || isProdEnvironment();

// インポートマッピング（プラグイン設定の一貫性向上）
const plugins = {
  '@typescript-eslint': tseslint.plugin,
  react,
  'react-hooks': reactHooks,
  'react-refresh': reactRefresh,
  'jsx-a11y': a11y,
  import: importPlugin,
};

// 共通ルールを定義（コード重複の削減とメンテナンス性向上）
const commonRules = {
  // コード品質関連の基本ルール
  'no-console': isProduction ? 'error' : 'warn', // 本番環境ではconsole文を禁止
  'no-debugger': isProduction ? 'error' : 'warn', // 本番環境ではdebugger文を禁止
  'no-unused-vars': 'off', // TypeScriptのルールを優先
  'no-var': 'error', // varの使用禁止
  'prefer-const': 'warn', // 再代入不要な変数はconstを使用
  'dot-notation': 'warn', // オブジェクトアクセスにはドット記法を優先
  eqeqeq: ['warn', 'always', { null: 'ignore' }], // 厳密等価演算子を推奨
};

// React関連ルール
const reactRules = {
  'react-hooks/rules-of-hooks': 'error', // フックのルールを厳格に適用
  'react-hooks/exhaustive-deps': 'warn', // 依存配列の不完全な指定を警告
  'react-refresh/only-export-components': ['warn', { allowConstantExport: true }], // Fast Refreshの最適化
  'react/prop-types': 'off', // TypeScriptを使用しているため不要
  'react/react-in-jsx-scope': 'off', // React 17以降では不要
};

// A11yルール（アクセシビリティ）
const a11yRules = {
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
};

// インポート関連ルール
const importRules = {
  // 重複インポートの禁止
  'import/no-duplicates': 'error',
  // インポート順序の整理
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
};

// 複雑性制限ルール
const complexityRules = {
  // 関数の循環的複雑度を制限（条件分岐が多すぎる関数を防止）
  complexity: ['warn', 15],
  // ネストされた条件やループの深さを制限（可読性とデバッグ容易性のため）
  'max-depth': ['warn', 4],
  // 関数あたりの行数を制限（長すぎる関数を分割促進）
  'max-lines-per-function': ['warn', { max: 100, skipBlankLines: true, skipComments: true }],
};

// .gitignoreからパターンを読み込む関数 (キャッシュ最適化)
const readGitignorePatterns = (() => {
  let patterns = null;

  return () => {
    if (patterns !== null) {
      return patterns; // キャッシュを返す
    }

    try {
      const gitignoreContent = fs.readFileSync(path.join(process.cwd(), '.gitignore'), 'utf8');
      patterns = gitignoreContent
        .split('\n')
        .filter(line => line.trim() && !line.startsWith('#'))
        .map(line => line.trim());
      return patterns;
    } catch (error) {
      patterns = [];
      return patterns;
    }
  };
})();

// 共通の除外パターン + .gitignoreの内容
const gitignorePatterns = readGitignorePatterns();

// ServiceWorkerファイル（完全に除外）
// devDistFilesはServiceWorkerファイルを含む
const devDistFiles = [
  // dev-distディレクトリ全体
  'dev-dist/**',
  '**/dev-dist/**',
  // 具体的なファイル名を指定
  'dev-dist/sw.js',
  'dev-dist/registerSW.js',
  'dev-dist/workbox-20a2f87f.js',
  // その他のdev-dist内のファイル
  'dev-dist/*.js',
  'dev-dist/*.js.map',
];

// 明示的に除外するパターン
const explicitIgnores = [
  '**/node_modules/**',
  '**/dist/**',
  '**/coverage/**',
  '**/.git/**',
  ...devDistFiles,
];

// すべての除外パターンを統合
const commonIgnores = [...explicitIgnores, ...gitignorePatterns];

// 設定ファイルパターン（型チェックから除外する）
const configFiles = [
  '*.config.js',
  '*.config.ts',
  '.*.js',
  'vite.config.ts',
  '.prettierrc.js',
  '.eslintrc.js',
  'eslint.config.js',
  'jest.config.js',
];

// typescript-eslintの設定
export default tseslint.config(
  // 基本設定（すべてのファイルに適用）
  {
    ignores: commonIgnores,
    linterOptions: {
      reportUnusedDisableDirectives: true,
      noInlineConfig: false,
    },
    plugins, // この行を追加してプラグインを設定
    rules: {
      ...eslint.configs.recommended.rules,
      ...commonRules,
      ...tsRules, // 分離したTypeScriptルールを参照
      ...reactRules,
      ...a11yRules,
      ...importRules,
      ...complexityRules,
    },
  },

  {
    files: ['**/*.{ts,tsx,js,jsx}'],
    ignores: commonIgnores,
    extends: [tseslint.configs.recommended],
  },

  // TypeScript型チェック設定
  {
    files: ['**/*.{ts,tsx}'],
    ignores: [...commonIgnores, ...configFiles, 'env.d.ts', '**/*.d.ts'],
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
    plugins,
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
      ...testFileRules, // 分離したテストファイル用ルールを使用
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
      // 簡略化のために、ほとんどのルールを無効化
      ...typeDefinitionRules, // 型定義ファイル用のルールを流用（同様のルール緩和が適用されるため）
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
    rules: typeDefinitionRules, // 分離した型定義ファイル用ルールを使用
  },

  // ServiceWorkerファイル用の特別な設定（すべてのルールを無効化）
  {
    files: devDistFiles,
    ignores: [],
    rules: {
      // ServiceWorkerファイルに対してすべてのルールを無効化
      '@typescript-eslint/ban-types': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/no-floating-promises': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      // ... 他のすべてのルールも無効化
      'import/no-duplicates': 'off',
      'import/order': 'off',
    },
  }
);

// 設定適用完了時のログ出力（最適化版）
try {
  // ロガーモジュールを環境変数ガイドラインに準拠した形で使用
  const { logger } = await import('./src/utils/logger.js').catch(() => {
    // フォールバックロガーを環境変数ガイドラインに準拠させる
    const isDev = !isProduction;
    return {
      logger: {
        info: (...args) => isDev && console.info('[ESLint Config]', ...args), // eslint-disable-line no-console
        warn: (...args) => console.warn('[ESLint Config]', ...args), // eslint-disable-line no-console
        error: (...args) => console.error('[ESLint Config]', ...args), // eslint-disable-line no-console
      },
    };
  });

  // 設定の概要をログに記録（構造化ロギングを使用）
  logger.info('ESLint設定を適用しました', {
    component: 'ESLintConfig',
    ignorePatterns: commonIgnores.length,
    configFiles: configFiles.length,
    environment: isProduction ? '本番環境' : '開発環境',
    typescript: true,
    react: true,
    moduleSplit: true, // モジュール分割フラグを追加
  });
} catch (error) {
  // エラーが発生した場合でも設定自体は適用されるようにする
  // エラー情報をより構造化された形で提供
  const errorMessage = error instanceof Error ? error.message : String(error);
  console.warn('[ESLint Config] 設定適用後のログ出力に失敗しました:', errorMessage); // eslint-disable-line no-console
}
