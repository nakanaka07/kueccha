/**
 * アプリケーション設定定数ファイル
 */
import { getEnvValue, getEnvValueAsBoolean, getEnvValueAsNumber } from '../utils/env.utils';
import type {
  AppConfig,
  EnvironmentName,
  EnvironmentConfig,
  DisplayConfig,
  ErrorHandlingConfig,
  MapTypeId,
} from '../types/config.types';

// 環境設定
export const CURRENT_ENVIRONMENT = getEnvValue<EnvironmentName>(
  'VITE_ENVIRONMENT',
  'development',
  (value) => 
    ['development', 'production', 'test'].includes(value as string)
      ? (value as EnvironmentName)
      : 'development'
);

// 環境別の基本設定
const ENV_CONFIGS: Record<EnvironmentName, EnvironmentConfig> = {
  development: { name: 'development', debug: true, logLevel: 'debug', cacheEnabled: false },
  production: { name: 'production', debug: false, logLevel: 'error', cacheEnabled: true },
  test: { name: 'test', debug: true, logLevel: 'info', cacheEnabled: false },
};

// 現在の環境設定
export const CURRENT_ENV_CONFIG: EnvironmentConfig = {
  ...ENV_CONFIGS[CURRENT_ENVIRONMENT],
  debug: getEnvValueAsBoolean('VITE_DEBUG', ENV_CONFIGS[CURRENT_ENVIRONMENT].debug),
  logLevel: getEnvValue('VITE_LOG_LEVEL', ENV_CONFIGS[CURRENT_ENVIRONMENT].logLevel, (value) =>
    ['error', 'warn', 'info', 'debug'].includes(value as string)
      ? (value as 'error' | 'warn' | 'info' | 'debug')
      : 'error'
  ),
  cacheEnabled: getEnvValueAsBoolean(
    'VITE_CACHE_ENABLED',
    ENV_CONFIGS[CURRENT_ENVIRONMENT].cacheEnabled
  ),
};

// Google Maps関連ユーティリティ
const mapsUtils = {
  isAvailable: (): boolean => 
    typeof google !== 'undefined' && typeof google.maps?.Animation !== 'undefined',
    
  getMapTypeId: (defaultType: string = 'roadmap'): MapTypeId => {
    if (!mapsUtils.isAvailable()) return defaultType as MapTypeId;
    
    switch (defaultType) {
      case 'satellite': return google.maps.MapTypeId.SATELLITE;
      case 'hybrid': return google.maps.MapTypeId.HYBRID;
      case 'terrain': return google.maps.MapTypeId.TERRAIN;
      default: return google.maps.MapTypeId.ROADMAP;
    }
  },
  
  getAnimation: (type: 'BOUNCE' | 'DROP' | null): any => {
    if (!type || !mapsUtils.isAvailable()) return null;
    return type === 'BOUNCE' ? google.maps.Animation.BOUNCE : 
           type === 'DROP' ? google.maps.Animation.DROP : null;
  },
  
  isMobileDevice: (): boolean => 
    typeof window !== 'undefined' && 
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      window.navigator.userAgent
    )
};

// 表示設定
export const DISPLAY_CONFIG: DisplayConfig = {
  defaultVisibleAreas: getEnvValue('VITE_DEFAULT_VISIBLE_AREAS', [], (value) =>
    (value as string).split(',').filter(Boolean)
  ),
  markerOptions: {
    defaultOpacity: getEnvValueAsNumber('VITE_MARKER_OPACITY', 0.8),
    selectedAnimation: mapsUtils.getAnimation('BOUNCE'),
    defaultSize: {
      width: getEnvValueAsNumber('VITE_MARKER_WIDTH', 32),
      height: getEnvValueAsNumber('VITE_MARKER_HEIGHT', 32),
    },
    highlight: {
      zIndex: 10,
      opacity: 1.0,
      scale: 1.2,
    },
  },
  mobile: {
    menuButtonPosition: getEnvValue('VITE_MOBILE_MENU_POSITION', 'top-left', (value) =>
      ['top-left', 'top-right', 'bottom-left', 'bottom-right'].includes(value as string)
        ? (value as 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right')
        : 'top-left'
    ),
    infoWindowScale: getEnvValueAsNumber('VITE_MOBILE_INFO_SCALE', 0.85),
  },
};

// エラー処理設定
export const ERROR_HANDLING_CONFIG: ErrorHandlingConfig = {
  retryCount: getEnvValueAsNumber('VITE_API_RETRY_COUNT', 3),
  retryInterval: getEnvValueAsNumber('VITE_RETRY_INTERVAL', 1000),
  reportErrors: getEnvValueAsBoolean('VITE_REPORT_ERRORS', CURRENT_ENVIRONMENT === 'production'),
  showErrors: getEnvValueAsBoolean('VITE_SHOW_ERRORS', CURRENT_ENVIRONMENT !== 'production'),
};

// デフォルト設定
export const DEFAULT_CONFIG: Partial<AppConfig> = {
  environment: CURRENT_ENV_CONFIG,
  display: DISPLAY_CONFIG,
  errorHandling: ERROR_HANDLING_CONFIG,
};

// 実行時設定ロード
export function loadRuntimeConfig(): Partial<AppConfig> {
  return {
    ...DEFAULT_CONFIG,
    maps: {
      apiKey: getEnvValue('VITE_GOOGLE_MAPS_API_KEY', ''),
      options: {
        center: { lat: 38.0307, lng: 138.3716 }, // 佐渡島の中心
        zoom: 11,
        mapTypeId: mapsUtils.getMapTypeId(getEnvValue('VITE_DEFAULT_MAP_TYPE', 'roadmap')),
        fullscreenControl: true,
        streetViewControl: false,
      },
    },
    sheets: {
      apiKey: getEnvValue('VITE_GOOGLE_SHEETS_API_KEY', ''),
      spreadsheetId: getEnvValue('VITE_SPREADSHEET_ID', ''),
      sheetNames: {
        pois: getEnvValue('VITE_POI_SHEET_NAME', 'POIs'),
        areas: getEnvValue('VITE_AREAS_SHEET_NAME', 'Areas'),
      },
    },
  };
}

// 既存の関数をエクスポート（互換性維持のため）
export const isGoogleMapsAvailable = mapsUtils.isAvailable;
export const getMapTypeId = mapsUtils.getMapTypeId;
export const isMobileDevice = mapsUtils.isMobileDevice;
export function getMarkerAnimation(type: 'BOUNCE' | 'DROP' | null): any {
  return mapsUtils.getAnimation(type);
}