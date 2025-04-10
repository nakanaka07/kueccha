/**
 * TypeScript固有のESLintルール設定
 *
 * このファイルは、TypeScript特有のルール設定を定義します。
 * メインのeslint.config.jsから参照され、設定の分割管理によりメンテナンス性を向上します。
 * コード最適化ガイドラインとロガー使用ガイドラインの原則に基づいています。
 */

// 型安全性関連のルール
export const typeSecurityRules = {
  // any型の使用を警告（コード最適化ガイドラインに準拠）
  '@typescript-eslint/no-explicit-any': 'warn',

  // 非nullアサーションの使用を警告
  '@typescript-eslint/no-non-null-assertion': 'warn',

  // 不要な型アサーションを警告
  '@typescript-eslint/no-unnecessary-type-assertion': 'warn',

  // 一貫した型宣言を強制（interface vs type）
  '@typescript-eslint/consistent-type-definitions': ['warn', 'interface'],

  // as constの使用を推奨
  '@typescript-eslint/prefer-as-const': 'warn',

  // 不要な条件式を警告
  '@typescript-eslint/no-unnecessary-condition': 'warn',

  // 厳格なbooleanチェック
  '@typescript-eslint/strict-boolean-expressions': [
    'warn',
    {
      allowString: true,
      allowNumber: true,
      allowNullableObject: true,
      allowNullableBoolean: false,
      allowNullableString: false,
      allowNullableNumber: false,
      allowAny: false,
    },
  ],
};

// コード品質とベストプラクティス関連のルール
export const codeQualityRules = {
  // 未使用変数のチェック（_で始まる引数は無視）
  '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],

  // 戻り値の型は推論可能な場合は省略可
  '@typescript-eslint/explicit-function-return-type': 'off',

  // クラスのプロパティ初期化を強制
  '@typescript-eslint/class-literal-property-style': ['warn', 'fields'],

  // コンストラクタの戻り値型を明示しない
  '@typescript-eslint/no-confusing-void-expression': [
    'warn',
    {
      ignoreArrowShorthand: true,
      ignoreVoidOperator: true,
    },
  ],
};

// 非同期処理とPromise関連のルール（ロガー使用ガイドラインに準拠）
export const asyncRules = {
  // Promiseの戻り値を無視しない
  '@typescript-eslint/no-floating-promises': 'warn',

  // Promise型の値にのみawaitを許可
  '@typescript-eslint/await-thenable': 'warn',

  // コールバック関数のPromiseを適切に処理する
  '@typescript-eslint/no-misused-promises': [
    'warn',
    {
      checksVoidReturn: false,
    },
  ],

  // asyncキーワードのある関数内でawaitが必須
  '@typescript-eslint/require-await': 'warn',

  // 関数の戻り値としてのawaitを最適化
  '@typescript-eslint/return-await': ['warn', 'in-try-catch'],
};

// モダンなJavaScript/TypeScript機能の活用を促進するルール
export const modernFeaturesRules = {
  // null/undefined用に??演算子を推奨
  '@typescript-eslint/prefer-nullish-coalescing': 'warn',

  // プロパティチェーンに?.演算子を推奨
  '@typescript-eslint/prefer-optional-chain': 'warn',

  // 文字列連結より文字列テンプレートを推奨
  '@typescript-eslint/prefer-string-starts-ends-with': 'warn',

  // インデックスアクセスより型安全なアクセスを推奨
  '@typescript-eslint/prefer-regexp-exec': 'warn',

  // メソッドの参照において、this bindingの問題を防止する
  '@typescript-eslint/unbound-method': ['warn', { ignoreStatic: true }],
};

// 型定義ファイル(.d.ts)用の緩和ルール
export const typeDefinitionRules = {
  '@typescript-eslint/no-unnecessary-type-assertion': 'off',
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
};

// テストファイル用の緩和ルール
export const testFileRules = {
  '@typescript-eslint/no-explicit-any': 'off', // テストでは柔軟な型を許可
  '@typescript-eslint/no-non-null-assertion': 'off', // テストでは非Nullアサーションを許可
  '@typescript-eslint/unbound-method': 'off', // テストではモック時にメソッド参照を許可
  '@typescript-eslint/no-floating-promises': 'off', // テストでは明示的なawaitを必須としない
};

// Google Maps関連のプロジェクト特有のルール（Google Maps統合ガイドラインに基づく）
export const googleMapsRules = {
  // Google Maps APIのPromiseメソッドに対する特別ルール
  'promise/always-return': [
    'error',
    {
      ignoreLastCallback: true, // Google Maps APIのコールバックパターンを許可
      allowExtraArgs: true, // Google Maps APIの追加引数を許可
    },
  ],

  // TypeScriptのLegacyと新APIの混在を許可（Google Maps APIの新旧両方をサポートするため）
  '@typescript-eslint/ban-types': [
    'warn',
    {
      types: {
        // Google Maps APIの型の混在を許可
        'google.maps.Map': false,
        'google.maps.marker.AdvancedMarkerElement': false,
      },
    },
  ],
};

// メインのTypeScriptルール（全てを集約）
export const tsRules = {
  ...typeSecurityRules,
  ...codeQualityRules,
  ...asyncRules,
  ...modernFeaturesRules,
};

// デフォルトエクスポート
export default {
  tsRules,
  typeDefinitionRules,
  testFileRules,
  googleMapsRules,
};
