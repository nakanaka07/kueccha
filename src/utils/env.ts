/**
 * 環境変数管理モジュール
 *
 * 機能:
 * - 型安全な環境変数へのアクセス
 * - 未設定の環境変数の検出と警告
 * - デフォルト値のサポート
 * - 環境変数の検証
 * - 文字列以外の型への変換サポート
 */

/// <reference types="vite/client" />

// 環境変数の取得オプション
interface EnvOptions<T> {
  /** デフォルト値 */
  defaultValue?: T;
  /** 変換関数（文字列から任意の型に変換） */
  transform?: (value: string) => T;
  /** 重要度（true: 必須、false: オプション） */
  critical?: boolean;
}

/**
 * 文字列をブール値に変換する
 */
export const toBool = (value: string): boolean => {
  return ['true', '1', 'yes'].includes(value.toLowerCase());
};

/**
 * 文字列を数値に変換する
 */
export const toNumber = (value: string): number => {
  const num = Number(value);
  if (isNaN(num)) {
    throw new Error(`"${value}" は有効な数値ではありません`);
  }
  return num;
};

/**
 * 環境種別を判定するユーティリティ関数（ロギングガイドラインに準拠）
 */
export const isDevEnvironment = (): boolean => {
  return import.meta.env.DEV === true;
};

export const isProdEnvironment = (): boolean => {
  return import.meta.env.PROD === true;
};

/**
 * ログ出力用のロガー
 * loggerモジュールとの循環参照を避けるため
 */
type LogArgs = unknown;

// コンソール出力用のESLint警告を回避するラッパー
const consoleWrapper = {
  // eslint-disable-next-line no-console
  error: (msg: string, ...args: unknown[]): void => console.error(msg, ...args),
  // eslint-disable-next-line no-console
  warn: (msg: string, ...args: unknown[]): void => console.warn(msg, ...args),
  // eslint-disable-next-line no-console
  info: (msg: string, ...args: unknown[]): void => console.info(msg, ...args),
  // eslint-disable-next-line no-console
  debug: (msg: string, ...args: unknown[]): void => console.debug(msg, ...args),
};

const safeLogger = {
  error: (message: string, ...args: LogArgs[]) => {
    consoleWrapper.error(`[ENV] ${message}`, ...(args as []));
  },
  warn: (message: string, ...args: LogArgs[]) => {
    consoleWrapper.warn(`[ENV] ${message}`, ...(args as []));
  },
  info: (message: string, ...args: LogArgs[]) => {
    consoleWrapper.info(`[ENV] ${message}`, ...(args as []));
  },
  debug: (message: string, ...args: LogArgs[]) => {
    consoleWrapper.debug(`[ENV] ${message}`, ...(args as []));
  },
};

/**
 * 環境変数を安全に取得するユーティリティ
 *
 * @param key 環境変数のキー（VITE_プレフィックスは自動的に処理）
 * @param options 取得オプション（デフォルト値、変換関数など）
 * @returns 環境変数の値、変換された値、またはデフォルト値
 */
export function getEnv<T = string>(key: string, options: EnvOptions<T> = {}): T {
  // デフォルト値の設定
  const defaultValue = options.defaultValue as T;

  // keyが'VITE_'で始まっていない場合は追加する
  const fullKey = key.startsWith('VITE_') ? key : `VITE_${key}`;

  // 環境変数を取得
  const value = import.meta.env[fullKey] as string | undefined;

  // 値が存在しない場合
  if (value === undefined) {
    const severity = options.critical ? 'error' : 'warn';
    const message = `環境変数"${fullKey}"が設定されていません。デフォルト値を使用します。`;

    // 安全なロガーを使用
    if (severity === 'error') {
      safeLogger.error(message);
    } else {
      safeLogger.warn(message);
    }

    return defaultValue;
  }

  // 空文字列の場合
  if (value === '') {
    safeLogger.warn(`環境変数"${fullKey}"が空です。デフォルト値を使用します。`);
    return defaultValue;
  }

  // 変換関数がある場合は変換して返す
  if (options.transform) {
    try {
      return options.transform(value);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      safeLogger.error(`環境変数"${fullKey}"の変換中にエラーが発生しました: ${errorMessage}`);
      return defaultValue;
    }
  }

  // 変換関数がない場合は文字列として返す
  return value as unknown as T;
}

