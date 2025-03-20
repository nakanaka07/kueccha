import { getEnvValue, getEnvValueAsNumber, getEnvValueAsBoolean } from '../utils/env.utils';

export const AppInfo = {
  NAME: 'くえっちゃ',
  VERSION: getEnvValue('VITE_APP_VERSION', '1.0.0'),
  DESCRIPTION: '佐渡島観光情報アプリ',
  BUILD_DATE: getEnvValue('VITE_BUILD_DATE', new Date().toISOString()),
  COMMIT_HASH: getEnvValue('VITE_COMMIT_HASH', ''),
};

export const RegionSettings = {
  TIMEZONE: 'Asia/Tokyo',
  COUNTRY: 'JP',
};

export const ApiSettings = {
  TIMEOUT: getEnvValueAsNumber('VITE_API_TIMEOUT', 10000),
  MAX_RETRY_COUNT: getEnvValueAsNumber('VITE_MAX_RETRY_COUNT', 3),
  BASE_URL: getEnvValue('VITE_API_BASE_URL', ''),
};

export const CacheSettings = {
  DURATION: getEnvValueAsNumber('VITE_CACHE_DURATION', 1000 * 60 * 60),
  STORAGE_PREFIX: getEnvValue('VITE_CACHE_PREFIX', 'kueccha_'),
};

export const DebugSettings = {
  IS_DEVELOPMENT: getEnvValueAsBoolean('VITE_DEV', import.meta.env.DEV === true),
  ENABLE_LOGS: getEnvValueAsBoolean('VITE_ENABLE_LOGS', import.meta.env.DEV === true),
  LOG_LEVEL: getEnvValue('VITE_LOG_LEVEL', 'error'),
};

export const MetaDefaults = {
  title: AppInfo.NAME,
  description: AppInfo.DESCRIPTION,
  ogImage: '/images/og-image.jpg',
  ogUrl: getEnvValue('VITE_BASE_URL', 'https://kueccha.jp'),
};