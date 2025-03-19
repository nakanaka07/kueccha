/**
 * 定数のバレルファイル
 *
 * すべての定数を一箇所からエクスポートします。
 * 論理的なグループ分けと名前空間によって整理されており、名前の衝突を防ぎます。
 */

// ============================================================================
// 個別ファイルからのインポート（名前空間のために必要）
// ============================================================================

// Core名前空間用のインポート
import { AppInfo } from './app.constants';
import { AreasUtil, AREAS } from './areas.constants';
import { DEFAULT_CONFIG } from './config.constants';
import { ERROR_MESSAGES } from './errors.constants';
import { SADO_CENTER, SADO_BOUNDS } from './geo.constants';
import { DEFAULT_LANGUAGE, SUPPORTED_LANGUAGES } from './i18n.constants';

// UI名前空間用のインポート
import { LoadingConfig } from './loading.constants';

// データ名前空間用のインポート

// マップ名前空間用のインポート
import { MAPS_CONFIG } from './maps.constants';
import { MARKERS_BY_AREA } from './markers.constants';
import { POI_GENRE_DISPLAY_NAMES, getMarkerOptionsForGenre } from './poi.constants';
import { SHEETS_CONFIG, dataTransformHelpers } from './sheets.constants';
import { INFO_WINDOW_CONFIG, MENU_ITEMS } from './ui.constants';

// エラー名前空間用のインポート

// 設定名前空間用のインポート

// ============================================================================
// 名前空間によるグループ化
// ============================================================================

/**
 * Core 名前空間：核となる重要定数
 * アプリケーション全体で頻繁に使用される基本的な定数
 */
export const Core = {
  APP_NAME: AppInfo.NAME,
  APP_VERSION: AppInfo.VERSION,
  APP_DESCRIPTION: AppInfo.DESCRIPTION,
  DEFAULT_LANGUAGE,
  SUPPORTED_LANGUAGES,
  SADO_CENTER,
  SADO_BOUNDS,
};

/**
 * UI 名前空間：ユーザーインターフェース関連の定数
 * 表示やレイアウトに関連する一般的な定数
 */
export const UI = {
  Loading: LoadingConfig,
  InfoWindow: INFO_WINDOW_CONFIG,
  MenuItems: MENU_ITEMS,
};

/**
 * データ名前空間：データ関連の定数とユーティリティ
 * データ操作やアクセスに関連する定数
 */
export const Data = {
  SheetsConfig: SHEETS_CONFIG,
  TransformHelpers: dataTransformHelpers,
};

/**
 * Map 名前空間：地図関連の定数とユーティリティ
 * 地図表示と操作に関連する集約された定数
 */
export const Map = {
  Config: MAPS_CONFIG,
  Areas: AreasUtil,
  AreasList: AREAS,
  Markers: MARKERS_BY_AREA,
  POIGenres: POI_GENRE_DISPLAY_NAMES,
  getMarkerForGenre: getMarkerOptionsForGenre,
};

/**
 * Error 名前空間：エラーメッセージと処理
 * アプリケーション全体のエラー処理に関する定数
 */
export const Errors = {
  MESSAGES: ERROR_MESSAGES,
};

/**
 * Config 名前空間：アプリケーション構成
 * 環境設定とデフォルト構成
 */
export const Config = {
  DEFAULT: DEFAULT_CONFIG,
};

// ============================================================================
// 個別ファイルからのエクスポート
// ============================================================================

// 名前付きエクスポートをまとめて再エクスポート
export * from './app.constants';
export * from './areas.constants';
export * from './config.constants';
export * from './errors.constants';
export * from './geo.constants';
export * from './i18n.constants';
export * from './loading.constants';
export * from './maps.constants';
export * from './markers.constants';
export * from './poi.constants';
export * from './sheets.constants';
export * from './ui.constants';

// ============================================================================
// 型エクスポート
// ============================================================================

/**
 * 便利なタイプエクスポート
 * よく使用される型をバレルファイルから直接アクセスできるようにする
 */
export type { AreaType } from '../types/areas.types';
export type { PoiGenre } from '../types/poi.types';
export type { SupportedLanguage } from '../types/i18n.types';
export type { MarkerDisplayOptions } from '../types/markers.types';
