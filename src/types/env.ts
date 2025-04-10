/**
 * 環境設定の型定義
 *
 * このファイルでは、アプリケーション全体で使用される環境設定の型を定義します。
 * 環境変数管理ガイドラインとロガー使用ガイドラインに準拠しています。
 *
 * @see ../docs/env_usage_guidelines.md
 * @see ../docs/logger_usage_guidelines.md
 */

/**
 * ロガーレベルを表す型
 * ロガー使用ガイドラインに準拠したログレベル定義
 */
export type LogLevelType = 'error' | 'warn' | 'info' | 'debug';

/**
 * アプリケーション環境設定を表すインターフェース
 * 環境変数から構築される完全な型安全な設定オブジェクト
 */
export interface EnvironmentConfig {
  // アプリケーション基本情報
  app: {
    /** アプリケーションの正式名称 */
    name: string;
    /** アプリケーションの短縮名（PWA用など） */
    shortName: string;
    /** アプリケーションの説明文 */
    description: string;
    /** アプリケーションのバージョン */
    version: string;
    /** ビルド日時 */
    buildDate: string;
    /** ベースパス（デプロイ先のパス） */
    basePath: string;
  };

  // Google API関連（Google Maps統合ガイドラインに準拠）
  google: {
    /** Google Maps API Key */
    apiKey: string;
    /** Google Maps APIのバージョン (weekly, quarterly等) */
    mapsVersion: string;
    /** 使用するGoogle Maps APIライブラリ */
    mapsLibraries: string[];
    /** Google Maps MapID (Cloud Consoleで設計したスタイル用) */
    mapId: string;
    /** Google Spreadsheet ID */
    spreadsheetId: string;
  };

  // EmailJS関連
  emailjs: {
    /** EmailJSサービスID */
    serviceId: string;
    /** EmailJSテンプレートID */
    templateId: string;
    /** EmailJS公開キー */
    publicKey: string;
  };

  // 環境設定
  env: {
    /** 現在の実行環境 */
    mode: 'development' | 'production' | 'test';
    /** 開発環境かどうか */
    isDev: boolean;
    /** 本番環境かどうか */
    isProd: boolean;
    /** テスト環境かどうか */
    isTest: boolean;
    /** デバッグモードが有効かどうか */
    debug: boolean;
  };

  // 機能フラグ設定
  features: {
    /** Google Sheetsとの連携を有効にするか */
    googleSheets: boolean;
    /** オフラインモードを有効にするか */
    offlineMode: boolean;
    /** アナリティクスを有効にするか */
    analytics: boolean;
    /** マーカークラスタリングを有効にするか */
    markerClustering: boolean;
    /** 詳細なログ記録を有効にするか */
    verboseLogging: boolean;
    /** 追加の機能フラグを動的に定義可能 */
    [key: string]: boolean;
  };

  // UI設定
  ui: {
    map: {
      /** 初期ズームレベル */
      initialZoom: number;
      /** 初期中心座標 */
      initialCenter: {
        lat: number;
        lng: number;
      };
      init: {
        /** マップ初期化遅延時間（ms） */
        delay: number;
        /** マップ初期化デバッグモード */
        debug: boolean;
      };
    };
  };

  // ログ設定（ロガー使用ガイドラインに準拠）
  logging: {
    /** ログレベル設定 */
    level: LogLevelType;
    /** ログ設定の追加プロパティを動的に定義可能 */
    [key: string]: unknown;
  };

  // デバッグ設定
  debug: {
    /** マップデバッグモードを有効にするか */
    ENABLE_MAP_DEBUG: boolean;
    /** 追加のデバッグフラグを動的に定義可能 */
    [key: string]: boolean;
  };
}

// エクスポート方法の最適化
// TypeScriptの`verbatimModuleSyntax`が有効な場合は
// 型とインターフェースを明示的にエクスポートする
