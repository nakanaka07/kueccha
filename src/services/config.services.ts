/**
 * アプリケーション設定ファイル
 *
 * アプリケーション全体で使用される設定を一元管理し、
 * 環境変数の検証や必須設定の確認を行います。
 */

import { MAPS_CONFIG, SHEETS_CONFIG, MARKER_CONFIG, ERROR_MESSAGES, INITIAL_VISIBILITY, AREAS } from '../constants';
import { checkRequiredEnvVars } from '../utils/env.utils';

import type { AppConfig, AreaType } from '../types';

/**
 * アプリケーションの必須環境変数
 */
const REQUIRED_ENV_VARS = [
  'VITE_GOOGLE_MAPS_API_KEY',
  'VITE_GOOGLE_MAPS_MAP_ID',
  'VITE_GOOGLE_SHEETS_API_KEY',
  'VITE_GOOGLE_SPREADSHEET_ID',
] as const;

/**
 * 初期表示設定からデフォルトで表示するエリアを取得
 */
function getDefaultVisibleAreas(): AreaType[] {
  // INITIAL_VISIBILITYから表示設定が true のエリアを抽出
  return Object.entries(INITIAL_VISIBILITY)
    .filter(([, isVisible]) => isVisible)
    .map(([area]) => area as AreaType);
}

/**
 * アプリケーションの全体設定
 */
export const CONFIG: AppConfig = {
  maps: MAPS_CONFIG,
  sheets: SHEETS_CONFIG,
  markers: MARKER_CONFIG,
  display: {
    // areas.constants.ts で定義されたINITIAL_VISIBILITYを使用して表示エリアを決定
    defaultVisibleAreas: getDefaultVisibleAreas(),
    markerOptions: {
      defaultOpacity: 1.0,
      selectedAnimation: 'BOUNCE' as google.maps.Animation.BOUNCE,
    },
  },
};

/**
 * 設定を検証する関数
 *
 * @param config - 検証する設定オブジェクト
 * @throws 環境変数や設定が不足している場合にエラーをスロー
 */
export const validateConfig = (config: AppConfig): void => {
  // 環境変数の検証 - 改善されたenv.utilsの関数を使用
  const missingVars = checkRequiredEnvVars(REQUIRED_ENV_VARS);

  if (missingVars.length > 0) {
    throw new Error(`${ERROR_MESSAGES.MAP.CONFIG_MISSING} 不足している環境変数: ${missingVars.join(', ')}`);
  }

  // 設定値の検証
  const requiredSettings = {
    'Google Maps API Key': config.maps.apiKey,
    'Google Maps Map ID': config.maps.mapId,
    'Google Sheets API Key': config.sheets.apiKey,
    'Google Sheets Spreadsheet ID': config.sheets.spreadsheetId,
  };

  const missingSettings = Object.entries(requiredSettings)
    .filter(([, value]) => value === undefined || value === null || value === '')
    .map(([key]) => key);

  if (missingSettings.length > 0) {
    throw new Error(`必要な設定が不足しています: ${missingSettings.join(', ')}`);
  }

  // エリア識別子の検証 - 存在しないエリアが指定されていないかチェック
  const invalidAreas = config.display.defaultVisibleAreas.filter((area) => !(area in AREAS));

  if (invalidAreas.length > 0) {
    console.warn(`無効なエリア識別子が指定されています: ${invalidAreas.join(', ')}`);
  }
};

// 設定の初期化と検証
try {
  validateConfig(CONFIG);
  console.info('アプリケーション設定の検証が完了しました');
} catch (error) {
  console.error('設定の検証に失敗しました:', error instanceof Error ? error.message : String(error));
  throw error;
}

export default CONFIG;
