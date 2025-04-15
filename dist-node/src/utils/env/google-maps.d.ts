/**
 * Google Maps関連の環境変数アクセス機能
 *
 * Google Maps Guidelinesに準拠した環境変数へのアクセスを提供します。
 * 必要最小限の実装となっています（YAGNI原則）
 */
/**
 * Google Maps API キーを取得
 * @returns Google Maps APIキー
 */
export declare function getGoogleApiKey(): string;
/**
 * Google Maps APIバージョンを取得
 * @returns Google Maps APIのバージョン設定
 */
export declare function getGoogleMapsVersion(): string;
/**
 * Google Mapsライブラリの配列を取得
 * @returns 使用するGoogleマップライブラリの配列
 */
export declare function getGoogleMapsLibraries(): string[];
/**
 * Google Maps Map IDを取得
 * @returns スタイル付きマップのMap ID
 */
export declare function getGoogleMapId(): string;
/**
 * マーカークラスタリングを有効にするかどうか
 * @returns マーカークラスタリングの有効/無効状態
 */
export declare function isMarkerClusteringEnabled(): boolean;
/**
 * 地図の初期ズームレベルを取得
 * @returns 地図の初期ズームレベル（0-22の範囲に制限）
 */
export declare function getInitialMapZoom(): number;
/**
 * 地図の初期中心座標を取得
 * @returns 地図の初期中心座標（緯度・経度）
 */
export declare function getInitialMapCenter(): {
  lat: number;
  lng: number;
};
/**
 * Google Maps 関連の環境変数が正しく設定されているか検証
 * KISS原則に基づいた単純な実装
 */
export declare function validateGoogleMapsConfig(): boolean;
