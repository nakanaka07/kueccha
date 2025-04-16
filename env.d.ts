/// <reference types="vite/client" />

/**
 * アプリケーションで使用する環境変数の型定義
 * @description
 * この型定義はViteが提供するImportMetaEnvを拡張し、
 * アプリケーション固有の環境変数に型安全性を提供します。
 */

/**
 * 真偽値を表す環境変数の型定義
 * @description
 * Viteの環境変数はすべて文字列として扱われるため、
 * 真偽値を表す環境変数は以下の値が許容されます。
 * - 'true', '1' → true として評価
 * - 'false', '0', '' → false として評価
 */
type BooleanEnvValue = 'true' | 'false' | '1' | '0' | '';

/**
 * 環境変数を真偽値に変換する型ガード関数
 * @param value - 環境変数の値
 * @returns 真偽値に変換された値
 */
type BooleanConverter = (value: BooleanEnvValue | undefined) => boolean;

/**
 * ログレベルを表す型
 * - 'debug': 開発時のみ有用な詳細情報
 * - 'info': 一般的な情報ログ
 * - 'warn': 潜在的な問題の警告
 * - 'error': エラーと例外
 */
type LogLevel = 'debug' | 'info' | 'warn' | 'error';

/**
 * 環境設定を保持するオブジェクトの型定義
 * @description
 * KISSの原則に従い、必要最小限の設定のみ維持しつつ、
 * 環境変数を論理的なグループに分類します。
 * 各環境（開発/テスト/本番）で共通の構造を持ちます。
 */
interface EnvironmentConfig {
  /**
   * アプリケーション基本情報
   */
  app: {
    /** アプリケーション名（表示用正式名称） */
    name: string;
    /** アプリケーション略称（PWA等で使用） */
    shortName: string;
    /** アプリケーション説明 */
    description: string;
    /** アプリケーションバージョン */
    version: string;
  };

  /**
   * 実行環境情報
   * @description 環境に関する情報とフラグ
   */
  env: {
    /** 実行モード（development/production/test） */
    mode: 'development' | 'production' | 'test';
    /** 開発環境フラグ */
    isDev: boolean;
    /** 本番環境フラグ */
    isProd: boolean;
    /** テスト環境フラグ */
    isTest: boolean;
  };

  /**
   * Google Maps API設定
   */
  google: {
    /** Google Maps API Key */
    apiKey: string;
    /** Maps ID（スタイル設定用） */
    mapId: string;
    /** API バージョン */
    version?: string;
  };

  /**
   * 機能フラグ設定
   * @description 各機能の有効/無効を制御するフラグ
   */
  features: {
    /** 動的に定義される機能フラグ */
    [key: string]: boolean;
  };

  /**
   * UI関連設定
   */
  ui: {
    /** 地図表示設定 */
    map: {
      /** 初期ズームレベル */
      initialZoom: number;
      /** 初期中心座標 */
      initialCenter: {
        lat: number;
        lng: number;
      };
      /** 地図タイプ（satellite/roadmap/hybrid/terrain） */
      mapType?: google.maps.MapTypeId;
    };
  };

  /**
   * ログ設定
   */
  logging: {
    /** ログレベル */
    level: LogLevel;
    /** エラーレポート送信先（本番環境のみ設定） */
    errorReportEndpoint?: string;
  };

  /**
   * データソース設定
   */
  data: {
    /** POIデータソースのURL */
    sourceUrl?: string;
    /** CSVデータファイルの場所 */
    csvPath?: string;
  };
}

/**
 * Viteアプリケーションの環境変数インターフェース
 * @description
 * このインターフェースはViteが提供する環境変数に加えて、
 * アプリケーション固有の環境変数を定義します。
 * すべての環境変数はプレーンなテキストとして扱われるため、
 * 型変換が必要な場合は別途ユーティリティ関数を使用してください。
 */
interface ImportMetaEnv {
  // ======================================================================
  // Viteが自動的に提供する環境変数（編集不可）
  // ======================================================================
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

