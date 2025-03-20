/**
 * Google Maps API関連の定数と設定
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
  MapStyle,
} from '../types/maps.types';
import type { LoadScriptProps } from '@react-google-maps/api';

// 環境設定
const IS_DEV = import.meta.env.DEV === true;

// API設定
export const VALID_LIBRARIES = ['places', 'geometry', 'drawing', 'visualization'] as const;
export const USED_LIBRARIES: LoadScriptProps['libraries'] = ['places', 'geometry', 'drawing'];
export const GOOGLE_MAPS_API_KEY = getEnvValue('VITE_GOOGLE_MAPS_API_KEY', '', String, {
  required: true,
  logErrors: true,
  throwInProduction: !IS_DEV,
});
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

// マップ基本設定
export const DEFAULT_CENTER = {
  lat: getEnvValue('VITE_MAP_DEFAULT_LAT', 38.0, Number, { logErrors: true }),
  lng: getEnvValue('VITE_MAP_DEFAULT_LNG', 138.4, Number, { logErrors: true }),
};
export const DEFAULT_ZOOM = getEnvValue('VITE_MAP_DEFAULT_ZOOM', 11, Number, { logErrors: true });

// Google Maps APIの状態確認
export function checkGoogleMapsLoaded(): boolean {
  return typeof google !== 'undefined' && typeof google.maps.MapTypeId !== 'undefined';
}

// マップタイプID取得
export function getMapTypeId(typeId: string): google.maps.MapTypeId | string {
  if (!checkGoogleMapsLoaded()) return typeId;

  switch (typeId.toLowerCase()) {
    case 'roadmap': return google.maps.MapTypeId.ROADMAP;
    case 'satellite': return google.maps.MapTypeId.SATELLITE;
    case 'hybrid': return google.maps.MapTypeId.HYBRID;
    case 'terrain': return google.maps.MapTypeId.TERRAIN;
    default: return google.maps.MapTypeId.ROADMAP;
  }
}

// マップ表示モード
export const MAP_DISPLAY_MODES: MapDisplayModes = {
  [MapDisplayMode.STANDARD]: {
    get mapTypeId() { return getMapTypeId('roadmap'); },
    styles: [],
  },
  [MapDisplayMode.SATELLITE]: {
    get mapTypeId() { return getMapTypeId('satellite'); },
    styles: [],
  },
  [MapDisplayMode.ACCESSIBLE]: {
    get mapTypeId() { return getMapTypeId('roadmap'); },
    styles: [
      {
        featureType: 'all',
        elementType: 'all',
        stylers: [{ visibility: 'simplified' }, { saturation: -100 }, { contrast: 1.2 }],
      },
    ],
  },
  [MapDisplayMode.NIGHT]: {
    get mapTypeId() { return getMapTypeId('roadmap'); },
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
  },
};

// マップスタイル
const MAP_STYLE: MapConfig['style'] = {
  width: '100%',
  height: '100%',
};

// モバイル用オプション
const MOBILE_MAP_OPTIONS: Partial<ExtendedMapOptions> = {
  zoomControl: false,
  streetViewControl: false,
  fullscreenControl: false,
  mapTypeControl: false,
};

// デフォルトマップオプション
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

// マップオプション生成
function createMapOptions(): ExtendedMapOptions {
  if (!checkGoogleMapsLoaded()) return DEFAULT_MAP_OPTIONS;

  return {
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
    gestureHandling: 'greedy',
    clickableIcons: false,
    cameraControl: true,
    cameraControlOptions: {
      position: ControlPosition.RIGHT_BOTTOM,
    },
    disableDefaultUI: false,
    backgroundColor: '#f2f2f2',
    mapId: GOOGLE_MAPS_MAP_ID,
  };
}

// エリア境界データ
const AREA_BOUNDS: Record<string, google.maps.LatLngBoundsLiteral> = {
  ryotsu: {
    north: 38.5, south: 38.0, east: 139.0, west: 138.5,
  },
  aikawa: {
    north: 38.3, south: 37.9, east: 138.4, west: 138.0,
  },
  default: {
    north: DEFAULT_CENTER.lat + 0.5,
    south: DEFAULT_CENTER.lat - 0.5,
    east: DEFAULT_CENTER.lng + 0.5,
    west: DEFAULT_CENTER.lng - 0.5,
  },
};

// マップ設定
export const MAPS_CONFIG: MapConfig = {
  apiKey: GOOGLE_MAPS_API_KEY,
  mapId: GOOGLE_MAPS_MAP_ID,
  defaultCenter: DEFAULT_CENTER,
  defaultZoom: DEFAULT_ZOOM,
  libraries: USED_LIBRARIES,
  language: 'ja',
  version: 'quarterly',
  style: MAP_STYLE,
  get options() { return createMapOptions(); },
  mobileOptions: MOBILE_MAP_OPTIONS,
  boundsPadding: 50,
  clusteringThreshold: 100,
  defaultInfoWindowMaxWidth: 300,
};

// マップコンテナスタイル
export const MAP_CONTAINER_STYLE: MapStyle = {
  width: '100%',
  height: '100vh',
  maxHeight: '100%',
  additionalStyles: {
    position: 'relative',
    overflow: 'hidden',
  },
};

// モバイル用マップコンテナスタイル
export const MOBILE_MAP_CONTAINER_STYLE: MapStyle = {
  ...MAP_CONTAINER_STYLE,
  height: 'calc(100vh - 56px)', // モバイルのナビゲーションバー考慮
  additionalStyles: {
    ...MAP_CONTAINER_STYLE.additionalStyles,
  },
};

// エリア境界取得
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
    const defaultBounds = AREA_BOUNDS.default;
    return new google.maps.LatLngBounds(
      { lat: defaultBounds.south, lng: defaultBounds.west },
      { lat: defaultBounds.north, lng: defaultBounds.east },
    );
  }
}

// マップ表示モード取得
export function getMapDisplayMode(modeName: string): MapDisplayModeOptions {
  const mode = Object.values(MapDisplayMode).find((mode) => mode === modeName);
  return mode ? MAP_DISPLAY_MODES[mode] : MAP_DISPLAY_MODES[MapDisplayMode.STANDARD];
}