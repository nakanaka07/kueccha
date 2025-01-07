import { LoadScriptProps } from '@react-google-maps/api';
import { ReactNode, CSSProperties } from 'react';
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
    styles: google.maps.MapTypeStyle[];
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
  style?: CSSProperties;
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
  areaCounts: Record<AreaType, number>;
  areaVisibility: Record<AreaType, boolean>;
  onAreaToggle: (area: AreaType, visible: boolean) => void;
  onAreaClick: () => void;
}

export interface LoadingFallbackProps extends BaseProps {
  isLoading: boolean;
  message?: string;
  spinnerClassName?: string;
}

export interface ErrorBoundaryProps extends BaseProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export const ERROR_MESSAGES = {
  MAP: {
    LOAD_FAILED:
      'マップの読み込みに失敗しました。インターネット接続を確認し、ページを再読み込みしてください。',
    RETRY_MESSAGE: 'しばらく経ってから再度お試しください。',
  },
  DATA: {
    FETCH_FAILED: 'データの取得に失敗しました。インターネット接続を確認し、再試行してください。',
    LOADING_FAILED: 'データの読み込みに失敗しました。ページを再読み込みしてください。',
  },
  CONFIG: {
    MISSING: '必要な設定が不足しています。設定を確認してください。',
    INVALID: '設定が正しくありません。設定を確認してください。',
  },
  SYSTEM: {
    UNKNOWN: '予期せぬエラーが発生しました。ページを再読み込みしてください。',
    CONTAINER_NOT_FOUND: 'コンテナ要素が見つかりません。ページの構造を確認してください。',
  },
  LOADING: {
    MAP: 'マップを読み込んでいます...',
    DATA: 'データを読み込んでいます...',
  },
} as const;
