/**
 * 環境変数関連のユーティリティ関数
 */

/** 標準化されたエラーメッセージ形式 */
const ENV_ERROR_MESSAGES = {
  MISSING: (key: string) => `環境変数 ${key} が見つかりません`,
  PARSE_ERROR: (key: string, value: string, target: string) =>
    `環境変数 ${key} の値 "${value}" を ${target} に変換できませんでした`,
};

/**
 * 環境変数から値を安全に取得するジェネリック関数
 */
export function getEnvValue<T>(
  key: string,
  defaultValue: T,
  parser: (val: string) => T = String as any,
  options?: {
    required?: boolean;
    logErrors?: boolean;
    throwInProduction?: boolean;
  },
): T {
  const env = import.meta.env as Record<string, string | undefined>;
  const value = env[key];

  const opts = {
    required: false,
    logErrors: true,
    throwInProduction: true,
    ...options,
  };

  const isProd = import.meta.env.PROD === true;

  // 環境変数が存在しない
  if (value === undefined || value === null) {
    // 必須環境変数がない場合
    if (opts.required) {
      const errorMsg = ENV_ERROR_MESSAGES.MISSING(key);
      if (isProd && opts.throwInProduction) {
        throw new Error(`[環境変数エラー] ${errorMsg}`);
      }

      if (opts.logErrors) {
        const logFn = isProd ? console.error : console.warn;
        logFn(
          `[${isProd ? '本番環境' : '開発環境'}] ${errorMsg}. デフォルト値を使用: ${defaultValue}`,
        );
      }
    }
    return defaultValue;
  }

  // 値の変換
  try {
    return parser(value);
  } catch (error) {
    const errorMsg = ENV_ERROR_MESSAGES.PARSE_ERROR(key, value, typeof defaultValue);

    if (isProd && opts.throwInProduction) {
      throw new Error(`[環境変数エラー] ${errorMsg}`);
    }

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
