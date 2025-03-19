/**
 * アプリケーション設定定数ファイル
 *
 * アプリケーション全体の設定値と環境変数からの読み込みロジックを定義します。
 * 設定の実行時コンテキストと環境を管理します。
 */

import { getEnvValue, getEnvValueAsBoolean, getEnvValueAsNumber } from '../utils/env.utils';

import type {
  AppConfig,
  EnvironmentName,
  EnvironmentConfig,
  DisplayConfig,
  ErrorHandlingConfig,
  MarkerCustomOptions,
  MapTypeId,
} from '../types/config.types';

// ============================================================================
// 環境設定
// ============================================================================

/**
 * 現在の実行環境を取得
 * 環境変数から現在の環境名を取得します
 */
export const CURRENT_ENVIRONMENT = getEnvValue<EnvironmentName>(
  'VITE_ENVIRONMENT',
  'development',
  (value) => {
    return ['development', 'production', 'test'].includes(value as string)
      ? (value as EnvironmentName)
      : 'development';
  },
);

/**
 * 環境別の設定値
 * 各環境ごとにカスタマイズされた設定値を提供します
 */
export const ENV_CONFIGS: Record<EnvironmentName, EnvironmentConfig> = {
  development: {
    name: 'development',
    debug: true,
    logLevel: 'debug',
    cacheEnabled: false,
  },
  production: {
    name: 'production',
    debug: false,
    logLevel: 'error',
    cacheEnabled: true,
  },
  test: {
    name: 'test',
    debug: true,
    logLevel: 'info',
    cacheEnabled: false,
  },
};

/**
 * 現在の環境設定
 * 現在の環境に基づいた設定と環境変数の上書きを組み合わせます
 */
export const CURRENT_ENV_CONFIG: EnvironmentConfig = {
  ...ENV_CONFIGS[CURRENT_ENVIRONMENT],
  debug: getEnvValueAsBoolean('VITE_DEBUG', ENV_CONFIGS[CURRENT_ENVIRONMENT].debug),
  logLevel: getEnvValue('VITE_LOG_LEVEL', ENV_CONFIGS[CURRENT_ENVIRONMENT].logLevel, (value) => {
    return ['error', 'warn', 'info', 'debug'].includes(value as string)
      ? (value as 'error' | 'warn' | 'info' | 'debug')
      : 'error';
  }),
  cacheEnabled: getEnvValueAsBoolean(
    'VITE_CACHE_ENABLED',
    ENV_CONFIGS[CURRENT_ENVIRONMENT].cacheEnabled,
  ),
};

// ============================================================================
// 表示設定
// ============================================================================

/**
 * モバイルデバイスかどうかを検出
 * ユーザーエージェントに基づいて判定します
 */
export function isMobileDevice(): boolean {
  if (typeof window === 'undefined') return false;

  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    window.navigator.userAgent,
  );
}

/**
 * Google Maps APIが利用可能かを安全に確認する
 *
 * @returns Google Maps API利用可能時にtrue
 */
export function isGoogleMapsAvailable(): boolean {
  return typeof google !== 'undefined' && typeof google.maps.Animation !== 'undefined';
}

/**
 * アニメーション定数を安全に取得
 *
 * @param type アニメーションタイプ
 * @returns アニメーション定数または null
 */
export function getMarkerAnimation(type: 'BOUNCE' | 'DROP' | null): any {
  if (!type || !isGoogleMapsAvailable()) return null;

  if (type === 'BOUNCE') {
    return google.maps.Animation.BOUNCE;
  } else if (type === 'DROP') {
    return google.maps.Animation.DROP;
  }

  return null;
}

/**
 * マーカー表示設定
 * マーカーの視覚的表現を制御するオプション
 */