/**
 * デバッグモードかどうかを確認
 * ローカルストレージを使用して一時的にデバッグログを有効化できる機能
 */
export function isDebugMode(): boolean {
  if (typeof window === 'undefined') return false;
  return window.localStorage.getItem('KUECCHA_DEBUG_MODE') === 'true';
}

/**
 * デバッグモードを有効化する
 * コンソールから呼び出せるようにする
 */
export function enableDebugMode(): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem('KUECCHA_DEBUG_MODE', 'true');
  // ロガーの設定を更新
  void import('@/utils/logger').then(({ logger, LogLevel }) => {
    logger.configure({ minLevel: LogLevel.DEBUG });
    logger.info('デバッグモードが有効になりました。ページを再読み込みすると元に戻ります。');
  });
}

/**
 * デバッグモードを無効化する
 */
export function disableDebugMode(): void {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem('KUECCHA_DEBUG_MODE');
  void import('@/utils/logger').then(({ logger, LogLevel }) => {
    logger.configure({ minLevel: ENV.env.isDev ? LogLevel.INFO : LogLevel.WARN });
    logger.info('デバッグモードが無効になりました。');
  });
}

/**
 * Maps API バージョンを取得
 * 開発環境ではweekly、本番環境ではquarterlyを使用
 */
export const getMapsApiVersion = (): string => {
  return getEnv('GOOGLE_MAPS_VERSION', { defaultValue: 'quarterly' });
};

/**
 * Maps APIで使用するライブラリを取得
 */
export const getMapsLibraries = (): string[] => {
  const libraries = getEnv('GOOGLE_MAPS_LIBRARIES', { defaultValue: 'places,geometry,marker' });
  return libraries.split(',');
};

/**
 * 型安全な環境変数へのアクセスを提供するオブジェクト
 */
export const ENV = {
  // Google API関連
  google: {
    API_KEY: getEnv('GOOGLE_API_KEY', { critical: true }),
    MAPS_MAP_ID: getEnv('GOOGLE_MAPS_MAP_ID'),
    SPREADSHEET_ID: getEnv('GOOGLE_SPREADSHEET_ID', { critical: true }),
    // Google Maps API バージョン設定を追加
    MAPS_VERSION: getMapsApiVersion(),
    MAPS_LIBRARIES: getMapsLibraries(),
  },

  // EmailJS関連
  emailjs: {
    SERVICE_ID: getEnv('EMAILJS_SERVICE_ID'),
    TEMPLATE_ID: getEnv('EMAILJS_TEMPLATE_ID'),
    PUBLIC_KEY: getEnv('EMAILJS_PUBLIC_KEY'),
  },

  // PWA関連
  app: {
    NAME: getEnv('APP_NAME', { defaultValue: '佐渡で食えっちゃ' }),
    SHORT_NAME: getEnv('APP_SHORT_NAME', { defaultValue: '食えっちゃ' }),
    DESCRIPTION: getEnv('APP_DESCRIPTION', {
      defaultValue: '佐渡島内の飲食店、駐車場、公共トイレの位置情報を網羅。',
    }),
    USE_GOOGLE_SHEETS: getEnv<boolean>('APP_USE_GOOGLE_SHEETS', {
      defaultValue: false,
      transform: toBool,
    }),
  },

  // 環境フラグ
  env: {
    NODE_ENV: getEnv('NODE_ENV', { defaultValue: 'development' }),
    MODE: import.meta.env.MODE,
    isProd: import.meta.env.PROD,
    isDev: import.meta.env.DEV,
    BASE_URL: import.meta.env.BASE_URL,
    isDebug: isDebugMode(),
  },
};

/**
 * 必須環境変数が正しく設定されているかを検証します
 * @returns 全ての必須環境変数が設定されている場合はtrue、それ以外はfalse
 */
