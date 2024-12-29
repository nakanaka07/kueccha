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
      mapContainerStyle: { width: '100%', height: '100%' },
      options: {
        disableDefaultUI: false,
        clickableIcons: false,
      },
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

// 環境変数チェックのログをCONFIGの宣言後に移動
console.log('環境変数チェック:', {
  mapsApiKey: !!CONFIG.maps.apiKey,
  sheetsApiKey: !!CONFIG.sheets.apiKey,
  spreadsheetId: !!CONFIG.sheets.spreadsheetId,
});

// API Key validation and logging
if (CONFIG.maps.apiKey) {
  console.log('config.ts: Google Maps API Key loaded successfully');
  const apiKeyPreview = '******' + CONFIG.maps.apiKey.slice(-7);
  console.log('config.ts: Maps API Key preview:', apiKeyPreview);
} else {
  console.error('config.ts: Google Maps API Key is missing');
}

// Map ID validation and logging
if (CONFIG.maps.mapId) {
  console.log('config.ts: Google Maps Map ID loaded successfully');
  const mapIdPreview = '******' + CONFIG.maps.mapId.slice(-7);
  console.log('config.ts: Map ID preview:', mapIdPreview);
} else {
  console.error('config.ts: Google Maps Map ID is missing');
}

// Sheets API Key validation and logging
if (CONFIG.sheets.apiKey) {
  console.log('config.ts: Google Sheets API Key loaded successfully');
  const apiKeyPreview = '******' + CONFIG.sheets.apiKey.slice(-7);
  console.log('config.ts: Sheets API Key preview:', apiKeyPreview);
} else {
  console.error('config.ts: Google Sheets API Key is missing');
}

// Spreadsheet ID validation and logging
if (CONFIG.sheets.spreadsheetId) {
  console.log('config.ts: Google Sheets Spreadsheet ID loaded successfully');
  const spreadsheetIdPreview = '******' + CONFIG.sheets.spreadsheetId.slice(-7);
  console.log('config.ts: Spreadsheet ID preview:', spreadsheetIdPreview);
} else {
  console.error('config.ts: Google Sheets Spreadsheet ID is missing');
}

console.log('config.ts: Final configuration:', {
  defaultCenter: CONFIG.maps.defaultCenter,
  defaultZoom: CONFIG.maps.defaultZoom,
  libraries: CONFIG.maps.libraries,
  language: CONFIG.maps.language,
  version: CONFIG.maps.version,
});

console.groupEnd();
