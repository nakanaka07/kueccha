import { LoadScriptProps } from '@react-google-maps/api';
import { AREAS, BUSINESS_HOURS } from './constants';

export type LatLngLiteral = {
  lat: number;
  lng: number;
};

export type Location = LatLngLiteral;

export interface MapStyle {
  width: string;
  height: string;
  disableDefaultUI: boolean;
  clickableIcons: boolean;
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
    styles?: google.maps.MapTypeStyle[]; // stylesをオプショナルにする
  };
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

export type AreaType = keyof typeof AREAS;
export type BusinessHourKey = (typeof BUSINESS_HOURS)[number]['key'];

export interface Poi {
  id: string;
  name: string;
  location: {
    lat: number;
    lng: number;
  };
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

export interface BaseProps {
  className?: string;
  style?: React.CSSProperties;
}

export interface MapProps extends BaseProps {
  pois: Poi[];
}

export interface InfoWindowProps extends BaseProps {
  poi: Poi;
  onCloseClick: () => void;
}

export interface MarkerProps extends BaseProps {
  poi: Poi;
  onClick: (poi: Poi) => void;
  map: google.maps.Map | null;
}

export interface FilterPanelProps extends BaseProps {
  pois: Poi[];
  setSelectedPoi: (poi: Poi | null) => void;
  setAreaVisibility: (visibility: Record<AreaType, boolean>) => void;
  isFilterPanelOpen: boolean;
  onClose: () => void; // 追加
}

export interface LoadingFallbackProps extends BaseProps {
  isLoading: boolean;
  message?: string;
  spinnerClassName?: string;
  isLoaded: boolean; // 追加
}

export interface ErrorBoundaryProps extends BaseProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}
