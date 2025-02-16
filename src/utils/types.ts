import { LoadScriptProps } from '@react-google-maps/api';
import { ErrorInfo } from 'react';
import { AREAS, BUSINESS_HOURS } from './constants';

export type AreaType = keyof typeof AREAS;

export interface BaseProps {
  className?: string;
  style?: React.CSSProperties;
}

export type BusinessHourKey = (typeof BUSINESS_HOURS)[number]['key'];

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

export interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

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

export interface InfoWindowProps extends BaseProps {
  poi: Poi;
  onCloseClick: () => void;
}

export interface LatLngLiteral {
  lat: number;
  lng: number;
}

export type Location = LatLngLiteral;

export interface LoadingFallbackProps extends BaseProps {
  isLoading: boolean;
  message?: string;
  spinnerClassName?: string;
  isLoaded: boolean;
}

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
    styles?: google.maps.MapTypeStyle[];
  };
}

export interface MapProps extends BaseProps {
  pois: Poi[];
}

export interface MapStyle {
  width: string;
  height: string;
  disableDefaultUI: boolean;
  clickableIcons: boolean;
}

export interface MarkerProps extends BaseProps {
  poi: Poi;
  onClick: (poi: Poi) => void;
  map: google.maps.Map | null;
}

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

export interface SearchBarProps {
  onSearch: (query: string) => void;
  pois: Poi[];
}

export interface MapComponentProps extends MapProps {
  selectedPoi: Poi | null;
  setSelectedPoi: React.Dispatch<React.SetStateAction<Poi | null>>;
  areaVisibility: Record<AreaType, boolean>;
  onLoad: () => void;
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

export interface LocationWarningProps {
  onClose: () => void;
}

export interface HamburgerMenuProps {
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

export type MenuActionType = {
  handleAreaClick: () => void;
  handleFeedbackClick: () => void;
  toggleSearchBar: () => void;
};

export interface MenuItem {
  label: string;
  title: string;
  action: keyof MenuActionType;
}

export interface FeedbackFormProps {
  onClose: () => void;
}

export interface TemplateParams {
  [key: string]: unknown;
  name: string;
  email: string;
  message: string;
}
