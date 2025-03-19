/**
 * アプリケーション共通定数ファイル
 *
 * アプリケーション全体で使用される基本設定や定数を定義します。
 * アプリ名、バージョン、言語設定などの基本情報を含みます。
 */

import { DEFAULT_LANGUAGE, SUPPORTED_LANGUAGES } from './i18n.constants';
import { getEnvValue, getEnvValueAsNumber, getEnvValueAsBoolean } from '../utils/env.utils';

/**
 * アプリケーション基本情報
 */
export const AppInfo = {
  NAME: 'くえっちゃ',
  VERSION: getEnvValue('VITE_APP_VERSION', '1.0.0'),
  DESCRIPTION: '佐渡島観光情報アプリ',
  BUILD_DATE: getEnvValue('VITE_BUILD_DATE', new Date().toISOString()),
  COMMIT_HASH: getEnvValue('VITE_COMMIT_HASH', ''),
};

/**
 * 地域・タイムゾーン設定
 */
export const RegionSettings = {
  TIMEZONE: 'Asia/Tokyo',
  COUNTRY: 'JP',
};

/**
 * API設定
 */
export const ApiSettings = {
  TIMEOUT: getEnvValueAsNumber('VITE_API_TIMEOUT', 10000),
  MAX_RETRY_COUNT: getEnvValueAsNumber('VITE_MAX_RETRY_COUNT', 3),
  BASE_URL: getEnvValue('VITE_API_BASE_URL', ''),
};

/**
 * キャッシュ設定
 */
export const CacheSettings = {
  DURATION: getEnvValueAsNumber('VITE_CACHE_DURATION', 1000 * 60 * 60), // 1時間（ミリ秒）
  STORAGE_PREFIX: getEnvValue('VITE_CACHE_PREFIX', 'kueccha_'),
};

/**
 * デバッグ設定
 */
export const DebugSettings = {
  IS_DEVELOPMENT: getEnvValueAsBoolean('VITE_DEV', import.meta.env.DEV === true),
  ENABLE_LOGS: getEnvValueAsBoolean('VITE_ENABLE_LOGS', import.meta.env.DEV === true),
  LOG_LEVEL: getEnvValue('VITE_LOG_LEVEL', 'error'),
};

/**
 * メタデータ
 */
export const MetaDefaults = {
  title: AppInfo.NAME,
  description: AppInfo.DESCRIPTION,
  ogImage: '/images/og-image.jpg',
  ogUrl: getEnvValue('VITE_BASE_URL', 'https://kueccha.jp'),
};
