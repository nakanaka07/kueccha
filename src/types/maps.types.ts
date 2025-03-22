/**
 * マップ関連の型定義ファイル
 *
 * Google Maps操作に関連する型定義を提供します。表示モード、設定、
 * イベントハンドラー、コンポーネントプロパティなどを含みます。
 *
 * @see geo.types.ts - 位置情報の基本型定義
 */

/// <reference types="@types/google.maps" />

import type { LoadScriptProps, MapOptions } from '@react-google-maps/api';

import type { BaseProps, StyledComponentProps, MapError } from './base.types';
import type { LatLngLiteral, ControlPosition, ControlPositionString, MapTypeId } from './geo.types';
import type { Poi } from './poi.types';

// ============================================================================
// マップ表示モード関連
// ============================================================================

/**
 * マップ表示モードの種類
 * ユーザーが選択できる地図の視覚表現スタイル
 */
export enum MapDisplayMode {
  STANDARD = 'standard', // 標準的な道路地図
  SATELLITE = 'satellite', // 衛星写真
  ACCESSIBLE = 'accessible', // アクセシビリティ向上モード
  NIGHT = 'night', // 夜間モード
}

/**
 * マップ表示モードのマッピング
 * 各モードに対応する設定オプションを保持
 */
export interface MapDisplayModes {
  [MapDisplayMode.STANDARD]: MapDisplayModeOptions;
  [MapDisplayMode.SATELLITE]: MapDisplayModeOptions;
  [MapDisplayMode.ACCESSIBLE]: MapDisplayModeOptions;
  [MapDisplayMode.NIGHT]: MapDisplayModeOptions;
}

/**
 * マップ表示モード設定の型
 * 地図の視覚的スタイルを定義するオプション
 */
export interface MapDisplayModeOptions {
  mapTypeId: MapTypeId; // マップタイプID
  styles: google.maps.MapTypeStyle[]; // マップスタイル配列
}

// ============================================================================
// マップ設定関連
// ============================================================================

/**
 * マップのスタイル設定
 * base.types.tsのStyledComponentPropsを活用
 */
export interface MapStyle extends StyledComponentProps {}

/**
 * 標準のMapOptions型を拡張してカスタムコントロールをサポート
 * Google Mapsの標準オプションに加えて、アプリ固有の拡張機能を定義
 */
export interface ExtendedMapOptions extends MapOptions {
  cameraControl?: boolean; // カメラコントロールの表示/非表示
  cameraControlOptions?: {
    position: ControlPosition | ControlPositionString;
  };
}

/**
 * マップの設定情報を表す型
 * アプリケーション全体のマップ設定を中央管理
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

// ============================================================================
// マップ読み込みとエラー処理
// ============================================================================

/**
 * マップ読み込みエラー情報を表す型
 * base.types.tsのMapErrorを活用
 */
export type MapLoadError = MapError;

/**
 * マップ読み込み結果を表す型
 * 読み込み成功時はマップインスタンス、失敗時はエラー情報を持つ判別可能なユニオン型
 */
export type MapLoadResult =
  | { success: true; map: google.maps.Map }
  | { success: false; error: MapLoadError };

// ============================================================================
// マップイベントとインタラクション
// ============================================================================

/**
 * マップイベントハンドラを表す型
 * マップとのユーザーインタラクションを処理するコールバック関数群
 */
export interface MapEventHandlers {
  onClick?: (event: google.maps.MapMouseEvent) => void; // マップクリック時の処理
  onDragEnd?: () => void; // マップドラッグ終了時の処理
  onZoomChanged?: (newZoom: number) => void; // ズーム変更時の処理
  onBoundsChanged?: (newBounds: google.maps.LatLngBounds) => void; // 表示範囲変更時の処理
  onIdle?: () => void; // アイドル状態（操作完了後）になった時の処理
}

// ============================================================================
// マップUIコンポーネント関連
// ============================================================================

/**
 * マップコンポーネントのプロパティ型
 * 最上位マップコンテナのプロパティを定義
 */
export interface MapProps extends BaseProps {
  pois: Poi[]; // マップ上に表示するPOI(Point of Interest)の配列
  eventHandlers?: MapEventHandlers; // マップイベントハンドラ
}

/**
 * メインマップコンポーネントのプロパティ型
 * 内部マップコンポーネントのプロパティを定義
 */
export interface MapComponentProps {
  onMapLoad: (result: MapLoadResult) => void; // マップがロードされたときに呼び出されるコールバック関数
  eventHandlers?: MapEventHandlers; // マップイベントハンドラ
}

/**
 * マップエラーコンポーネントのプロパティ型
 * マップ読み込みエラー表示用コンポーネントのプロパティを定義
 */
export interface MapErrorProps {
  error: MapLoadError; // エラー情報
  onRetry: () => void; // マップの再読み込みを試みる関数
}

/**
 * マップコントロールコンポーネントのプロパティ型
 * マップ上に表示される操作コントロール用コンポーネントのプロパティを定義
 */
export interface MapControlsProps {
  map: google.maps.Map; // マップインスタンス
  onResetNorth: () => void; // マップを北向きにリセットする関数
  onGetCurrentLocation: () => void; // ユーザーの現在位置を取得してマップを中心に表示する関数
  onToggleRecommendations: () => void; // おすすめエリアの表示/非表示を切り替える関数
}
