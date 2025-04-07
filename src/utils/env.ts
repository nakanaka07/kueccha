/**
 * 環境変数管理モジュール
 *
 * 機能:
 * - 型安全な環境変数へのアクセス
 * - 未設定の環境変数の検出と警告
 * - デフォルト値のサポート
 * - 環境変数の検証
 * - 文字列以外の型への変換サポート
 *
 * このモジュールは環境変数管理ガイドラインに準拠しています。
 */

import { LogLevel } from './logger';

import type {
  BooleanEnvValue,
  EnvironmentConfig,
  ImportMetaEnv,
  LogLevel as LogLevelType,
} from '../../env';

// ======================================================================
// 型定義
// ======================================================================

/**
 * 環境変数の取得オプション
 */
interface EnvOptions<T> {
  /** デフォルト値 */
  defaultValue?: T;
  /** 変換関数（文字列から任意の型に変換） */
  transform?: (value: string) => T;
  /** 重要度（true: 必須、false: オプション） */
  critical?: boolean;
}

/**
 * 環境変数検証用の型定義
 */
interface EnvCheck {
  /** 環境変数の名前 */
  name: string;
  /** 検証関数（trueなら有効） */
  validator: (value: any) => boolean;
  /** 必須かどうか */
  required: boolean;
  /** エラーメッセージ */
  message?: string;
}

/**
 * キャッシュエントリの型定義
 */
interface CacheEntry<T> {
  value: T;
  expiry: number;
}

// ======================================================================
// ロギングユーティリティ
// ======================================================================

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

/**
 * ロガーのインスタンスを保持する変数
 * 初期化時は簡易ロガー、loggerモジュールがロードされたら本物のロガーに切り替える
 */
let envLogger: {
  error: (message: string, ...args: unknown[]) => void;
  warn: (message: string, ...args: unknown[]) => void;
  info: (message: string, ...args: unknown[]) => void;
  debug: (message: string, ...args: unknown[]) => void;
} = {
  error: (message: string, ...args: unknown[]) => {
    consoleWrapper.error(`[ENV] ${message}`, ...args);
  },
  warn: (message: string, ...args: unknown[]) => {
    consoleWrapper.warn(`[ENV] ${message}`, ...args);
  },
  info: (message: string, ...args: unknown[]) => {
    consoleWrapper.info(`[ENV] ${message}`, ...args);
  },
  debug: (message: string, ...args: unknown[]) => {
    consoleWrapper.debug(`[ENV] ${message}`, ...args);
  },
};

/**
 * 本物のロガーに置き換える関数
 * logger.tsがロードされた後に呼び出す
 */
export function initializeEnvLogger(logger: typeof envLogger): void {
  envLogger = logger;
}

/**
 * 現在のロガーインスタンスを取得する
 * これにより、初期化前でも初期化後でも同じインターフェースでロガーを使用できる
 */
export function getEnvLogger(): typeof envLogger {
  return envLogger;
}

// ======================================================================
// 値変換ユーティリティ
// ======================================================================

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
 * 文字列をLogLevel型に変換する
 * 有効な値でない場合はデフォルトとしてINFOを返す
 */
export const toLogLevel = (value: string): LogLevel => {
  const lowercased = value.toLowerCase();
  switch (lowercased) {
    case 'error':
      return LogLevel.ERROR;
    case 'warn':
    case 'warning':
      return LogLevel.WARN;
    case 'info':
      return LogLevel.INFO;
    case 'debug':
      return LogLevel.DEBUG;
    default:
      getEnvLogger().warn(`"${value}"は有効なログレベルではありません。INFOを使用します。`);
      return LogLevel.INFO;
  }
};

// ======================================================================
// 環境検出ユーティリティ
// ======================================================================

/**
 * 環境種別を判定するユーティリティ関数（ロギングガイドラインに準拠）
 */
export const isDevEnvironment = (): boolean => {
  return import.meta.env.DEV === true;
};

export const isProdEnvironment = (): boolean => {
  return import.meta.env.PROD === true;
};

export const isTestEnvironment = (): boolean => {
  return import.meta.env.MODE === 'test';
};

// ======================================================================
// キャッシュユーティリティ
// ======================================================================

