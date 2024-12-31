import { Library } from '@googlemaps/js-api-loader';
import { AREAS, MARKER_COLORS } from './constants';

export type AreaType = keyof typeof AREAS;
export type MarkerColorType = keyof typeof MARKER_COLORS;

export interface Location {
  lat: number;
  lng: number;
}

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
  libraries: Library[];
  language: string;
  version: string;
  style: MapStyle;
}

export interface Poi {
  id: string;
  name: string;
  area: AreaType;
  location: Location;
  category?: string;
  genre?: string;
  description?: string;
  payment?: string;
  phone?: string;
  address?: string;
  monday?: string;
  tuesday?: string;
  wednesday?: string;
  thursday?: string;
  friday?: string;
  saturday?: string;
  sunday?: string;
  holiday?: string;
}
