/// <reference types="vite/client" />

/**
 * アプリケーションで使用する環境変数の型定義
 * @description
 * この型定義はViteが提供するImportMetaEnvを拡張し、
 * アプリケーション固有の環境変数に型安全性を提供します。
 * コードの環境変数管理ガイドラインに準拠しています。
 */
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
  /** アプリケーションのバージョン番号 */
  readonly VITE_APP_VERSION: string;
  /** アプリケーションのビルド日時 */
  readonly VITE_APP_BUILD_DATE: string;
  /** デプロイ時のベースパス */
  readonly BASE_PATH: string;

  // ==== Google API関連の環境変数（必須） ====
  /** Google APIキー (Maps API等で使用) */
  readonly VITE_GOOGLE_API_KEY: string;
  /** Google Maps APIバージョン設定 */
  readonly VITE_GOOGLE_MAPS_VERSION: string;
  /** Google Maps APIライブラリ設定 (カンマ区切りリスト) */
  readonly VITE_GOOGLE_MAPS_LIBRARIES: string;
  /** Google Maps用のマップID */
  readonly VITE_GOOGLE_MAPS_MAP_ID: string;
  /** データソースとなるGoogleスプレッドシートID */
  readonly VITE_GOOGLE_SPREADSHEET_ID: string;

  // ==== EmailJS関連の環境変数（任意） ====
  /** EmailJSのサービスID */
  readonly VITE_EMAILJS_SERVICE_ID: string;
  /** EmailJSのテンプレートID */
  readonly VITE_EMAILJS_TEMPLATE_ID: string;
  /** EmailJSの公開キー */
  readonly VITE_EMAILJS_PUBLIC_KEY: string;

  // ==== 機能フラグ (VITE_ENABLE_* パターン) ====
  /** Google Sheets使用フラグ */
  readonly VITE_ENABLE_GOOGLE_SHEETS: 'true' | 'false';
  /** アナリティクス機能の有効化 */
  readonly VITE_ENABLE_ANALYTICS?: 'true' | 'false';
  /** オフラインモードサポート */
  readonly VITE_ENABLE_OFFLINE_MODE?: 'true' | 'false';
  /** マーカークラスタリング有効化 */
  readonly VITE_ENABLE_MARKER_CLUSTERING?: 'true' | 'false';
  /** 詳細ログの有効化 */
  readonly VITE_ENABLE_VERBOSE_LOGGING?: 'true' | 'false';
  /** その他の機能フラグ (動的に追加可能) */
  readonly [index: `VITE_ENABLE_${string}`]: 'true' | 'false' | undefined;

  // ==== UI/UX設定 (VITE_UI_* パターン) ====
  /** 地図初期ズームレベル */
  readonly VITE_UI_MAP_INITIAL_ZOOM?: string;
  /** 地図初期中心緯度 */
  readonly VITE_UI_MAP_INITIAL_CENTER_LAT?: string;
  /** 地図初期中心経度 */
  readonly VITE_UI_MAP_INITIAL_CENTER_LNG?: string;
  /** その他のUI設定 (動的に追加可能) */
  readonly [index: `VITE_UI_${string}`]: string | undefined;

  // ==== その他のオプション環境変数 ====
  /** デバッグモード有効フラグ (デフォルト: 'false') */
  readonly VITE_DEBUG_MODE: 'true' | 'false';
  /** API基本URL (任意) */
  readonly VITE_API_BASE_URL?: string;
  /** ログレベル設定 (デフォルト: 'info') - error, warn, info, debug */
  readonly VITE_LOG_LEVEL: 'error' | 'warn' | 'info' | 'debug';
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
    version: string;
    buildDate: string;
    basePath: string;
  };
  /** Google API関連設定 */
  google: {
    apiKey: string;
    mapsVersion: string;
    mapsLibraries: string[];
    mapId: string;
    spreadsheetId: string;
  };
  /** EmailJS関連設定 */
  emailjs: {
    serviceId: string;
    templateId: string;
    publicKey: string;
  };
  /** アプリケーション動作モード設定 */
  env: {
    /** 現在の環境（development, production, test） */
    mode: Environment;
    /** 開発環境かどうか */
    isDev: boolean;
    /** 本番環境かどうか */
    isProd: boolean;
    /** テスト環境かどうか */
    isTest: boolean;
    /** デバッグモードが有効かどうか */
    debug: boolean;
  };
  /** 機能フラグ設定 */
  features: {
    /** Google Sheetsデータソース使用フラグ */
    googleSheets: boolean;
    /** オフラインモードが有効かどうか */
    offlineMode: boolean;
    /** アナリティクスが有効かどうか */
    analytics: boolean;
    /** マーカークラスタリングが有効かどうか */
    markerClustering: boolean;
    /** 詳細ログが有効かどうか */
    verboseLogging: boolean;
    /** その他の機能フラグ (動的に設定可能) */
    [key: string]: boolean;
  };
  /** UI設定 */
  ui: {
    map: {
      initialZoom: number;
      initialCenter: {
        lat: number;
        lng: number;
      };
      /** マップ初期化設定 */
      init: {
        delay: number;
        debug: boolean;
      };
    };
    /** その他のUI設定 (動的に設定可能) */
    [key: string]:
      | Record<string, string | number | boolean | object>
      | {
          initialZoom: number;
          initialCenter: {
            lat: number;
            lng: number;
          };
          init?: {
            delay: number;
            debug: boolean;
          };
        };
  };
  /** ログ設定 */
  logging: {
    level: LogLevel;
  };
  /** デバッグ設定 */
  debug: {
    /** マップデバッグモードの有効化フラグ */
    ENABLE_MAP_DEBUG: boolean;
    /** その他のデバッグ設定（動的に設定可能） */
    [key: string]: boolean;
  };
}
