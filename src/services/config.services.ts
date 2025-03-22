/**
 * アプリケーション設定管理
 *
 * このサービスは設定の読み込み、検証、アクセスを一元管理し、
 * 環境変数へのアクセスを標準化します。アプリケーション全体で
 * 一貫した設定管理を提供するためのシングルトンパターンを採用しています。
 */

import {
  MAPS_CONFIG,
  SHEETS_CONFIG,
  MARKER_CONFIG,
  ERROR_MESSAGES,
  INITIAL_VISIBILITY,
  AREAS,
} from '../constants';
import type {
  AppConfig,
  AreaType,
  EnvironmentName,
  EnvironmentConfig,
  LogLevel,
  MapsConfig,
  SheetsConfig,
  DisplayConfig,
  MapTypeId,
  AppInfoConfig,
  ErrorHandlingConfig,
  EnvValueOptions,
} from '../types';
import { getEnvValue, getEnvValueAsBoolean, getEnvValueAsNumber } from '../utils/env.utils';
import { logger } from '../utils/logger.utils';


/**
 * 必須環境変数リスト
 */
const REQUIRED_ENV_VARS = [
  'VITE_GOOGLE_MAPS_API_KEY',
  'VITE_GOOGLE_MAPS_MAP_ID',
  'VITE_GOOGLE_SHEETS_API_KEY',
  'VITE_GOOGLE_SPREADSHEET_ID',
] as const;

/**
 * 環境別の基本設定
 */
const ENV_CONFIGS: Record<EnvironmentName, EnvironmentConfig> = {
  development: { name: 'development', debug: true, logLevel: 'debug', cacheEnabled: false },
  production: { name: 'production', debug: false, logLevel: 'error', cacheEnabled: true },
  test: { name: 'test', debug: true, logLevel: 'info', cacheEnabled: false },
};

/**
 * 設定管理クラス
 * シングルトンパターンを使用してアプリケーション全体で単一のインスタンスを提供
 */
export class ConfigManager {
  private static instance: ConfigManager | null = null;
  private _config: AppConfig;
  private _initialized: boolean = false;
  private _cachedValues: Map<string, any> = new Map();

  /**
   * プライベートコンストラクタ
   * クラス外部からの直接インスタンス化を防止
   */
  private constructor() {
    this._config = this.buildInitialConfig();
  }

  /**
   * シングルトンインスタンスを取得
   */
  public static getInstance(): ConfigManager {
    if (!ConfigManager.instance) {
      ConfigManager.instance = new ConfigManager();
    }
    return ConfigManager.instance;
  }

  /**
   * テスト用のリセットメソッド
   * 注: 通常のアプリケーションコードからは呼び出さないでください
   */
  public static resetForTests(): void {
    ConfigManager.instance = null;
  }

  /**
   * 設定の初期化と検証を実行
   * アプリケーション起動時に一度だけ呼び出す
   */
  public initialize(): void {
    if (this._initialized) {
      logger.warn('設定はすでに初期化されています');
      return;
    }

    try {
      this.validateConfig();
      this._initialized = true;

      if (this.isDevelopment()) {
        logger.info('✅ アプリケーション設定の検証が完了しました');
      }
    } catch (error) {
      logger.error(
        '設定の検証に失敗しました:',
        error instanceof Error ? error.message : String(error),
      );
      throw error;
    }
  }

  /**
   * 環境変数から値を取得（文字列型）
   * @param key 環境変数名
   * @param defaultValue デフォルト値
   * @param options オプション設定
   * @returns 環境変数の値またはデフォルト値
   */
  public getEnvString(key: string, defaultValue = '', options?: EnvValueOptions): string {
    return getEnvValue(key, defaultValue, String, options);
  }

  /**
   * 環境変数から値を取得（数値型）
   * @param key 環境変数名
   * @param defaultValue デフォルト値
   * @param options オプション設定
   * @returns 環境変数の数値またはデフォルト値
   */
  public getEnvNumber(key: string, defaultValue = 0, options?: EnvValueOptions): number {
    return getEnvValueAsNumber(key, defaultValue, options);
  }

  /**
   * 環境変数から値を取得（真偽値型）
   * @param key 環境変数名
   * @param defaultValue デフォルト値
   * @param options オプション設定
   * @returns 環境変数の真偽値またはデフォルト値
   */
  public getEnvBoolean(key: string, defaultValue = false, options?: EnvValueOptions): boolean {
    return getEnvValueAsBoolean(key, defaultValue, options);
  }

