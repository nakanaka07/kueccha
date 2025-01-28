import { MARKER_COLORS } from './constants'; // マーカーの色定数をインポート
import { LoadScriptProps } from '@react-google-maps/api'; // Google Maps APIの型定義をインポート
import type { Config } from './types'; // Config型をインポート

export const mapsConfig: Config['maps'] = {
  apiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY, // Google Maps APIキー
  mapId: import.meta.env.VITE_GOOGLE_MAPS_MAP_ID, // Google Maps Map ID
  defaultCenter: { lat: 38.0, lng: 138.5 }, // デフォルトの中心座標
  defaultZoom: 10, // デフォルトのズームレベル
  libraries: [
    'places',
    'geometry',
    'drawing',
    'marker',
  ] as LoadScriptProps['libraries'], // 使用するライブラリ
  language: 'ja', // 言語設定
  version: 'weekly', // バージョン設定
  style: {
    width: '100%', // 幅を100%に設定
    height: '100%', // 高さを100%に設定
    disableDefaultUI: true, // デフォルトのUIを無効にする
    clickableIcons: true, // アイコンをクリック可能にする
  },
  options: {
    zoomControl: true, // ズームコントロールを有効にする
    mapTypeControl: true, // マップタイプコントロールを有効にする
    streetViewControl: true, // ストリートビューコントロールを有効にする
    fullscreenControl: false, // フルスクリーンコントロールを無効にする
    styles: undefined, // mapIdがある場合はstylesをundefinedに設定
  },
};

export const sheetsConfig = {
  apiKey: import.meta.env.VITE_GOOGLE_SHEETS_API_KEY, // Google Sheets APIキー
  spreadsheetId: import.meta.env.VITE_GOOGLE_SPREADSHEET_ID, // Google Sheets スプレッドシートID
};

export const markerConfig = {
  colors: MARKER_COLORS, // マーカーの色設定
};

export const CONFIG: Config = {
  maps: mapsConfig, // マップの設定
  sheets: sheetsConfig, // シートの設定
  markers: markerConfig, // マーカーの設定
};

export const validateConfig = (config: Config) => {
  const required = {
    'Google Maps API Key': config.maps.apiKey, // 必須のGoogle Maps APIキー
    'Google Maps Map ID': config.maps.mapId, // 必須のGoogle Maps Map ID
    'Google Sheets API Key': config.sheets.apiKey, // 必須のGoogle Sheets APIキー
    'Google Sheets Spreadsheet ID': config.sheets.spreadsheetId, // 必須のGoogle Sheets スプレッドシートID
  };

  const missing = Object.entries(required)
    .filter(([, value]) => !value) // 値がない場合にフィルタ
    .map(([key]) => key); // キーを取得

  if (missing.length > 0) {
    throw new Error(`Missing required configuration: ${missing.join(', ')}`); // 必須の設定が不足している場合はエラーをスロー
  }
};

export const logConfigInDevelopment = (_config: Config) => {
  if (import.meta.env.MODE !== 'development') return; // 開発モードでない場合は何もしない

  console.log('Configuration loaded successfully.'); // 設定が正常に読み込まれたことをログに出力
};

validateConfig(CONFIG); // 設定を検証
logConfigInDevelopment(CONFIG); // 開発モードで設定をログに出力

export default CONFIG; // CONFIGをエクスポート
