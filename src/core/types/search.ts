import { BaseProps } from './common';
import { Poi, LatLngLiteral } from './poi';

export interface SearchBarProps extends BaseProps {
  onSearch: (query: string) => void;
  pois: Poi[];
}

export interface SearchResultsProps extends BaseProps {
  results: Poi[];
  onResultClick: (poi: Poi) => void;
}

// useSearch.tsから移動させた型定義
export interface SearchOptions {
  fields?: Array<keyof Poi>;
  mode?: 'AND' | 'OR';
  currentLocation?: LatLngLiteral | null;
  sortBy?: 'name' | 'area' | 'distance' | null;
  limit?: number | null;
}