  /**
   * 環境変数から値を取得（配列型）
   * @param key 環境変数名
   * @param defaultValue デフォルト値
   * @param options オプション設定
   * @returns カンマ区切りの環境変数を配列に変換した結果またはデフォルト値
   */
  public getEnvArray<T extends string>(
    key: string,
    defaultValue: T[] = [] as unknown as T[],
    options?: EnvValueOptions,
  ): T[] {
    return getEnvValue(
      key,
      '',
      (val) => {
        if (!val) return defaultValue;
        return val.split(',').map((item) => item.trim() as T);
      },
      options,
    );
  }

  /**
   * ネストされた設定値にアクセスするヘルパーメソッド
   * @param path ドット区切りのパス（例：'maps.apiKey'）
   * @param defaultValue デフォルト値
   * @returns 設定値またはデフォルト値
   */
  public getValue<T>(path: string, defaultValue?: T): T {
    // キャッシュチェック
    const cacheKey = `getValue:${path}`;
    if (this._cachedValues.has(cacheKey)) {
      return this._cachedValues.get(cacheKey);
    }

    const value = this.getNestedValue(this._config, path);
    const result = (value === undefined ? defaultValue : value) as T;

    // キャッシュに保存
    this._cachedValues.set(cacheKey, result);
    return result;
  }

  /**
   * 設定カテゴリ全体を取得
   * @param category 設定カテゴリ名
   * @returns カテゴリの設定オブジェクト
   */
  public getCategory<K extends keyof AppConfig>(category: K): AppConfig[K] {
    return this._config[category];
  }

  /**
   * 設定全体を取得
   * @returns 設定オブジェクト（読み取り専用）
   */
  public getConfig(): Readonly<AppConfig> {
    return this._config;
  }

  /**
   * 開発環境かどうかを判定
   */
  public isDevelopment(): boolean {
    return this._config.environment.name === 'development';
  }

  /**
   * 本番環境かどうかを判定
   */
  public isProduction(): boolean {
    return this._config.environment.name === 'production';
  }

  /**
   * テスト環境かどうかを判定
   */
  public isTest(): boolean {
    return this._config.environment.name === 'test';
  }

  /**
   * デバッグモードかどうかを判定
   */
  public isDebugMode(): boolean {
    return this._config.environment.debug;
  }

  /**
   * Google Mapsが利用可能かどうかを判定
   */
  public isGoogleMapsAvailable(): boolean {
    return typeof google !== 'undefined' && typeof google.maps.Animation !== 'undefined';
  }

