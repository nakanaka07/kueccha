// 更新されたインポートパス
import { APP } from '../../constants'; // './constants'から変更
import type { Config } from '../types/common'; // './types'から変更

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
  // マップ設定のバリデーション
  if (!config.maps.apiKey || !config.maps.mapId) {
    throw new Error('Google Maps API KeyとMap IDが必要です');
  }

  // シート設定のバリデーション
  if (!config.sheets.apiKey || !config.sheets.spreadsheetId) {
    throw new Error('Google Sheets API KeyとSpreadsheet IDが必要です');
  }

  // マーカー色設定のバリデーション
  if (!config.markers.colors || Object.keys(config.markers.colors).length === 0) {
    throw new Error('マーカーの色設定が必要です');
  }

  // geolocationプロパティの検証を追加
  if (!config.maps.geolocation) {
    throw new Error('位置情報設定が必要です');
  }
};

// 型の互換性を確保するために安全に変換
export const CONFIG: Config = {
  maps: {
    apiKey: APP.config.maps.apiKey,
    mapId: APP.config.maps.mapId,
    libraries: APP.config.maps.libraries,
    version: APP.config.maps.version,
    language: APP.config.maps.language,
    defaultCenter: APP.config.maps.defaultCenter,
    defaultZoom: APP.config.maps.defaultZoom,
    style: APP.config.maps.style,
    geolocation: APP.config.maps.geolocation, // geolocationプロパティを追加
    options: {
      ...APP.config.maps.options,
      mapTypeControlOptions: {
        ...APP.config.maps.options.mapTypeControlOptions,
        mapTypeIds: [...APP.config.maps.options.mapTypeControlOptions.mapTypeIds],
      },
    },
  },
  sheets: APP.config.sheets,
  markers: {
    colors: APP.markers.colors,
  },
};

// 環境変数のバリデーション
validateEnvironmentVariables();

// 設定値のバリデーション
try {
  validateConfig(CONFIG);
} catch (error) {
  console.error('設定のバリデーションに失敗しました:', error);
  throw error;
}

export default CONFIG;
