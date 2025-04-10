/**
 * 環境変数管理モジュール
 *
 * 機能:
 * - 型安全な環境変数へのアクセス
 * - 未設定の環境変数の検出と警告
 * - デフォルト値サポートと型変換
 * - 環境変数の検証
 * - パフォーマンス最適化（キャッシュ機能）
 *
 * Google Maps統合ガイドライン、環境変数管理ガイドライン、
 * ロガー使用ガイドラインおよびコード最適化ガイドラインに準拠
 */

import { LogLevel } from './logger';

// 環境変数の型定義をインポート
import type { LogLevelType } from '../types/env';

// ======================================================================
// 型定義
// ======================================================================

/**
 * 環境変数の取得オプション
 */
interface EnvOptions<T> {
  /** 環境変数キー（VITE_プレフィックス付き） */
  key: string;
  /** デフォルト値 */
  defaultValue?: T;
  /** 変換関数（文字列から任意の型に変換） */
  transform?: (value: string) => T;
  /** 重要度（true: 必須、false: オプション） */
  critical?: boolean;
  /** 環境変数の説明（ログ用） */
  description?: string;
}

/**
 * 環境変数検証用の型定義
 */
interface EnvCheck {
  /** 環境変数の名前 */
  name: string;
  /** 検証関数（trueなら有効） */
  validator: (value: string) => boolean;
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

/**
 * 環境変数設定の型定義
 */
interface AppEnvironmentConfig {
  // アプリケーション基本情報
  app: {
    name: string;
    shortName: string;
    description: string;
    version: string;
    buildDate: string;
    basePath: string;
  };
  // Google API関連（Google Maps統合ガイドラインに準拠）
  google: {
    apiKey: string;
    mapsVersion: string;
    mapsLibraries: string[];
    mapId: string;
    spreadsheetId: string;
    // 新規追加：Google Maps統合ガイドラインに準拠した季節別マップID
    springMapId: string;
    summerMapId: string;
    autumnMapId: string;
    winterMapId: string;
    // 新規追加：アクセシビリティ対応マップID
    accessibleMapId: string;
  };
  // EmailJS関連
  emailjs: {
    serviceId: string;
    templateId: string;
    publicKey: string;
  };
  // 環境設定
  env: {
    mode: string;
    isDev: boolean;
    isProd: boolean;
    isTest: boolean;
    debug: boolean;
  };
  // 機能フラグ設定
  features: {
    googleSheets: boolean;
    offlineMode: boolean;
    analytics: boolean;
    markerClustering: boolean;
    verboseLogging: boolean;
  };
  // UI設定
  ui: {
    map: {
      initialZoom: number;
      initialCenter: {
        lat: number;
        lng: number;
      };
      init: {
        delay: number;
        debug: boolean;
      };
    };
  };
  // ログ設定
  logging: {
    level: LogLevelType;
  };
  // デバッグ設定
  debug: {
    ENABLE_MAP_DEBUG: boolean;
  };
}

// ======================================================================
// ロギングユーティリティ
// ======================================================================

// ロガーのインスタンスを保持する変数
// ロガー使用ガイドラインに準拠: 構造化ログを使用し、ログレベルを適切に設定
let envLogger = {
  error: (message: string, ...args: unknown[]) => {
    globalThis.console.error(`[ENV] ${message}`, ...args);
  },
  warn: (message: string, ...args: unknown[]) => {
    globalThis.console.warn(`[ENV] ${message}`, ...args);
  },
  info: (message: string, ...args: unknown[]) => {
    globalThis.console.info(`[ENV] ${message}`, ...args);
  },
  debug: (message: string, ...args: unknown[]) => {
    globalThis.console.debug(`[ENV] ${message}`, ...args);
  },
};

/**
 * 本物のロガーに置き換える関数（logger.tsがロードされた後に呼び出す）
 * ロガー使用ガイドラインに準拠: 初期化パターン
 */
export function initializeEnvLogger(logger: typeof envLogger): void {
  envLogger = logger;
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
      envLogger.warn(`"${value}"は有効なログレベルではありません。INFOを使用します。`, {
        component: 'EnvUtils',
        action: 'convert_log_level',
        invalidValue: value,
      });
      return LogLevel.INFO;
  }
};

