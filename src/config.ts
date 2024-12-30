// config.ts
import { MapConfig } from './types';

console.group('config.ts: Configuration Initialization');

export const MARKER_COLORS = {
  DEFAULT: '#000000',
  RYOTSU_AIKAWA: '#ff8000',
  KANAI_SAWADA_NIIBO_HATANO_MANO: '#ff8000',
  AKADOMARI_HAMOCHI_OGI: '#ff8000',
  SNACK: '#ff80c0',
  PUBLIC_TOILET: '#00ffff',
  PARKING: '#000000',
  RECOMMEND: '#ff0000',
} as const;

console.log('config.ts: Marker colors initialized:', MARKER_COLORS);

const validateConfig = (config: typeof CONFIG) => {
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

// 開発環境判定の修正
const isDevelopment = import.meta.env.MODE === 'development';

export const CONFIG = {
  maps: {
    apiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    mapId: import.meta.env.VITE_GOOGLE_MAPS_MAP_ID,
    defaultCenter: { lat: 38.0, lng: 138.5 },
    defaultZoom: 10,
    libraries: ['places', 'geometry', 'drawing', 'marker'],
    language: 'ja',
    version: 'weekly',
    style: {
      width: '100%',
      height: '100%',
      disableDefaultUI: false, // ここに統合
      clickableIcons: false, // ここに統合
    },
  } as MapConfig,
  sheets: {
    apiKey: import.meta.env.VITE_GOOGLE_SHEETS_API_KEY,
    spreadsheetId: import.meta.env.VITE_GOOGLE_SPREADSHEET_ID,
  },
  markers: {
    colors: {
      default: MARKER_COLORS.DEFAULT,
      areas: MARKER_COLORS,
    },
  },
} as const;

// 設定の検証を実行
try {
  validateConfig(CONFIG);

  if (isDevelopment) {
    // 開発環境でのみログを出力
    Object.entries({
      'Maps API Key': CONFIG.maps.apiKey,
      'Map ID': CONFIG.maps.mapId,
      'Sheets API Key': CONFIG.sheets.apiKey,
      'Spreadsheet ID': CONFIG.sheets.spreadsheetId,
    }).forEach(([key, value]) => {
      if (value) {
        const preview = '******' + String(value).slice(-7);
        console.log(`${key} loaded: ${preview}`);
      }
    });
  }
} catch (error) {
  console.error('Configuration Error:', error instanceof Error ? error.message : 'Unknown error');
  throw error;
}

export type Config = typeof CONFIG;

console.groupEnd();
