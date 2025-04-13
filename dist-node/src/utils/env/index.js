/**
 * 環境変数関連のユーティリティをエクスポートするインデックスファイル
 *
 * このファイルは環境変数アクセスに関する全ての機能を集約し、単一のエントリポイントを提供します。
 * @/utils/env として他のモジュールからインポート可能にします。
 */
// コアユーティリティをエクスポート
export * from './core';
// キャッシュ機能をエクスポート
export * from './cache';
// 変換ユーティリティをエクスポート
export * from './transforms';
// バリデーターをエクスポート
export * from './validators';
// Google Maps関連のエクスポート
export * from './google-maps';
// 環境設定型をインポート
/**
 * アプリケーション全体の環境設定を取得する
 * 型安全で、キャッシュ利用可能な環境設定オブジェクトを返します
 *
 * @returns アプリケーションの環境設定
 */
import { getEnvVar, getEnvBool } from './core';
import { getGoogleApiKey, getGoogleMapsLibraries, getGoogleMapsVersion, getGoogleMapId, getInitialMapCenter, getInitialMapZoom, isMarkerClusteringEnabled, } from './google-maps';
/**
 * 環境設定を取得
 * @returns EnvironmentConfig オブジェクト
 */
export function getEnvironmentConfig() {
    const isDev = getEnvBool('VITE_DEV_MODE', true);
    const isProd = !isDev;
    return {
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
            mode: isProd
                ? 'production'
                : getEnvVar({ key: 'NODE_ENV' }) === 'test'
                    ? 'test'
                    : 'development',
            isDev,
            isProd,
        },
        features: {
            googleSheets: getEnvBool('VITE_FEATURE_GOOGLE_SHEETS', false),
            offlineMode: getEnvBool('VITE_FEATURE_OFFLINE_MODE', true),
            markerClustering: isMarkerClusteringEnabled(),
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
            }),
        },
    };
}
