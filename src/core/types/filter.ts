import React from 'react';
import { BaseProps, AreaVisibility, LatLngLiteral } from './common';
import { PoiManagementProps, Poi } from './poi';

/**
 * @deprecated AreaFilteringPropsを使用してください
 */
export interface AreaVisibilityProps {
  setAreaVisibility: React.Dispatch<React.SetStateAction<AreaVisibility>>;
  localAreaVisibility: AreaVisibility;
  setLocalAreaVisibility: React.Dispatch<React.SetStateAction<AreaVisibility>>;
}

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
