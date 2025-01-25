import { LoadScriptProps } from '@react-google-maps/api';
import { AREAS, BUSINESS_HOURS } from './constants';

// 緯度経度を表す型
export type LatLngLiteral = {
  lat: number;
  lng: number;
};

// 位置情報を表す型
export type Location = LatLngLiteral;

// 地図のスタイルを表すインターフェース
export interface MapStyle {
  width: string;
  height: string;
  disableDefaultUI: boolean;
  clickableIcons: boolean;
}

// 地図の設定を表すインターフェース
export interface MapConfig {
  apiKey: string;
  mapId: string;
  defaultCenter: Location;
  defaultZoom: number;
  libraries: LoadScriptProps['libraries'];
  language: string;
  version: string;
  style: MapStyle;
  options: {
    zoomControl: boolean;
    mapTypeControl: boolean;
    streetViewControl: boolean;
    fullscreenControl: boolean;
    styles?: google.maps.MapTypeStyle[]; // stylesをオプショナルにする
  };
}

// 全体の設定を表すインターフェース
export interface Config {
  maps: MapConfig;
  sheets: {
    apiKey: string;
    spreadsheetId: string;
  };
  markers: {
    colors: Record<string, string>;
  };
}

// エリアの種類を表す型
export type AreaType = keyof typeof AREAS;

// 営業時間のキーを表す型
export type BusinessHourKey = (typeof BUSINESS_HOURS)[number]['key'];

// POI（ポイント・オブ・インタレスト）を表すインターフェース
export interface Poi {
  id: string;
  name: string;
  location: Location;
  area: AreaType;
  category: string;
  description?: string;
  businessHours?: string[];
  genre?: string;
  phone?: string;
  address?: string;
  information?: string;
  view?: string;
  reservation?: string;
  payment?: string;
  monday?: string;
  tuesday?: string;
  wednesday?: string;
  thursday?: string;
  friday?: string;
  saturday?: string;
  sunday?: string;
  holiday?: string;
}

// APIレスポンスアイテムを表すインターフェース
export interface ApiResponseItem {
  id: string;
  name: string;
  lat: number;
  lng: number;
  area: string;
  category: string;
  description?: string;
  businessHours?: string[];
  genre?: string;
  phone?: string;
  address?: string;
  information?: string;
  view?: string;
  reservation?: string;
}

// 基本的なプロパティを表すインターフェース
export interface BaseProps {
  className?: string;
  style?: React.CSSProperties;
}

// 地図のプロパティを表すインターフェース
export interface MapProps extends BaseProps {
  pois: Poi[];
}

// インフォウィンドウのプロパティを表すインターフェース
export interface InfoWindowProps extends BaseProps {
  poi: Poi;
  onCloseClick: () => void;
}

// マーカーのプロパティを表すインターフェース
export interface MarkerProps extends BaseProps {
  poi: Poi;
  onClick: (poi: Poi) => void;
  map: google.maps.Map | null;
}

// フィルターパネルのプロパティを表すインターフェース
export interface FilterPanelProps extends BaseProps {
  pois: Poi[];
  setSelectedPoi: (poi: Poi | null) => void;
  setAreaVisibility: (visibility: Record<AreaType, boolean>) => void;
  isFilterPanelOpen: boolean;
  onCloseClick: () => void;
  localAreaVisibility: Record<AreaType, boolean>;
  setLocalAreaVisibility: React.Dispatch<React.SetStateAction<Record<AreaType, boolean>>>;
}

// ローディングフォールバックのプロパティを表すインターフェース
export interface LoadingFallbackProps extends BaseProps {
  isLoading: boolean;
  message?: string;
  spinnerClassName?: string;
  isLoaded: boolean;
}

// エラーバウンダリのプロパティを表すインターフェース
export interface ErrorBoundaryProps extends BaseProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}