// キャッシュストレージ
const envCache = new Map<string, CacheEntry<any>>();

/**
 * 関数の結果をキャッシュするユーティリティ
 * @param key キャッシュキー
 * @param fn 実行する関数
 * @param ttlMs キャッシュ有効期間（ミリ秒）
 * @returns 関数の結果（キャッシュヒットの場合はキャッシュから）
 */
export function cachedValue<T>(key: string, fn: () => T, ttlMs: number = 60000): T {
  const now = Date.now();
  const cached = envCache.get(key);

  // キャッシュが有効な場合はそれを返す
  if (cached && cached.expiry > now) {
    return cached.value;
  }

  // キャッシュがない、または期限切れの場合は計算して保存
  const value = fn();
  envCache.set(key, { value, expiry: now + ttlMs });
  return value;
}

/**
 * キャッシュをクリアする
 * @param key 特定のキーのみクリアする場合に指定（省略するとすべてクリア）
 */
export function clearCache(key?: string): void {
  if (key) {
    envCache.delete(key);
  } else {
    envCache.clear();
  }
}

// ======================================================================
// 環境変数アクセスと検証
// ======================================================================

/**
 * 環境変数を安全に取得するユーティリティ
 *
 * @param key 環境変数のキー（必ず VITE_ プレフィックス付きで指定）
 * @param options 取得オプション（デフォルト値、変換関数など）
 * @returns 環境変数の値、変換された値、またはデフォルト値
 */
export function getEnv<T = string>(key: string, options: EnvOptions<T> = {}): T {
  // デフォルト値の設定
  const defaultValue = options.defaultValue as T;

  // 環境変数を取得
  const value = import.meta.env[key as keyof ImportMetaEnv] as string | undefined;

  // 値が存在しない場合
  if (value === undefined) {
    const severity = options.critical ? 'error' : 'warn';
    const message = `環境変数"${key}"が設定されていません。デフォルト値を使用します。`;

    // 現在利用可能なロガーを使用
    if (severity === 'error') {
      getEnvLogger().error(message);
    } else {
      getEnvLogger().warn(message);
    }

    return defaultValue;
  }

  // 空文字列の場合
  if (value === '') {
    getEnvLogger().warn(`環境変数"${key}"が空です。デフォルト値を使用します。`);
    return defaultValue;
  }

  // 変換関数がある場合は変換して返す
  if (options.transform) {
    try {
      return options.transform(value);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      getEnvLogger().error(`環境変数"${key}"の変換中にエラーが発生しました: ${errorMessage}`);
      return defaultValue;
    }
  }

  // 変換関数がない場合は文字列として返す
  return value as unknown as T;
}

/**
 * 環境変数を取得するためのより簡潔なインターフェース
 * MapLoadingError など、単純な使用ケース向けにオブジェクト形式の API を提供
 *
 * @param options キーと任意のデフォルト値を含むオブジェクト
 * @returns 環境変数の値またはデフォルト値
 */
export function getEnvVar<T = string>({
  key,
  defaultValue,
  transform,
  critical = false,
}: {
  key: string;
  defaultValue?: T;
  transform?: (value: string) => T;
  critical?: boolean;
}): T {
  // 空のオプションオブジェクトを作成
  const options: EnvOptions<T> = {};

  // 値が undefined でない場合のみプロパティを追加
  if (defaultValue !== undefined) options.defaultValue = defaultValue;
  if (transform !== undefined) options.transform = transform;
  if (critical !== false) options.critical = critical;

  return getEnv<T>(key, options);
}

/**
 * 環境変数の詳細な検証を行う機能を提供
 * ガイドラインに準拠した形式検証を実装
 *
 * @param checks 検証ルールの配列
 * @returns 全ての検証がパスすればtrue、それ以外はfalse
 */
