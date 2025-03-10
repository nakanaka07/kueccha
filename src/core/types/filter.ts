/**
 * 機能: フィルタリングとエリア表示制御に関する型定義
 * 依存関係:
 *   - React
 *   - common.ts (BaseProps, AreaVisibility, LatLngLiteral型を使用)
 *   - poi.ts (PoiManagementProps型を使用)
 * 注意点:
 *   - コンポーネント間でのエリア可視性状態共有のための型を定義
 *   - 位置情報管理のPropsも含む
 *   - FilterPanelとHamburgerMenuの共通基盤を提供
 */
import React from 'react';
import { BaseProps, AreaVisibility, LatLngLiteral } from './common';
import { PoiManagementProps, Poi } from './poi';

export interface AreaVisibilityProps {
  setAreaVisibility: React.Dispatch<React.SetStateAction<AreaVisibility>>;
  localAreaVisibility: AreaVisibility;
  setLocalAreaVisibility: React.Dispatch<React.SetStateAction<AreaVisibility>>;
}

// 位置情報管理用のProps基底
export interface LocationManagementProps {
  currentLocation: LatLngLiteral | null;
  setCurrentLocation: React.Dispatch<React.SetStateAction<LatLngLiteral | null>>;
  setShowWarning: React.Dispatch<React.SetStateAction<boolean>>;
}

// FilterPanelとHamburgerMenuの共通Props
export interface BaseFilterProps extends BaseProps, AreaVisibilityProps, LocationManagementProps, PoiManagementProps {}

// FilterPanel固有のProps
export interface FilterPanelProps extends BaseFilterProps {
  isFilterPanelOpen: boolean;
  onCloseClick: () => void;
}

// HamburgerMenu固有のProps
export interface HamburgerMenuProps extends BaseFilterProps {
  search: (query: string) => void;
  searchResults: Poi[];
  handleSearchResultClick: (poi: Poi) => void;
}
