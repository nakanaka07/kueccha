/**
 * アプリケーション設定ファイル
 *
 * このファイルは、アプリケーション全体で使用される設定を管理します。
 * Google Maps API、Google Sheets API、マーカー表示などの設定を一元管理し、
 * 環境変数からの値取得や設定の検証を行います。
 */

// 定数ファイルから設定のデフォルト値とエラーメッセージをインポート
import { MAPS_CONFIG, SHEETS_CONFIG, MARKER_CONFIG, ERROR_MESSAGES } from '../constants/constants';
// 型定義ファイルから設定の型をインポート
import type { Config } from '../types/types';

/**
 * 環境変数の存在を検証する関数
 *
 * 必要な環境変数（Google Maps API KeyとMap ID）が設定されているか確認し、
 * 設定されていない場合はエラーをスローします。
 */
const validateEnvironmentVariables = () => {
  // Google Maps API Keyが存在するか確認
  if (!import.meta.env.VITE_GOOGLE_MAPS_API_KEY) {
    throw new Error(ERROR_MESSAGES.MAP.CONFIG_MISSING);
  }
  // Google Maps Map IDが存在するか確認
  if (!import.meta.env.VITE_GOOGLE_MAPS_MAP_ID) {
    throw new Error(ERROR_MESSAGES.MAP.CONFIG_MISSING);
  }
};

// アプリケーション起動時に環境変数の検証を実行
validateEnvironmentVariables();

/**
 * アプリケーションの全体設定オブジェクト
 *
 * 各種APIの設定やマーカーの色など、アプリケーション全体で使用される設定を保持します。
 * constants.tsで定義された基本設定を使用し、環境変数の値で上書きされます。
 */
export const CONFIG: Config = {
  maps: MAPS_CONFIG, // Google Maps APIの設定（APIキー、マップID、デフォルト位置など）
  sheets: SHEETS_CONFIG, // Google Sheets APIの設定（APIキー、スプレッドシートIDなど）
  markers: MARKER_CONFIG, // マーカーの設定（カテゴリ別の色設定など）
};

/**
 * 設定オブジェクトの必須項目を検証する関数
 *
 * 必須の設定値（各APIキーやIDなど）が存在するか確認し、
 * 欠けている項目がある場合はエラーをスローします。
 *
 * @param config - 検証する設定オブジェクト
 * @throws 必須設定が欠けている場合にエラーをスロー
 */
export const validateConfig = (config: Config): void => {
  // 必須の設定項目とその値のマッピング
  const required = {
    'Google Maps API Key': config.maps.apiKey,
    'Google Maps Map ID': config.maps.mapId,
    'Google Sheets API Key': config.sheets.apiKey,
    'Google Sheets Spreadsheet ID': config.sheets.spreadsheetId,
  };

  // 値が空の項目をフィルタリングして名前のリストを作成
  const missing = Object.entries(required)
    .filter(([, value]) => !value) // 値が空または未定義の項目をフィルタリング
    .map(([key]) => key); // 項目名のみを抽出

  // 欠けている項目がある場合はエラーをスロー
  if (missing.length > 0) {
    throw new Error(`Missing required configuration: ${missing.join(', ')}`);
  }
};

/**
 * 設定の検証を実行
 *
 * アプリケーション起動時に設定内容を検証し、
 * 問題がある場合はエラーをスローして起動を中止します。
 */
try {
  validateConfig(CONFIG); // 設定内容の検証を実行
} catch (error) {
  console.error('Configuration validation failed:', error);
  throw error; // エラーを再スローしてアプリケーションの起動を中止
}

// 設定オブジェクトをデフォルトエクスポート
export default CONFIG;
