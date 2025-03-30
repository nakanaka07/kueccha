/// <reference types="vite/client" />

/**
 * アプリケーションで使用する環境変数の型定義
 * @description
 * この型定義はViteが提供するImportMetaEnvを拡張し、
 * アプリケーション固有の環境変数に型安全性を提供します。
 */
interface ImportMetaEnv {
  // ==== アプリケーション基本情報 ====
  /** アプリケーションの正式名称 */
  readonly VITE_APP_NAME: string;
  /** アプリケーションの略称 */
  readonly VITE_APP_SHORT_NAME: string;
  /** アプリケーションの説明文 */
  readonly VITE_APP_DESCRIPTION: string;

  // ==== Google API関連の環境変数 ====
  /** Google APIキー (Maps API等で使用) */
  readonly VITE_GOOGLE_API_KEY: string;
  /** Google Maps用のマップID */
  readonly VITE_GOOGLE_MAPS_MAP_ID: string;
  /** データソースとなるGoogleスプレッドシートID */
  readonly VITE_GOOGLE_SPREADSHEET_ID: string;

  // ==== EmailJS関連の環境変数 ====
  /** EmailJSのサービスID */
  readonly VITE_EMAILJS_SERVICE_ID: string;
  /** EmailJSのテンプレートID */
  readonly VITE_EMAILJS_TEMPLATE_ID: string;
  /** EmailJSの公開キー */
  readonly VITE_EMAILJS_PUBLIC_KEY: string;

  // ==== Viteが自動的に提供する環境変数 ====
  /** 現在のモード (Viteが自動的に提供) */
  readonly MODE: string;
  /** 現在の環境 (Viteが自動的に提供) */
  readonly NODE_ENV: 'development' | 'production' | 'test';

  // ==== その他のオプション環境変数 ====
  /** デバッグモード有効フラグ (任意) */
  readonly VITE_DEBUG_MODE?: 'true' | 'false';
  /** API基本URL (任意) */
  readonly VITE_API_BASE_URL?: string;
  /** ログレベル設定 (任意) - error, warn, info, debug */
  readonly VITE_LOG_LEVEL?: 'error' | 'warn' | 'info' | 'debug';
  /** オフラインモード有効フラグ (任意) - オフラインデータ使用時に設定 */
  readonly VITE_OFFLINE_MODE?: 'true' | 'false';
}

/**
 * ImportMeta インターフェースの拡張
 * Viteは環境変数をimport.meta.env経由で提供
 */
interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// ==== アプリケーション用のエクスポート型定義 ====

/** アプリケーション環境タイプ */
export type Environment = 'development' | 'production' | 'test';

/** 論理値として扱う環境変数の値の型 */
export type BooleanEnvValue = 'true' | 'false';

/** ログレベル設定の型 */
export type LogLevel = 'error' | 'warn' | 'info' | 'debug';

/** 環境変数インターフェースの再エクスポート */
export type { ImportMetaEnv };

/**
 * 環境設定グループ型 - アプリケーション内での環境変数グループ
 * 関連する環境変数をまとめて扱いやすくするため
 */
export interface EnvironmentConfig {
  /** アプリケーション名情報 */
  app: {
    name: string;
    shortName: string;
    description: string;
  };
  /** Google API関連設定 */
  google: {
    apiKey: string;
    mapId: string;
    spreadsheetId: string;
  };
  /** EmailJS関連設定 */
  emailjs?: {
    serviceId: string;
    templateId: string;
    publicKey: string;
  };
  /** アプリケーション動作モード設定 */
  mode: {
    environment: Environment;
    debug: boolean;
    offline: boolean;
  };
  /** ログ設定 */
  logging: {
    level: LogLevel;
  };
}