export function validateEnv(): boolean {
  // 必須環境変数のリスト（優先度順）
  const requiredEnvVars = [
    // Google API関連（最重要）
    'VITE_GOOGLE_API_KEY',
    'VITE_GOOGLE_SPREADSHEET_ID',

    // 地図のカスタマイズに関する設定（重要）
    'VITE_GOOGLE_MAPS_MAP_ID',

    // EmailJS関連（フォーム機能に必要）
    'VITE_EMAILJS_SERVICE_ID',
    'VITE_EMAILJS_TEMPLATE_ID',
    'VITE_EMAILJS_PUBLIC_KEY',

    // PWA関連（オプション）
    'VITE_APP_NAME',
    'VITE_APP_SHORT_NAME',
    'VITE_APP_DESCRIPTION',
  ];

  // 重要度が高い（必須）環境変数
  const criticalEnvVars = ['VITE_GOOGLE_API_KEY', 'VITE_GOOGLE_SPREADSHEET_ID'];

  // 不足している環境変数の確認
  const missingEnvVars = requiredEnvVars.filter(envVar => !import.meta.env[envVar]);

  // 重要な環境変数が不足している場合
  const missingCriticalEnvVars = criticalEnvVars.filter(envVar => !import.meta.env[envVar]);

  // 不足している環境変数がある場合
  if (missingEnvVars.length > 0) {
    safeLogger.error(`以下の環境変数が設定されていません: ${missingEnvVars.join(', ')}`);
    safeLogger.info(
      'これらの環境変数を .env ファイルに追加してください。サンプルは .env.example を参照してください。'
    );

    // 重要な環境変数が不足している場合は警告レベルを上げる
    if (missingCriticalEnvVars.length > 0) {
      safeLogger.error(
        '⚠️ 重要: 以下の必須環境変数が設定されていないため、アプリケーションが正常に動作しません:'
      );
      safeLogger.error(missingCriticalEnvVars.join(', '));
      return false;
    }

    // 重要ではない環境変数のみが不足している場合は警告のみ
    safeLogger.warn('一部の機能が制限される可能性があります。');
    return true;
  }

  // 全ての必須環境変数が設定されている
  return true;
}

/**
 * アプリケーション起動時に環境変数の検証を実行し、結果をコンソールに表示
 * @param verbose 詳細なログを出力するかどうか
 */
export function checkEnvironment(verbose: boolean = false): void {
  const isValid = validateEnv();

  if (isValid && verbose && isDevEnvironment()) {
    safeLogger.info('✅ 環境変数の検証が完了しました。必要な環境変数はすべて設定されています。');

    // 開発環境での詳細情報（デバッグ用）
    safeLogger.info('🔧 現在の環境設定:', {
      environment: import.meta.env.MODE,
      baseUrl: import.meta.env.BASE_URL,
      debugMode: isDebugMode(),
    });

    // デバッグモードの表示（新機能）
    if (isDebugMode()) {
      safeLogger.info('🔍 デバッグモードが有効です');
    }
  }
}

// 環境変数の型定義（TypeScript補完のため）
declare global {
  interface ImportMetaEnv {
    // Google API関連
    readonly VITE_GOOGLE_API_KEY: string;
    readonly VITE_GOOGLE_MAPS_MAP_ID: string;
    readonly VITE_GOOGLE_SPREADSHEET_ID: string;

    // Google Maps API バージョン関連を追加
    readonly VITE_GOOGLE_MAPS_VERSION?: string;
    readonly VITE_GOOGLE_MAPS_LIBRARIES?: string;

    // その他は変更なし
    // EmailJS関連
    readonly VITE_EMAILJS_SERVICE_ID: string;
    readonly VITE_EMAILJS_TEMPLATE_ID: string;
    readonly VITE_EMAILJS_PUBLIC_KEY: string;

    // PWA関連
    readonly VITE_APP_NAME: string;
    readonly VITE_APP_SHORT_NAME: string;
    readonly VITE_APP_DESCRIPTION: string;

    // 追加: Google Sheets使用フラグ
    readonly VITE_APP_USE_GOOGLE_SHEETS?: string;

    // 拡張: デバッグモード設定
    readonly VITE_DEBUG?: string;

    // Vite標準の環境変数はここで再定義しない
    // BASE_URL, MODE, DEV, PRODはViteが提供する型定義をそのまま使用
  }
}

// モジュールのエクスポート
export default ENV;
