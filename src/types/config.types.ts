/**
 * アプリケーション設定関連の型定義ファイル
 *
 * アプリケーション全体の設定に関する型を定義します。
 * すべての設定パラメータの型安全な構造を提供します。
 */

/// <reference types="@types/google.maps" />
import type { AreaType } from './areas.types';
import type { MapConfig } from './maps.types';
import type { SheetsConfig } from './sheets.types';

// ============================================================================
// 環境設定関連の型定義
// ============================================================================

/**
 * アプリケーション実行環境を表す型
 */
export type EnvironmentName = 'development' | 'production' | 'test';

/**
 * 環境固有の設定を表す型
 */
export interface EnvironmentConfig {
  /** 環境名 */
  name: EnvironmentName;

  /** デバッグモードを有効にするか */
  debug: boolean;

  /** ログレベル */
  logLevel: 'error' | 'warn' | 'info' | 'debug';

  /** API呼び出しのキャッシュを有効にするか */
  cacheEnabled: boolean;
}

// ============================================================================
// 表示設定関連の型定義
// ============================================================================

/**
 * マーカーカスタム設定のオプション
 * MarkerStyleOptionsと整合性を保ちつつ、選択時のアニメーションを追加
 */
export interface MarkerCustomOptions {
  /** デフォルトの不透明度（0.0-1.0） */
  defaultOpacity: number;

  /** 選択時のアニメーション */
  selectedAnimation: google.maps.Animation | null;

  /** デフォルトのマーカーサイズ */
  defaultSize?: {
    width: number;
    height: number;
  };

  /** 選択時の強調表示設定 */
  highlight?: {
    zIndex: number;
    opacity: number;
    scale?: number;
  };
}

/**
 * 表示関連の設定を表す型
 */
export interface DisplayConfig {
  /** デフォルトで表示するエリア */
  defaultVisibleAreas: AreaType[];

  /** マーカーのカスタム設定 */
  markerOptions: MarkerCustomOptions;

  /** モバイルデバイスでの表示調整 */
  mobile: {
    /** メニューボタンの表示位置 */
    menuButtonPosition: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
    /** 情報ウィンドウのサイズ調整係数 */
    infoWindowScale: number;
  };
}

// ============================================================================
// エラー処理設定関連の型定義
// ============================================================================

/**
 * エラー処理関連の設定を表す型
 */
export interface ErrorHandlingConfig {
  /** API呼び出しの再試行回数 */
  retryCount: number;

  /** 再試行間隔（ミリ秒） */
  retryInterval: number;

  /** エラーレポートを送信するかどうか */
  reportErrors: boolean;

  /** エラーログを表示するかどうか */
  showErrors: boolean;
}

// ============================================================================
// アプリケーション全体設定
// ============================================================================

/**
 * アプリケーションの全体設定を表す型
 */
export interface AppConfig {
  /** 環境設定 */
  environment: EnvironmentConfig;

  /** Google Maps関連の設定 */
  maps: MapConfig;

  /** Google Sheets関連の設定 */
  sheets: SheetsConfig;

  /** エリアやマーカーの表示設定 */
  display: DisplayConfig;

  /** エラー処理の設定 */
  errorHandling: ErrorHandlingConfig;
}

/**
 * 設定値の検証を行うユーティリティ型
 * 各設定値に対して型安全な検証を行うための関数型
 */
export type ConfigValidator<T> = (value: unknown) => T;

/**
 * 設定値のマージに関するユーティリティ型
 * 基本設定と部分的な上書き設定をマージするための関数型
 */
export type ConfigMerger<T> = (base: T, override: Partial<T>) => T;

/**
 * 設定ロード関数の型
 * 実行時に設定をロードする関数の型定義
 */
export type ConfigLoader = () => Promise<Partial<AppConfig>> | Partial<AppConfig>;
