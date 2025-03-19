/**
 * 位置情報関連の型定義ファイル
 *
 * 地理的な位置情報と座標データ構造を定義します。
 * Google Maps APIとの互換性を持ちつつ、型安全性を高めた実装です。
 */

/// <reference types="@types/google.maps" />
import { BaseProps } from './base.types';

// ============================================================================
// 基本地理データ型 - ブランド型による強化
// ============================================================================

/**
 * 緯度を表すブランド型
 * -90から90の範囲に制限される数値型
 */
export type Latitude = number & { readonly __brand: unique symbol };

/**
 * 経度を表すブランド型
 * -180から180の範囲に制限される数値型
 */
export type Longitude = number & { readonly __brand: unique symbol };

/**
 * 緯度経度を表す型。
 * Google Maps APIの同名型（google.maps.LatLngLiteral）と互換性があります。
 */
export interface LatLngLiteral {
  /** 緯度（-90〜90の範囲） */
  lat: Latitude | number;

  /** 経度（-180〜180の範囲） */
  lng: Longitude | number;
}

/**
 * 地理的境界ボックスを表す型。
 * 地図の表示範囲などに使用されます。
 */
export interface Bounds {
  /** 北東端の座標 */
  northeast: LatLngLiteral;

  /** 南西端の座標 */
  southwest: LatLngLiteral;
}

// ============================================================================
// Google Maps API 列挙型の静的定義
// ============================================================================

/**
 * Google Maps API のコントロール位置列挙型
 * API読み込み前でも使用できるように静的に定義
 * @see https://developers.google.com/maps/documentation/javascript/reference/control#ControlPosition
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
 * コントロール位置を表す文字列リテラル型
 * 列挙型と互換性を持つ文字列表現
 */
export type ControlPositionString = keyof typeof ControlPosition;

/**
 * Google Maps API の MapTypeControl スタイル列挙型
 * API読み込み前でも使用できるように静的に定義
 * @see https://developers.google.com/maps/documentation/javascript/reference/control#MapTypeControlStyle
 */
export enum MapTypeControlStyle {
  DEFAULT = 0,
  HORIZONTAL_BAR = 1,
  DROPDOWN_MENU = 2,
}

// ============================================================================
// 拡張地理データ型
// ============================================================================

/**
 * 距離を表す型。
 * 2地点間の距離計算結果などに使用されます。
 */
export interface Distance {
  /** 距離の値 */
  value: number;

  /** 距離の単位 */
  unit: 'km' | 'm' | 'mi' | 'ft';
}

/**
 * 位置情報の精度を表す型。
 * Geolocation APIから取得した位置情報の精度を表します。
 */
export interface GeolocationAccuracy {
  /** 精度（メートル） */
  accuracy: number;

  /** 高精度モードが使用されたか */
  isHighAccuracy: boolean;

  /** タイムスタンプ */
  timestamp: number;
}

// ============================================================================
// 地図表示関連の型
// ============================================================================

/**
 * マップタイプIDの型定義
 * Google Maps APIのマップタイプに対応する文字列リテラルまたはAPIの定数
 */
export type MapTypeId = google.maps.MapTypeId | 'roadmap' | 'satellite' | 'hybrid' | 'terrain';

/**
 * 地図の表示スタイル設定
 */
export interface MapStyleOptions {
  /** スタイルの名称 */
  name: string;

  /** スタイルの説明 */
  description?: string;

  /** Google Maps API用のスタイル配列 */
  styles: google.maps.MapTypeStyle[];
}

// ============================================================================
// ユーティリティ関数の型定義と実装
// ============================================================================

/**
 * 緯度値を検証して型安全な値を返す
 * @param value - 検証する緯度値
 * @returns ブランド化された緯度値
 * @throws 値が範囲外の場合はエラー
 */
export function createLatitude(value: number): Latitude {
  if (value < -90 || value > 90) {
    throw new Error(`Invalid latitude value: ${value}. Must be between -90 and 90.`);
  }
  return value as Latitude;
}

/**
 * 経度値を検証して型安全な値を返す
 * @param value - 検証する経度値
 * @returns ブランド化された経度値
 * @throws 値が範囲外の場合はエラー
 */
export function createLongitude(value: number): Longitude {
  if (value < -180 || value > 180) {
    throw new Error(`Invalid longitude value: ${value}. Must be between -180 and 180.`);
  }
  return value as Longitude;
}

/**
 * 型安全な緯度経度オブジェクトを作成する
 * @param lat - 緯度
 * @param lng - 経度
 * @returns 検証済みの緯度経度オブジェクト
 */
export function createLatLng(lat: number, lng: number): LatLngLiteral {
  return {
    lat: createLatitude(lat),
    lng: createLongitude(lng),
  };
}

/**
 * 緯度経度オブジェクトを検証する
 * @param location - 検証する緯度経度オブジェクト
 * @returns 検証済みの緯度経度オブジェクト
 */
export function validateLatLng(location: LatLngLiteral): LatLngLiteral {
  return createLatLng(Number(location.lat), Number(location.lng));
}

/**
 * 2地点間の距離を計算する関数の型定義
 */
export type DistanceCalculator = (
  point1: LatLngLiteral,
  point2: LatLngLiteral,
  unit?: Distance['unit'],
) => Distance;

/**
 * 指定した座標が境界ボックス内にあるかを判定する関数の型定義
 */
export type BoundsChecker = (point: LatLngLiteral, bounds: Bounds) => boolean;

/**
 * 座標を文字列表現に変換する関数の型
 */
export type LatLngFormatter = (location: LatLngLiteral, format?: 'dms' | 'dec') => string;

/**
 * 複数地点から境界を計算する関数の型
 */
export type BoundsCalculator = (points: LatLngLiteral[]) => Bounds | null;
