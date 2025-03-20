/**
 * マップ関連の型定義ファイル
 */

/// <reference types="@types/google.maps" />

import type { BaseProps } from './base.types';
import type { LatLngLiteral, ControlPosition, ControlPositionString, MapTypeId } from './geo.types';
import type { Poi } from './poi.types';
import type { LoadScriptProps, MapOptions } from '@react-google-maps/api';

/**
 * マップ表示モードの種類
 */
export enum MapDisplayMode {
  STANDARD = 'standard',  // 標準的な道路地図
  SATELLITE = 'satellite', // 衛星写真
  ACCESSIBLE = 'accessible', // アクセシビリティ向上モード
  NIGHT = 'night', // 夜間モード
}

/**
 * マップ表示モードのマッピング
 */
export interface MapDisplayModes {
  [MapDisplayMode.STANDARD]: MapDisplayModeOptions;
  [MapDisplayMode.SATELLITE]: MapDisplayModeOptions;
  [MapDisplayMode.ACCESSIBLE]: MapDisplayModeOptions;
  [MapDisplayMode.NIGHT]: MapDisplayModeOptions;
}

/**
 * マップ表示モード設定の型
 */
export interface MapDisplayModeOptions {
  mapTypeId: MapTypeId; // マップタイプID
  styles: google.maps.MapTypeStyle[]; // マップスタイル配列
}

/**
 * マップのスタイル設定
 */
export interface MapStyle {
  width: string; // コンテナの幅
  height: string; // コンテナの高さ
  additionalStyles?: React.CSSProperties; // 追加のCSSスタイル
}

/**
 * 標準のMapOptions型を拡張してカスタムコントロールをサポート
 */
export interface ExtendedMapOptions extends MapOptions {
  cameraControl?: boolean; // カメラコントロールの表示/非表示
  cameraControlOptions?: {
    position: ControlPosition | ControlPositionString;
  };
}

/**
 * マップの設定情報を表す型
 */
export interface MapConfig {
  apiKey: string; // Google Maps API キー
  mapId: string; // Google Maps Map ID
  defaultCenter: LatLngLiteral; // マップの初期中心座標
  defaultZoom: number; // マップの初期ズームレベル (1-20)
  libraries: LoadScriptProps['libraries']; // 使用するGoogle Maps APIのライブラリ
  language: string; // マップの表示言語
  version: string; // Google Maps API バージョン
  style: MapStyle; // マップのコンテナスタイル設定
  options: ExtendedMapOptions; // Google Maps の詳細なオプション設定
  mobileOptions?: Partial<ExtendedMapOptions>; // モバイルデバイス用の追加マップオプション
  boundsPadding?: number; // マーカーの周囲の余白（ピクセル）
  clusteringThreshold?: number; // マーカーのクラスタリングしきい値
  defaultInfoWindowMaxWidth?: number; // 情報ウィンドウのデフォルト最大幅
}

/**
 * マップ読み込みエラー情報を表す型
 */
export interface MapLoadError {
  code: string; // エラーコード
  message: string; // エラーメッセージ
  details?: unknown; // 追加のエラー詳細情報
  timestamp: number; // エラーのタイムスタンプ
}

/**
 * マップ読み込み結果を表す型
 */
export type MapLoadResult =
  | { success: true; map: google.maps.Map }
  | { success: false; error: MapLoadError };

/**
 * マップイベントハンドラを表す型
 */
export interface MapEventHandlers {
  onClick?: (event: google.maps.MapMouseEvent) => void; // マップクリック時の処理
  onDragEnd?: () => void; // マップドラッグ終了時の処理
  onZoomChanged?: (newZoom: number) => void; // ズーム変更時の処理
  onBoundsChanged?: (newBounds: google.maps.LatLngBounds) => void; // 表示範囲変更時の処理
  onIdle?: () => void; // アイドル状態（操作完了後）になった時の処理
}

/**
 * マップコンポーネントのプロパティ型
 */
export interface MapProps extends BaseProps {
  pois: Poi[]; // マップ上に表示するPOI(Point of Interest)の配列
  eventHandlers?: MapEventHandlers; // マップイベントハンドラ
}

/**
 * メインマップコンポーネントのプロパティ型
 */
export interface MapComponentProps {
  onMapLoad: (result: MapLoadResult) => void; // マップがロードされたときに呼び出されるコールバック関数
  eventHandlers?: MapEventHandlers; // マップイベントハンドラ
}

/**
 * マップエラーコンポーネントのプロパティ型
 */
export interface MapErrorProps {
  error: MapLoadError; // エラー情報
  onRetry: () => void; // マップの再読み込みを試みる関数
}

/**
 * マップコントロールコンポーネントのプロパティ型
 */
export interface MapControlsProps {
  map: google.maps.Map; // マップインスタンス
  onResetNorth: () => void; // マップを北向きにリセットする関数
  onGetCurrentLocation: () => void; // ユーザーの現在位置を取得してマップを中心に表示する関数
  onToggleRecommendations: () => void; // おすすめエリアの表示/非表示を切り替える関数
}