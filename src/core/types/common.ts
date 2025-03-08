/**
 * 機能: アプリケーション全体で使用される共通型定義
 * 依存関係:
 *   - React (ReactNode型を使用)
 *   - areas.ts定数ファイル (AREAS定数を使用)
 *   - ui.ts定数ファイル (INFO_WINDOW_BUSINESS_HOURS定数を使用)
 * 注意点:
 *   - 複数のコンポーネントやモジュールから参照される基本型を定義
 *   - 地理座標、エリア情報、設定、エラー処理など多岐にわたる型を含む
 *   - これらの型変更は広範な影響を及ぼす可能性があるため注意が必要
 */
import { ReactNode } from 'react';
import { AREAS } from '../constants/areas';
import { INFO_WINDOW_BUSINESS_HOURS } from '../constants/ui';

// 基本Props型
export interface BaseProps {
  className?: string;
  style?: React.CSSProperties;
}

// 基本座標型
export interface LatLngLiteral {
  lat: number;
  lng: number;
}

// エリア関連型
export type AreaType = keyof typeof AREAS;
export type AreaVisibility = Record<AreaType, boolean>;
export type BusinessHourKey = keyof typeof INFO_WINDOW_BUSINESS_HOURS;

// 設定関連型
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

// エラー関連型
export interface AppError {
  message: string;
  code?: string;
  details?: string;
}

export interface GeolocationError {
  code: number;
  message: string;
  details?: string;
}

// 汎用アクション型
export type MenuActionType = {
  handleAreaClick: () => void;
  handleFeedbackClick: () => void;
  toggleSearchBar: () => void;
};
