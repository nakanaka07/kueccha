// @react-google-maps/apiからLoadScriptPropsをインポートします。
// Google Mapsのスクリプトロードに必要なプロパティを定義するために使用します。
import { LoadScriptProps } from '@react-google-maps/api';
// 定数とエラーメッセージをインポートします。
// MARKER_COLORSはマーカーの色設定、ERROR_MESSAGESはエラーメッセージを定義します。
import { MARKER_COLORS, ERROR_MESSAGES } from './constants';
// Config型をインポートします。
// アプリケーションの設定を型定義するために使用します。
import type { Config } from './types';

// 環境変数の検証関数
// 必要な環境変数が設定されているかをチェックします。
const validateEnvironmentVariables = () => {
  if (!import.meta.env.VITE_GOOGLE_MAPS_API_KEY) {
    throw new Error(ERROR_MESSAGES.MAP.CONFIG_MISSING); // APIキーがない場合はエラーをスロー
  }
  if (!import.meta.env.VITE_GOOGLE_MAPS_MAP_ID) {
    throw new Error(ERROR_MESSAGES.MAP.CONFIG_MISSING); // マップIDがない場合はエラーをスロー
  }
};

// 環境変数の検証を実行します。
validateEnvironmentVariables();

// Google Mapsの設定
// Google Maps APIの設定を定義します。
export const mapsConfig: Config['maps'] = {
  apiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY, // Google Maps APIキー
  mapId: import.meta.env.VITE_GOOGLE_MAPS_MAP_ID, // Google MapsのマップID
  defaultCenter: { lat: 38.0, lng: 138.5 }, // マップのデフォルト中心座標
  defaultZoom: 10, // マップのデフォルトズームレベル
  libraries: ['places', 'geometry', 'drawing', 'marker'] as LoadScriptProps['libraries'], // 使用するGoogle Mapsのライブラリ
  language: 'ja', // マップの言語設定
  version: 'weekly', // Google Maps APIのバージョン
  style: {
    width: '100%', // マップの幅
    height: '100%', // マップの高さ
  },
  options: {
    mapId: import.meta.env.VITE_GOOGLE_MAPS_MAP_ID, // マップID
    disableDefaultUI: false, // デフォルトUIを無効にしない
    zoomControl: true, // ズームコントロールを表示
    mapTypeControl: true, // マップタイプコントロールを表示
    streetViewControl: true, // ストリートビューコントロールを表示
    fullscreenControl: false, // フルスクリーンコントロールを表示しない
    clickableIcons: true, // アイコンをクリック可能にする
    mapTypeControlOptions: {
      style: 2, // DROPDOWN_MENU
      position: 1, // TOP_LEFT
    },
  },
};

// Google Sheetsの設定
// Google Sheets APIの設定を定義します。
export const sheetsConfig = {
  apiKey: import.meta.env.VITE_GOOGLE_SHEETS_API_KEY, // Google Sheets APIキー
  spreadsheetId: import.meta.env.VITE_GOOGLE_SPREADSHEET_ID, // スプレッドシートID
};

// マーカーの設定
// マーカーの色設定を定義します。
export const markerConfig = {
  colors: MARKER_COLORS,
};

// 全体の設定
// アプリケーション全体の設定をまとめます。
export const CONFIG: Config = {
  maps: mapsConfig,
  sheets: sheetsConfig,
  markers: markerConfig,
};

// 設定の検証関数
// 必要な設定がすべて揃っているかをチェックします。
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
    throw new Error(`Missing required configuration: ${missing.join(', ')}`); // 必要な設定が不足している場合はエラーをスロー
  }
};

// 開発環境での設定のログ関数
// 開発環境でのみ設定をコンソールにログ出力します。
export const logConfigInDevelopment = (config: Config): void => {
  if (import.meta.env.MODE !== 'development') return;

  console.log('Configuration loaded successfully:', config);
};

// 設定の検証とログの実行
try {
  validateConfig(CONFIG); // 設定の検証を実行
  logConfigInDevelopment(CONFIG); // 開発環境での設定のログ出力を実行
} catch (error) {
  console.error('Configuration validation failed:', error); // 設定の検証に失敗した場合はエラーログを出力
  throw error; // エラーを再スロー
}

export default CONFIG;