// ======================================================================
// 環境検出ユーティリティ
// ======================================================================

/**
 * 環境種別を判定するユーティリティ関数（ロギングガイドラインに準拠）
 */
export const isDevEnvironment = (): boolean => import.meta.env.DEV === true;
export const isProdEnvironment = (): boolean => import.meta.env.PROD === true;
export const isTestEnvironment = (): boolean => import.meta.env.MODE === 'test';

// ======================================================================
// キャッシュユーティリティ
// ======================================================================

// キャッシュストレージ
// コード最適化ガイドラインに準拠: メモリ使用量の最適化
const envCache = new Map<string, CacheEntry<unknown>>();

/**
 * 関数の結果をキャッシュするユーティリティ
 * コード最適化ガイドラインに準拠: パフォーマンス最適化
 * @param key キャッシュキー
 * @param fn 実行する関数
 * @param ttlMs キャッシュ有効期間（ミリ秒）
 * @returns 関数の結果（キャッシュヒットの場合はキャッシュから）
 */
export function cachedValue<T>(key: string, fn: () => T, ttlMs: number = 60000): T {
  const now = Date.now();
  const cached = envCache.get(key);

  if (cached && cached.expiry > now) {
    return cached.value as T;
  }

  const value = fn();
  envCache.set(key, { value, expiry: now + ttlMs });
  return value;
}

/**
 * キャッシュをクリアする
 * @param key 特定のキーのみクリアする場合に指定（省略するとすべてクリア）
 */
export function clearCache(key?: string): void {
  if (key !== undefined) {
    if (key.trim().length > 0) {
      envCache.delete(key);
      return;
    }
  }
  envCache.clear();
}

// ======================================================================
// 環境変数アクセスと検証
// ======================================================================

/**
 * 環境変数を安全に取得するユーティリティ
 * 環境変数管理ガイドラインに準拠した統一インターフェース
 */
export function getEnvVar<T = string>({
  key,
  defaultValue,
  transform,
  critical = false,
  description,
}: EnvOptions<T>): T {
  // キャッシュキー（頻繁なアクセスを最適化）
  const cacheKey = `env_var_${key}`;
  return cachedValue(
    cacheKey,
    () => {
      // 環境変数を取得（型安全にアクセス）
      const envValue =
        key in import.meta.env
          ? (import.meta.env as Record<string, string | boolean | undefined>)[key]
          : undefined;
      const value = typeof envValue === 'string' ? envValue : undefined;

      // コンテキスト情報の構築（ロガーガイドラインに準拠）
      const logContext = {
        component: 'EnvManager',
        action: 'get_env_var',
        envKey: key,
        hasValue: value !== undefined,
        hasDefaultValue: defaultValue !== undefined,
        description,
      };

      // 値が存在しない場合
      if (value === undefined) {
        const message = `環境変数"${key}"が設定されていません${defaultValue !== undefined ? '。デフォルト値を使用します' : ''}。`;

        if (critical) {
          envLogger.error(message, logContext);
        } else {
          envLogger.warn(message, logContext);
        }

        return defaultValue as T;
      }

      // 空文字列の場合
      if (value === '') {
        envLogger.warn(
          `環境変数"${key}"が空です。${defaultValue !== undefined ? 'デフォルト値を使用します。' : ''}`,
          logContext
        );
        // 空文字列で、デフォルト値がある場合はデフォルト値を返す
        if (defaultValue !== undefined) {
          return defaultValue as T;
        }
        // 空文字列のままでOK
      }

      // 変換関数がある場合は変換して返す
      if (transform) {
        try {
          return transform(value);
        } catch (error: unknown) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          envLogger.error(`環境変数"${key}"の変換中にエラーが発生しました: ${errorMessage}`, {
            ...logContext,
            error: errorMessage,
          });
          return defaultValue as T;
        }
      }

      // 変換関数がない場合は文字列として返す
      return value as unknown as T;
    },
    critical ? 10000 : 60000 // 重要な変数は10秒、それ以外は1分キャッシュ
  );
}