export const MARKER_OPTIONS: MarkerCustomOptions = {
  defaultOpacity: getEnvValueAsNumber('VITE_MARKER_OPACITY', 0.8),
  selectedAnimation: getMarkerAnimation('BOUNCE'), // 安全に取得
  defaultSize: {
    width: getEnvValueAsNumber('VITE_MARKER_WIDTH', 32),
    height: getEnvValueAsNumber('VITE_MARKER_HEIGHT', 32),
  },
  highlight: {
    zIndex: 10,
    opacity: 1.0,
    scale: 1.2,
  },
};

/**
 * 表示設定
 * UI表示に関する設定値
 */
export const DISPLAY_CONFIG: DisplayConfig = {
  defaultVisibleAreas: getEnvValue('VITE_DEFAULT_VISIBLE_AREAS', [], (value) =>
    (value as string).split(',').filter(Boolean),
  ),
  markerOptions: MARKER_OPTIONS,
  mobile: {
    menuButtonPosition: getEnvValue('VITE_MOBILE_MENU_POSITION', 'top-left', (value) => {
      return ['top-left', 'top-right', 'bottom-left', 'bottom-right'].includes(value as string)
        ? (value as 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right')
        : 'top-left';
    }),
    infoWindowScale: getEnvValueAsNumber('VITE_MOBILE_INFO_SCALE', 0.85),
  },
};

// ============================================================================
// エラー処理設定
// ============================================================================

/**
 * エラー処理設定
 * エラーの処理方法と表示に関する設定
 */
export const ERROR_HANDLING_CONFIG: ErrorHandlingConfig = {
  retryCount: getEnvValueAsNumber('VITE_API_RETRY_COUNT', 3),
  retryInterval: getEnvValueAsNumber('VITE_RETRY_INTERVAL', 1000),
  reportErrors: getEnvValueAsBoolean('VITE_REPORT_ERRORS', CURRENT_ENVIRONMENT === 'production'),
  showErrors: getEnvValueAsBoolean('VITE_SHOW_ERRORS', CURRENT_ENVIRONMENT !== 'production'),
};

// ============================================================================
// デフォルト設定
// ============================================================================

/**
 * マップタイプIDを安全に取得
 *
 * @param defaultType デフォルトのマップタイプ
 * @returns マップタイプIDまたはフォールバック値
 */
export function getMapTypeId(defaultType: string = 'roadmap'): MapTypeId {
  if (isGoogleMapsAvailable()) {
    switch (defaultType) {
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

  // フォールバック値としての文字列
  return defaultType as MapTypeId;
}

/**
 * デフォルトのアプリケーション設定
 * 必須設定が提供されない場合のフォールバック値として機能します
 */
export const DEFAULT_CONFIG: Partial<AppConfig> = {
  environment: CURRENT_ENV_CONFIG,
  display: DISPLAY_CONFIG,
  errorHandling: ERROR_HANDLING_CONFIG,
};

/**
 * 実行時の設定をロードする
 * 環境変数と実行時コンテキストから設定を構築します
 */
export function loadRuntimeConfig(): Partial<AppConfig> {
  // 環境変数から外部サービスの設定を取得
  const mapsApiKey = getEnvValue('VITE_GOOGLE_MAPS_API_KEY', '');
  const sheetsApiKey = getEnvValue('VITE_GOOGLE_SHEETS_API_KEY', '');
  const defaultMapTypeId = getEnvValue('VITE_DEFAULT_MAP_TYPE', 'roadmap');

  return {
    ...DEFAULT_CONFIG,
    maps: {
      apiKey: mapsApiKey,
      options: {
        center: { lat: 38.0307, lng: 138.3716 }, // 佐渡島の中心
        zoom: 11,
        mapTypeId: getMapTypeId(defaultMapTypeId),
        fullscreenControl: true,
        streetViewControl: false,
      },
    },
    sheets: {
      apiKey: sheetsApiKey,
      spreadsheetId: getEnvValue('VITE_SPREADSHEET_ID', ''),
      sheetNames: {
        pois: getEnvValue('VITE_POI_SHEET_NAME', 'POIs'),
        areas: getEnvValue('VITE_AREAS_SHEET_NAME', 'Areas'),
      },
    },
  };
}
