/// <reference types="vite/client" />

/**
 * アプリケーションで使用する環境変数の型定義
 * @description
 * この型定義はViteが提供するImportMetaEnvを拡張し、
 * アプリケーション固有の環境変数に型安全性を提供します。
 */

// 真偽値を表す環境変数の型定義（実際に使用される値のみに簡素化）
type BooleanEnvValue = 'true' | 'false' | '1' | '0' | '';

// ログレベルを表す型
type LogLevel = 'debug' | 'info' | 'warn' | 'error';

/**
 * 環境設定を保持するオブジェクトの型定義
 * KISSの原則に従い、必要最小限の設定のみ維持
 */
interface EnvironmentConfig {
  app: {
    name: string;
    shortName: string;
    description: string;
    version: string;
  };
  env: {
    mode: string;
    isDev: boolean;
    isProd: boolean;
  };
  google: {
    apiKey: string;
    mapId: string;
  };
  features: {
    [key: string]: boolean;
  };
  ui: {
    map: {
      initialZoom: number;
      initialCenter: {
        lat: number;
        lng: number;
      };
    };
  };
  logging: {
    level: LogLevel;
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

  // ==== Google Maps関連設定（コア機能のみ） ====
  /** Google Maps JavaScript API Key */
  readonly VITE_GOOGLE_API_KEY: string;
  /** Google Maps MapID (Cloud Consoleで設計したスタイル用) */
  readonly VITE_GOOGLE_MAPS_MAP_ID: string;
  /** Google Maps API バージョン (weekly, quarterly, latest等) */
  readonly VITE_GOOGLE_MAPS_VERSION?: string;

  // ==== データソース設定（必須項目のみ） ====
  /** POIデータのソースURL */
  readonly VITE_DATA_SOURCE_URL?: string;
  /** CSVデータファイルの保存場所 */
  readonly VITE_DATA_CSV_PATH?: string;

  // ==== ロギング設定 ====
  /** ログレベル (debug, info, warn, error) */
  readonly VITE_LOG_LEVEL?: LogLevel;

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
