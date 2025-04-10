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

/**
 * 環境変数アクセスユーティリティ
 * 環境変数管理ガイドラインに基づく実装
 */
const getEnv = (name, options = {}) => {
  const { defaultValue, required = false, transform } = options || {};
  const value = process.env[name] !== undefined ? process.env[name] : defaultValue;

  if (value === undefined && required) {
    throw new Error(`必須環境変数 "${name}" が設定されていません。`);
  }

  return transform && value !== undefined ? transform(value) : value;
};

// 環境検出ユーティリティ
const isDevEnvironment = () => process.env.NODE_ENV !== 'production';
const isProdEnvironment = () => process.env.NODE_ENV === 'production';

// 環境変数から本番環境かどうかを判断する
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

// Google Mapsコード用の特殊ルール（Google Maps統合ガイドラインに準拠）
const mapsRules = {
  // Google Maps関連ファイルでは複雑な関数を許可
  'max-lines-per-function': ['warn', { max: 150, skipBlankLines: true, skipComments: true }],
  // APIキーなどのセキュリティリスク
  'no-hardcoded-credentials': 'error',
  // APIリクエスト制限に関する警告
  'max-params': ['warn', 5],
};

/**
 * .gitignoreからパターンを読み込む関数
 *
 * ロガー使用ガイドラインに準拠したパフォーマンス計測を実装
 */
const readGitignorePatterns = (() => {
  let patterns = null;
  let lastReadTime = 0;
  const MAX_CACHE_AGE_MS = 60000; // 1分間キャッシュを有効に

  return () => {
    const now = Date.now();

    // 有効期限内のキャッシュがある場合
    if (patterns !== null && now - lastReadTime < MAX_CACHE_AGE_MS) {
      return patterns;
    }

    try {
      const startTime = performance.now();
      const gitignoreContent = fs.readFileSync(path.join(process.cwd(), '.gitignore'), 'utf8');
      patterns = gitignoreContent
        .split('\n')
        .filter(line => line.trim() && !line.startsWith('#'))
        .map(line => line.trim());

      lastReadTime = now;

      const duration = performance.now() - startTime;
      if (duration > 50) {
        // 50ms以上かかる場合のみ、警告ログを出力
        console.warn(`[ESLint Config] .gitignoreの読み込みに${Math.round(duration)}ms要しました`);
      }

      return patterns;
    } catch (error) {
      console.error(
        '[ESLint Config] .gitignoreの読み込みに失敗:',
        error instanceof Error ? error.message : error
      );
      patterns = [];
      lastReadTime = now;
      return patterns;
    }
  };
})();

// ServiceWorkerファイル（完全に除外）
const devDistFiles = ['dev-dist/**', '**/dev-dist/**'];

// 明示的に除外するパターン
const explicitIgnores = [
  '**/node_modules/**',
  '**/dist/**',
  '**/coverage/**',
  '**/.git/**',
  ...devDistFiles,
];

// すべての除外パターンを統合
const commonIgnores = [...explicitIgnores, ...readGitignorePatterns()];

// 設定ファイルパターン
const configFiles = [
  '*.config.js',
  '*.config.ts',
  '.*.js',
  'vite.config.ts',
  'eslint.config.js',
  'rules/*.js',
  'scripts/*.js',
];

// Google Maps関連ファイル
const mapsFiles = [
  '**/hooks/useGoogleMaps.ts',
  '**/components/Map*.{ts,tsx}',
  '**/utils/markerUtils.ts',
  '**/utils/googleMaps*.ts',
];

// 設定ファイル用のルール
const configFileRules = {
  ...typeDefinitionRules,
  '@typescript-eslint/no-confusing-void-expression': 'off',
  '@typescript-eslint/await-thenable': 'off',
  '@typescript-eslint/no-unsafe-argument': 'off',
  '@typescript-eslint/no-unsafe-assignment': 'off',
  '@typescript-eslint/no-unsafe-call': 'off',
  '@typescript-eslint/no-unsafe-member-access': 'off',
  '@typescript-eslint/no-unsafe-return': 'off',
  'import/order': 'off', // 設定ファイルではインポート順序を緩和
  'max-lines-per-function': 'off', // 設定ファイルでは関数の長さ制限を緩和
};

