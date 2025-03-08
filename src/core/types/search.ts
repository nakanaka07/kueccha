/**
 * 機能: 検索機能に関する型定義
 * 依存関係:
 *   - common.ts (BaseProps型を使用)
 *   - poi.ts (Poi型とLatLngLiteral型を使用)
 * 注意点:
 *   - SearchOptions型は検索ロジックの動作に直接影響する
 *   - フィールド指定検索や並べ替えなどの拡張機能をサポート
 */
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