/**
 * 環境変数の詳細な検証を行う機能
 * @param checks 検証ルールの配列
 * @returns 全ての検証がパスすればtrue、それ以外はfalse
 */
export function validateEnvDetails(checks: EnvCheck[]): boolean {
  let isValid = true;
  const errors: string[] = [];
  const validationStart = performance.now();
  const processedVars: string[] = [];

  // 機密情報をマスクする関数
  // セキュリティ強化: ロガー使用ガイドラインに準拠
  const maskSensitiveValue = (varName: string, value: string | undefined): string => {
    if (value === undefined) return '[未設定]';

    // APIキーなど機密性の高い情報をマスク
    const SENSITIVE_VAR_PATTERNS = [/key/i, /token/i, /secret/i, /password/i, /api/i];

    const isSensitive = SENSITIVE_VAR_PATTERNS.some(pattern => pattern.test(varName));
    if (isSensitive) {
      if (value.length <= 8) return '********';
      return value.substring(0, 4) + '****' + value.substring(value.length - 4);
    }

    return value;
  };

  checks.forEach(check => {
    processedVars.push(check.name);
    try {
      // 環境変数の存在確認
      const value =
        check.name in import.meta.env
          ? ((import.meta.env as Record<string, string | boolean | undefined>)[
              check.name
            ] as string)
          : undefined;

      // 必須なのに存在しない場合
      if (value === undefined) {
        if (check.required) {
          isValid = false;
          errors.push(check.message ?? `必須環境変数 "${check.name}" が設定されていません`);
        }
        return;
      }

      // 存在する場合はバリデーションを実行
      // 文字列値が確実に存在する場合のみバリデーターを実行
      const valid = typeof value === 'string' ? check.validator(value) : false;
      if (!valid) {
        isValid = false;
        // 機密性の高い値はマスクして表示
        const maskedValue = maskSensitiveValue(check.name, value);
        errors.push(check.message ?? `環境変数 "${check.name}" の値 "${maskedValue}" は無効です`);
      }
    } catch (error: unknown) {
      isValid = false;
      const errorMessage = error instanceof Error ? error.message : String(error);
      errors.push(`${check.name}: ${errorMessage}`);
    }
  });

  // 検証にかかった時間を計測
  const validationTime = performance.now() - validationStart;

  // エラーがある場合はログ出力
  if (errors.length > 0) {
    envLogger.error('環境変数の検証に失敗しました:', {
      component: 'EnvValidator',
      action: 'validate_details',
      errors,
      processedVarCount: processedVars.length,
      failedVarCount: errors.length,
      validationTimeMs: Math.round(validationTime),
    });
  } else {
    envLogger.debug('全ての環境変数の検証に成功しました', {
      component: 'EnvValidator',
      action: 'validate_details',
      processedVarCount: processedVars.length,
      checkedVars: processedVars,
      validationTimeMs: Math.round(validationTime),
    });
  }

  return isValid;
}

/**
 * 必須環境変数が正しく設定されているかを検証します
 * @returns 全ての必須環境変数が設定されている場合はtrue、それ以外はfalse
 */
