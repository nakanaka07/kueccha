/**
 * 位置情報関連の定数ファイル
 */
/// <reference types="@types/google.maps" />
import type {
  LatLngLiteral,
  Bounds,
  Distance,
  MapTypeId,
  ControlPosition,
  MapTypeControlStyle,
} from '../types/geo.types';
import { getEnvValueAsNumber } from '../utils/env.utils';

// Google Maps 依存関係ユーティリティ
export function isGoogleMapsAvailable(): boolean {
  return typeof google !== 'undefined' && typeof google.maps.MapTypeId !== 'undefined';
}

export function getMapTypeId(type: 'roadmap' | 'satellite' | 'hybrid' | 'terrain'): MapTypeId {
  if (!isGoogleMapsAvailable()) return type;

  switch (type) {
    case 'satellite':
      return google.maps.MapTypeId.SATELLITE;
    case 'hybrid':
      return google.maps.MapTypeId.HYBRID;
    case 'terrain':
      return google.maps.MapTypeId.TERRAIN;
    default:
      return google.maps.MapTypeId.ROADMAP;
  }
}

function getControlPosition(position: 'TOP_RIGHT'): ControlPosition {
  return isGoogleMapsAvailable() ? google.maps.ControlPosition.TOP_RIGHT : 3; // TOP_RIGHT = 3
}

function getMapTypeControlStyle(style: 'DROPDOWN_MENU'): MapTypeControlStyle {
  return isGoogleMapsAvailable() ? google.maps.MapTypeControlStyle.DROPDOWN_MENU : 2; // DROPDOWN_MENU = 2
}

// 地理的デフォルト位置
export const SADO_CENTER: LatLngLiteral = {
  lat: 38.0307,
  lng: 138.3716,
};

export const SADO_BOUNDS: Bounds = {
  northeast: { lat: 38.3198, lng: 138.5811 },
  southwest: { lat: 37.796, lng: 138.1623 },
};

export const MAX_ZOOM_LEVEL = getEnvValueAsNumber('VITE_MAX_ZOOM_LEVEL', 19);
export const MIN_ZOOM_LEVEL = getEnvValueAsNumber('VITE_MIN_ZOOM_LEVEL', 9);
export const DEFAULT_ZOOM_LEVEL = getEnvValueAsNumber('VITE_DEFAULT_ZOOM_LEVEL', 11);

// 地図表示オプション
export const DEFAULT_MAP_OPTIONS = {
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
} as google.maps.MapOptions;

export const MOBILE_MAP_OPTIONS: Partial<google.maps.MapOptions> = {
  streetViewControl: false,
  mapTypeControl: false,
  zoomControl: false,
  fullscreenControl: false,
};

// 距離計算関連
export const DISTANCE_UNIT_FACTORS: Record<Distance['unit'], number> = {
  m: 1,
  km: 0.001,
  mi: 0.000621371,
  ft: 3.28084,
};

export const DEFAULT_DISTANCE_UNIT: Distance['unit'] = 'km';
export const EARTH_RADIUS_METERS = 6371000;

// Geolocation API関連
export const DEFAULT_GEOLOCATION_OPTIONS: PositionOptions = {
  enableHighAccuracy: true,
  timeout: getEnvValueAsNumber('VITE_GEOLOCATION_TIMEOUT', 10000),
  maximumAge: getEnvValueAsNumber('VITE_GEOLOCATION_MAX_AGE', 60000),
};

export const MIN_ACCEPTABLE_ACCURACY = getEnvValueAsNumber('VITE_MIN_GEOLOCATION_ACCURACY', 100);
export const LOCATION_UPDATE_INTERVAL = getEnvValueAsNumber('VITE_LOCATION_UPDATE_INTERVAL', 10000);
