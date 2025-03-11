import { Poi, LatLngLiteral } from '@core/types/poi';
import { BaseProps } from '@core/types/common';

export interface SearchBarProps extends BaseProps {
  onSearch: (query: string) => void;
  pois: Poi[];
}

export interface SearchResultsProps extends BaseProps {
  results: Poi[];
  onResultClick: (poi: Poi) => void;
}

export interface SearchOptions {
  fields?: Array<keyof Poi>;
  mode?: 'AND' | 'OR';
  currentLocation?: LatLngLiteral | null;
  sortBy?: 'name' | 'area' | 'distance' | null;
  limit?: number | null;
}