export function validateEnv(): boolean {
  // 必須環境変数のリスト（Google Maps統合ガイドラインに準拠）
  const requiredEnvVars = [
    // Google API関連（最重要）
    'VITE_GOOGLE_API_KEY',
    'VITE_GOOGLE_SPREADSHEET_ID',
    // 地図のカスタマイズに関する設定
    'VITE_GOOGLE_MAPS_MAP_ID',
  ];

  // 重要度が高い（必須）環境変数
  const criticalEnvVars = ['VITE_GOOGLE_API_KEY', 'VITE_GOOGLE_SPREADSHEET_ID'];

  // 不足している環境変数の確認
  const missingEnvVars = requiredEnvVars.filter(envVar => {
    const value =
      envVar in import.meta.env
        ? (import.meta.env as Record<string, string | boolean | undefined>)[envVar]
        : undefined;
    return value === undefined || value === '';
  });

  // 重要な環境変数が不足している場合
  const missingCriticalEnvVars = criticalEnvVars.filter(envVar => {
    const value =
      envVar in import.meta.env
        ? (import.meta.env as Record<string, string | boolean | undefined>)[envVar]
        : undefined;
    return value === undefined || value === '';
  });

  // 不足している環境変数がある場合
  if (missingEnvVars.length > 0) {
    envLogger.error(`以下の環境変数が設定されていません: ${missingEnvVars.join(', ')}`, {
      component: 'EnvValidator',
      action: 'validate_required',
      missingVars: missingEnvVars,
    });

    envLogger.info(
      'これらの環境変数を .env ファイルに追加してください。サンプルは .env.example を参照してください。',
      { component: 'EnvValidator', action: 'provide_help' }
    );

    // 重要な環境変数が不足している場合は警告レベルを上げる
    if (missingCriticalEnvVars.length > 0) {
      envLogger.error(
        '⚠️ 重要: 以下の必須環境変数が設定されていないため、アプリケーションが正常に動作しません:',
        {
          component: 'EnvValidator',
          action: 'critical_warning',
          missingCriticalVars: missingCriticalEnvVars,
        }
      );
      return false;
    }

    // 重要ではない環境変数のみが不足している場合は警告のみ
    envLogger.warn('一部の機能が制限される可能性があります。', {
      component: 'EnvValidator',
      action: 'non_critical_warning',
    });
    return true;
  }

  // 全ての必須環境変数が設定されている
  envLogger.debug('全ての必須環境変数が設定されています', {
    component: 'EnvValidator',
    action: 'validation_success',
  });
  return true;
}

/**
 * Google Maps API関連の環境変数を詳細に検証する
 * Google Maps統合ガイドラインに準拠
 */
export function validateGoogleMapsEnvDetails(): boolean {
  const googleMapsChecks: EnvCheck[] = [
    {
      name: 'VITE_GOOGLE_API_KEY',
      validator: value => typeof value === 'string' && value.length > 10,
      required: true,
      message: 'Google Maps APIキーが無効な形式です。10文字以上の有効なAPIキーが必要です。',
    },
    {
      name: 'VITE_GOOGLE_MAPS_MAP_ID',
      validator: value => value === '' || (typeof value === 'string' && value.trim().length > 0),
      required: false,
      message:
        'Google Maps MapIDが設定されていますが、空白文字のみです。有効なMapIDを設定するか、完全に空にしてください。',
    },
    {
      name: 'VITE_GOOGLE_MAPS_VERSION',
      validator: value =>
        ['weekly', 'quarterly', 'beta'].includes(value) || /^\d+\.\d+(\.\d+)?$/.test(value),
      required: false,
      message:
        'Google Maps APIバージョンは "weekly", "quarterly", "beta" または有効なバージョン番号である必要があります。',
    },
    {
      name: 'VITE_GOOGLE_MAPS_LIBRARIES',
      validator: value => {
        const validLibraries = ['maps', 'marker', 'places', 'drawing', 'geometry', 'visualization'];
        const libraries = value.split(',');
        return libraries.every(lib => validLibraries.includes(lib.trim()));
      },
      required: false,
      message:
        'Google Maps ライブラリの指定が無効です。有効なライブラリ名をカンマ区切りで指定してください。',
    },
    {
      name: 'VITE_GOOGLE_SPREADSHEET_ID',
      validator: value =>
        typeof value === 'string' && value.length > 0 && /^[a-zA-Z0-9_-]{20,}$/.test(value),
      required: true,
      message: 'Google SpreadsheetのIDが無効な形式です。正しいIDを設定してください。',
    },
  ];

  // 詳細な検証を実行
  const isValid = validateEnvDetails(googleMapsChecks);

  if (isValid) {
    envLogger.info('Google Maps関連の環境変数の検証に成功しました', {
      component: 'GoogleMapsEnvValidator',
      action: 'validate_maps_env',
    });
  }

  return isValid;
}

