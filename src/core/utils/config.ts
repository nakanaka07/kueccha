/**
 * 機能: アプリケーション設定の検証と初期化を行う設定管理モジュール
 * 依存関係:
 *   - ../../constants (APPオブジェクト)
 *   - ../types/common (Config型定義)
 *   - Vite環境変数 (VITE_GOOGLE_MAPS_API_KEY、VITE_GOOGLE_SHEETS_API_KEYなど)
 * 注意点:
 *   - 必要な環境変数が設定されていない場合、アプリケーションの起動時にエラーをスローします
 *   - 設定値の検証に失敗した場合もエラーがスローされるため、正しい設定が必須です
 *   - Google Maps APIとGoogle Sheets APIキーが有効である必要があります
 */
import { APP } from '../../constants';
import type { Config } from '../types/common';

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
    geolocation: APP.config.maps.geolocation,
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

validateEnvironmentVariables();

try {
  validateConfig(CONFIG);
} catch (error) {
  console.error('設定のバリデーションに失敗しました:', error);
  throw error;
}

export default CONFIG;
