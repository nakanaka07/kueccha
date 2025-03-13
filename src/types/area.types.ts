/**
 * エリア機能に関する型定義
 * - エリアフィルタリングのインターフェース
 * - 位置情報管理のプロパティ
 * - フィルターパネルとメニューコンポーネントの型
 * - エリア表示/非表示の状態管理
 */
import React from 'react';
import { BaseProps, LatLngLiteral, AreaType, AreaVisibility } from './common.types';
import { Poi, PoiManagementProps } from './poi.types';

export interface AreaFilteringProps {
  areaVisibility: AreaVisibility;
  localAreaVisibility: AreaVisibility;
  filteredPois: Poi[];
  areaFilters: {
    areas: Array<{
      area: AreaType;
      name: string;
      count: number;
      isVisible: boolean;
      color: string;
      icon: string;
    }>;
    currentLocationData: {
      isVisible: boolean;
      color: string;
      icon: string;
    };
  };
  handleAreaChange: (area: AreaType, isVisible: boolean) => void;
  commitChanges: () => void;
  discardChanges: () => void;
  showAllAreas: () => void;
  hideAllAreas: () => void;
  resetToDefaults: () => void;
}

export interface LocationManagementProps {
  currentLocation: LatLngLiteral | null;
  setCurrentLocation: React.Dispatch<React.SetStateAction<LatLngLiteral | null>>;
  setShowWarning: React.Dispatch<React.SetStateAction<boolean>>;
}

export interface BaseFilterProps extends BaseProps, AreaVisibilityProps, LocationManagementProps, PoiManagementProps {}

export interface FilterPanelProps extends BaseFilterProps {
  isFilterPanelOpen: boolean;
  onCloseClick: () => void;
}

export interface HamburgerMenuProps extends BaseFilterProps {
  search: (query: string) => void;
  searchResults: Poi[];
  handleSearchResultClick: (poi: Poi) => void;
}
