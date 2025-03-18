/**
 * 位置情報関連の定数ファイル
 *
 * 地理的な位置情報と地図表示に関する定数値を定義します。
 * 地図の初期表示位置や境界、距離計算のデフォルト値などを含みます。
 */

/// <reference types="@types/google.maps" />
import { getEnvValueAsNumber } from '../utils/env.utils';

import type {
  LatLngLiteral,
  Bounds,
  Distance,
  MapTypeId,
  ControlPosition,
  MapTypeControlStyle,
} from '../types/geo.types';

// ============================================================================
// Google Maps 依存関係の安全な参照
// ============================================================================

/**
 * Google Maps APIが利用可能かを確認する
 *
 * @returns Google Maps APIが利用可能な場合はtrue、そうでない場合はfalse
 */
function isGoogleMapsAvailable(): boolean {
  return typeof google !== 'undefined' && typeof google.maps.MapTypeId !== 'undefined';
}

/**
 * マップタイプIDを安全に取得する
 *
 * @param type マップタイプの識別子
 * @returns Google Maps APIのマップタイプIDまたは文字列リテラル
 */
function getMapTypeId(type: 'roadmap' | 'satellite' | 'hybrid' | 'terrain'): MapTypeId {
  if (isGoogleMapsAvailable()) {
    switch (type) {
      case 'satellite':
        return google.maps.MapTypeId.SATELLITE;
      case 'hybrid':
        return google.maps.MapTypeId.HYBRID;
      case 'terrain':
        return google.maps.MapTypeId.TERRAIN;
      case 'roadmap':
      default:
        return google.maps.MapTypeId.ROADMAP;
    }
  }

  // APIが利用できない場合は文字列を返す
  return type;
}

/**
 * コントロールの位置を安全に取得する
 *
 * @param position ポジション名
 * @returns Google Maps APIのコントロールポジションまたは数値
 */
function getControlPosition(position: 'TOP_RIGHT'): ControlPosition {
  if (isGoogleMapsAvailable()) {
    switch (position) {
      case 'TOP_RIGHT':
        return google.maps.ControlPosition.TOP_RIGHT;
      default:
        return google.maps.ControlPosition.TOP_RIGHT;
    }
  }

  // APIが利用できない場合は数値を返す (Google Mapsの実装に基づく)
  return 3; // TOP_RIGHT = 3
}

/**
 * マップタイプコントロールスタイルを安全に取得する
 *
 * @param style スタイル名
 * @returns Google Maps APIのマップタイプコントロールスタイルまたは数値
 */
function getMapTypeControlStyle(style: 'DROPDOWN_MENU'): MapTypeControlStyle {
  if (isGoogleMapsAvailable()) {
    switch (style) {
      case 'DROPDOWN_MENU':
        return google.maps.MapTypeControlStyle.DROPDOWN_MENU;
      default:
        return google.maps.MapTypeControlStyle.DROPDOWN_MENU;
    }
  }

  // APIが利用できない場合は数値を返す (Google Mapsの実装に基づく)
  return 2; // DROPDOWN_MENU = 2
}

// ============================================================================
// 地理的デフォルト位置
// ============================================================================

/**
 * 佐渡島の中心座標
 * 地図の初期表示位置として使用されます
 */
export const SADO_CENTER: LatLngLiteral = {
  lat: 38.0307,
  lng: 138.3716,
};

/**
 * 佐渡島の表示境界
 * 地図の表示範囲を制限するために使用されます
 */
export const SADO_BOUNDS: Bounds = {
  northeast: {
    lat: 38.3198,
    lng: 138.5811,
  },
  southwest: {
    lat: 37.796,
    lng: 138.1623,
  },
};

/**
 * 最大ズームレベル
 * 地図の最大ズームレベルを指定します
 */
export const MAX_ZOOM_LEVEL = getEnvValueAsNumber('VITE_MAX_ZOOM_LEVEL', 19);

/**
 * 最小ズームレベル
 * 地図の最小ズームレベルを指定します
 */
export const MIN_ZOOM_LEVEL = getEnvValueAsNumber('VITE_MIN_ZOOM_LEVEL', 9);

/**
 * デフォルトのズームレベル
 * 地図の初期ズームレベルを指定します
 */
export const DEFAULT_ZOOM_LEVEL = getEnvValueAsNumber('VITE_DEFAULT_ZOOM_LEVEL', 11);

// ============================================================================
// 地図表示オプション
// ============================================================================

/**
 * 安全なマップオプションを生成する
 * Google Maps APIの可用性に依存しないマップオプションを作成
 *
 * @returns Google Maps APIのマップオプション
 */
function createSafeMapOptions(): google.maps.MapOptions {
  const mapOptions = {
    center: SADO_CENTER,
    zoom: DEFAULT_ZOOM_LEVEL,
    minZoom: MIN_ZOOM_LEVEL,
    maxZoom: MAX_ZOOM_LEVEL,
    mapTypeId: getMapTypeId('roadmap'),
    fullscreenControl: true,
    streetViewControl: true,
    mapTypeControl: true,
    zoomControl: true,
    mapTypeControlOptions: {
      style: getMapTypeControlStyle('DROPDOWN_MENU'),
      position: getControlPosition('TOP_RIGHT'),
    },
  };

  return mapOptions as google.maps.MapOptions;
}

/**
 * Google Mapsのデフォルトオプション
 * 地図の初期表示設定として使用されます
 */
export const DEFAULT_MAP_OPTIONS = createSafeMapOptions();

/**
 * モバイル向けのマップオプション
 * モバイルデバイスでの表示に最適化されたオプション
 */
export const MOBILE_MAP_OPTIONS: Partial<google.maps.MapOptions> = {
  streetViewControl: false,
  mapTypeControl: false,
  zoomControl: false,
  fullscreenControl: false,
};

// ============================================================================
// 距離計算関連
// ============================================================================

/**
 * 距離単位の変換係数
 * 異なる単位間の距離変換に使用されます
 */
export const DISTANCE_UNIT_FACTORS: Record<Distance['unit'], number> = {
  m: 1,
  km: 0.001,
  mi: 0.000621371,
  ft: 3.28084,
};

/**
 * デフォルトの距離単位
 * 距離計算で明示的に指定がない場合に使用される単位
 */
export const DEFAULT_DISTANCE_UNIT: Distance['unit'] = 'km';

/**
 * 地球の半径（メートル）
 * 大圏距離計算で使用されます
 */
export const EARTH_RADIUS_METERS = 6371000;

// ============================================================================
// Geolocation API関連
// ============================================================================

/**
 * 位置情報取得オプション
 * Geolocation APIで位置情報を取得する際のオプション
 */
export const DEFAULT_GEOLOCATION_OPTIONS: PositionOptions = {
  enableHighAccuracy: true,
  timeout: getEnvValueAsNumber('VITE_GEOLOCATION_TIMEOUT', 10000),
  maximumAge: getEnvValueAsNumber('VITE_GEOLOCATION_MAX_AGE', 60000),
};

/**
 * 位置情報の許容精度（メートル）
 * この値より精度が低い場合、警告またはエラーが表示されます
 */
export const MIN_ACCEPTABLE_ACCURACY = getEnvValueAsNumber('VITE_MIN_GEOLOCATION_ACCURACY', 100);

/**
 * 現在地の更新間隔（ミリ秒）
 * リアルタイム追跡機能で使用されます
 */
export const LOCATION_UPDATE_INTERVAL = getEnvValueAsNumber('VITE_LOCATION_UPDATE_INTERVAL', 10000);
