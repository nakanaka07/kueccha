/**
 * 位置情報関連のユーティリティ関数
 *
 * 地理的な位置情報の処理、検証、計算に関する関数を提供します。
 */

import {
  EARTH_RADIUS_METERS,
  DISTANCE_UNIT_FACTORS,
  DEFAULT_DISTANCE_UNIT,
  SADO_BOUNDS,
} from '../constants/geo.constants';
import { getCurrentLanguage } from '../constants/i18n.constants';

import type {
  LatLngLiteral,
  Bounds,
  Distance,
  DistanceUnit,
  Latitude,
  Longitude,
} from '../types/geo.types';

/**
 * 緯度値を検証して型安全な値を返す
 */
export function createLatitude(value: number): Latitude {
  if (value < -90 || value > 90) {
    throw new Error(`緯度の値が範囲外です: ${value}。-90から90の間である必要があります。`);
  }
  return value as Latitude;
}

/**
 * 経度値を検証して型安全な値を返す
 */
export function createLongitude(value: number): Longitude {
  if (value < -180 || value > 180) {
    throw new Error(`経度の値が範囲外です: ${value}。-180から180の間である必要があります。`);
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

/**
 * 境界ボックスを作成する
 */
export function createBounds(northeast: LatLngLiteral, southwest: LatLngLiteral): Bounds {
  return { northeast, southwest };
}

/**
 * 緯度経度を検証する関数
 *
 * @param lat - 緯度
 * @param lng - 経度
 * @returns 検証済みの緯度経度オブジェクト
 * @throws 値が範囲外の場合はエラー
 */
export function validateLatLng(lat: number, lng: number): LatLngLiteral {
  const lang = getCurrentLanguage();

  if (lat < -90 || lat > 90) {
    const message =
      lang === 'ja'
        ? '緯度は-90から90の間である必要があります'
        : 'Latitude must be between -90 and 90';
    throw new Error(message);
  }

  if (lng < -180 || lng > 180) {
    const message =
      lang === 'ja'
        ? '経度は-180から180の間である必要があります'
        : 'Longitude must be between -180 and 180';
    throw new Error(message);
  }

  return { lat, lng };
}

/**
 * 2地点間の距離を計算する（ハベルシン公式）
 *
 * @param point1 - 始点の座標
 * @param point2 - 終点の座標
 * @param unit - 距離の単位（デフォルト: km）
 * @returns 計算された距離
 */
export function calculateDistance(
  point1: LatLngLiteral,
  point2: LatLngLiteral,
  unit: DistanceUnit = DEFAULT_DISTANCE_UNIT,
): Distance {
  // 緯度と経度をラジアンに変換
  const lat1 = (point1.lat * Math.PI) / 180;
  const lat2 = (point2.lat * Math.PI) / 180;
  const lon1 = (point1.lng * Math.PI) / 180;
  const lon2 = (point2.lng * Math.PI) / 180;

  // ハベルシン公式
  const dLat = lat2 - lat1;
  const dLon = lon2 - lon1;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  // メートル単位での距離
  const distanceInMeters = EARTH_RADIUS_METERS * c;

  // 指定された単位に変換
  const value = distanceInMeters * DISTANCE_UNIT_FACTORS[unit];

  return { value, unit };
}

/**
 * 座標が境界内にあるかチェックする
 *
 * @param point - チェックする座標
 * @param bounds - 境界ボックス
 * @returns 境界内にある場合はtrue
 */
export function isPointInBounds(point: LatLngLiteral, bounds: Bounds): boolean {
  return (
    point.lat >= bounds.southwest.lat &&
    point.lat <= bounds.northeast.lat &&
    point.lng >= bounds.southwest.lng &&
    point.lng <= bounds.northeast.lng
  );
}

/**
 * 座標が佐渡島の境界内にあるかチェックする
 *
 * @param point - チェックする座標
 * @returns 佐渡島内にある場合はtrue
 */
export function isPointInSado(point: LatLngLiteral): boolean {
  return isPointInBounds(point, SADO_BOUNDS);
}

/**
 * 境界ボックスの中心座標を計算する
 *
 * @param bounds - 境界ボックス
 * @returns 中心の緯度経度
 */
export function getBoundsCenter(bounds: Bounds): LatLngLiteral {
  return {
    lat: (bounds.northeast.lat + bounds.southwest.lat) / 2,
    lng: (bounds.northeast.lng + bounds.southwest.lng) / 2,
  };
}

/**
 * 座標の配列から境界ボックスを計算する
 *
 * @param points - 緯度経度の配列
 * @returns 計算された境界ボックス、または空配列の場合はnull
 */
export function calculateBoundsFromPoints(points: LatLngLiteral[]): Bounds | null {
  if (!points.length) {
    return null;
  }

  let minLat = points[0].lat;
  let maxLat = points[0].lat;
  let minLng = points[0].lng;
  let maxLng = points[0].lng;

  for (let i = 1; i < points.length; i++) {
    const { lat, lng } = points[i];
    minLat = Math.min(minLat, lat);
    maxLat = Math.max(maxLat, lat);
    minLng = Math.min(minLng, lng);
    maxLng = Math.max(maxLng, lng);
  }

  return {
    northeast: { lat: maxLat, lng: maxLng },
    southwest: { lat: minLat, lng: minLng },
  };
}
