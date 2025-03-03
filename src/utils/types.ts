import { LoadScriptProps } from '@react-google-maps/api';
import { ReactNode } from 'react';
import { AREAS, INFO_WINDOW_BUSINESS_HOURS } from './constants';

export type AreaType = keyof typeof AREAS;
export type AreaVisibility = Record<AreaType, boolean>;
export type BusinessHourKey = (typeof INFO_WINDOW_BUSINESS_HOURS)[number]['key'];
export type Location = LatLngLiteral;
export type MapControlsProps = {
  onResetNorth: () => void;
  onGetCurrentLocation: () => void;
};
export type MenuActionType = {
  handleAreaClick: () => void;
  handleFeedbackClick: () => void;
  toggleSearchBar: () => void;
};

export interface BaseProps {
  className?: string;
  style?: React.CSSProperties;
}

// モーダル系コンポーネントの基本Props
export interface ModalBaseProps extends BaseProps {
  onClose: () => void;
}

// フィードバックフォームと位置情報警告に共通のProps型 - ESLintエラー修正
export interface FeedbackFormProps extends ModalBaseProps {
  templateParams?: Record<string, unknown>; // メールテンプレート用パラメータ
}

export interface LocationWarningProps extends ModalBaseProps {
  onAllowLocation?: () => void; // 位置情報アクセス許可時の処理
}

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

export interface ErrorBoundaryProps extends BaseProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: {
    componentStack: string;
  } | null;
}

// LoadingFallback専用のProps
export interface LoadingFallbackProps extends BaseProps {
  isLoading?: boolean;
  isLoaded?: boolean;
  message?: string;
  spinnerClassName?: string;
  fadeDuration?: number;
  variant?: 'spinner' | 'skeleton' | 'progress';
  isFading?: boolean;
}

export interface AreaVisibilityProps {
  setAreaVisibility: React.Dispatch<React.SetStateAction<Record<AreaType, boolean>>>;
  localAreaVisibility: Record<AreaType, boolean>;
  setLocalAreaVisibility: React.Dispatch<React.SetStateAction<Record<AreaType, boolean>>>;
}

// 位置情報管理用のProps基底
export interface LocationManagementProps {
  currentLocation: LatLngLiteral | null;
  setCurrentLocation: React.Dispatch<React.SetStateAction<LatLngLiteral | null>>;
  setShowWarning: React.Dispatch<React.SetStateAction<boolean>>;
}

// POI管理用のProps基底
export interface PoiManagementProps {
  pois: Poi[];
  setSelectedPoi: React.Dispatch<React.SetStateAction<Poi | null>>;
}

// FilterPanelとHamburgerMenuの共通Props
export interface BaseFilterProps extends BaseProps, AreaVisibilityProps, LocationManagementProps, PoiManagementProps {}

// FilterPanel固有のProps
export interface FilterPanelProps extends BaseFilterProps {
  isFilterPanelOpen: boolean;
  onCloseClick: () => void;
}

// HamburgerMenu固有のProps
export interface HamburgerMenuProps extends BaseFilterProps {
  search: (query: string) => void;
  searchResults: Poi[];
  handleSearchResultClick: (poi: Poi) => void;
}

export interface InfoWindowProps extends BaseProps {
  poi: Poi;
  onCloseClick: () => void;
}

export interface LatLngLiteral {
  lat: number;
  lng: number;
}

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
    mapTypeId?: string; // APP.config.maps.optionsに合わせて追加
    disableDefaultUI?: boolean;
    disableDoubleClickZoom?: boolean; // APP.config.maps.optionsに合わせて追加
    scrollwheel?: boolean; // APP.config.maps.optionsに合わせて追加
    zoomControl?: boolean;
    mapTypeControl?: boolean;
    streetViewControl?: boolean;
    fullscreenControl?: boolean;
    clickableIcons?: boolean;
    gestureHandling?: string;
    fullscreenControlOptions?: {
      // APP.config.maps.optionsに合わせて追加
      position: number;
    };
    zoomControlOptions?: {
      // APP.config.maps.optionsに合わせて追加
      position: number;
    };
    streetViewControlOptions?: {
      // APP.config.maps.optionsに合わせて追加
      position: number;
    };
    cameraControl?: boolean; // APP.config.maps.optionsに合わせて追加
    cameraControlOptions?: {
      // APP.config.maps.optionsに合わせて追加
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

// マップ関連のProps統合
export interface MapBaseProps extends BaseProps {
  onLoad?: (map: google.maps.Map) => void;
}

export interface ExtendedMapProps extends MapBaseProps {
  pois?: Poi[];
  selectedPoi?: Poi | null;
  onMarkerClick?: (poi: Poi) => void;
}

// シンプルなMapPropsの定義
export interface MapProps extends BaseProps {
  pois: Poi[];
}

export interface MarkerProps extends BaseProps {
  poi: Poi;
  onClick: (poi: Poi) => void;
  map: google.maps.Map | null;
}

export interface MenuItem {
  label: string;
  title: string;
  action: keyof MenuActionType;
}

export interface Poi {
  id: string;
  name: string;
  location: LatLngLiteral;
  area: AreaType;
  genre: string;
  category: string;
  parking?: string;
  payment?: string;
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
  [key: string]: string | LatLngLiteral | AreaType | undefined;
}

export interface SearchBarProps extends BaseProps {
  onSearch: (query: string) => void;
  pois: Poi[];
}

export interface SearchResultsProps extends BaseProps {
  results: Poi[];
  onResultClick: (poi: Poi) => void;
}

export interface TemplateParams {
  [key: string]: unknown;
  name: string;
  email: string;
  message: string;
}

export interface MapErrorProps {
  message: string;
  details?: string;
  onRetry?: () => void;
}

export interface AppError {
  message: string;
  code?: string;
  details?: string;
}

export interface GeolocationError {
  code: number;
  message: string;
  details?: string;
}
