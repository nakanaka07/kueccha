/**
 * 位置情報関連の型定義ファイル
 */

/// <reference types="@types/google.maps" />

/**
 * 緯度を表すブランド型 (-90〜90)
 */
export type Latitude = number & { readonly __brand: unique symbol };

/**
 * 経度を表すブランド型 (-180〜180)
 */
export type Longitude = number & { readonly __brand: unique symbol };

/**
 * 緯度経度を表す型
 */
export interface LatLngLiteral {
  lat: number; // 緯度
  lng: number; // 経度
}

/**
 * 地理的境界ボックスを表す型
 */
export interface Bounds {
  northeast: LatLngLiteral; // 北東の隅の座標
  southwest: LatLngLiteral; // 南西の隅の座標
}

/**
 * Google Maps API のコントロール位置列挙型
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

export type ControlPositionString = keyof typeof ControlPosition;

/**
 * Google Maps API の MapTypeControl スタイル列挙型
 */
export enum MapTypeControlStyle {
  DEFAULT = 0,
  HORIZONTAL_BAR = 1,
  DROPDOWN_MENU = 2,
}

/**
 * 距離を表す型
 */
export interface Distance {
  value: number;     // 距離の値
  unit: string;      // 距離の単位
  formatted: string; // フォーマット済み文字列
}

/**
 * 位置情報の精度を表す型
 */
export interface GeolocationAccuracy {
  value: number;       // 精度値（メートル）
  horizontal?: number; // 水平精度
  vertical?: number;   // 垂直精度
  isHighAccuracy: boolean; // 高精度かどうか
}

/**
 * マップタイプIDの型定義
 */
export type MapTypeId = google.maps.MapTypeId | 'roadmap' | 'satellite' | 'hybrid' | 'terrain';

/**
 * 地図の表示スタイル設定
 */
export interface MapStyleOptions {
  name: string;                      // スタイル名
  description?: string;              // 説明
  styles: google.maps.MapTypeStyle[]; // スタイル配列
}

/**
 * 緯度値を検証して型安全な値を返す
 */
export function createLatitude(value: number): Latitude {
  if (value < -90 || value > 90) {
    throw new Error(`Invalid latitude value: ${value}. Must be between -90 and 90.`);
  }
  return value as Latitude;
}

/**
 * 経度値を検証して型安全な値を返す
 */
export function createLongitude(value: number): Longitude {
  if (value < -180 || value > 180) {
    throw new Error(`Invalid longitude value: ${value}. Must be between -180 and 180.`);
  }
  return value as Longitude;
}

/**
 * 緯度経度の値から型安全なLatLngLiteralオブジェクトを作成
 */
export function createLatLng(lat: number, lng: number): LatLngLiteral {
  createLatitude(lat);
  createLongitude(lng);
  return { lat, lng };
}