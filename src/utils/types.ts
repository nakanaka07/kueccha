import { LoadScriptProps } from '@react-google-maps/api';
import { ReactNode } from 'react';
import { AREAS, BUSINESS_HOURS } from './constants';

// AREASのキーを表す型
export type AreaType = keyof typeof AREAS;

// 共通のプロパティを持つ基本的なプロパティ型
export interface BaseProps {
  className?: string;
  style?: React.CSSProperties;
}

// BUSINESS_HOURSのキーを表す型
export type BusinessHourKey = (typeof BUSINESS_HOURS)[number]['key'];

// アプリケーションの設定を表す型
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

// エラーバウンダリのプロパティ型
export interface ErrorBoundaryProps extends BaseProps {
  children: ReactNode;
  fallback?: ReactNode;
}

// エラーバウンダリの状態型
export interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: {
    componentStack: string;
  } | null;
}

// フィルターパネルのプロパティ型
export interface FilterPanelProps extends BaseProps {
  pois: Poi[];
  setSelectedPoi: React.Dispatch<React.SetStateAction<Poi | null>>;
  setAreaVisibility: React.Dispatch<
    React.SetStateAction<Record<AreaType, boolean>>
  >;
  isFilterPanelOpen: boolean;
  onCloseClick: () => void;
  localAreaVisibility: Record<AreaType, boolean>;
  setLocalAreaVisibility: React.Dispatch<
    React.SetStateAction<Record<AreaType, boolean>>
  >;
  currentLocation: LatLngLiteral | null;
  setCurrentLocation: React.Dispatch<
    React.SetStateAction<LatLngLiteral | null>
  >;
  setShowWarning: React.Dispatch<React.SetStateAction<boolean>>;
}

// 情報ウィンドウのプロパティ型
export interface InfoWindowProps extends BaseProps {
  poi: Poi;
  onCloseClick: () => void;
}

// 緯度経度を表す型
export interface LatLngLiteral {
  lat: number;
  lng: number;
}

// ロケーションを表す型
export type Location = LatLngLiteral;

// ローディング中のフォールバックプロパティ型
export interface LoadingFallbackProps extends BaseProps {
  isLoading: boolean;
  message?: string;
  spinnerClassName?: string;
  isLoaded: boolean;
}

// マップの設定を表す型
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
    mapId?: string;
    disableDefaultUI: boolean;
    zoomControl: boolean;
    mapTypeControl: boolean;
    streetViewControl: boolean;
    fullscreenControl: boolean;
    clickableIcons: boolean;
    mapTypeControlOptions?: {
      style: number;
      position: number;
    };
    styles?: google.maps.MapTypeStyle[];
  };
}

// マップのプロパティ型
export interface MapProps extends BaseProps {
  pois: Poi[];
}

// マップのスタイルを表す型
export interface MapStyle {
  width: string;
  height: string;
}

// マーカーのプロパティ型
export interface MarkerProps extends BaseProps {
  poi: Poi;
  onClick: (poi: Poi) => void;
  map: google.maps.Map | null;
}

// POI（ポイントオブインタレスト）を表す型
export interface Poi {
  id: string;
  name: string;
  location: LatLngLiteral;
  area: AreaType;
  category: string;
  genre: string;
  monday?: string;
  tuesday?: string;
  wednesday?: string;
  thursday?: string;
  friday?: string;
  saturday?: string;
  sunday?: string;
  holiday?: string;
  holidayInfo?: string;
  information?: string;
  view?: string;
  phone?: string;
  address?: string;
  parking?: string;
  payment?: string;
  [key: string]: string | LatLngLiteral | AreaType | undefined;
}

// サーチバーのプロパティ型
export interface SearchBarProps extends BaseProps {
  onSearch: (query: string) => void;
  pois: Poi[];
}

// マップコンポーネントのプロパティ型
export interface MapComponentProps extends MapProps {
  selectedPoi: Poi | null;
  setSelectedPoi: React.Dispatch<React.SetStateAction<Poi | null>>;
  areaVisibility: Record<AreaType, boolean>;
  onLoad: (mapInstance: google.maps.Map) => void;
  setAreaVisibility: React.Dispatch<
    React.SetStateAction<Record<AreaType, boolean>>
  >;
  currentLocation: LatLngLiteral | null;
  setCurrentLocation: React.Dispatch<
    React.SetStateAction<LatLngLiteral | null>
  >;
  showWarning: boolean;
  setShowWarning: React.Dispatch<React.SetStateAction<boolean>>;
}

// ロケーション警告のプロパティ型
export interface LocationWarningProps extends BaseProps {
  onClose: () => void;
}

// ハンバーガーメニューのプロパティ型
export interface HamburgerMenuProps extends BaseProps {
  pois: Poi[];
  setSelectedPoi: React.Dispatch<React.SetStateAction<Poi | null>>;
  setAreaVisibility: React.Dispatch<
    React.SetStateAction<Record<AreaType, boolean>>
  >;
  localAreaVisibility: Record<AreaType, boolean>;
  setLocalAreaVisibility: React.Dispatch<
    React.SetStateAction<Record<AreaType, boolean>>
  >;
  currentLocation: LatLngLiteral | null;
  setCurrentLocation: React.Dispatch<
    React.SetStateAction<LatLngLiteral | null>
  >;
  setShowWarning: React.Dispatch<React.SetStateAction<boolean>>;
  search: (query: string) => void;
  searchResults: Poi[];
  handleSearchResultClick: (poi: Poi) => void;
}

// メニューアクションの型
export type MenuActionType = {
  handleAreaClick: () => void;
  handleFeedbackClick: () => void;
  toggleSearchBar: () => void;
};

// メニューアイテムの型
export interface MenuItem {
  label: string;
  title: string;
  action: keyof MenuActionType;
}

// フィードバックフォームのプロパティ型
export interface FeedbackFormProps extends BaseProps {
  onClose: () => void;
}

// テンプレートパラメータの型
export interface TemplateParams {
  [key: string]: unknown;
  name: string;
  email: string;
  message: string;
}