export function validateEnvDetails(checks: EnvCheck[]): boolean {
  let isValid = true;
  const errors: string[] = [];

  checks.forEach(check => {
    try {
      // 環境変数の存在確認
      const value = import.meta.env[check.name as keyof ImportMetaEnv];

      // 必須なのに存在しない場合
      if (value === undefined && check.required) {
        isValid = false;
        errors.push(check.message || `必須環境変数 "${check.name}" が設定されていません`);
        return;
      }

      // 存在し、バリデーションを通す必要がある場合
      if (value !== undefined) {
        const valid = check.validator(value);

        if (!valid) {
          isValid = false;
          errors.push(check.message || `環境変数 "${check.name}" の値 "${value}" は無効です`);
        }
      }
    } catch (error) {
      isValid = false;
      const errorMessage = error instanceof Error ? error.message : String(error);
      errors.push(`${check.name}: ${errorMessage}`);
    }
  });

  // エラーがある場合はログ出力
  if (!isValid) {
    getEnvLogger().error('環境変数の検証に失敗しました:', { errors });
  } else {
    getEnvLogger().debug('全ての環境変数の検証に成功しました');
  }

  return isValid;
}

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
  const missingEnvVars = requiredEnvVars.filter(
    envVar => !import.meta.env[envVar as keyof ImportMetaEnv]
  );

  // 重要な環境変数が不足している場合
  const missingCriticalEnvVars = criticalEnvVars.filter(
    envVar => !import.meta.env[envVar as keyof ImportMetaEnv]
  );

  // 不足している環境変数がある場合
  if (missingEnvVars.length > 0) {
    getEnvLogger().error(`以下の環境変数が設定されていません: ${missingEnvVars.join(', ')}`);
    getEnvLogger().info(
      'これらの環境変数を .env ファイルに追加してください。サンプルは .env.example を参照してください。'
    );

    // 重要な環境変数が不足している場合は警告レベルを上げる
    if (missingCriticalEnvVars.length > 0) {
      getEnvLogger().error(
        '⚠️ 重要: 以下の必須環境変数が設定されていないため、アプリケーションが正常に動作しません:'
      );
      getEnvLogger().error(missingCriticalEnvVars.join(', '));
      return false;
    }

    // 重要ではない環境変数のみが不足している場合は警告のみ
    getEnvLogger().warn('一部の機能が制限される可能性があります。');
    return true;
  }

  // 全ての必須環境変数が設定されている
  return true;
}

// ======================================================================
// アプリケーション固有の環境変数ユーティリティ
// ======================================================================

/**
 * デバッグモードかどうかを高速に確認（キャッシュ対応）
 * 環境変数とローカルストレージを使用して一時的にデバッグログを有効化できる機能
 */
export function isDebugMode(): boolean {
  // 環境変数のデバッグ設定を優先的に確認
  return cachedValue(
    'debug-mode',
    () => {
      const envDebug = getEnv<BooleanEnvValue>('VITE_DEBUG_MODE', { defaultValue: 'false' });
      if (envDebug === 'true') return true;

      // ローカルストレージによる一時的な上書き（開発環境のみ）
      if (typeof window !== 'undefined' && isDevEnvironment()) {
        return window.localStorage.getItem('KUECCHA_DEBUG_MODE') === 'true';
      }

      return false;
    },
    5000
  ); // 5秒キャッシュ
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
  // キャッシュをクリアして、次回isDebugModeが呼ばれたときに再評価されるようにする
  clearCache('debug-mode');
}

/**
 * デバッグモードを無効化する
 */
export function disableDebugMode(): void {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem('KUECCHA_DEBUG_MODE');
  void import('@/utils/logger').then(({ logger }) => {
    const logLevel = getLogLevel();
    logger.configure({ minLevel: toLogLevel(logLevel) });
    logger.info('デバッグモードが無効になりました。');
  });
  // キャッシュをクリアして、次回isDebugModeが呼ばれたときに再評価されるようにする
  clearCache('debug-mode');
}

/**
 * 環境変数からログレベルを取得
 * VITE_LOG_LEVEL環境変数を優先し、未設定の場合は開発/本番環境に基づいて決定
 */
export function getLogLevel(): LogLevelType {
  return cachedValue(
    'log-level',
    () => {
      return getEnv<LogLevelType>('VITE_LOG_LEVEL', {
        defaultValue: isDevEnvironment() ? 'info' : 'warn',
      });
    },
    60000
  ); // 1分キャッシュ
}

/**
 * Maps API バージョンを取得
 * 開発環境ではweekly、本番環境ではquarterlyを使用
 */
