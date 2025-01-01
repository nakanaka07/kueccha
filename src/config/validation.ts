import type { Config } from './types';

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

export const logConfigInDevelopment = (config: Config) => {
  if (import.meta.env.MODE !== 'development') return;

  Object.entries({
    'Maps API Key': config.maps.apiKey,
    'Map ID': config.maps.mapId,
    'Sheets API Key': config.sheets.apiKey,
    'Spreadsheet ID': config.sheets.spreadsheetId,
  }).forEach(([key, value]) => {
    if (value) {
      const preview = '******' + String(value).slice(-7);
      console.log(`${key} loaded: ${preview}`);
    }
  });
};
