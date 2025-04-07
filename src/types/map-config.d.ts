/**
 * マップ設定に関する型定義
 *
 * このファイルはマップ関連の設定オブジェクトの型を定義します
 * 環境変数ガイドラインに従って、マップID、中心座標、ズームレベル等の
 * 設定パラメータに強力な型付けを提供します
 *
 * @see ../constants/maps.ts - マップの定数定義
 * @see ../utils/env.ts - 環境変数アクセス
 */

/**
 * マップの中心座標を表す型
 */
export interface MapCenter {
  /** 緯度 */
  lat: number;
  /** 経度 */
  lng: number;
}

/**
 * マップID設定
 * 環境変数 VITE_GOOGLE_MAPS_MAP_ID に対応
 */
export interface MapIdConfig {
  /** メインマップID */
  MAIN: string;
  /** フォールバック用マップID */
  FALLBACK: string;
  /** マップIDが有効かどうか確認 */
  isValid: (mapId: string) => boolean;
}

/**
 * マップコントロール位置の定数
 */
export interface ControlPositions {
  /** 右下 */
  RIGHT_BOTTOM: number;
  /** 右中央 */
  RIGHT_CENTER: number;
  /** 右上 */
  RIGHT_TOP: number;
  /** 上右 */
  TOP_RIGHT: number;
  /** 左上 */
  LEFT_TOP: number;
}

/**
 * マップタイプコントロールスタイル
 */
export interface MapTypeControlStyles {
  /** ドロップダウンメニュー */
  DROPDOWN_MENU: number;
}

/**
 * マップタイプID
 */
export interface MapTypeIds {
  /** 通常の道路地図 */
  ROADMAP: string;
  /** 衛星写真 */
  SATELLITE: string;
  /** 衛星写真と道路地図の組み合わせ */
  HYBRID: string;
  /** 地形図 */
  TERRAIN: string;
}

/**
 * API再試行設定
 */
export interface RetryConfig {
  /** 最大再試行回数 */
  MAX_RETRIES: number;
  /** 再試行間隔（ミリ秒） */
  RETRY_DELAY: number;
}

/**
 * レスポンシブマップオプション決定に使用するデバイスブレークポイント
 */
export interface DeviceBreakpoint {
  /** ピクセル値 */
  DEVICE_BREAKPOINT: number;
}

/**
 * マップ初期化オプションの詳細設定型
 * Google Maps APIの初期化に使用
 */
export interface MapInitOptions {
  /** 中心座標（佐渡島） */
  center: MapCenter;

  /** ズームレベル */
  zoom: number;

  /** マップID */
  mapId: string | null;

  /** ジェスチャーハンドリング設定 */
  gestureHandling: 'auto' | 'cooperative' | 'greedy' | 'none';

  /** デフォルトPOIアイコンのクリック有効化 */
  clickableIcons: boolean;

  /** UI要素の表示設定 */
  disableDefaultUI: boolean;

  /** ズームコントロール表示 */
  zoomControl: boolean;

  /** ズームコントロールオプション */
  zoomControlOptions?: {
    position: number;
  };

  /** マップタイプコントロール表示 */
  mapTypeControl: boolean;

  /** マップタイプコントロールオプション */
  mapTypeControlOptions?: {
    position: number;
    style: number;
    mapTypeIds: string[];
  };

  /** ストリートビューコントロール表示 */
  streetViewControl: boolean;

  /** ストリートビューコントロールオプション */
  streetViewControlOptions?: {
    position: number;
  };

  /** フルスクリーンコントロール表示 */
  fullscreenControl: boolean;

  /** フルスクリーンコントロールオプション */
  fullscreenControlOptions?: {
    position: number;
  };
}

/**
 * 環境変数と連携したマップローダーオプション
 * 環境変数ガイドラインに基づく
 */
export interface EnvAwareLoaderOptions {
  /** APIキー(VITE_GOOGLE_MAPS_API_KEY) */
  apiKey: string;

  /** APIバージョン(VITE_GOOGLE_MAPS_VERSION) */
  version: string;

  /** ライブラリ(VITE_GOOGLE_MAPS_LIBRARIES) */
  libraries: string[];

  /** 言語設定 */
  language?: string;

  /** 地域設定 */
  region?: string;

  /** マップID(VITE_GOOGLE_MAPS_MAP_ID) */
  mapIds?: string[];
}

/**
 * マップ関連の型をまとめたエクスポート
 */
export interface MapTypes {
  MapCenter: MapCenter;
  MapIdConfig: MapIdConfig;
  ControlPositions: ControlPositions;
  MapTypeControlStyles: MapTypeControlStyles;
  MapTypeIds: MapTypeIds;
  RetryConfig: RetryConfig;
  DeviceBreakpoint: DeviceBreakpoint;
  MapInitOptions: MapInitOptions;
  EnvAwareLoaderOptions: EnvAwareLoaderOptions;
}
