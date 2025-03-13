/**
 * アプリケーション全体の設定を管理
 * - 環境変数のバリデーション機能
 * - Google Maps APIとGoogle Sheets APIの設定
 * - マップの初期表示設定やコントロールオプション
 * - 外部サービスとの連携に必要な設定の集約
 */
import { LoadScriptProps } from '@react-google-maps/api';
import { Config } from '../types/common.types';
import { MARKERS } from './marker.constants';
const validateEnvironmentVariables = () => {
  const requiredEnvVars = {
    VITE_GOOGLE_MAPS_API_KEY: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    VITE_GOOGLE_MAPS_MAP_ID: import.meta.env.VITE_GOOGLE_MAPS_MAP_ID,
    VITE_GOOGLE_SHEETS_API_KEY: import.meta.env.VITE_GOOGLE_SHEETS_API_KEY,
    VITE_GOOGLE_SPREADSHEET_ID: import.meta.env.VITE_GOOGLE_SPREADSHEET_ID,
  };

  const missing = Object.entries(requiredEnvVars)
    .filter(([, value]) => !value)
    .map(([key]) => key);

  if (missing.length > 0) {
    throw new Error(`必要な環境変数が設定されていません: ${missing.join(', ')}`);
  }
};

export const validateConfig = (config: Config): void => {
  if (!config.maps.apiKey || !config.maps.mapId) {
    throw new Error('Google Maps API KeyとMap IDが必要です');
  }

  if (!config.sheets.apiKey || !config.sheets.spreadsheetId) {
    throw new Error('Google Sheets API KeyとSpreadsheet IDが必要です');
  }

  if (!config.markers.colors || Object.keys(config.markers.colors).length === 0) {
    throw new Error('マーカーの色設定が必要です');
  }

  if (!config.maps.geolocation) {
    throw new Error('位置情報設定が必要です');
  }
};

export const CONFIG = {
  maps: {
    apiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    mapId: import.meta.env.VITE_GOOGLE_MAPS_MAP_ID,
    libraries: ['places', 'geometry', 'drawing', 'marker'] as LoadScriptProps['libraries'],
    version: 'weekly',
    language: 'ja',
    defaultCenter: { lat: 38.1, lng: 138.4 },
    defaultZoom: 10,
    geolocation: {
      timeout: 10000,
      maxAge: 0,
      highAccuracy: true,
    },
    style: {
      width: '100%',
      height: '100%',
    },
    options: {
      mapId: import.meta.env.VITE_GOOGLE_MAPS_MAP_ID,
      mapTypeId: 'roadmap',
      disableDefaultUI: false,
      disableDoubleClickZoom: false,
      scrollwheel: true,
      clickableIcons: true,
      gestureHandling: 'cooperative',
      mapTypeControl: true,
      mapTypeControlOptions: {
        style: 2,
        position: 1,
        mapTypeIds: ['roadmap', 'satellite', 'hybrid', 'terrain'],
      },
      fullscreenControl: true,
      fullscreenControlOptions: {
        position: 3,
      },
      zoomControl: true,
      zoomControlOptions: {
        position: 7,
      },
      streetViewControl: true,
      streetViewControlOptions: {
        position: 7,
      },
      cameraControl: true,
      cameraControlOptions: {
        position: 7,
      },
    },
  },
  sheets: {
    apiKey: import.meta.env.VITE_GOOGLE_SHEETS_API_KEY,
    spreadsheetId: import.meta.env.VITE_GOOGLE_SPREADSHEET_ID,
  },
  markers: {
    colors: MARKERS.colors,
  },
} as const;

export const APP_CONFIG = {
  maps: CONFIG.maps,
  sheets: CONFIG.sheets,
  markers: MARKERS,
};

validateEnvironmentVariables();

try {
  validateConfig(CONFIG as Config);
} catch (error) {
  console.error('設定のバリデーションに失敗しました:', error);
  throw error;
}

export const MAPS_CONFIG = APP_CONFIG.maps;
export const SHEETS_CONFIG = APP_CONFIG.sheets;
export default CONFIG;
