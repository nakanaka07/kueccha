/**
 * Google Maps関連の環境変数アクセス機能
 *
 * Google Maps Guidelinesに準拠した環境変数へのアクセスを提供します。
 * 必要最小限の実装となっています（YAGNI原則）
 */
import { logger } from '../logger';
import { getCachedEnvVar, getCachedEnvBool, getCachedEnvNumber } from './cache';
// 実際の実装場所から関数をインポート
// ======================================================================
// Google Maps環境変数アクセス関数
// ======================================================================
/**
 * Google Maps API キーを取得
 * @returns Google Maps APIキー
 */
export function getGoogleApiKey() {
  return getCachedEnvVar('VITE_GOOGLE_API_KEY', '');
}
/**
 * Google Maps APIバージョンを取得
 * @returns Google Maps APIのバージョン設定
 */
export function getGoogleMapsVersion() {
  return getCachedEnvVar('VITE_GOOGLE_MAPS_VERSION', 'quarterly');
}
/**
 * Google Mapsライブラリの配列を取得
 * @returns 使用するGoogleマップライブラリの配列
 */
export function getGoogleMapsLibraries() {
  const librariesStr = getCachedEnvVar('VITE_GOOGLE_MAPS_LIBRARIES', 'places,geometry,marker');
  return librariesStr.split(',').map(lib => lib.trim());
}
/**
 * Google Maps Map IDを取得
 * @returns スタイル付きマップのMap ID
 */
export function getGoogleMapId() {
  return getCachedEnvVar('VITE_GOOGLE_MAPS_MAP_ID', '');
}
/**
 * マーカークラスタリングを有効にするかどうか
 * @returns マーカークラスタリングの有効/無効状態
 */
export function isMarkerClusteringEnabled() {
  return getCachedEnvBool('VITE_FEATURE_MARKER_CLUSTERING', true);
}
/**
 * 地図の初期ズームレベルを取得
 * @returns 地図の初期ズームレベル（0-22の範囲に制限）
 */
export function getInitialMapZoom() {
  const zoom = getCachedEnvNumber('VITE_UI_MAP_INITIAL_ZOOM', 11);
  return Math.max(0, Math.min(22, zoom)); // 0-22の範囲に制限
}
/**
 * 地図の初期中心座標を取得
 * @returns 地図の初期中心座標（緯度・経度）
 */
export function getInitialMapCenter() {
  return {
    lat: getCachedEnvNumber('VITE_UI_MAP_INITIAL_CENTER_LAT', 38.048),
    lng: getCachedEnvNumber('VITE_UI_MAP_INITIAL_CENTER_LNG', 138.409),
  };
}
/**
 * Google Maps 関連の環境変数が正しく設定されているか検証
 * KISS原則に基づいた単純な実装
 */
export function validateGoogleMapsConfig() {
  // 必須項目のチェック
  const apiKey = getGoogleApiKey();
  // APIキーが設定されていない場合はエラー
  if (!apiKey || apiKey.trim() === '') {
    logger.error('Google Maps APIキーが設定されていません');
    return false;
  }
  // APIキーが短すぎる場合は警告（正しいキーは通常もっと長い）
  if (apiKey.length < 10) {
    logger.warn('Google Maps APIキーが短すぎるか、不正な形式の可能性があります');
  }
  return true;
}
