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
  if (import.meta.env && Object.prototype.hasOwnProperty.call(import.meta.env, key)) {
    const envValue = Reflect.get(import.meta.env, key);
    // undefined や null でない場合のみ代入
    if (envValue != null) {
      value = String(envValue);
    }
  } else if (
    typeof process !== 'undefined' &&
    process.env &&
    Object.prototype.hasOwnProperty.call(process.env, key)
  ) {
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
 * 許可された環境変数キーのセット（セキュリティ対策）
 */
const ALLOWED_ENV_KEYS = new Set<string>();

/**
 * メモ化された環境変数キャッシュ（パフォーマンス最適化）
 */
const envCache = new Map<string, string>();

/**
 * 環境変数を取得する（型安全で、キャッシュを活用）
 */
export function getEnv(
  key: string,
  options: {
    defaultValue?: string;
    required?: boolean;
    cache?: boolean;
  } = {}
): string {
  const { defaultValue = '', required = false, cache = true } = options;

  // キーの検証（英数字、アンダースコア、ドットのみ許可）
  if (!/^[a-zA-Z0-9_.]+$/.test(key)) {
    throw new Error('環境変数キーに無効な文字が含まれています');
  }

  // キャッシュから値を取得（もし有効で、キャッシュにキーがあれば）
  if (cache && envCache.has(key)) {
    return envCache.get(key) || '';
  }

  // 環境変数を取得
  const value = getEnvVar({ key, defaultValue, required });

  // キャッシュに保存（キャッシュが有効な場合）
  if (cache) {
    envCache.set(key, value);
    // 許可されたキーに追加
    ALLOWED_ENV_KEYS.add(key);
  }

  return value;
}

/**
 * 数値型の環境変数を取得
 */
export function getNumberEnv(
  key: string,
  options: {
    defaultValue?: number;
    required?: boolean;
    min?: number;
    max?: number;
  } = {}
): number {
  const { defaultValue, required, min, max } = options;

  // 文字列として環境変数を取得
  const strValue = getEnv(key, {
    defaultValue: defaultValue?.toString(),
    required,
  });

  // 数値に変換
  const numValue = Number(strValue);

  // NaNチェック
  if (isNaN(numValue)) {
    if (defaultValue !== undefined) {
      return defaultValue;
    }
    throw new Error(`環境変数 ${key} の値 "${strValue}" は有効な数値ではありません`);
  }

  // 範囲チェック
  if (min !== undefined && numValue < min) {
    throw new Error(`環境変数 ${key} の値 ${numValue} は最小値 ${min} より小さいです`);
  }

  if (max !== undefined && numValue > max) {
    throw new Error(`環境変数 ${key} の値 ${numValue} は最大値 ${max} より大きいです`);
  }

  return numValue;
}
