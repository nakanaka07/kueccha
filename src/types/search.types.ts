/**
 * 検索機能関連の型定義ファイル
 */

import type { AreaFilterParams, SearchParams } from './base.types';
import type { Poi } from './poi.types';
import type { PoiGenre, PoiSearchBaseParams, SearchResultBase } from './poi-common.types';

/**
 * POI検索用パラメータの型
 */
export interface PoiSearchParams extends SearchParams, PoiSearchBaseParams {
  excludeIds?: string[];
  includeIds?: string[];
}

/**
 * 検索結果アイテムの拡張構造
 */
export interface SearchResultItem<T> extends SearchResultBase<T> {}

/**
 * POI検索結果の標準形式
 */
export type PoiSearchResult<T> = SearchResultItem<T>[];

// 検索フィルタリング関連の型定義
// ...

/**
 * 従来の検索結果型定義
 *
 * @deprecated v2.0.0で削除予定。代わりに PoiSearchResult<Poi> を使用してください。
 * @example
 * // 代替使用法:
 * const results: PoiSearchResult<Poi> = searchPois(params);
 */
export type LegacyPoiSearchResult = PoiSearchResult<Poi>;
