/**
 * 環境変数関連のユーティリティ関数
 * 
 * Vite環境での環境変数の安全な取得と型変換を提供します。
 */

/**
 * 環境変数から値を安全に取得するジェネリック関数
 *
 * @param key 環境変数のキー
 * @param defaultValue デフォルト値
 * @param parser 文字列から目的の型への変換関数
 * @param options オプション設定
 * @returns 環境変数の値（変換済み）またはデフォルト値
 */
export function getEnvValue<T>(
  key: string,
  defaultValue: T,
  parser: (val: string) => T = String as any,
  options: {
    required?: boolean;
    logErrors?: boolean;
    throwInProduction?: boolean;
  } = {},
): T {
  const env = import.meta.env as Record<string, string | undefined>;
  const value = env[key];
  const isProd = import.meta.env.PROD === true;
  
  // デフォルトオプションを設定
  const opts = {
    required: false,
    logErrors: true,
    throwInProduction: true,
    ...options,
  };

  // 環境変数が存在しない場合
  if (value === undefined || value === null) {
    if (opts.required) {
      const errorMsg = `環境変数 ${key} が見つかりません`;
      
      // 本番環境では例外をスロー
      if (isProd && opts.throwInProduction) {
        throw new Error(`[環境変数エラー] ${errorMsg}`);
      }

      // エラーをログに記録
      if (opts.logErrors) {
        const logFn = isProd ? console.error : console.warn;
        logFn(`[${isProd ? '本番環境' : '開発環境'}] ${errorMsg}. デフォルト値: ${defaultValue}`);
      }
    }
    return defaultValue;
  }

  // 値の変換を試みる
  try {
    return parser(value);
  } catch (error) {
    const errorMsg = `環境変数 ${key} の値 "${value}" を ${typeof defaultValue} に変換できませんでした`;

    // 本番環境では例外をスロー
    if (isProd && opts.throwInProduction) {
      throw new Error(`[環境変数エラー] ${errorMsg}`);
    }

    // エラーをログに記録
    if (opts.logErrors) {
      console.error(errorMsg, error);
    }

    return defaultValue;
  }
}

/**
 * 必須環境変数が存在するかチェックする関数
 *
 * @param requiredVars 必須環境変数の配列
 * @returns 見つからなかった環境変数の配列
 */
export function checkRequiredEnvVars(requiredVars: ReadonlyArray<string>): string[] {
  const env = import.meta.env as Record<string, string | undefined>;
  return requiredVars.filter((key) => env[key] === undefined || env[key] === '');
}

/**
 * 環境変数から数値を取得
 */
export function getEnvValueAsNumber(
  key: string,
  defaultValue = 0,
  options?: Parameters<typeof getEnvValue>[3],
): number {
  return getEnvValue(
    key,
    defaultValue,
    (val) => {
      const num = Number(val);
      if (isNaN(num)) throw new Error(`"${val}" は有効な数値ではありません`);
      return num;
    },
    options,
  );
}

/**
 * 環境変数からブール値を取得
 */
export function getEnvValueAsBoolean(
  key: string,
  defaultValue = false,
  options?: Parameters<typeof getEnvValue>[3],
): boolean {
  return getEnvValue(
    key,
    defaultValue,
    (val) => {
      const lowerVal = val.toLowerCase();
      return lowerVal === 'true' || lowerVal === '1' || lowerVal === 'yes';
    },
    options,
  );
}

/**
 * 環境変数からJSON値を取得
 */
export function getEnvValueAsJson<T>(
  key: string,
  defaultValue: T,
  options?: Parameters<typeof getEnvValue>[3],
): T {
  return getEnvValue(key, defaultValue, (val) => JSON.parse(val) as T, options);
}