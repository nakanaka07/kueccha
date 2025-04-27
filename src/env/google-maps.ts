/**
 * Google Maps関連の環境変数アクセス機能
 *
 * Google Maps Guidelinesに準拠した実装
 * 静的ホスティング環境向けに最適化済み
 */

import { logger } from '../utils/logger';

import { getCachedEnvVar, getCachedEnvBool, getCachedEnvNumber } from './cache';

// Google Maps API関連の環境変数定数
const ENV_KEYS = {
  API_KEY: 'VITE_GOOGLE_API_KEY',
  MAPS_VERSION: 'VITE_GOOGLE_MAPS_VERSION',
  MAPS_LIBRARIES: 'VITE_GOOGLE_MAPS_LIBRARIES',
  MAP_ID: 'VITE_GOOGLE_MAPS_MAP_ID',
  FEATURE_MARKER_CLUSTERING: 'VITE_FEATURE_MARKER_CLUSTERING',
  UI_MAP_INITIAL_ZOOM: 'VITE_UI_MAP_INITIAL_ZOOM',
  UI_MAP_INITIAL_CENTER_LAT: 'VITE_UI_MAP_INITIAL_CENTER_LAT',
  UI_MAP_INITIAL_CENTER_LNG: 'VITE_UI_MAP_INITIAL_CENTER_LNG',
  MAP_MIN_ZOOM: 'VITE_UI_MAP_MIN_ZOOM',
  MAP_MAX_ZOOM: 'VITE_UI_MAP_MAX_ZOOM',
  MAP_OPTIMIZE_FOR_MOBILE: 'VITE_UI_MAP_OPTIMIZE_FOR_MOBILE',
  ENABLE_ADVANCED_MARKERS: 'VITE_FEATURE_ADVANCED_MARKERS',
  ENABLE_OFFLINE_MAPS: 'VITE_FEATURE_OFFLINE_MAPS',
};

// デフォルト値の定数
const DEFAULTS = {
  MAPS_VERSION: 'quarterly',
  MAPS_LIBRARIES: 'places,geometry,marker',
  INITIAL_ZOOM: 11,
  MIN_ZOOM: 5,
  MAX_ZOOM: 20,
  INITIAL_LAT: 38.048, // 佐渡島の中心緯度
  INITIAL_LNG: 138.409, // 佐渡島の中心経度
};

// エラーメッセージ定数
const ERROR_MESSAGES = {
  API_KEY_MISSING: 'Google Maps APIキーが設定されていません',
  API_KEY_SHORT: 'Google Maps APIキーが短すぎるか、不正な形式の可能性があります',
  MAP_ID_INVALID: 'Google Maps Map IDが空白文字のみです',
};

/**
 * Google Maps API キーを取得
 * @returns Google Maps APIキー
 */
export function getGoogleApiKey(): string {
  return getCachedEnvVar(ENV_KEYS.API_KEY, '');
}

/**
 * Google Maps APIバージョンを取得
 * @returns Google Maps APIのバージョン設定
 */
export function getGoogleMapsVersion(): string {
  return getCachedEnvVar(ENV_KEYS.MAPS_VERSION, DEFAULTS.MAPS_VERSION);
}

/**
 * Google Mapsライブラリの配列を取得
 * @returns 使用するGoogleマップライブラリの配列
 */
export function getGoogleMapsLibraries(): string[] {
  const librariesStr = getCachedEnvVar(ENV_KEYS.MAPS_LIBRARIES, DEFAULTS.MAPS_LIBRARIES);
  // 安全な値のみを許可（ホワイトリストアプローチ）
  const allowedLibraries = new Set([
    'places',
    'geometry',
    'marker',
    'drawing',
    'visualization',
    'localcontext',
    'webgl',
    'routes',
  ]);

  return librariesStr
    .split(',')
    .map(lib => lib.trim())
    .filter(lib => allowedLibraries.has(lib));
}

/**
 * Google Maps Map IDを取得
 * @returns スタイル付きマップのMap ID
 */
export function getGoogleMapId(): string {
  return getCachedEnvVar(ENV_KEYS.MAP_ID, '');
}

/**
 * マーカークラスタリングを有効にするかどうか
 * @returns マーカークラスタリングの有効/無効状態
 */
