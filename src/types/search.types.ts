/**
 * 検索機能に関する型定義
 * - 検索バーコンポーネントのプロパティ
 * - 検索結果表示のプロパティ
 * - 検索オプション（フィールド、モード、ソート順など）
 */
import { Poi } from './poi.types';
import { BaseProps, LatLngLiteral } from './common.types';
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