// ======================================================================
// Google Maps API固有の環境変数ユーティリティ（Google Maps統合ガイドライン準拠）
// ======================================================================

/**
 * Maps API バージョンを取得
 * Google Maps統合ガイドラインに準拠
 */
export const getMapsApiVersion = (): string => {
  return getEnvVar({
    key: 'VITE_GOOGLE_MAPS_VERSION',
    defaultValue: isProdEnvironment() ? 'quarterly' : 'weekly',
    description: 'Google Maps APIバージョン',
  });
};

/**
 * Maps APIで使用するライブラリを取得
 * Google Maps統合ガイドラインに準拠
 */
export const getMapsLibraries = (): string[] => {
  const libraries = getEnvVar({
    key: 'VITE_GOOGLE_MAPS_LIBRARIES',
    defaultValue: 'places,geometry,marker',
    description: 'Google Maps APIで使用するライブラリ（カンマ区切り）',
  });
  return libraries.split(',').map(lib => lib.trim());
};

/**
 * Google Maps APIキーの検証
 * Google Maps統合ガイドラインに準拠
 */
export const validateGoogleMapsConfig = (): { isValid: boolean; messages: string[] } => {
  const messages: string[] = [];
  let isValid = true;

  // APIキーの検証
  const apiKey = getEnvVar({
    key: 'VITE_GOOGLE_API_KEY',
    defaultValue: '',
    description: 'Google Maps APIキー',
  });

  if (apiKey === '') {
    messages.push('Google Maps APIキーが設定されていません');
    isValid = false;
  } else if (apiKey.length < 10) {
    messages.push('Google Maps APIキーが短すぎるか不正な形式です');
    isValid = false;
  }

  // MapIDの検証
  const mapId = getEnvVar({
    key: 'VITE_GOOGLE_MAPS_MAP_ID',
    defaultValue: '',
    description: 'Google Maps MapID',
  });

  // 空白文字のみのMapIDをチェック（より厳密な条件式）
  const hasMapId = typeof mapId === 'string' && mapId.length > 0;
  const isEmptyMapId = hasMapId && mapId.trim().length === 0;
  if (isEmptyMapId) {
    messages.push('Google Maps MapIDが設定されていますが、空白文字のみです');
    isValid = false;
  }

  // APIキーのセキュリティ制限の検証
  const apiKeyRestrictions = getEnvVar({
    key: 'VITE_GOOGLE_API_KEY_RESTRICTIONS',
    defaultValue: false,
    transform: toBool,
    description: 'Google APIキーに制限が設定されているか',
  });

  if (!apiKeyRestrictions && isProdEnvironment()) {
    messages.push('本番環境でAPIキーに制限が設定されていません。セキュリティリスクがあります');
    isValid = false;
  }

  // ログ出力
  if (!isValid) {
    envLogger.error('Google Maps設定の検証に失敗しました', {
      component: 'GoogleMapsEnvValidator',
      action: 'validate_maps_config',
      messages,
    });
  } else {
    envLogger.debug('Google Maps設定の検証に成功しました', {
      component: 'GoogleMapsEnvValidator',
      action: 'validate_maps_config',
    });
  }

  return { isValid, messages };
};

// ======================================================================
// ロギング設定固有の環境変数ユーティリティ（ロガー使用ガイドライン準拠）
// ======================================================================

/**
 * デバッグモードかどうかを高速に確認（キャッシュ対応）
 * 環境変数とローカルストレージを使用して一時的にデバッグログを有効化できる機能
 */
export function isDebugMode(): boolean {
  return cachedValue(
    'debug-mode',
    () => {
      const envDebug = getEnvVar({
        key: 'VITE_DEBUG_MODE',
        defaultValue: 'false',
        description: 'デバッグモードの有効化フラグ',
      });

      if (envDebug === 'true') return true;

      // ローカルストレージによる一時的な上書き（開発環境のみ）
      if (typeof window !== 'undefined' && isDevEnvironment()) {
        return window.localStorage.getItem('KUECCHA_DEBUG_MODE') === 'true';
      }

      return false;
    },
    5000 // 5秒キャッシュ
  );
}

