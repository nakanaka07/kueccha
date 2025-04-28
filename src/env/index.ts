/**
 * 環境変数関連のユーティリティ
 *
 * このファイルは、環境変数ユーティリティの統一エントリポイントです。
 * 静的ホスティング環境向けに最適化されています。
 */

// 型定義のインポート（先頭に配置）

// 各モジュールから厳選した関数のみをインポート

import { validateClientEnv } from '../config/client-validator';

import { getCachedEnvVar, getCachedEnvBool } from './cache';
import { getEnvVar, getEnvBool } from './core';
import {
  getGoogleApiKey,
  getGoogleMapsLibraries,
  getGoogleMapsVersion,
  getGoogleMapId,
  getInitialMapCenter,
  getInitialMapZoom,
  isMarkerClusteringEnabled,
  validateGoogleMapsConfig,
} from './google-maps';

import type { EnvironmentConfig, LogLevelType } from '@/types/env-types';

// 便利な関数を直接エクスポート
export {
  // core
  getEnvVar,
  getEnvBool,

  // cache
  getCachedEnvVar,
  getCachedEnvBool,

  // client-validator
  validateClientEnv,

  // google-maps
  validateGoogleMapsConfig,
};

/**
 * グローバルに利用可能なENV設定オブジェクト
 * アプリケーション全体で一貫した環境設定へのアクセスを提供します
 */
export const ENV: EnvironmentConfig = {
  app: {
    name: getEnvVar({ key: 'VITE_APP_NAME', defaultValue: 'くえっちゃ', required: true }),
    shortName: getEnvVar({ key: 'VITE_APP_SHORT_NAME', defaultValue: 'くえっちゃ' }),
    description: getEnvVar({
      key: 'VITE_APP_DESCRIPTION',
      defaultValue: '佐渡島観光支援アプリケーション',
    }),
    version: getEnvVar({ key: 'VITE_APP_VERSION', defaultValue: '1.0.0' }),
    basePath: getEnvVar({ key: 'VITE_BASE_PATH', defaultValue: '/' }),
  },
  google: {
    apiKey: getGoogleApiKey(),
    mapsVersion: getGoogleMapsVersion(),
    mapsLibraries: getGoogleMapsLibraries(),
    mapId: getGoogleMapId(),
  },
  env: {
    mode: getEnvBool('VITE_DEV_MODE', true)
      ? 'development'
      : getEnvVar({ key: 'NODE_ENV' }) === 'test'
        ? 'test'
        : 'production',
    isDev: getEnvBool('VITE_DEV_MODE', true),
    isProd: !getEnvBool('VITE_DEV_MODE', true),
  },
  features: {
    googleSheets: getEnvBool('VITE_FEATURE_GOOGLE_SHEETS', false),
    offlineMode: getEnvBool('VITE_FEATURE_OFFLINE_MODE', true),
    markerClustering: isMarkerClusteringEnabled(),
    // 静的ホスティング環境向けの新機能フラグ
    enableProductionProfiling: getEnvBool('VITE_FEATURE_PRODUCTION_PROFILING', false),
    staticHostOptimization: getEnvBool('VITE_FEATURE_STATIC_HOST_OPT', true),
  },
  ui: {
    map: {
      initialZoom: getInitialMapZoom(),
      initialCenter: getInitialMapCenter(),
    },
  },
  logging: {
    level: getEnvVar({
      key: 'VITE_LOG_LEVEL',
      defaultValue: 'info',
    }) as LogLevelType,
  },
};
