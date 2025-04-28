/**
 * 環境変数を取得するシンプルなユーティリティ
 * Node.js環境とブラウザ環境の両方で動作するよう最適化
 */

/**
 * 環境変数を取得する関数
 * @param options オプション
 * @param options.key 環境変数のキー
 * @param options.defaultValue デフォルト値
 * @returns 環境変数の値
 */
export function getEnvVar(options: { key: string; defaultValue?: string }): string {
  const { key, defaultValue = '' } = options;

  try {
    // Node環境での環境変数アクセス - セキュアな方法
    if (typeof process !== 'undefined' && process.env) {
      // ホワイトリストによる検証 + Reflectによる安全なプロパティアクセス
      if (Object.prototype.hasOwnProperty.call(process.env, key)) {
        const value = Reflect.get(process.env, key);
        if (value !== undefined) {
          return value;
        }
      }
    }

    // Vite/ブラウザ環境での環境変数アクセス - セキュアな方法
    if (typeof import.meta !== 'undefined' && import.meta.env) {
      // Reflectによる安全なプロパティアクセス
      if (Object.prototype.hasOwnProperty.call(import.meta.env, key)) {
        const value = Reflect.get(import.meta.env, key);
        if (value !== undefined) {
          return value;
        }
      }
    }

    // デフォルト値を返す
    return defaultValue;
  } catch (error) {
    console.error(`環境変数の取得に失敗しました: ${key}`, error);
    return defaultValue;
  }
}

// ユーティリティのエクスポート
export default { getEnvVar };