// 型定義ファイル専用ルール
const dtsSpecificRules = {
  ...typeDefinitionRules,
  '@typescript-eslint/no-confusing-void-expression': 'off',
  '@typescript-eslint/await-thenable': 'off',
  '@typescript-eslint/no-unsafe-argument': 'off',
  '@typescript-eslint/no-unsafe-assignment': 'off',
  '@typescript-eslint/no-unsafe-call': 'off',
  '@typescript-eslint/no-unsafe-member-access': 'off',
  '@typescript-eslint/no-unsafe-return': 'off',
};

// ESLint設定エクスポート
export default tseslint.config(
  // 基本設定（すべてのファイルに適用）
  {
    ignores: commonIgnores,
    linterOptions: {
      reportUnusedDisableDirectives: true,
      noInlineConfig: false,
    },
    plugins,
    rules: {
      ...eslint.configs.recommended.rules,
      ...commonRules,
      ...tsRules,
      ...reactRules,
      ...a11yRules,
      ...importRules,
      ...complexityRules,
    },
  },

  // TypeScript設定
  {
    files: ['**/*.{ts,tsx,js,jsx}'],
    ignores: commonIgnores,
    extends: [tseslint.configs.recommended],
  },

  // TypeScript型チェック
  {
    files: ['**/*.{ts,tsx}'],
    ignores: [...commonIgnores, ...configFiles, '**/*.d.ts'],
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

  // 型定義ファイル専用
  {
    files: ['**/*.d.ts', 'env.d.ts'],
    ignores: commonIgnores,
    plugins: {
      '@typescript-eslint': tseslint.plugin,
    },
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        project: false,
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
    },
    rules: dtsSpecificRules,
  },

  // React、JSX
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
        version: 'detect',
      },
      'import/resolver': {
        node: {
          extensions: ['.js', '.jsx', '.ts', '.tsx'],
        },
      },
    },
  },

  // Google Maps関連ファイル（Maps統合ガイドラインに準拠）
  {
    files: mapsFiles,
    ignores: commonIgnores,
    rules: mapsRules,
  },

  // テストファイル
  {
    files: ['**/*.test.{js,jsx,ts,tsx}', '**/*.spec.{js,jsx,ts,tsx}'],
    ignores: commonIgnores,
    plugins: {
      '@typescript-eslint': tseslint.plugin,
    },
    rules: {
      ...testFileRules,
      'no-console': 'off',
      'max-lines-per-function': 'off',
      'max-depth': 'off',
      complexity: 'off',
    },
  },

  // 設定ファイル
  {
    files: [...configFiles, 'dist/**'],
    ignores: commonIgnores,
    plugins: {
      '@typescript-eslint': tseslint.plugin,
    },
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        project: false,
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
    },
    rules: configFileRules,
  },

  // ServiceWorker
  {
    files: devDistFiles,
    ignores: [],
    rules: {
      // すべてのルールを無効化
      '@typescript-eslint/ban-types': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      'import/no-duplicates': 'off',
      'import/order': 'off',
    },
  }
);

/**
 * 設定適用完了時のログ出力
 * ロガー使用ガイドライン準拠
 */
(async () => {
  try {
    // ロガーモジュールの動的インポート
    const { logger } = await import('./src/utils/logger.js').catch(() => {
      // フォールバックロガー
      const isDev = !isProduction;
      return {
        logger: {
          info: (...args) => isDev && console.info('[ESLint Config]', ...args),
          warn: (...args) => console.warn('[ESLint Config]', ...args),
          error: (...args) => console.error('[ESLint Config]', ...args),
          debug: (...args) => isDev && console.debug('[ESLint Config]', ...args),
        },
      };
    });

    // 構造化ロギングを使用
    logger.info('ESLint設定を適用しました', {
      component: 'ESLintConfig',
      ignorePatterns: commonIgnores.length,
      configFiles: configFiles.length,
      mapsFiles: mapsFiles.length,
      environment: isProduction ? '本番環境' : '開発環境',
    });
  } catch (error) {
    // エラー情報を構造化
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorName = error instanceof Error ? error.name : 'Unknown';
    console.warn('[ESLint Config] 設定適用後のログ出力に失敗しました:', {
      error: errorMessage,
      type: errorName,
      timestamp: new Date().toISOString(),
    });
  }
})();