export function isMarkerClusteringEnabled(): boolean {
  return getCachedEnvBool(ENV_KEYS.FEATURE_MARKER_CLUSTERING, true);
}

/**
 * 地図の初期ズームレベルを取得
 * @returns 地図の初期ズームレベル（制限付き）
 */
export function getInitialMapZoom(): number {
  return getCachedEnvNumber(ENV_KEYS.UI_MAP_INITIAL_ZOOM, DEFAULTS.INITIAL_ZOOM, {
    min: 1, // 全地球表示の最低ズーム
    max: 22, // 最大ズームレベル
  });
}

/**
 * 地図の最小ズームレベルを取得
 * @returns 地図の最小許容ズームレベル
 */
export function getMinMapZoom(): number {
  return getCachedEnvNumber(ENV_KEYS.MAP_MIN_ZOOM, DEFAULTS.MIN_ZOOM, {
    min: 1,
    max: 10,
  });
}

/**
 * 地図の最大ズームレベルを取得
 * @returns 地図の最大許容ズームレベル
 */
export function getMaxMapZoom(): number {
  return getCachedEnvNumber(ENV_KEYS.MAP_MAX_ZOOM, DEFAULTS.MAX_ZOOM, {
    min: 15,
    max: 22,
  });
}

/**
 * モバイル向けの最適化設定を取得
 * @returns モバイル最適化が有効かどうか
 */
export function isMapOptimizedForMobile(): boolean {
  return getCachedEnvBool(ENV_KEYS.MAP_OPTIMIZE_FOR_MOBILE, true);
}

/**
 * Advanced Markersの使用が有効かどうか
 * @returns Advanced Markersの有効/無効状態
 */
export function isAdvancedMarkersEnabled(): boolean {
  return getCachedEnvBool(ENV_KEYS.ENABLE_ADVANCED_MARKERS, true);
}

/**
 * オフラインマップ機能が有効かどうか
 * @returns オフラインマップの有効/無効状態
 */
export function isOfflineMapsEnabled(): boolean {
  return getCachedEnvBool(ENV_KEYS.ENABLE_OFFLINE_MAPS, true);
}

/**
 * 地図の初期中心座標を取得
 * @returns 地図の初期中心座標（緯度・経度）
 */
export function getInitialMapCenter(): { lat: number; lng: number } {
  return {
    lat: getCachedEnvNumber(ENV_KEYS.UI_MAP_INITIAL_CENTER_LAT, DEFAULTS.INITIAL_LAT, {
      min: -90,
      max: 90,
    }),
    lng: getCachedEnvNumber(ENV_KEYS.UI_MAP_INITIAL_CENTER_LNG, DEFAULTS.INITIAL_LNG, {
      min: -180,
      max: 180,
    }),
  };
}

/**
 * Google Maps 関連の環境変数が正しく設定されているか検証
 * @returns 検証結果（成功・失敗）と問題点のリスト
 */
export function validateGoogleMapsConfig(): { isValid: boolean; issues: string[] } {
  const issues: string[] = [];

  // APIキーの検証
  const apiKey = getGoogleApiKey();
  if (!apiKey || apiKey.trim() === '') {
    issues.push(ERROR_MESSAGES.API_KEY_MISSING);
  } else if (apiKey.length < 20) {
    // 正規のAPIキーは通常もっと長い
    issues.push(ERROR_MESSAGES.API_KEY_SHORT);
  }

  // マップIDの検証
  const mapId = getGoogleMapId();
  if (mapId && mapId.trim() === '') {
    issues.push(ERROR_MESSAGES.MAP_ID_INVALID);
  }

  // ライブラリの検証
  const libraries = getGoogleMapsLibraries();
  if (libraries.length === 0) {
    issues.push('Google Mapsライブラリが設定されていません');
  }

  // 結果のログ出力
  if (issues.length > 0) {
    logger.error('Google Maps設定の検証で問題が見つかりました', {
      component: 'GoogleMapsConfig',
      issues,
    });
    return { isValid: false, issues };
  }

  logger.debug('Google Maps設定の検証が成功しました', {
    component: 'GoogleMapsConfig',
    apiKeyLength: apiKey ? apiKey.length : 0,
    mapId: mapId ? '設定済み' : '未設定',
    libraries: libraries.join(', '),
  });

  return { isValid: true, issues: [] };
}
