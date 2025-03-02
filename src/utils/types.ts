import { LoadScriptProps } from '@react-google-maps/api';
import { ReactNode } from 'react';
import { AREAS, INFO_WINDOW_BUSINESS_HOURS } from './constants';

export type AreaType = keyof typeof AREAS;
export type AreaVisibility = Record<AreaType, boolean>;
export type BusinessHourKey = (typeof INFO_WINDOW_BUSINESS_HOURS)[number]['key'];
export type Location = LatLngLiteral;
export type MapErrorProps = {
  message: string;
  onRetry: () => void;
};
export type MapControlsProps = {
  onResetNorth: () => void;
  onGetCurrentLocation: () => void;
  onFitMarkers: () => void;
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

export interface FeedbackFormProps extends BaseProps {
  onClose: () => void;
}

export interface FilterPanelProps extends BaseProps {
  pois: Poi[];
  setSelectedPoi: React.Dispatch<React.SetStateAction<Poi | null>>;
  setAreaVisibility: React.Dispatch<React.SetStateAction<Record<AreaType, boolean>>>;
  isFilterPanelOpen: boolean;
  onCloseClick: () => void;
  localAreaVisibility: Record<AreaType, boolean>;
  setLocalAreaVisibility: React.Dispatch<React.SetStateAction<Record<AreaType, boolean>>>;
  currentLocation: LatLngLiteral | null;
  setCurrentLocation: React.Dispatch<React.SetStateAction<LatLngLiteral | null>>;
  setShowWarning: React.Dispatch<React.SetStateAction<boolean>>;
}

export interface HamburgerMenuProps extends BaseProps {
  pois: Poi[];
  setSelectedPoi: React.Dispatch<React.SetStateAction<Poi | null>>;
  setAreaVisibility: React.Dispatch<React.SetStateAction<Record<AreaType, boolean>>>;
  localAreaVisibility: Record<AreaType, boolean>;
  setLocalAreaVisibility: React.Dispatch<React.SetStateAction<Record<AreaType, boolean>>>;
  currentLocation: LatLngLiteral | null;
  setCurrentLocation: React.Dispatch<React.SetStateAction<LatLngLiteral | null>>;
  setShowWarning: React.Dispatch<React.SetStateAction<boolean>>;
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

export interface LocationWarningProps extends BaseProps {
  onClose: () => void;
}

export interface LoadingFallbackProps extends BaseProps {
  isLoading?: boolean;
  isLoaded?: boolean;
  message?: string;
  spinnerClassName?: string;
  fadeDuration?: number;
  variant?: 'spinner' | 'skeleton' | 'progress';
  isFading?: boolean;
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
  options: {
    mapId?: string;
    disableDefaultUI?: boolean;
    zoomControl?: boolean;
    mapTypeControl?: boolean;
    streetViewControl?: boolean;
    fullscreenControl?: boolean;
    clickableIcons?: boolean;
    gestureHandling?: string;
    mapTypeControlOptions?: {
      style?: number;
      position?: number;
      mapTypeIds?: string[];
    };
    [key: string]: unknown;
  };
}

export interface MapProps extends BaseProps {
  pois: Poi[];
}

export interface MapComponentProps {
  onLoad: (map: google.maps.Map) => void;
}

export interface MapStyle {
  width: string;
  height: string;
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
