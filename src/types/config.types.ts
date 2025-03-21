/**
 * アプリケーション設定関連の型定義
 * 
 * 設定管理システムで使用される型を体系的に定義します。
 * 環境設定、マップ設定、シート設定など、カテゴリごとに整理されています。
 */

export type EnvironmentName = 'development' | 'production' | 'test';
export type LogLevel = 'error' | 'warn' | 'info' | 'debug';
export type MapTypeId = 
  | google.maps.MapTypeId 
  | 'roadmap' 
  | 'satellite' 
  | 'hybrid' 
  | 'terrain' 
  | string;

/**
 * 環境固有の設定
 */
export interface EnvironmentConfig {
  name: EnvironmentName;
  debug: boolean;
  logLevel: LogLevel;
  cacheEnabled: boolean;
  cacheDuration?: number;
}

/**
 * マップ設定
 */
export interface MapsConfig {
  apiKey: string;
  mapId: string;
  libraries?: string[];
  version?: string;
  language?: string;
  region?: string;
  options: {
    center: { lat: number; lng: number };
    zoom: number;
    mapTypeId: MapTypeId;
    fullscreenControl?: boolean;
    streetViewControl?: boolean;
    zoomControl?: boolean;
    mapTypeControl?: boolean;
    [key: string]: any;
  };
  mobileOptions?: Partial<MapsConfig['options']>;
  boundsPadding?: number;
  clusteringThreshold?: number;
}

/**
 * シート設定
 */
export interface SheetsConfig {
  apiKey: string;
  spreadsheetId: string;
  cacheDuration?: number;
  maxRetries?: number;
  retryDelay?: number;
  sheets?: Array<{
    name: string;
    range: string;
    primaryKey?: string;
    isKeyValue?: boolean;
  }>;
  sheetNames?: {
    pois: string;
    areas: string;
    [key: string]: string;
  };
}

/**
 * マーカー設定
 */
export interface MarkerConfig {
  defaultIcon: string;
  selectedIcon?: string;
  clusterIcon?: string;
  animation?: 'BOUNCE' | 'DROP' | null;
  opacity?: number;
  size?: {
    width: number;
    height: number;
  };
  iconMapping?: Record<string, string>;
}

/**
 * 表示設定
 */
export interface DisplayConfig {
  defaultVisibleAreas: Array<string>;
  markerOptions: {
    defaultOpacity: number;
    selectedAnimation: any;
    defaultSize?: {
      width: number;
      height: number;
    };
    highlight?: {
      zIndex: number;
      opacity: number;
      scale: number;
    };
  };
  mobile?: {
    menuButtonPosition: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
    infoWindowScale: number;
  };
}

/**
 * エラー処理設定
 */
export interface ErrorHandlingConfig {
  retryCount: number;
  retryInterval: number;
  reportErrors: boolean;
  showErrors: boolean;
}

/**
 * アプリケーション情報
 */
export interface AppInfoConfig {
  name: string;
  version: string;
  description: string;
  buildDate: string;
  commitHash?: string;
}

/**
 * 完全なアプリケーション設定
 */
export interface AppConfig {
  app: AppInfoConfig;
  environment: EnvironmentConfig;
  maps: MapsConfig;
  sheets: SheetsConfig;
  markers: MarkerConfig;
  display: DisplayConfig;
  errorHandling: ErrorHandlingConfig;
}

/**
 * 環境変数オプション
 */
export interface EnvValueOptions {
  required?: boolean;
  logErrors?: boolean;
  throwInProduction?: boolean;
}