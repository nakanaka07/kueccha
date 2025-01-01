import { LoadScriptProps } from '@react-google-maps/api';
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
  };
}
