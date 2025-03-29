import { Libraries } from '@googlemaps/js-api-loader';

import { ENV } from '@/utils/env';
// Libraries型をインポート

/**
 * Google Maps API関連の定数
 *
 * 目的:
 * - マップ設定の一元管理
 * - 環境に応じた設定切り替え
 * - コード重複の防止
 * - 一貫性のある地図体験の提供
 */

/** 佐渡島の中心座標 */
export const SADO_CENTER = {
  lat: 38.0413,
  lng: 138.3689,
};

/** 地図初期表示のデフォルトズームレベル */
export const DEFAULT_ZOOM = 10;

/** モバイル時のデフォルトズームレベル (やや広めに表示) */
export const MOBILE_DEFAULT_ZOOM = 9;

/**
 * マップコントロール位置の定数
 * googleオブジェクト未ロード時のフォールバック用
 */
export const CONTROL_POSITIONS = {
  RIGHT_BOTTOM: 7, // google.maps.ControlPosition.RIGHT_BOTTOM
  RIGHT_CENTER: 3, // google.maps.ControlPosition.RIGHT_CENTER
  RIGHT_TOP: 6, // google.maps.ControlPosition.RIGHT_TOP
  TOP_RIGHT: 2, // google.maps.ControlPosition.TOP_RIGHT
  LEFT_TOP: 5, // google.maps.ControlPosition.LEFT_TOP
};

/**
 * マップタイプコントロールスタイルの定数
 */
export const MAP_TYPE_CONTROL_STYLES = {
  DROPDOWN_MENU: 2, // google.maps.MapTypeControlStyle.DROPDOWN_MENU
};

/**
 * マップタイプIDの定数
 */
export const MAP_TYPE_IDS = {
  ROADMAP: 'roadmap',
  SATELLITE: 'satellite',
  HYBRID: 'hybrid',
  TERRAIN: 'terrain',
};

// MAP_TYPESはMAP_TYPE_IDSと重複しているため削除
// 重複定義を避けるため、既存のMAP_TYPE_IDSを使用

/**
 * 再試行関連の設定
 * API接続失敗時のリトライ戦略
 */
export const RETRY_CONFIG = {
  /** 最大再試行回数 */
  MAX_RETRIES: 3,

  /** 再試行間隔（ミリ秒） */
  RETRY_DELAY: 1000,
};

/**
 * マップID関連設定
 * Cloud-based stylingのIDとフォールバックオプション
 */
export const MAP_ID_CONFIG = {
  /** メインマップID - 環境変数から取得 */
  MAIN: ENV.google.MAPS_MAP_ID || '',

  /** フォールバック用マップID（メインが無効な場合） */
  FALLBACK: '',

  /** マップIDが有効かどうかを確認 */
  isValid: (mapId: string): boolean => {
    return !!mapId && mapId.trim() !== '';
  },
};

/**
 * googleオブジェクトの可用性をチェック
 * @returns google.mapsが利用可能かどうか
 */
export const isGoogleMapsAvailable = (): boolean => {
  // グローバルスコープでgoogleオブジェクトが存在するかチェック
  if (typeof window === 'undefined' || typeof window.google === 'undefined') {
    return false;
  }

  // googleオブジェクトが存在する場合、mapsプロパティをチェック
  // Record<string, unknown>型を使用して型安全に存在確認
  const googleObj = window.google as Record<string, unknown>;
  return Object.prototype.hasOwnProperty.call(googleObj, 'maps') && googleObj.maps !== undefined;
};

/**
 * マップオプションのデフォルト設定
 *
 * Google Maps APIの初期化時に使用するオプション
 * @see https://developers.google.com/maps/documentation/javascript/reference/map#MapOptions
 */
