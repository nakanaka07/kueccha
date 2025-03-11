import { AREAS } from '@/areas';
import { INFO_WINDOW_BUSINESS_HOURS } from '@/ui';

export interface BaseProps {
  className?: string;
  style?: React.CSSProperties;
}

export interface LatLngLiteral {
  lat: number;
  lng: number;
}

export type AreaType = keyof typeof AREAS;
export type AreaVisibility = Record<AreaType, boolean>;
export type BusinessHourKey = (typeof INFO_WINDOW_BUSINESS_HOURS)[number]['key'];

export interface Config {
  maps: {
    apiKey: string;
    mapId: string;
    defaultCenter: LatLngLiteral;
    defaultZoom: number;
    libraries: string[];
    language: string;
    version: string;
    style: {
      width: string;
      height: string;
    };
    geolocation: {
      timeout: number;
      maxAge: number;
      highAccuracy: boolean;
    };
    options: Record<string, unknown>;
  };
  sheets: {
    apiKey: string;
    spreadsheetId: string;
  };
  markers: {
    colors: Record<string, string>;
  };
}

export type MenuActionType = {
  handleAreaClick: () => void;
  handleFeedbackClick: () => void;
  toggleSearchBar: () => void;
};