export const getMapsApiVersion = (): string => {
  return getEnv('VITE_GOOGLE_MAPS_VERSION', { defaultValue: 'quarterly' });
};

/**
 * Maps APIで使用するライブラリを取得
 */
export const getMapsLibraries = (): string[] => {
  const libraries = getEnv('VITE_GOOGLE_MAPS_LIBRARIES', {
    defaultValue: 'places,geometry,marker',
  });
  return libraries.split(',');
};

// ======================================================================
// 環境設定チェックとデバッグ
// ======================================================================

/**
 * アプリケーション起動時に環境変数の検証を実行し、結果をコンソールに表示
 * @param verbose 詳細なログを出力するかどうか
 */
export function checkEnvironment(verbose: boolean = false): void {
  // 基本の検証を実行
  const isValid = validateEnv();

  // 詳細な検証ルール
  const detailedChecks: EnvCheck[] = [
    // Google Maps API Key検証
    {
      name: 'VITE_GOOGLE_API_KEY',
      validator: value => typeof value === 'string' && value.length > 10,
      required: true,
      message: 'Google Maps APIキーが設定されていないか無効です',
    },
    // Google Spreadsheet ID検証
    {
      name: 'VITE_GOOGLE_SPREADSHEET_ID',
      validator: value => typeof value === 'string' && (/^[a-zA-Z0-9_-]{20,}$/.exec(value)) !== null,
      required: true,
      message: 'Google SpreadsheetのIDが無効な形式です',
    },
    // ログレベル検証
    {
      name: 'VITE_LOG_LEVEL',
      validator: value => ['error', 'warn', 'info', 'debug'].includes(value.toLowerCase()),
      required: false,
      message: 'ログレベルは error, warn, info, debug のいずれかである必要があります',
    },
    // デバッグモード検証
    {
      name: 'VITE_DEBUG_MODE',
      validator: value => ['true', 'false'].includes(value.toLowerCase()),
      required: false,
      message: 'デバッグモードは true または false である必要があります',
    },
  ];

  // 詳細な検証を実行（開発環境かverboseモードのみ）
  const runDetailedChecks = verbose || isDevEnvironment();
  const detailedValid = runDetailedChecks ? validateEnvDetails(detailedChecks) : true;

  if (isValid && detailedValid && (verbose || isDevEnvironment())) {
    getEnvLogger().info(
      '✅ 環境変数の検証が完了しました。必要な環境変数はすべて設定されています。'
    );

    // 開発環境での詳細情報（デバッグ用）
    getEnvLogger().info('🔧 現在の環境設定:', {
      environment: ENV.env.mode,
      baseUrl: import.meta.env.BASE_URL,
      debugMode: ENV.env.debug,
      version: ENV.app.version,
      buildDate: ENV.app.buildDate,
    });

    // デバッグモードの表示
    if (ENV.env.debug) {
      getEnvLogger().info('🔍 デバッグモードが有効です');
    }

    // 有効な機能フラグの表示
    const enabledFeatures = Object.entries(ENV.features)
      .filter(([_, enabled]) => enabled)
      .map(([name]) => name);

    if (enabledFeatures.length > 0) {
      getEnvLogger().info('✨ 有効な機能:', enabledFeatures);
    }
  }
}

/**
 * 開発用コンソールコマンド
 * グローバルにデバッグ用の関数を登録
 */
export function registerDebugCommands(): void {
  if (isDevEnvironment() && typeof window !== 'undefined') {
    // @ts-ignore - グローバルオブジェクトに追加
    window.__KUECCHA_DEBUG__ = {
      enableDebugMode,
      disableDebugMode,
      getEnv: (key: string) => import.meta.env[key as keyof ImportMetaEnv],
      checkEnvironment: () => checkEnvironment(true),
      clearCache,
      ENV,
    };
    getEnvLogger().debug(
      'デバッグコマンドが登録されました。console.log(window.__KUECCHA_DEBUG__)を実行して確認できます。'
    );
  }
}

// ======================================================================
// 環境変数の値を集約したオブジェクト
// ======================================================================

/**
 * 型安全な環境変数へのアクセスを提供するオブジェクト
 * ガイドラインに準拠したカテゴリ分け
 */
