/**
 * 機能: Google Maps連携と地図表示に関する型定義
 * 依存関係:
 *   - @react-google-maps/api ライブラリ
 *   - common.ts (BaseProps, LatLngLiteral型を使用)
 *   - poi.ts (Poi型を使用)
 *   - Google Maps API
 * 注意点:
 *   - MapConfig型はGoogle Maps APIの初期化パラメータに直接対応
 *   - 地図スタイルやコントロールのカスタマイズオプションを含む
 *   - 位置情報機能の設定パラメータも定義
 */
import { LoadScriptProps } from '@react-google-maps/api';
import { BaseProps, LatLngLiteral } from './common';
import { Poi } from './poi';

export interface MapConfig {
  apiKey: string;
  mapId: string;
  defaultCenter: LatLngLiteral;
  defaultZoom: number;
  libraries: LoadScriptProps['libraries'];
  language: string;
  version: string;
  style: MapStyle;
  geolocation: {
    timeout: number;
    maxAge: number;
    highAccuracy: boolean;
  };
  options: {
    mapId?: string;
    mapTypeId?: string;
    disableDefaultUI?: boolean;
    disableDoubleClickZoom?: boolean;
    scrollwheel?: boolean;
    zoomControl?: boolean;
    mapTypeControl?: boolean;
    streetViewControl?: boolean;
    fullscreenControl?: boolean;
    clickableIcons?: boolean;
    gestureHandling?: string;
    fullscreenControlOptions?: {
      position: number;
    };
    zoomControlOptions?: {
      position: number;
    };
    streetViewControlOptions?: {
      position: number;
    };
    cameraControl?: boolean;
    cameraControlOptions?: {
      position: number;
    };
    mapTypeControlOptions?: {
      style?: number;
      position?: number;
      mapTypeIds?: string[];
    };
    [key: string]: unknown;
  };
}

export interface MapStyle {
  width: string;
  height: string;
}

export interface MapControlsProps {
  onResetNorth: () => void;
  onGetCurrentLocation: () => void;
}

export interface MapBaseProps extends BaseProps {
  onLoad?: (map: google.maps.Map) => void;
}

export interface ExtendedMapProps extends MapBaseProps {
  pois?: Poi[];
  selectedPoi?: Poi | null;
  onMarkerClick?: (poi: Poi) => void;
}

export interface MapProps extends BaseProps {
  pois: Poi[];
}

export interface MapErrorProps {
  message: string;
  details?: string;
  onRetry?: () => void;
}

/**
 * 地図関連の型定義
 */

// 地図インスタンスの基本インターフェース
export interface MapInstance {
  // Map型の必要なプロパティ
  controls?: google.maps.MVCArray<google.maps.MVCObject>[];
  data?: google.maps.Data;
  fitBounds?: (bounds: google.maps.LatLngBounds | google.maps.LatLngBoundsLiteral) => void;
  getBounds?: () => google.maps.LatLngBounds | null;
  // その他の必要なプロパティ

  // カスタムメソッド
  initialize?: () => void;
  cleanup?: () => void;
}

// 地図操作アクションのインターフェース
export interface MapActions {
  zoomIn?: () => void;
  zoomOut?: () => void;
  panTo?: (lat: number, lng: number) => void;
  // その他のアクション
}