  // ======================================================================
  // アプリケーション基本情報（必須）
  // ======================================================================
  /** アプリケーションの正式名称 */
  readonly VITE_APP_NAME: string;
  /** アプリケーションの略称（PWA等で使用） */
  readonly VITE_APP_SHORT_NAME: string;
  /** アプリケーションの説明文 */
  readonly VITE_APP_DESCRIPTION: string;
  /** アプリケーションのバージョン */
  readonly VITE_APP_VERSION?: string;

  // ======================================================================
  // Google Maps関連設定
  // ======================================================================
  /** Google Maps JavaScript API Key */
  readonly VITE_GOOGLE_API_KEY: string;
  /** Google Maps MapID (Cloud Consoleで設計したスタイル用) */
  readonly VITE_GOOGLE_MAPS_MAP_ID: string;
  /**
   * Google Maps API バージョン
   * @example 'weekly', 'quarterly', 'latest'等
   */
  readonly VITE_GOOGLE_MAPS_VERSION?: string;
  /** マーカークラスタリングの有効化 */
  readonly VITE_GOOGLE_MAPS_ENABLE_CLUSTERING?: BooleanEnvValue;
  /** マーカークラスタリングのグリッドサイズ */
  readonly VITE_GOOGLE_MAPS_CLUSTER_GRID_SIZE?: string;

  // ======================================================================
  // データソース設定
  // ======================================================================
  /** POIデータのソースURL */
  readonly VITE_DATA_SOURCE_URL?: string;
  /** CSVデータファイルの保存場所 */
  readonly VITE_DATA_CSV_PATH?: string;
  /** データ更新間隔（ミリ秒） */
  readonly VITE_DATA_REFRESH_INTERVAL?: string;
  /** オフラインキャッシュの有効期限（分） */
  readonly VITE_DATA_CACHE_EXPIRY?: string;

  // ======================================================================
  // ロギング設定
  // ======================================================================
  /**
   * ログレベル
   * @type {LogLevel} 'debug' | 'info' | 'warn' | 'error'
   */
  readonly VITE_LOG_LEVEL?: LogLevel;
  /** エラーレポートの送信先URL（本番環境用） */
  readonly VITE_ERROR_REPORT_URL?: string;
  /** 詳細なパフォーマンスログを有効化 */
  readonly VITE_ENABLE_PERFORMANCE_LOGGING?: BooleanEnvValue;

  // ======================================================================
  // 機能フラグ（VITE_ENABLE_*）
  // ======================================================================
  /**
   * 指定された機能を有効化するフラグ
   * @example
   * VITE_ENABLE_OFFLINE_MODE='true' // オフラインモードを有効化
   * VITE_ENABLE_DEBUG_TOOLS='true'  // デバッグツールを有効化
   */
  readonly [key: `VITE_ENABLE_${string}`]: BooleanEnvValue | undefined;

  // ======================================================================
  // UI設定（VITE_UI_*）
  // ======================================================================
  /**
   * UI関連の設定値
   * @example
   * VITE_UI_MAP_INITIAL_ZOOM='12'  // 地図の初期ズームレベル
   * VITE_UI_MAP_INITIAL_LAT='38.0'  // 地図の初期緯度
   * VITE_UI_MAP_INITIAL_LNG='138.3' // 地図の初期経度
   */
  readonly [key: `VITE_UI_${string}`]: string | undefined;

  // ======================================================================
  // 環境固有の設定（開発/テスト/本番）
  // ======================================================================
  /**
   * 開発環境固有の設定
   * @description 開発環境でのみ使用される設定
   */
  readonly [key: `VITE_DEV_${string}`]: string | undefined;

  /**
   * テスト環境固有の設定
   * @description テスト環境でのみ使用される設定
   */
  readonly [key: `VITE_TEST_${string}`]: string | undefined;

  /**
   * 本番環境固有の設定
   * @description 本番環境でのみ使用される設定
   */
  readonly [key: `VITE_PROD_${string}`]: string | undefined;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
