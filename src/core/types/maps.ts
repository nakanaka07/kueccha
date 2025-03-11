import { LoadScriptProps } from '@react-google-maps/api';
import { BaseProps, LatLngLiteral } from '@core/types/common';
import { Poi } from '@core/types/pois';

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
export interface MapInstance {
  controls?: google.maps.MVCArray<google.maps.MVCObject>[];
  data?: google.maps.Data;
  fitBounds?: (bounds: google.maps.LatLngBounds | google.maps.LatLngBoundsLiteral) => void;
  getBounds?: () => google.maps.LatLngBounds | null;

  initialize?: () => void;
  cleanup?: () => void;
}

export interface MapActions {
  zoomIn?: () => void;
  zoomOut?: () => void;
  panTo?: (lat: number, lng: number) => void;
}