export const ENV: EnvironmentConfig = {
  // アプリケーション基本情報
  app: {
    name: getEnv('VITE_APP_NAME', { defaultValue: '佐渡で食えっちゃ' }),
    shortName: getEnv('VITE_APP_SHORT_NAME', { defaultValue: '食えっちゃ' }),
    description: getEnv('VITE_APP_DESCRIPTION', {
      defaultValue: '佐渡島内の飲食店、駐車場、公共トイレの位置情報を網羅。',
    }),
    version: getEnv('VITE_APP_VERSION', { defaultValue: '1.0.0' }),
    buildDate: getEnv('VITE_APP_BUILD_DATE', { defaultValue: new Date().toISOString() }),
    basePath: getEnv('BASE_PATH', { defaultValue: '/' }),
  },

  // Google API関連
  google: {
    apiKey: getEnv('VITE_GOOGLE_API_KEY', { critical: true }),
    mapsVersion: getMapsApiVersion(),
    mapsLibraries: getMapsLibraries(),
    mapId: getEnv('VITE_GOOGLE_MAPS_MAP_ID', { defaultValue: '' }),
    spreadsheetId: getEnv('VITE_GOOGLE_SPREADSHEET_ID', { critical: true }),
  },

  // EmailJS関連
  emailjs: {
    serviceId: getEnv('VITE_EMAILJS_SERVICE_ID', { defaultValue: '' }),
    templateId: getEnv('VITE_EMAILJS_TEMPLATE_ID', { defaultValue: '' }),
    publicKey: getEnv('VITE_EMAILJS_PUBLIC_KEY', { defaultValue: '' }),
  },

  // 環境設定
  env: {
    mode: isTestEnvironment() ? 'test' : isProdEnvironment() ? 'production' : 'development',
    isDev: isDevEnvironment(),
    isProd: isProdEnvironment(),
    isTest: isTestEnvironment(),
    debug: isDebugMode(),
  },

  // 機能フラグ設定
  features: {
    // Google Sheetsデータソース使用フラグ（名称変更に対応）
    googleSheets: getEnv<boolean>('VITE_ENABLE_GOOGLE_SHEETS', {
      defaultValue: false,
      transform: toBool,
    }),
    offlineMode: getEnv<boolean>('VITE_ENABLE_OFFLINE_MODE', {
      defaultValue: false,
      transform: toBool,
    }),
    analytics: getEnv<boolean>('VITE_ENABLE_ANALYTICS', {
      defaultValue: false,
      transform: toBool,
    }),
    markerClustering: getEnv<boolean>('VITE_ENABLE_MARKER_CLUSTERING', {
      defaultValue: true,
      transform: toBool,
    }),
    verboseLogging: getEnv<boolean>('VITE_ENABLE_VERBOSE_LOGGING', {
      defaultValue: false,
      transform: toBool,
    }),
  },

  // UI設定
  ui: {
    map: {
      initialZoom: getEnv<number>('VITE_UI_MAP_INITIAL_ZOOM', {
        defaultValue: 11,
        transform: toNumber,
      }),
      initialCenter: {
        lat: getEnv<number>('VITE_UI_MAP_INITIAL_CENTER_LAT', {
          defaultValue: 38.048,
          transform: toNumber,
        }),
        lng: getEnv<number>('VITE_UI_MAP_INITIAL_CENTER_LNG', {
          defaultValue: 138.409,
          transform: toNumber,
        }),
      },
      // マップ初期化設定を追加
      init: {
        delay: getEnv<number>('VITE_MAP_INIT_DELAY', {
          defaultValue: 100,
          transform: toNumber,
        }),
        debug: getEnv<boolean>('VITE_MAP_DEBUG_MODE', {
          defaultValue: false,
          transform: toBool,
        }),
      },
    },
  },

  // ログ設定
  logging: {
    level: getLogLevel(),
  },

  // デバッグ設定
  debug: {
    ENABLE_MAP_DEBUG: getEnv<boolean>('VITE_DEBUG_MAP', {
      defaultValue: false,
      transform: toBool,
    }),
  },
};

// 開発環境では自動的にデバッグコマンドを登録
if (isDevEnvironment()) {
  registerDebugCommands();
}

// モジュールのデフォルトエクスポート
export default ENV;
