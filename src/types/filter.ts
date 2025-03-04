import React from 'react';
import { BaseProps, AreaVisibility, LatLngLiteral } from './common';
import { PoiManagementProps } from './poi';

export interface AreaVisibilityProps {
  setAreaVisibility: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  localAreaVisibility: Record<string, boolean>;
  setLocalAreaVisibility: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
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