/**
 * デバッグモードを有効化する
 * コンソールから呼び出せるようにする（ロガーガイドラインに準拠）
 */
export function enableDebugMode(): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem('KUECCHA_DEBUG_MODE', 'true');

  void import('./logger').then(({ logger, LogLevel }) => {
    logger.configure({ minLevel: LogLevel.DEBUG });
    logger.info('デバッグモードが有効になりました。ページを再読み込みすると元に戻ります。', {
      component: 'DebugManager',
      action: 'enable_debug_mode',
    });
  });

  clearCache('debug-mode');
}

/**
 * デバッグモードを無効化する
 */
export function disableDebugMode(): void {
  // ブラウザ環境でのみ実行
  if (typeof window !== 'undefined') {
    window.localStorage.removeItem('KUECCHA_DEBUG_MODE');

    void import('./logger').then(({ logger }) => {
      const logLevel = getLogLevel();
      logger.configure({ minLevel: toLogLevel(logLevel) });
      logger.info('デバッグモードが無効になりました。', {
        component: 'DebugManager',
        action: 'disable_debug_mode',
      });
    });

    clearCache('debug-mode');
  }
}

/**
 * 環境変数からログレベルを取得
 * VITE_LOG_LEVEL環境変数を優先し、未設定の場合は開発/本番環境に基づいて決定
 */
export function getLogLevel(): LogLevelType {
  return cachedValue(
    'log-level',
    () => {
      return getEnvVar({
        key: 'VITE_LOG_LEVEL',
        defaultValue: isDevEnvironment() ? 'info' : 'warn',
        description: 'ロギングレベル (error, warn, info, debug)',
      });
    },
    60000 // 1分キャッシュ
  );
}

// ======================================================================
// 環境設定チェックとデバッグ
// ======================================================================

/**
 * アプリケーション起動時に環境変数の検証を実行し、結果をコンソールに表示
 *
 * コード最適化ガイドラインとGoogle Maps統合ガイドラインに準拠した実装
 * @param verbose 詳細なログを出力するかどうか
 * @returns 検証結果（成功した場合true）
 */
export function checkEnvironment(verbose: boolean = false): boolean {
  try {
    // 基本の検証を実行
    const isValid = validateEnv();

    // 詳細な検証ルール（複数のガイドラインに準拠）
    const detailedChecks: EnvCheck[] = [
      // Google Maps API Key検証（Google Maps統合ガイドラインに準拠）
      {
        name: 'VITE_GOOGLE_API_KEY',
        validator: value => typeof value === 'string' && value.length > 10,
        required: true,
        message: 'Google Maps APIキーが設定されていないか無効です',
      },
      // Google Spreadsheet ID検証
      {
        name: 'VITE_GOOGLE_SPREADSHEET_ID',
        validator: value =>
          typeof value === 'string' && value.length > 0 && /^[a-zA-Z0-9_-]{20,}$/.test(value),
        required: true,
        message: 'Google SpreadsheetのIDが無効な形式です',
      },
      // ログレベル検証（ロガー使用ガイドラインに準拠）
      {
        name: 'VITE_LOG_LEVEL',
        validator: value => ['error', 'warn', 'info', 'debug'].includes(value.toLowerCase()),
        required: false,
        message: 'ログレベルは error, warn, info, debug のいずれかである必要があります',
      },
      // マップ初期化設定の検証
      {
        name: 'VITE_MAP_INIT_DELAY',
        validator: value => {
          const num = Number(value);
          return !isNaN(num) && num >= 0 && num <= 5000;
        },
        required: false,
        message: 'マップ初期化遅延時間は0〜5000の範囲で指定してください',
      },
      // 新たに追加: マップバージョン検証
      {
        name: 'VITE_GOOGLE_MAPS_VERSION',
        validator: value =>
          !value ||
          ['weekly', 'quarterly', 'beta'].includes(value) ||
          /^\d+\.\d+(\.\d+)?$/.test(value),
        required: false,
        message:
          'Maps APIバージョンは "weekly", "quarterly", "beta" または数字形式のバージョンである必要があります',
      },
      // 新たに追加: ライブラリ検証
      {
        name: 'VITE_GOOGLE_MAPS_LIBRARIES',
        validator: value => {
          if (!value) return true; // 空の場合は有効（デフォルト値が使用される）
          const validLibraries = [
            'maps',
            'marker',
            'places',
            'drawing',
            'geometry',
            'visualization',
          ];
          return value.split(',').every(lib => validLibraries.includes(lib.trim()));
        },
        required: false,
        message: 'Maps APIライブラリ指定は有効なライブラリ名をカンマ区切りで指定してください',
      },
    ];

    // 詳細な検証を実行（開発環境かverboseモードのみ）
    const runDetailedChecks = verbose || isDevEnvironment();
    const detailedValid = runDetailedChecks ? validateEnvDetails(detailedChecks) : true;
    if (isValid && detailedValid) {
      if (verbose || isDevEnvironment()) {
        envLogger.info(
          '✅ 環境変数の検証が完了しました。必要な環境変数はすべて設定されています。',
          {
            component: 'EnvCheck',
            action: 'validation_success',
          }
        );
      }

      // Google Maps API設定の検証（Google Maps統合ガイドラインに準拠）
      const mapsConfig = validateGoogleMapsConfig();

      return mapsConfig.isValid;
    }

    return false;
  } catch (error) {
    // エラーハンドリング（ロガー使用ガイドラインに準拠）
    envLogger.error('環境変数検証中にエラーが発生しました', {
      component: 'EnvCheck',
      action: 'validation_error',
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });

    return false;
  }
}

