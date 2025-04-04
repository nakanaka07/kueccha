/**
 * TypeScript固有のESLintルール設定
 *
 * このファイルは、TypeScript特有のルール設定を定義します。
 * メインのeslint.config.jsから参照され、設定の分割管理によりメンテナンス性を向上します。
 */

// TypeScript特有のルール設定
export const tsRules = {
  // 未使用変数のチェック（_で始まる引数は無視）
  '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],

  // 戻り値の型は推論可能な場合は省略可
  '@typescript-eslint/explicit-function-return-type': 'off',

  // any型の使用を警告
  '@typescript-eslint/no-explicit-any': 'warn',

  // 非nullアサーションの使用を警告
  '@typescript-eslint/no-non-null-assertion': 'warn',

  // Promiseの戻り値を無視しない
  '@typescript-eslint/no-floating-promises': 'warn',

  // 不要な条件式を警告
  '@typescript-eslint/no-unnecessary-condition': 'warn',

  // null/undefined用に??演算子を推奨
  '@typescript-eslint/prefer-nullish-coalescing': 'warn',

  // プロパティチェーンに?.演算子を推奨
  '@typescript-eslint/prefer-optional-chain': 'warn',

  // 不要な型アサーションを警告
  '@typescript-eslint/no-unnecessary-type-assertion': 'warn',

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

  // try-catchのエラー変数の型を指定する
  '@typescript-eslint/no-implicit-any-catch': 'off', // TypeScript 4.4以降では型推論が改善済み

  // メソッドの参照において、this bindingの問題を防止する
  '@typescript-eslint/unbound-method': ['warn', { ignoreStatic: true }],

  // クラスのプロパティ初期化を強制
  '@typescript-eslint/class-literal-property-style': ['warn', 'fields'],

  // 一貫した型宣言を強制（interface vs type）
  '@typescript-eslint/consistent-type-definitions': ['warn', 'interface'],

  // コンストラクタの戻り値型を明示しない
  '@typescript-eslint/no-confusing-void-expression': [
    'warn',
    {
      ignoreArrowShorthand: true,
      ignoreVoidOperator: true,
    },
  ],

  // as constの使用を推奨
  '@typescript-eslint/prefer-as-const': 'warn',

  // 関数の戻り値としてのawaitを最適化
  '@typescript-eslint/return-await': ['warn', 'in-try-catch'],

  // 文字列連結より文字列テンプレートを推奨
  '@typescript-eslint/prefer-string-starts-ends-with': 'warn',

  // インデックスアクセスより型安全なアクセスを推奨
  '@typescript-eslint/prefer-regexp-exec': 'warn',
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

// デフォルトエクスポート
export default {
  tsRules,
  typeDefinitionRules,
  testFileRules,
};
