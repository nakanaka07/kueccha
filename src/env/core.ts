/**
 * 環境変数を取得するコアユーティリティ関数
 * コード最適化ガイドラインに準拠した実装
 *
 * Vite設定ファイル（Node.js）とブラウザ環境の両方で動作するための実装
 * パスエイリアスを使わず、相対パスのみを使用
 */

import { logger } from '../config/simple-logger';

// 型定義
export interface GetEnvVarOptions {
  key: string;
  defaultValue?: string;
  required?: boolean;
}

/**
 * 環境変数キーの安全性を検証
 * @param key 環境変数キー
 * @returns キーが有効かどうか
 */
function validateEnvKey(key: string): boolean {
  // キーの型チェック
  if (typeof key !== 'string') {
    throw new TypeError('環境変数のキーは文字列である必要があります');
  }

  // 英数字、アンダースコア、ドットのみ許可（セキュリティ対策）
  return /^[a-zA-Z0-9_.]+$/.test(key);
}

/**
 * 環境変数を取得する基本関数
 * @param options 環境変数オプション
 * @returns 環境変数の値
 */
export function getEnvVar({ key, defaultValue = '', required = false }: GetEnvVarOptions): string {
  try {
    // 安全なアクセスのためにキーを検証
    if (!validateEnvKey(key)) {
      throw new Error(`環境変数キーに無効な文字が含まれています: ${key}`);
    }

    // 安全な変数アクセスのためのホワイトリストアプローチ
    let value: string = defaultValue; // Node環境でのアクセス (process.env)
    if (typeof process !== 'undefined' && process.env) {
      // セキュリティのための安全なアクセス - ホワイトリストアプローチ
      const safeKeys = ['NODE_ENV', 'VITE_BASE_PATH', 'BASE_PATH', 'VITE_LOG_LEVEL'];
      if (safeKeys.includes(key) || key.startsWith('VITE_')) {
        // 安全なアクセス方法としてReflect.getを使用
        const rawValue = Object.prototype.hasOwnProperty.call(process.env, key)
          ? Reflect.get(process.env, key)
          : undefined;
        if (rawValue != null) {
          value = String(rawValue);
        }
      }
    } // Vite/ブラウザ環境でのアクセス (import.meta.env)
    else if (typeof import.meta !== 'undefined' && import.meta.env) {
      // 安全なアクセス方法を使用
      // キーの存在確認後、Reflectを使用して安全にアクセス
      if (Object.prototype.hasOwnProperty.call(import.meta.env, key)) {
        const rawValue = Reflect.get(import.meta.env, key);
        if (rawValue != null) {
          value = String(rawValue);
        }
      }
    }

    // 必須チェック
    if (required && !value) {
      throw new Error(`必須環境変数 ${key} が未設定です`);
    }

    return value;
  } catch (error) {
    // エラーログ出力と例外再スロー
    logger.error(`環境変数 ${key} の取得に失敗しました`, {
      component: 'EnvCore',
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

/**
 * 環境変数をブール値に変換する
 * @param key 環境変数のキー
 * @param defaultValue デフォルト値
 * @returns ブール値
 */
export function getEnvBool(key: string, defaultValue = false): boolean {
  const value = getEnvVar({ key });
  if (!value) return defaultValue;

  return ['true', '1', 'yes'].includes(value.toLowerCase());
}

// デフォルトエクスポート
export default {
  getEnvVar,
  getEnvBool,
};
