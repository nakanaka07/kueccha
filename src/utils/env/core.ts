/**
 * 環境変数を取得するユーティリティ関数
 * @param options 環境変数オプション
 * @returns 環境変数の値
 */
interface GetEnvVarOptions {
  key: string;
  defaultValue?: string;
  required?: boolean;
}

export function getEnvVar({ key, defaultValue = '', required = false }: GetEnvVarOptions): string {
  // 安全なアクセスのためにキーの検証を追加
  if (typeof key !== 'string') {
    throw new TypeError('環境変数のキーは文字列である必要があります');
  }

  // 環境変数キーの安全性を検証（英数字、アンダースコア、ドットのみ許可）
  if (!/^[a-zA-Z0-9_.]+$/.test(key)) {
    throw new Error('環境変数キーに無効な文字が含まれています');
  }
  // 安全な変数アクセスのためのホワイトリストアプローチ
  let value: string = defaultValue;

  // Reflect.getを使用してより安全にアクセス
  if (Object.prototype.hasOwnProperty.call(import.meta.env, key)) {
    const envValue = Reflect.get(import.meta.env, key);
    // undefined や null でない場合のみ代入
    if (envValue != null) {
      value = String(envValue);
    }
  } else if (Object.prototype.hasOwnProperty.call(process.env, key)) {
    const envValue = Reflect.get(process.env, key);
    // undefined や null でない場合のみ代入
    if (envValue != null) {
      value = String(envValue);
    }
  }

  if (required && !value) {
    throw new Error(`必須環境変数 ${key} が未設定です`);
  }

  return value;
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

/**
 * 環境変数を数値に変換する
 * @param key 環境変数のキー
 * @param defaultValue デフォルト値
 * @returns 数値
 */
export function getEnvNumber(key: string, defaultValue = 0): number {
  const value = getEnvVar({ key });
  if (!value) return defaultValue;

  const num = Number(value);
  return isNaN(num) ? defaultValue : num;
}