/**
 * 開発用コンソールコマンドを登録
 * デバッグ用のグローバル関数を提供
 */
export function registerDebugCommands(): void {
  if (isDevEnvironment() && typeof window !== 'undefined') {
    // @ts-expect-error - グローバルオブジェクトに追加
    window.__KUECCHA_DEBUG__ = {
      enableDebugMode,
      disableDebugMode,
      getEnv: (key: string) =>
        key in import.meta.env
          ? (import.meta.env as Record<string, string | boolean | undefined>)[key]
          : undefined,
      checkEnvironment: () => checkEnvironment(true),
      clearCache,
      ENV,
      validateGoogleMapsEnvDetails, // Google Maps検証を追加
    };

    envLogger.debug(
      'デバッグコマンドが登録されました。console.log(window.__KUECCHA_DEBUG__)を実行して確認できます。',
      { component: 'DebugManager', action: 'register_commands' }
    );
  }
}

// ======================================================================
// 環境変数の値を集約したオブジェクト
// ======================================================================

/**
 * 型安全な環境変数へのアクセスを提供するオブジェクト
 * 環境変数管理ガイドラインに準拠したカテゴリ分け
 */
export const ENV: AppEnvironmentConfig = {
  // アプリケーション基本情報
  app: {
    name: getEnvVar({ key: 'VITE_APP_NAME', defaultValue: '佐渡で食えっちゃ' }),
    shortName: getEnvVar({ key: 'VITE_APP_SHORT_NAME', defaultValue: '食えっちゃ' }),
    description: getEnvVar({
      key: 'VITE_APP_DESCRIPTION',
      defaultValue: '佐渡島内の飲食店、駐車場、公共トイレの位置情報を網羅。',
    }),
    version: getEnvVar({ key: 'VITE_APP_VERSION', defaultValue: '1.0.0' }),
    buildDate: getEnvVar({ key: 'VITE_APP_BUILD_DATE', defaultValue: new Date().toISOString() }),
    basePath: getEnvVar({ key: 'BASE_PATH', defaultValue: '/' }),
  },

  // Google API関連（Google Maps統合ガイドラインに準拠）
  google: {
    apiKey: getEnvVar({ key: 'VITE_GOOGLE_API_KEY', critical: true }),
    mapsVersion: getMapsApiVersion(),
    mapsLibraries: getMapsLibraries(),
    mapId: getEnvVar({ key: 'VITE_GOOGLE_MAPS_MAP_ID', defaultValue: '' }),
    spreadsheetId: getEnvVar({ key: 'VITE_GOOGLE_SPREADSHEET_ID', critical: true }),
    // 季節別のマップIDを追加（Google Maps統合ガイドラインに準拠）
    springMapId: getEnvVar({ key: 'VITE_GOOGLE_MAPS_SPRING_MAP_ID', defaultValue: '' }),
    summerMapId: getEnvVar({ key: 'VITE_GOOGLE_MAPS_SUMMER_MAP_ID', defaultValue: '' }),
    autumnMapId: getEnvVar({ key: 'VITE_GOOGLE_MAPS_AUTUMN_MAP_ID', defaultValue: '' }),
    winterMapId: getEnvVar({ key: 'VITE_GOOGLE_MAPS_WINTER_MAP_ID', defaultValue: '' }),
    // アクセシブル版のマップID（Google Maps統合ガイドラインに準拠）
    accessibleMapId: getEnvVar({ key: 'VITE_GOOGLE_MAPS_ACCESSIBLE_MAP_ID', defaultValue: '' }),
  },

  // EmailJS関連
  emailjs: {
    serviceId: getEnvVar({ key: 'VITE_EMAILJS_SERVICE_ID', defaultValue: '' }),
    templateId: getEnvVar({ key: 'VITE_EMAILJS_TEMPLATE_ID', defaultValue: '' }),
    publicKey: getEnvVar({ key: 'VITE_EMAILJS_PUBLIC_KEY', defaultValue: '' }),
  },

  // 環境設定
  env: {
    mode: isTestEnvironment() ? 'test' : isProdEnvironment() ? 'production' : 'development',
    isDev: isDevEnvironment(),
    isProd: isProdEnvironment(),
    isTest: isTestEnvironment(),
    debug: isDebugMode(),
  },

  // 機能フラグ設定（命名規則の一貫性を確保）
  features: {
    googleSheets: getEnvVar({
      key: 'VITE_ENABLE_GOOGLE_SHEETS',
      defaultValue: false,
      transform: toBool,
    }),
    offlineMode: getEnvVar({
      key: 'VITE_ENABLE_OFFLINE_MODE',
      defaultValue: false,
      transform: toBool,
    }),
    analytics: getEnvVar({
      key: 'VITE_ENABLE_ANALYTICS',
      defaultValue: false,
      transform: toBool,
    }),
    markerClustering: getEnvVar({
      key: 'VITE_ENABLE_MARKER_CLUSTERING',
      defaultValue: true,
      transform: toBool,
    }),
    verboseLogging: getEnvVar({
      key: 'VITE_ENABLE_VERBOSE_LOGGING',
      defaultValue: false,
      transform: toBool,
    }),
  },

  // UI設定
  ui: {
    map: {
      initialZoom: getEnvVar({
        key: 'VITE_UI_MAP_INITIAL_ZOOM',
        defaultValue: 11,
        transform: toNumber,
      }),
      initialCenter: {
        lat: getEnvVar({
          key: 'VITE_UI_MAP_INITIAL_CENTER_LAT',
          defaultValue: 38.048,
          transform: toNumber,
        }),
        lng: getEnvVar({
          key: 'VITE_UI_MAP_INITIAL_CENTER_LNG',
          defaultValue: 138.409,
          transform: toNumber,
        }),
      },
      init: {
        delay: getEnvVar({
          key: 'VITE_MAP_INIT_DELAY',
          defaultValue: 100,
          transform: toNumber,
        }),
        debug: getEnvVar({
          key: 'VITE_MAP_DEBUG_MODE',
          defaultValue: false,
          transform: toBool,
        }),
      },
    },
  },

  // ログ設定（ロガー使用ガイドラインに準拠）
  logging: {
    level: getLogLevel(),
  },

  // デバッグ設定
  debug: {
    ENABLE_MAP_DEBUG: getEnvVar({
      key: 'VITE_DEBUG_MAP',
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
