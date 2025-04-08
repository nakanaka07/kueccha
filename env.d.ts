/// <reference types="vite/client" />

/**
 * アプリケーションで使用する環境変数の型定義
 * @description
 * この型定義はViteが提供するImportMetaEnvを拡張し、
 * アプリケーション固有の環境変数に型安全性を提供します。
 * 環境変数管理ガイドライン、Google Maps統合ガイドライン、ロガー使用ガイドラインに準拠しています。
 */

// 真偽値を表す環境変数の型定義
type BooleanEnvValue = boolean | 'true' | 'false' | '1' | '0' | '';

// ログレベルを表す型
type LogLevel = 'debug' | 'info' | 'warn' | 'error';

/**
 * 環境設定を保持するオブジェクトの型定義
 */
interface EnvironmentConfig {
  app: {
    name: string;
    shortName: string;
    description: string;
    version: string;
    buildDate: string;
    basePath: string;
  };
  env: {
    mode: string;
    isDev: boolean;
    isProd: boolean;
    isTest: boolean;
    debug: boolean;
  };
  google: {
    apiKey: string;
    mapsVersion: string;
    mapsLibraries: string[];
    mapId: string;
    spreadsheetId: string;
  };
  emailjs: {
    serviceId: string;
    templateId: string;
    publicKey: string;
  };
  features: {
    googleSheets: boolean;
    offlineMode: boolean;
    analytics: boolean;
    markerClustering: boolean;
    verboseLogging: boolean;
    [key: string]: boolean;
  };
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
  logging: {
    level: LogLevel;
  };
  debug: {
    ENABLE_MAP_DEBUG: boolean;
    [key: string]: boolean;
  };
}

interface ImportMetaEnv {
  // ==== Viteが自動的に提供する環境変数（編集不可） ====
  /** 開発モードフラグ (Viteが自動的に提供) */
  readonly DEV: boolean;
  /** 本番モードフラグ (Viteが自動的に提供) */
  readonly PROD: boolean;
  /** 現在のモード (Viteが自動的に提供) */
  readonly MODE: string;
  /** ベースURL (Viteが自動的に提供) */
  readonly BASE_URL: string;
  /** 現在の環境 (Viteが自動的に提供) */
  readonly NODE_ENV: 'development' | 'production' | 'test';

  // ==== アプリケーション基本情報（必須） ====
  /** アプリケーションの正式名称 */
  readonly VITE_APP_NAME: string;
  /** アプリケーションの略称 */
  readonly VITE_APP_SHORT_NAME: string;
  /** アプリケーションの説明文 */
  readonly VITE_APP_DESCRIPTION: string;

  // ==== Google Maps関連設定 ====
  /** Google Maps JavaScript API Key */
  readonly VITE_GOOGLE_MAPS_API_KEY?: string;
  /** Google Maps MapID (Cloud Consoleで設計したスタイル用) */
  readonly VITE_GOOGLE_MAPS_MAP_ID?: string;
  /** Google Maps API バージョン (weekly, quarterly, latest等) */
  readonly VITE_GOOGLE_MAPS_VERSION?: string;
  /** Google Maps APIキーに設定された制限の有無 */
  readonly VITE_GOOGLE_API_KEY_RESTRICTIONS?: BooleanEnvValue;
  /** 季節に応じたMapID（春） */
  readonly VITE_GOOGLE_SPRING_MAP_ID?: string;
  /** 季節に応じたMapID（夏） */
  readonly VITE_GOOGLE_SUMMER_MAP_ID?: string;
  /** 季節に応じたMapID（秋） */
  readonly VITE_GOOGLE_AUTUMN_MAP_ID?: string;
  /** 季節に応じたMapID（冬） */
  readonly VITE_GOOGLE_WINTER_MAP_ID?: string;
  /** アクセシブル版MapID */
  readonly VITE_GOOGLE_ACCESSIBLE_MAP_ID?: string;

  // ==== データソース設定 ====
  /** POIデータのソースURL */
  readonly VITE_DATA_SOURCE_URL?: string;
  /** CSVデータファイルの保存場所 */
  readonly VITE_DATA_CSV_PATH?: string;
  /** データ更新間隔（分単位） */
  readonly VITE_DATA_REFRESH_INTERVAL?: string;

  // ==== ロギング設定 ====
  /** ログレベル (debug, info, warn, error) */
  readonly VITE_LOG_LEVEL?: 'debug' | 'info' | 'warn' | 'error';
  /** リモートログ送信先URL */
  readonly VITE_LOG_ENDPOINT?: string;
  /** 高頻度ログのサンプリングレート */
  readonly VITE_LOG_SAMPLING_RATE?: string;
  /** パフォーマンス計測ログの閾値（ms） */
  readonly VITE_LOG_PERFORMANCE_THRESHOLD?: string;

  // ==== 機能フラグ（VITE_ENABLE_*） ====
  /** 指定された機能を有効化するフラグ */
  readonly [key: `VITE_ENABLE_${string}`]: BooleanEnvValue | undefined;

  // ==== UI設定（VITE_UI_*） ====
  /** UI関連の設定値 */
  readonly [key: `VITE_UI_${string}`]: string | undefined;

  // ==== データ関連設定（VITE_DATA_*） ====
  /** データ関連の設定値 */
  readonly [key: `VITE_DATA_${string}`]: string | undefined;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
