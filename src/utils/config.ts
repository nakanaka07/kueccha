import { LoadScriptProps } from '@react-google-maps/api';
import { MARKER_COLORS } from './constants';
import type { Config } from './types';

// Google Mapsの設定
export const mapsConfig: Config['maps'] = {
  apiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
  mapId: import.meta.env.VITE_GOOGLE_MAPS_MAP_ID,
  defaultCenter: { lat: 38.0, lng: 138.5 },
  defaultZoom: 10,
  libraries: [
    'places',
    'geometry',
    'drawing',
    'marker',
  ] as LoadScriptProps['libraries'],
  language: 'ja',
  version: 'weekly',
  style: {
    width: '100%',
    height: '100%',
  },
  options: {
    mapId: import.meta.env.VITE_GOOGLE_MAPS_MAP_ID,
    disableDefaultUI: false,
    zoomControl: true,
    mapTypeControl: true,
    streetViewControl: true,
    fullscreenControl: false,
    clickableIcons: true,
    mapTypeControlOptions: {
      style: 2, // DROPDOWN_MENU
      position: 1, // TOP_LEFT
    },
  },
};

// Google Sheetsの設定
export const sheetsConfig = {
  apiKey: import.meta.env.VITE_GOOGLE_SHEETS_API_KEY,
  spreadsheetId: import.meta.env.VITE_GOOGLE_SPREADSHEET_ID,
};

// マーカーの設定
export const markerConfig = {
  colors: MARKER_COLORS,
};

// 全体の設定
export const CONFIG: Config = {
  maps: mapsConfig,
  sheets: sheetsConfig,
  markers: markerConfig,
};

// 設定の検証関数
export const validateConfig = (config: Config): void => {
  const required = {
    'Google Maps API Key': config.maps.apiKey,
    'Google Maps Map ID': config.maps.mapId,
    'Google Sheets API Key': config.sheets.apiKey,
    'Google Sheets Spreadsheet ID': config.sheets.spreadsheetId,
  };

  const missing = Object.entries(required)
    .filter(([, value]) => !value)
    .map(([key]) => key);

  if (missing.length > 0) {
    throw new Error(`Missing required configuration: ${missing.join(', ')}`);
  }
};

// 開発環境での設定のログ関数
export const logConfigInDevelopment = (config: Config): void => {
  if (import.meta.env.MODE !== 'development') return;

  console.log('Configuration loaded successfully:', config);
};

// 設定の検証とログの実行
validateConfig(CONFIG);
logConfigInDevelopment(CONFIG);

export default CONFIG;
