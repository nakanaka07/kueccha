/**
 * 環境設定の型定義
 *
 * このファイルでは、アプリケーション全体で使用される環境設定の型を定義します。
 * 環境変数管理ガイドラインとロガー使用ガイドラインに準拠しています。
 *
 * KISS（Keep It Simple, Stupid）およびYAGNI（You Aren't Gonna Need It）原則に
 * 基づいて最適化されています。
 *
 * @version 1.4.0
 * @since 1.0.0
 * @see {@link ../../docs/env_usage_guidelines.md 環境変数管理ガイドライン}
 * @see {@link ../../docs/logger_usage_guidelines.md ロガー使用ガイドライン}
 * @see {@link ../../docs/code_optimization_guidelines.md コード最適化ガイドライン}
 */

/**
 * ロガーレベルを表す型
 * ロガー使用ガイドラインに準拠したログレベル定義
 * @see {@link ./logger.ts LogLevel} - ログレベルの列挙型との対応
 */
export type LogLevelType = 'error' | 'warn' | 'info' | 'debug';

/**
 * アプリケーション環境設定を表すインターフェース
 * 環境変数から構築される型安全な設定オブジェクト
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
    /** ベースパス（デプロイ先のパス） */
    basePath: string;
  };

  // Google Maps API関連（Google Maps統合ガイドラインに準拠）
  google: {
    /** Google Maps API Key */
    apiKey: string;
    /** Google Maps APIのバージョン */
    mapsVersion: string;
    /** 使用するGoogle Maps APIライブラリ */
    mapsLibraries: string[];
    /** Google Maps MapID */
    mapId: string;
    /** Google Spreadsheet ID（必要な場合のみ） */
    spreadsheetId?: string;
  };

  // 環境設定
  env: {
    /** 現在の実行環境 */
    mode: 'development' | 'production' | 'test';
    /** 開発環境かどうか */
    isDev: boolean;
    /** 本番環境かどうか */
    isProd: boolean;
  };

  // 機能フラグ設定
  features: {
    /** Google Sheetsとの連携を有効にするか */
    googleSheets: boolean;
    /** オフラインモードを有効にするか */
    offlineMode: boolean;
    /** マーカークラスタリングを有効にするか */
    markerClustering: boolean;
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
    };
  };

  // ログ設定（ロガー使用ガイドラインに準拠）
  logging: {
    /** ログレベル設定 */
    level: LogLevelType;
  };
}

/**
 * EmailJSの設定（必要時に拡張可能な分離型）
 * YAGNI原則に基づき、使用時のみ追加
 */
export interface EmailJSConfig {
  /** EmailJSサービスID */
  serviceId: string;
  /** EmailJSテンプレートID */
  templateId: string;
  /** EmailJS公開キー */
  publicKey: string;
}

// 注: 型やインターフェースは上記ですでにexportされているため、再エクスポート不要
// 特にverbatimModuleSyntax有効時はエラーになるので注意