  /**
   * モバイルデバイスかどうかを判定
   */
  public isMobileDevice(): boolean {
    return (
      typeof window !== 'undefined' &&
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        window.navigator.userAgent,
      )
    );
  }

  /**
   * マップタイプIDを取得
   */
  public getMapTypeId(defaultType: string = 'roadmap'): google.maps.MapTypeId | string {
    if (!this.isGoogleMapsAvailable()) return defaultType;

    switch (defaultType) {
      case 'satellite':
        return google.maps.MapTypeId.SATELLITE;
      case 'hybrid':
        return google.maps.MapTypeId.HYBRID;
      case 'terrain':
        return google.maps.MapTypeId.TERRAIN;
      default:
        return google.maps.MapTypeId.ROADMAP;
    }
  }

  /**
   * マーカーアニメーションを取得
   */
  public getMarkerAnimation(type: 'BOUNCE' | 'DROP' | null): google.maps.Animation | null {
    if (!type || !this.isGoogleMapsAvailable()) return null;
    return type === 'BOUNCE'
      ? google.maps.Animation.BOUNCE
      : type === 'DROP'
        ? google.maps.Animation.DROP
        : null;
  }

  /**
   * 初期設定オブジェクトを構築
   */
  private buildInitialConfig(): AppConfig {
    // 現在の環境取得
    const currentEnv = this.getCurrentEnvironment();

    // 環境設定の構築
    const envConfig = this.buildEnvironmentConfig(currentEnv);

    // アプリケーション情報の構築
    const appInfo = this.buildAppInfo();

    // マップ設定の構築
    const mapsConfig = this.buildMapsConfig();

    // シート設定の構築
    const sheetsConfig = this.buildSheetsConfig();

    // 表示設定の構築
    const displayConfig = this.buildDisplayConfig();

    // エラー処理設定の構築
    const errorHandlingConfig = this.buildErrorHandlingConfig(currentEnv);

    return {
      app: appInfo,
      environment: envConfig,
      maps: mapsConfig,
      sheets: sheetsConfig,
      markers: MARKER_CONFIG,
      display: displayConfig,
      errorHandling: errorHandlingConfig,
    };
  }

  /**
   * 現在の環境名を取得
   */
  private getCurrentEnvironment(): EnvironmentName {
    return getEnvValue<EnvironmentName>('VITE_ENVIRONMENT', 'development', (value) =>
      ['development', 'production', 'test'].includes(value as string)
        ? (value as EnvironmentName)
        : 'development',
    );
  }

  /**
   * 環境設定を構築
   */
  private buildEnvironmentConfig(currentEnv: EnvironmentName): EnvironmentConfig {
    const baseConfig = ENV_CONFIGS[currentEnv];

    return {
      ...baseConfig,
      debug: this.getEnvBoolean('VITE_DEBUG', baseConfig.debug),
      logLevel: getEnvValue<LogLevel>('VITE_LOG_LEVEL', baseConfig.logLevel, (value) =>
        ['error', 'warn', 'info', 'debug'].includes(value as string)
          ? (value as LogLevel)
          : 'error',
      ),
      cacheEnabled: this.getEnvBoolean('VITE_CACHE_ENABLED', baseConfig.cacheEnabled),
      cacheDuration: this.getEnvNumber('VITE_CACHE_DURATION', 60 * 60 * 1000),
    };
  }

  /**
   * アプリケーション情報を構築
   */
  private buildAppInfo(): AppInfoConfig {
    return {
      name: this.getEnvString('VITE_APP_NAME', 'くえっちゃ'),
      version: this.getEnvString('VITE_APP_VERSION', '1.0.0'),
      description: this.getEnvString('VITE_APP_DESCRIPTION', '佐渡島観光情報アプリ'),
      buildDate: this.getEnvString('VITE_BUILD_DATE', new Date().toISOString()),
      commitHash: this.getEnvString('VITE_COMMIT_HASH', ''),
    };
  }

  /**
   * マップ設定を構築
   */
  private buildMapsConfig(): MapsConfig {
    return {
      ...MAPS_CONFIG,
      apiKey: this.getEnvString('VITE_GOOGLE_MAPS_API_KEY', '', { required: true }),
      mapId: this.getEnvString('VITE_GOOGLE_MAPS_MAP_ID', '', { required: true }),
      language: this.getEnvString('VITE_GOOGLE_MAPS_LANGUAGE', 'ja'),
      version: this.getEnvString('VITE_GOOGLE_MAPS_VERSION', 'weekly'),
      options: {
        ...MAPS_CONFIG.options,
        mapTypeId: this.getMapTypeId(this.getEnvString('VITE_DEFAULT_MAP_TYPE', 'roadmap')),
      },
    };
  }

  /**
   * シート設定を構築
   */
  private buildSheetsConfig(): SheetsConfig {
    return {
      ...SHEETS_CONFIG,
      apiKey: this.getEnvString('VITE_GOOGLE_SHEETS_API_KEY', '', { required: true }),
      spreadsheetId: this.getEnvString('VITE_GOOGLE_SPREADSHEET_ID', '', { required: true }),
      cacheDuration: this.getEnvNumber('VITE_SHEETS_CACHE_DURATION', 3600 * 1000),
      maxRetries: this.getEnvNumber('VITE_SHEETS_MAX_RETRIES', 3),
      retryDelay: this.getEnvNumber('VITE_SHEETS_RETRY_DELAY', 1000),
      sheetNames: {
        pois: this.getEnvString('VITE_POI_SHEET_NAME', 'POIs'),
        areas: this.getEnvString('VITE_AREAS_SHEET_NAME', 'Areas'),
      },
    };
  }

  /**
   * 表示設定を構築
   */
  private buildDisplayConfig(): DisplayConfig {
    // デフォルトで表示するエリア（INITIAL_VISIBILITYでtrueのもの）
    const defaultVisibleAreas = Object.entries(INITIAL_VISIBILITY)
      .filter(([, isVisible]) => isVisible)
      .map(([area]) => area as AreaType);

    return {
      defaultVisibleAreas: this.getEnvArray<AreaType>(
        'VITE_DEFAULT_VISIBLE_AREAS',
        defaultVisibleAreas,
      ),
      markerOptions: {
        defaultOpacity: this.getEnvNumber('VITE_MARKER_OPACITY', 0.8),
        selectedAnimation: this.getMarkerAnimation('BOUNCE'),
        defaultSize: {
          width: this.getEnvNumber('VITE_MARKER_WIDTH', 32),
          height: this.getEnvNumber('VITE_MARKER_HEIGHT', 32),
        },
        highlight: {
          zIndex: 10,
          opacity: 1.0,
          scale: 1.2,
        },
      },
      mobile: {
        menuButtonPosition: getEnvValue('VITE_MOBILE_MENU_POSITION', 'top-left', (value) =>
          ['top-left', 'top-right', 'bottom-left', 'bottom-right'].includes(value as string)
            ? (value as 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right')
            : 'top-left',
        ),
        infoWindowScale: this.getEnvNumber('VITE_MOBILE_INFO_SCALE', 0.85),
      },
    };
  }

  /**
   * エラー処理設定を構築
   */
  private buildErrorHandlingConfig(currentEnv: EnvironmentName): ErrorHandlingConfig {
    return {
      retryCount: this.getEnvNumber('VITE_API_RETRY_COUNT', 3),
      retryInterval: this.getEnvNumber('VITE_RETRY_INTERVAL', 1000),
      reportErrors: this.getEnvBoolean('VITE_REPORT_ERRORS', currentEnv === 'production'),
      showErrors: this.getEnvBoolean('VITE_SHOW_ERRORS', currentEnv !== 'production'),
    };
  }

  /**
   * 設定を検証する
   */
  private validateConfig(): void {
    this.validateRequiredEnvVars();
    this.validateRequiredSettings();
    this.validateSettingValues();
    this.validateSettingRelationships();
  }

  /**
   * 必須環境変数を検証
   */
  private validateRequiredEnvVars(): void {
    const missingVars = this.checkRequiredEnvVars();
    if (missingVars.length > 0) {
      throw new Error(
        `${ERROR_MESSAGES.MAP.CONFIG_MISSING} 不足している環境変数: ${missingVars.join(', ')}`,
      );
    }
  }

  /**
   * 必須設定値を検証
   */
  private validateRequiredSettings(): void {
    const requiredSettings = {
      'Google Maps API Key': this._config.maps.apiKey,
      'Google Maps Map ID': this._config.maps.mapId,
      'Google Sheets API Key': this._config.sheets.apiKey,
      'Google Sheets Spreadsheet ID': this._config.sheets.spreadsheetId,
    };

    const missingSettings = Object.entries(requiredSettings)
      .filter(([, value]) => !value)
      .map(([key]) => key);

    if (missingSettings.length > 0) {
      throw new Error(`必要な設定が不足しています: ${missingSettings.join(', ')}`);
    }
  }

  /**
   * 設定値の範囲や形式を検証
   */
  private validateSettingValues(): void {
    // マップズームレベルの検証
    const zoom = this._config.maps.options.zoom;
    if (typeof zoom === 'number' && (zoom < 1 || zoom > 22)) {
      this.logConfigWarning(
        `ズームレベル(${zoom})が推奨範囲外です(1-22)。問題が生じる可能性があります。`,
        'maps.options.zoom',
      );
    }

    // APIタイムアウト値の検証
    const timeout = this.getEnvNumber('VITE_API_TIMEOUT', 10000);
    if (timeout < 1000) {
      this.logConfigWarning(
        `APIタイムアウト(${timeout}ms)が短すぎます。通信エラーが発生する可能性があります。`,
        'VITE_API_TIMEOUT',
      );
    }
  }

  /**
   * 設定間の関係性を検証
   */
  private validateSettingRelationships(): void {
    // 無効なエリア識別子の警告
    const invalidAreas = this._config.display.defaultVisibleAreas.filter(
      (area) => !(area in AREAS),
    );
    if (invalidAreas.length > 0) {
      this.logConfigWarning(
        `無効なエリア識別子が指定されています: ${invalidAreas.join(', ')}`,
        'display.defaultVisibleAreas',
      );
    }
  }

  /**
   * 必須環境変数をチェック
   * @returns 不足している環境変数のリスト
   */
  private checkRequiredEnvVars(): string[] {
    return REQUIRED_ENV_VARS.filter((varName) => {
      const value = process.env[varName] || import.meta.env[varName];
      return value === undefined || value === null || value === '';
    });
  }

  /**
   * ネストされたオブジェクトからパスで値を取得
   */
  private getNestedValue(obj: any, path: string): any {
    const keys = path.split('.');
    return keys.reduce((o, k) => (o && o[k] !== undefined ? o[k] : undefined), obj);
  }

  /**
   * 設定警告をログに記録
   */
  private logConfigWarning(message: string, key: string): void {
    if (this.isDevelopment() || this._config.environment.debug) {
      logger.warn(`⚠️ 設定警告 [${key}]: ${message}`);
    }
  }
}

// シングルトンインスタンスの取得用ヘルパー関数
export const getConfig = (): ConfigManager => ConfigManager.getInstance();

// 既存のインターフェースとの互換性のための従来の設定オブジェクト
// 注: この方法は移行期間中のみ使用し、最終的にはすべてgetConfig()に置き換えることを推奨
export const CONFIG: AppConfig = ConfigManager.getInstance().getConfig();

// 初期化（通常はアプリケーションのメインエントリポイントで行う）
ConfigManager.getInstance().initialize();

// 既存コードとの互換性のために一部の関数をエクスポート
export const validateConfig = (config: AppConfig): void => {
  // 既存の検証関数は内部的にConfigManagerを使用するよう変更
  // このラッパーは後方互換性のために保持
  try {
    ConfigManager.getInstance().initialize();
  } catch (error) {
    logger.error('設定の検証に失敗しました:', error);
    throw error;
  }
};

export default CONFIG;
