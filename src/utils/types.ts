import { LoadScriptProps } from '@react-google-maps/api';
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

export interface ErrorBoundaryProps extends BaseProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export interface FilterPanelProps extends BaseProps {
  pois: Poi[];
  setSelectedPoi: (poi: Poi | null) => void;
  setAreaVisibility: (visibility: Record<AreaType, boolean>) => void;
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
}

export interface InfoWindowProps extends BaseProps {
  poi: Poi;
  onCloseClick: () => void;
}

export type LatLngLiteral = {
  lat: number;
  lng: number;
};

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
  location: Location;
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
}