export const DEFAULT_MAP_OPTIONS = {
  /** 中心座標（佐渡島） */
  center: SADO_CENTER,

  /** ズームレベル */
  zoom: DEFAULT_ZOOM,

  /** マップID - 環境変数から取得（スタイルのカスタマイズに使用） */
  mapId: MAP_ID_CONFIG.MAIN || null,

  /** ジェスチャー設定 - 'greedy'でモバイル操作性向上 */
  gestureHandling: 'greedy' as const,

  /** デフォルトPOIアイコンのクリック有効化 */
  clickableIcons: true,

  /** UI要素の表示設定 */
  disableDefaultUI: false,

  /** ズームコントロール */
  zoomControl: true,
  get zoomControlOptions() {
    return {
      position: isGoogleMapsAvailable()
        ? google.maps.ControlPosition.RIGHT_BOTTOM
        : CONTROL_POSITIONS.RIGHT_BOTTOM,
    };
  },

  /** マップタイプコントロール */
  mapTypeControl: true,
  get mapTypeControlOptions() {
    return {
      position: isGoogleMapsAvailable()
        ? google.maps.ControlPosition.TOP_RIGHT
        : CONTROL_POSITIONS.TOP_RIGHT,
      style: isGoogleMapsAvailable()
        ? google.maps.MapTypeControlStyle.DROPDOWN_MENU
        : MAP_TYPE_CONTROL_STYLES.DROPDOWN_MENU,
      mapTypeIds: isGoogleMapsAvailable()
        ? [
            google.maps.MapTypeId.ROADMAP,
            google.maps.MapTypeId.SATELLITE,
            google.maps.MapTypeId.HYBRID,
            google.maps.MapTypeId.TERRAIN,
          ]
        : [MAP_TYPE_IDS.ROADMAP, MAP_TYPE_IDS.SATELLITE, MAP_TYPE_IDS.HYBRID, MAP_TYPE_IDS.TERRAIN],
    };
  },

  /** ストリートビューコントロール */
  streetViewControl: true,
  get streetViewControlOptions() {
    return {
      position: isGoogleMapsAvailable()
        ? google.maps.ControlPosition.RIGHT_BOTTOM
        : CONTROL_POSITIONS.RIGHT_BOTTOM,
    };
  },

  /** フルスクリーンコントロール */
  fullscreenControl: true,
  get fullscreenControlOptions() {
    return {
      position: isGoogleMapsAvailable()
        ? google.maps.ControlPosition.RIGHT_TOP
        : CONTROL_POSITIONS.RIGHT_TOP,
    };
  },
};

/**
 * モバイル向けマップオプション
 *
 * スマートフォンなど小型デバイス向けの最適化設定
 */
export const MOBILE_MAP_OPTIONS = {
  ...DEFAULT_MAP_OPTIONS,
  zoom: MOBILE_DEFAULT_ZOOM,
  // モバイルではよりシンプルなUIに
  mapTypeControl: false,
  streetViewControl: false,
  // モバイルでは操作しやすい位置に
  get zoomControlOptions() {
    return {
      position: isGoogleMapsAvailable()
        ? google.maps.ControlPosition.RIGHT_CENTER
        : CONTROL_POSITIONS.RIGHT_CENTER,
    };
  },
  get fullscreenControlOptions() {
    return {
      position: isGoogleMapsAvailable()
        ? google.maps.ControlPosition.LEFT_TOP
        : CONTROL_POSITIONS.LEFT_TOP,
    };
  },
};

/**
 * Loader設定
 * Google Maps JavaScript APIのロード設定
 */
export const LOADER_OPTIONS = {
  /** APIバージョン */
  version: 'weekly',

  /** 読み込む追加ライブラリ */
  libraries: ['places', 'geometry'] as Libraries,

  /** 言語設定 - デフォルトは日本語 */
  language: 'ja',

  /** 地域設定 - 日本 */
  region: 'JP',
};

/**
 * Google Maps Loader設定を取得
 * 環境に応じた適切な設定を返す
 * @returns LoaderOptions
 */
export const getLoaderOptions = () => {
  const apiKey = ENV.google.API_KEY;
  const mapId = MAP_ID_CONFIG.MAIN;

  return {
    ...LOADER_OPTIONS,
    apiKey,
    // マップIDが有効な場合のみ追加
    ...(MAP_ID_CONFIG.isValid(mapId) ? { mapIds: [mapId] } : {}),
  };
};

/**
 * デバイスタイプ検出
 * ビューポートサイズに基づいてデバイスタイプを判定
 * @returns モバイルデバイスかどうか
 */
export const isMobileDevice = (): boolean => {
  return window.innerWidth <= 768 || 'ontouchstart' in window || navigator.maxTouchPoints > 0;
};

/**
 * 現在のデバイスに適したマップオプションを取得
 * @returns マップ初期化オプション
 */
export const getResponsiveMapOptions = () => {
  return isMobileDevice() ? MOBILE_MAP_OPTIONS : DEFAULT_MAP_OPTIONS;
};
