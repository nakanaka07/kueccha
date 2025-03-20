/**
 * Google Maps API関連定数ファイル
 *
 * Google Maps APIの設定パラメータや初期設定値を定義します。
 */

import { ERROR_MESSAGES } from './errors.constants';
import { MapTypeControlStyle, ControlPosition, MapDisplayMode } from '../types/maps.types';
import { getEnvValue } from '../utils/env.utils';
import { createError, logError } from '../utils/errors.utils';

import type {
  MapConfig,
  ExtendedMapOptions,
  MapDisplayModes,
  MapDisplayModeOptions,
} from '../types/maps.types';
import type { LoadScriptProps } from '@react-google-maps/api';

// ============================================================================
// 環境変数処理
// ============================================================================

/** 開発環境かどうかを判定 */
const IS_DEV = import.meta.env.DEV === true;

// ============================================================================
// Google Maps API 設定値
// ============================================================================

/**
 * 有効なGoogle Maps APIライブラリのリスト
 * @see https://developers.google.com/maps/documentation/javascript/libraries
 */
export const VALID_LIBRARIES = ['places', 'geometry', 'drawing', 'visualization'] as const;

/**
 * 使用するGoogle Maps APIのライブラリ
 */
export const USED_LIBRARIES: LoadScriptProps['libraries'] = ['places', 'geometry', 'drawing'];

/**
 * Google Maps API キー
 * 環境変数から取得します
 */
export const GOOGLE_MAPS_API_KEY = getEnvValue('VITE_GOOGLE_MAPS_API_KEY', '', String, {
  required: true,
  logErrors: true,
  throwInProduction: !IS_DEV,
});

/**
 * Google Maps Map ID
 * カスタムスタイルのマップで使用します
 */
export const GOOGLE_MAPS_MAP_ID = getEnvValue(
  'VITE_GOOGLE_MAPS_MAP_ID',
  IS_DEV ? 'development-map-id' : '',
  String,
  {
    required: true,
    logErrors: true,
    throwInProduction: !IS_DEV,
  },
);

/**
 * デフォルトのマップ中心位置（佐渡島）
 */
export const DEFAULT_CENTER = {
  lat: getEnvValue('VITE_MAP_DEFAULT_LAT', 38.0, Number, { logErrors: true }),
  lng: getEnvValue('VITE_MAP_DEFAULT_LNG', 138.4, Number, { logErrors: true }),
};

/**
 * デフォルトのズームレベル
 */
export const DEFAULT_ZOOM = getEnvValue('VITE_MAP_DEFAULT_ZOOM', 11, Number, { logErrors: true });

// ============================================================================
// ヘルパー関数（先に定義してコード内で利用）
// ============================================================================

/**
 * Google Maps APIが読み込まれているかを確認する
 *
 * @returns Google Maps APIが利用可能な場合はtrue、そうでない場合はfalse
 */
export function checkGoogleMapsLoaded(): boolean {
  return typeof google !== 'undefined' && typeof google.maps.MapTypeId !== 'undefined';
}

/**
 * Google Maps のMapTypeId値を安全に取得する
 *
 * @param typeId マップタイプID文字列
 * @returns Google Maps MapTypeId値またはフォールバック文字列
 */
export function getMapTypeId(typeId: string): google.maps.MapTypeId | string {
  if (!checkGoogleMapsLoaded()) {
    return typeId; // APIが読み込まれていない場合は文字列をそのまま返す
  }

  switch (typeId.toLowerCase()) {
    case 'roadmap':
      return google.maps.MapTypeId.ROADMAP;
    case 'satellite':
      return google.maps.MapTypeId.SATELLITE;
    case 'hybrid':
      return google.maps.MapTypeId.HYBRID;
    case 'terrain':
      return google.maps.MapTypeId.TERRAIN;
    default:
      return google.maps.MapTypeId.ROADMAP;
  }
}

// ============================================================================
// マップ表示モード設定
// ============================================================================

