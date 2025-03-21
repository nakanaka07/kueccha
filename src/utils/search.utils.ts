/**
 * 検索関連のユーティリティ関数
 *
 * 検索パラメータの作成、変換、フィルタリングなど、
 * 検索機能に関連するヘルパー関数を提供します。
 */

import type { SearchFilterCriteria, SearchParams, PoiSearchParams } from '../types/search.types';

/**
 * 検索フィルター条件をPoiSearchParamsに変換する
 *
 * @param criteria フィルター条件
 * @param baseParams 基本検索パラメータ（オプション）
 * @returns POI検索パラメータ
 *
 * @example
 * // 基本的な検索パラメータを生成
 * const params = createSearchParams({
 *   includeAreas: ['RYOTSU_AIKAWA'],
 *   genres: ['restaurant', 'cafe'],
 *   keywords: ['ラーメン', '人気']
 * });
 */
export function createSearchParams(
  criteria: SearchFilterCriteria,
  baseParams: Partial<SearchParams> = {},
): PoiSearchParams {
  return {
    ...baseParams,
    query: criteria.keywords?.join(' ') || baseParams.query,
    area: criteria.includeAreas,
    genre: criteria.genres,
    maxDistance: criteria.maxDistance,
  };
}
