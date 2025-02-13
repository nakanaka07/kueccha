import { MARKER_COLORS } from './constants';
import { LoadScriptProps } from '@react-google-maps/api';
import type { Config } from './types';

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
    disableDefaultUI: true,
    clickableIcons: true,
  },
  options: {
    zoomControl: true,
    mapTypeControl: true,
    streetViewControl: true,
    fullscreenControl: false,
    styles: undefined,
  },
};

export const sheetsConfig = {
  apiKey: import.meta.env.VITE_GOOGLE_SHEETS_API_KEY,
  spreadsheetId: import.meta.env.VITE_GOOGLE_SPREADSHEET_ID,
};

export const markerConfig = {
  colors: MARKER_COLORS,
};

export const CONFIG: Config = {
  maps: mapsConfig,
  sheets: sheetsConfig,
  markers: markerConfig,
};

export const validateConfig = (config: Config) => {
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

export const logConfigInDevelopment = (_config: Config) => {
  if (import.meta.env.MODE !== 'development') return;

  console.log('Configuration loaded successfully.');
};

validateConfig(CONFIG);
logConfigInDevelopment(CONFIG);

export default CONFIG;
