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
  DistanceCalculator,
  BoundsChecker,
  LatLngValidator,
} from '../types/geo.types';

/**
 * 緯度経度を検証する関数
 *
 * @param lat - 緯度
 * @param lng - 経度
 * @returns 検証済みの緯度経度オブジェクト
 * @throws 値が範囲外の場合はエラー
 */
export const validateLatLng: LatLngValidator = (lat, lng) => {
  const lang = getCurrentLanguage();

  if (lat < -90 || lat > 90) {
    const message = lang === 'ja' ? '緯度は-90から90の間である必要があります' : 'Latitude must be between -90 and 90';
    throw new Error(message);
  }

  if (lng < -180 || lng > 180) {
    const message =
      lang === 'ja' ? '経度は-180から180の間である必要があります' : 'Longitude must be between -180 and 180';
    throw new Error(message);
  }

  return { lat, lng };
};

/**
 * 2地点間の距離を計算する（ハベルシン公式）
 *
 * @param point1 - 始点の座標
 * @param point2 - 終点の座標
 * @param unit - 距離の単位（デフォルト: km）
 * @returns 計算された距離
 */
export const calculateDistance: DistanceCalculator = (point1, point2, unit = DEFAULT_DISTANCE_UNIT) => {
  // 緯度と経度をラジアンに変換
  const lat1 = (point1.lat * Math.PI) / 180;
  const lat2 = (point2.lat * Math.PI) / 180;
  const lon1 = (point1.lng * Math.PI) / 180;
  const lon2 = (point2.lng * Math.PI) / 180;

  // ハベルシン公式
  const dLat = lat2 - lat1;
  const dLon = lon2 - lon1;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  // メートル単位での距離
  const distanceInMeters = EARTH_RADIUS_METERS * c;

  // 指定された単位に変換
  const value = distanceInMeters * DISTANCE_UNIT_FACTORS[unit];

  return { value, unit };
};

/**
 * 座標が境界内にあるかチェックする
 *
 * @param point - チェックする座標
 * @param bounds - 境界ボックス
 * @returns 境界内にある場合はtrue
 */
export const isPointInBounds: BoundsChecker = (point, bounds) => {
  return (
    point.lat >= bounds.southwest.lat &&
    point.lat <= bounds.northeast.lat &&
    point.lng >= bounds.southwest.lng &&
    point.lng <= bounds.northeast.lng
  );
};

/**
 * 座標が佐渡島の境界内にあるかチェックする
 *
 * @param point - チェックする座標
 * @returns 佐渡島内にある場合はtrue
 */
export const isPointInSado = (point: LatLngLiteral): boolean => {
  return isPointInBounds(point, SADO_BOUNDS);
};

/**
 * 緯度経度を文字列表現に変換する
 *
 * @param location - 緯度経度オブジェクト
 * @param format - 出力形式 ('dms': 度分秒, 'dec': 10進数)
 * @returns 人間が読みやすい形式の座標文字列
 */
export const formatLatLng = (location: LatLngLiteral, format: 'dms' | 'dec' = 'dec'): string => {
  const { lat, lng } = location;

  if (format === 'dec') {
    return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
  }

  // 度分秒形式への変換
  const formatDMS = (value: number, isLat: boolean): string => {
    const absolute = Math.abs(value);
    const degrees = Math.floor(absolute);
    const minutes = Math.floor((absolute - degrees) * 60);
    const seconds = ((absolute - degrees) * 60 - minutes) * 60;

    const direction = isLat ? (value >= 0 ? 'N' : 'S') : value >= 0 ? 'E' : 'W';

    return `${degrees}° ${minutes}' ${seconds.toFixed(2)}" ${direction}`;
  };

  return `${formatDMS(lat, true)} ${formatDMS(lng, false)}`;
};

/**
 * 境界ボックスの中心座標を計算する
 *
 * @param bounds - 境界ボックス
 * @returns 中心の緯度経度
 */
export const getBoundsCenter = (bounds: Bounds): LatLngLiteral => {
  return {
    lat: (bounds.northeast.lat + bounds.southwest.lat) / 2,
    lng: (bounds.northeast.lng + bounds.southwest.lng) / 2,
  };
};

/**
 * 座標の配列から境界ボックスを計算する
 *
 * @param points - 緯度経度の配列
 * @returns 計算された境界ボックス
 */
export const calculateBoundsFromPoints = (points: LatLngLiteral[]): Bounds | null => {
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
};
