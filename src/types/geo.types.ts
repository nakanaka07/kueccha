/**
 * 位置情報関連の型定義ファイル
 *
 * 地理座標、境界、距離などの位置情報に関する基本型を定義します。
 * 関連するユーティリティ関数は utils/geo.utils.ts に実装されています。
 *
 * @see ../utils/geo.utils.ts - 位置情報操作用ユーティリティ関数
 */

/// <reference types="@types/google.maps" />

// ============================================================================
// 基本位置情報型
// ============================================================================

/**
 * 緯度を表すブランド型 (-90〜90)
 * 型安全な緯度値を表現するための特殊な型
 */
export type Latitude = number & { readonly __brand: unique symbol };

/**
 * 経度を表すブランド型 (-180〜180)
 * 型安全な経度値を表現するための特殊な型
 */
export type Longitude = number & { readonly __brand: unique symbol };

/**
 * 緯度経度を表す型
 * Google Maps APIの基本的な位置表現
 */
export interface LatLngLiteral {
  lat: number; // 緯度
  lng: number; // 経度
}

/**
 * 地理的境界ボックスを表す型
 * 矩形領域を北東と南西の座標で表現
 */
export interface Bounds {
  northeast: LatLngLiteral; // 北東の隅の座標
  southwest: LatLngLiteral; // 南西の隅の座標
}

/**
 * 距離を表す型
 */
export interface Distance {
  value: number; // 距離の値
  unit: string; // 距離の単位
  formatted: string; // フォーマット済み文字列
}

/**
 * 位置情報の精度を表す型
 */
export interface GeolocationAccuracy {
  value: number; // 精度値（メートル）
  horizontal?: number; // 水平精度
  vertical?: number; // 垂直精度
  isHighAccuracy: boolean; // 高精度かどうか
}

// ============================================================================
// Google Maps API関連型
// ============================================================================

/**
 * Google Maps API のコントロール位置列挙型
 * UIコントロールの配置位置を指定する定数
 */
export enum ControlPosition {
  TOP_LEFT = 1,
  TOP_CENTER = 2,
  TOP_RIGHT = 3,
  LEFT_TOP = 4,
  LEFT_CENTER = 5,
  LEFT_BOTTOM = 6,
  RIGHT_TOP = 7,
  RIGHT_CENTER = 8,
  RIGHT_BOTTOM = 9,
  BOTTOM_LEFT = 10,
  BOTTOM_CENTER = 11,
  BOTTOM_RIGHT = 12,
}

/**
 * ControlPositionをstring型で表現する型
 * 設定ファイルなどで文字列として位置を指定する際に使用
 */
export type ControlPositionString = keyof typeof ControlPosition;

/**
 * Google Maps API の MapTypeControl スタイル列挙型
 * 地図タイプ切替コントロールの表示スタイル
 */
export enum MapTypeControlStyle {
  DEFAULT = 0,
  HORIZONTAL_BAR = 1,
  DROPDOWN_MENU = 2,
}

/**
 * マップタイプIDの型定義
 * 地図の表示スタイル（道路地図、衛星写真など）を指定
 */
export type MapTypeId = google.maps.MapTypeId | 'roadmap' | 'satellite' | 'hybrid' | 'terrain';

/**
 * 地図の表示スタイル設定
 */
export interface MapStyleOptions {
  name: string; // スタイル名
  description?: string; // 説明
  styles: google.maps.MapTypeStyle[]; // スタイル配列
}
