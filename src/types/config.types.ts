/**
 * アプリケーション設定関連の型定義ファイル
 */

/// <reference types="@types/google.maps" />
import type { AreaType } from './areas.types';
import type { MapConfig } from './maps.types';
import type { SheetsConfig } from './sheets.types';

/**
 * アプリケーション実行環境を表す型
 */
export type EnvironmentName = 'development' | 'production' | 'test';

/**
 * 環境固有の設定を表す型
 */
export interface EnvironmentConfig {
  name: EnvironmentName;     // 環境名
  debug: boolean;            // デバッグモード有効化
  logLevel: 'error' | 'warn' | 'info' | 'debug'; // ログレベル
  cacheEnabled: boolean;     // API呼び出しのキャッシュ有効化
}

/**
 * マーカーカスタム設定のオプション
 */
export interface MarkerCustomOptions {
  defaultOpacity: number;    // デフォルトの不透明度（0.0-1.0）
  selectedAnimation: google.maps.Animation | null; // 選択時アニメーション
  defaultSize?: {
    width: number;
    height: number;
  };
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
  defaultVisibleAreas: AreaType[]; // デフォルト表示エリア
  markerOptions: MarkerCustomOptions; // マーカー設定
  mobile: {
    menuButtonPosition: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
    infoWindowScale: number;
  };
}

/**
 * エラー処理関連の設定を表す型
 */
export interface ErrorHandlingConfig {
  retryCount: number;        // API呼び出し再試行回数
  retryInterval: number;     // 再試行間隔（ミリ秒）
  reportErrors: boolean;     // エラーレポート送信
  showErrors: boolean;       // エラーログ表示
}

/**
 * アプリケーションの全体設定を表す型
 */
export interface AppConfig {
  environment: EnvironmentConfig;   // 環境設定
  maps: MapConfig;                  // Google Maps設定
  sheets: SheetsConfig;             // Google Sheets設定
  display: DisplayConfig;           // 表示設定
  errorHandling: ErrorHandlingConfig; // エラー処理設定
}

/**
 * 設定関連のユーティリティ型
 */
export type ConfigValidator<T> = (value: unknown) => T;
export type ConfigMerger<T> = (base: T, override: Partial<T>) => T;
export type ConfigLoader = () => Promise<Partial<AppConfig>> | Partial<AppConfig>;