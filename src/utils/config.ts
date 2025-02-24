import { MAPS_CONFIG, SHEETS_CONFIG, MARKER_CONFIG, ERROR_MESSAGES } from './constants';
import type { Config } from './types';

// 環境変数の検証関数
const validateEnvironmentVariables = () => {
  if (!import.meta.env.VITE_GOOGLE_MAPS_API_KEY) {
    throw new Error(ERROR_MESSAGES.MAP.CONFIG_MISSING);
  }
  if (!import.meta.env.VITE_GOOGLE_MAPS_MAP_ID) {
    throw new Error(ERROR_MESSAGES.MAP.CONFIG_MISSING);
  }
};

// 環境変数の検証を実行します。
validateEnvironmentVariables();

// 全体の設定
export const CONFIG: Config = {
  maps: MAPS_CONFIG,
  sheets: SHEETS_CONFIG,
  markers: MARKER_CONFIG,
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
try {
  validateConfig(CONFIG);
  logConfigInDevelopment(CONFIG);
} catch (error) {
  console.error('Configuration validation failed:', error);
  throw error;
}

export default CONFIG;