/**
 * マップ表示モード設定
 * 各モードのマップ表示スタイルとオプション
 */
export const MAP_DISPLAY_MODES: MapDisplayModes = {
  // グローバルオブジェクト参照を安全に行うための関数で囲む
  get [MapDisplayMode.STANDARD]() {
    return {
      mapTypeId: getMapTypeId('roadmap'),
      styles: [],
    };
  },
  get [MapDisplayMode.SATELLITE]() {
    return {
      mapTypeId: getMapTypeId('satellite'),
      styles: [],
    };
  },
  get [MapDisplayMode.ACCESSIBLE]() {
    return {
      mapTypeId: getMapTypeId('roadmap'),
      styles: [
        {
          featureType: 'all',
          elementType: 'all',
          stylers: [{ visibility: 'simplified' }, { saturation: -100 }, { contrast: 1.2 }],
        },
      ],
    };
  },
  get [MapDisplayMode.NIGHT]() {
    return {
      mapTypeId: getMapTypeId('roadmap'),
      styles: [
        {
          featureType: 'all',
          elementType: 'all',
          stylers: [
            { invert_lightness: true },
            { hue: '#00aaff' },
            { saturation: -50 },
            { lightness: -10 },
          ],
        },
      ],
    };
  },
};

// ============================================================================
// マップ設定
// ============================================================================

/**
 * マップの基本スタイル設定
 */
const MAP_STYLE: MapConfig['style'] = {
  width: '100%',
  height: '100%',
};

/**
 * モバイルデバイス用マップオプション（基本設定と合わせて使用）
 */
const MOBILE_MAP_OPTIONS: Partial<ExtendedMapOptions> = {
  zoomControl: false,
  streetViewControl: false,
  fullscreenControl: false,
  mapTypeControl: false,
};

/**
 * マップの基本オプション設定のデフォルト値
 * Google Maps APIが未ロード時のフォールバック
 */
const DEFAULT_MAP_OPTIONS: ExtendedMapOptions = {
  zoomControl: true,
  mapTypeControl: true,
  streetViewControl: true,
  fullscreenControl: true,
  gestureHandling: 'greedy',
  clickableIcons: false,
  disableDefaultUI: false,
  backgroundColor: '#f2f2f2',
  mapId: GOOGLE_MAPS_MAP_ID,
} as ExtendedMapOptions;

/**
 * マップの基本オプション設定
 *
 * Google Maps APIがロードされた後にアクセスするため、
 * 関数として定義してランタイムで評価します
 */
function createMapOptions(): ExtendedMapOptions {
  // Google Maps APIが読み込まれていることを確認
  if (!checkGoogleMapsLoaded()) {
    // フォールバック値を返す
    return DEFAULT_MAP_OPTIONS;
  }

  return {
    // 一般的なコントロール設定
    zoomControl: true,
    zoomControlOptions: {
      position: ControlPosition.RIGHT_BOTTOM,
    },
    mapTypeControl: true,
    mapTypeControlOptions: {
      position: ControlPosition.TOP_RIGHT,
      style: MapTypeControlStyle.DROPDOWN_MENU,
      mapTypeIds: [google.maps.MapTypeId.ROADMAP, google.maps.MapTypeId.SATELLITE],
    },
    streetViewControl: true,
    streetViewControlOptions: {
      position: ControlPosition.RIGHT_BOTTOM,
    },
    fullscreenControl: true,
    fullscreenControlOptions: {
      position: ControlPosition.RIGHT_TOP,
    },

    // ジェスチャー設定
    gestureHandling: 'greedy',
    clickableIcons: false,

    // カメラコントロールの設定
    cameraControl: true,
    cameraControlOptions: {
      position: ControlPosition.RIGHT_BOTTOM,
    },

    // UI設定
    disableDefaultUI: false,
    backgroundColor: '#f2f2f2',

    // マップID（クラウドベーススタイル用）
    mapId: GOOGLE_MAPS_MAP_ID,
  };
}

