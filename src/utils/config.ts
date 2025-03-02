import { MAPS_CONFIG, SHEETS_CONFIG, MARKER_CONFIG, ERROR_MESSAGES } from './constants';
import type { Config } from './types';

const validateEnvironmentVariables = () => {
  if (!import.meta.env.VITE_GOOGLE_MAPS_API_KEY) {
    throw new Error(ERROR_MESSAGES.MAP.CONFIG_MISSING);
  }
  if (!import.meta.env.VITE_GOOGLE_MAPS_MAP_ID) {
    throw new Error(ERROR_MESSAGES.MAP.CONFIG_MISSING);
  }
};

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

export const CONFIG: Config = {
  maps: MAPS_CONFIG,
  sheets: SHEETS_CONFIG,
  markers: MARKER_CONFIG,
};

validateEnvironmentVariables();

try {
  validateConfig(CONFIG);
} catch (error) {
  console.error('Configuration validation failed:', error);
  throw error;
}

export default CONFIG;
