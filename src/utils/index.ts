/**
 * ユーティリティ関数のバレルファイル
 *
 * 純粋なユーティリティ関数を一元的にエクスポートします。
 * アプリケーション基盤を支える汎用的な関数を提供し、
 * 実装の詳細を抽象化します。
 */

// ============================================================================
// 直接エクスポート（下位互換性のため）
// ============================================================================

// 環境変数ユーティリティ
export * from './env.utils';

// エラーハンドリングユーティリティ
export * from './errors.utils';

// 文字列操作ユーティリティ
export * from './string.utils';

// 位置情報ユーティリティ
export * from './geo.utils';

// ============================================================================
// 内部インポート（名前空間用）
// ============================================================================

import * as EnvUtils from './env.utils';
import * as ErrorsUtils from './errors.utils';
import * as GeoUtils from './geo.utils';
import * as StringUtils from './string.utils';

// ============================================================================
// 名前空間によるグループ化
// ============================================================================

/**
 * 環境変数操作ユーティリティ
 *
 * 環境変数の安全な取得と検証のための関数群
 */
export const Env = {
  /** 環境変数を型安全に取得 */
  getValue: EnvUtils.getEnvValue,
  /** 環境変数を数値として取得 */
  getNumber: EnvUtils.getEnvValueAsNumber,
  /** 環境変数をブール値として取得 */
  getBoolean: EnvUtils.getEnvValueAsBoolean,
  /** 環境変数をJSONとして取得 */
  getJson: EnvUtils.getEnvValueAsJson,
  /** 必須環境変数を検証 */
  checkRequired: EnvUtils.checkRequiredEnvVars,
};

/**
 * エラー処理ユーティリティ
 *
 * 標準化されたエラー処理と多言語対応メッセージの取得
 */
export const Errors = {
  /** エラーメッセージを取得 */
  getMessage: ErrorsUtils.getErrorMessage,
  /** 多言語対応エラーメッセージを取得 */
  getLocalizedMessage: ErrorsUtils.getLocalizedErrorMessage,
  /** 標準化されたエラーオブジェクトを作成 */
  create: ErrorsUtils.createErrorObject,
  /** エラーコードの検証 */
  isValidCode: ErrorsUtils.isValidErrorCode,
  /** エラーメッセージの整合性検証 */
  validateMessages: ErrorsUtils.validateErrorMessages,
};

/**
 * 文字列操作ユーティリティ
 *
 * 文字列のフォーマットと操作のための関数群
 */
export const Strings = {
  /** プレースホルダーを置換してメッセージをフォーマット */
  format: StringUtils.formatMessage,
  /** 文字列を最大長に切り詰め */
  truncate: StringUtils.truncateText,
};

/**
 * 地理情報ユーティリティ
 *
 * 位置情報の計算、検証、フォーマットのための関数群
 */
export const Geo = {
  /** 緯度経度を検証 */
  validateLatLng: GeoUtils.validateLatLng,
  /** 2点間の距離を計算 */
  calculateDistance: GeoUtils.calculateDistance,
  /** 座標が境界内にあるか検証 */
  isPointInBounds: GeoUtils.isPointInBounds,
  /** 座標が佐渡島内にあるか検証 */
  isPointInSado: GeoUtils.isPointInSado,
  /** 緯度経度を文字列形式に変換 */
  formatLatLng: GeoUtils.formatLatLng,
  /** 境界の中心点を取得 */
  getBoundsCenter: GeoUtils.getBoundsCenter,
  /** 複数の座標から境界を計算 */
  calculateBoundsFromPoints: GeoUtils.calculateBoundsFromPoints,
};

// ============================================================================
// 共通ユーティリティ（頻繁に使用される関数へのショートカット）
// ============================================================================

/**
 * 共通ユーティリティ関数
 *
 * 頻繁に使用される関数へのショートカットアクセス
 */
export const Utils = {
  /** 文字列フォーマット */
  formatMessage: StringUtils.formatMessage,
  /** 距離計算 */
  calculateDistance: GeoUtils.calculateDistance,
  /** エラーメッセージ取得 */
  getErrorMessage: ErrorsUtils.getErrorMessage,
  /** 環境変数取得 */
  getEnvValue: EnvUtils.getEnvValue,
};

// ============================================================================
// サービスエクスポート注意喚起コメント
// ============================================================================

/**
 * 注意: サービスは src/services から直接インポートしてください
 * 例:
 *   import { CONFIG } from '../services/config';
 *   import { isMobileDevice } from '../services/device';
 *   import { formatPoiDetails } from '../services/formatters';
 *
 * または、services バレルファイルを使用:
 *   import { Config, Device, Formatters } from '../services';
 */

// サービスのエクスポートなし - このファイルは純粋なユーティリティ関数のみを提供