/**
 * エリア別の境界データ
 * ToDo: このデータは将来的に外部ファイルや設定から取得するように改善
 */
const AREA_BOUNDS: Record<string, google.maps.LatLngBoundsLiteral> = {
  ryotsu: {
    north: 38.5,
    south: 38.0,
    east: 139.0,
    west: 138.5,
  },
  aikawa: {
    north: 38.3,
    south: 37.9,
    east: 138.4,
    west: 138.0,
  },
  // デフォルト境界はマップ全体を表示
  default: {
    north: DEFAULT_CENTER.lat + 0.5,
    south: DEFAULT_CENTER.lat - 0.5,
    east: DEFAULT_CENTER.lng + 0.5,
    west: DEFAULT_CENTER.lng - 0.5,
  },
};

/**
 * マップの全体設定
 */
export const MAPS_CONFIG: MapConfig = {
  apiKey: GOOGLE_MAPS_API_KEY,
  mapId: GOOGLE_MAPS_MAP_ID,
  defaultCenter: DEFAULT_CENTER,
  defaultZoom: DEFAULT_ZOOM,
  libraries: USED_LIBRARIES,
  language: 'ja',
  version: 'quarterly',
  style: MAP_STYLE,
  get options() {
    return createMapOptions();
  },
  mobileOptions: MOBILE_MAP_OPTIONS,
  boundsPadding: 50,
  clusteringThreshold: 100,
  defaultInfoWindowMaxWidth: 300,
};

// 既存のコードに追加
/**
 * マップコンテナの基本スタイル
 * コンポーネント内で直接使用できるCSSスタイルオブジェクト
 */
export const MAP_CONTAINER_STYLE: MapStyle = {
  width: '100%',
  height: '100vh',
  maxHeight: '100%',
  additionalStyles: {
    // 必要に応じて追加のCSSプロパティ
    position: 'relative',
    overflow: 'hidden',
  },
};

/**
 * モバイル用マップコンテナスタイル
 * デバイスタイプに応じた最適化
 */
export const MOBILE_MAP_CONTAINER_STYLE: MapStyle = {
  ...MAP_CONTAINER_STYLE,
  height: 'calc(100vh - 56px)', // モバイルのナビゲーションバーを考慮
  additionalStyles: {
    ...MAP_CONTAINER_STYLE.additionalStyles,
    // モバイル固有のスタイル調整
  },
};

// ============================================================================
// エクスポートされるヘルパー関数
// ============================================================================

/**
 * 指定されたエリアタイプの境界データを取得
 *
 * @param areaType - エリアタイプ
 * @returns エリアの境界座標
 */
export function getAreaBounds(areaType: string): google.maps.LatLngBounds {
  try {
    if (!checkGoogleMapsLoaded()) {
      throw createError('MAP', 'API_ERROR', ERROR_MESSAGES.MAP.API_NOT_LOADED);
    }

    const bounds = AREA_BOUNDS[areaType] || AREA_BOUNDS.default;

    return new google.maps.LatLngBounds(
      { lat: bounds.south, lng: bounds.west },
      { lat: bounds.north, lng: bounds.east },
    );
  } catch (error) {
    logError('MAP', 'BOUNDS_ERROR', `エリア境界の取得に失敗しました: ${areaType}`);
    // エラー発生時はデフォルト境界を返す
    const defaultBounds = AREA_BOUNDS.default;
    return new google.maps.LatLngBounds(
      { lat: defaultBounds.south, lng: defaultBounds.west },
      { lat: defaultBounds.north, lng: defaultBounds.east },
    );
  }
}

/**
 * マップ表示モードを取得する
 *
 * @param modeName - モード名
 * @returns モード設定またはデフォルト設定
 */
export function getMapDisplayMode(modeName: string): MapDisplayModeOptions {
  const mode = Object.values(MapDisplayMode).find((mode) => mode === modeName);
  return mode ? MAP_DISPLAY_MODES[mode] : MAP_DISPLAY_MODES[MapDisplayMode.STANDARD];
}
