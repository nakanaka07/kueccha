/**
 * 配列操作関連のユーティリティ関数
 *
 * POIデータや検索結果など、配列データの処理に便利な関数を提供します。
 */

import { calculateDistance } from './geo.utils';
import { createError } from './errors.utils';
import { logError } from './logger';

import type { Poi, LatLngLiteral } from '../types';

// ============================================================================
// 基本配列操作
// ============================================================================

/**
 * 配列から重複を除去する
 *
 * @param array 重複を除去する配列
 * @param getKey 重複判定に使うキーを取得する関数（オプション）
 * @returns 重複が除去された新しい配列
 * @example
 * // 単純な値の配列から重複を除去
 * unique([1, 2, 2, 3, 3, 3]); // [1, 2, 3]
 * 
 * // オブジェクト配列から特定のプロパティに基づいて重複を除去
 * unique(users, user => user.id);
 */
export function unique<T>(array: T[], getKey?: (item: T) => any): T[] {
  if (!array.length) return [];

  if (!getKey) {
    return [...new Set(array)];
  }

  const seen = new Set();
  return array.filter((item) => {
    const key = getKey(item);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/**
 * 配列をチャンク（塊）に分割する
 *
 * @param array 分割する配列
 * @param size チャンクサイズ
 * @returns チャンク配列の配列
 * @example
 * chunk([1, 2, 3, 4, 5], 2); // [[1, 2], [3, 4], [5]]
 */
export function chunk<T>(array: T[], size: number): T[][] {
  if (!array.length || size <= 0) return [];
  
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

/**
 * 配列をシャッフル（ランダムに並べ替え）する
 *
 * @param array シャッフルする配列
 * @returns シャッフルされた新しい配列
 * @example
 * shuffle([1, 2, 3, 4, 5]); // [3, 1, 5, 2, 4] (ランダムな順序)
 */
export function shuffle<T>(array: T[]): T[] {
  if (!array.length) return [];

  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * 配列をキーによってグループ化する
 *
 * @param array グループ化する配列
 * @param getKey グループ化キーを取得する関数
 * @returns キーごとにグループ化されたオブジェクト
 * @example
 * // ユーザーを役割でグループ化
 * groupBy(users, user => user.role); // { admin: [...], user: [...] }
 */
export function groupBy<T, K extends string | number | symbol>(
  array: T[],
  getKey: (item: T) => K,
): Record<K, T[]> {
  if (!array.length) return {} as Record<K, T[]>;

  return array.reduce((groups, item) => {
    const key = getKey(item);
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(item);
    return groups;
  }, {} as Record<K, T[]>);
}

/**
 * 数値の配列から統計値を計算する
 * 
 * @param array 対象の数値配列
 * @returns 統計情報（合計、平均、最大、最小）
 * @example
 * stats([1, 5, 3, 9, 2]); // { sum: 20, avg: 4, max: 9, min: 1 }
 */
export function stats(array: number[]): { sum: number; avg: number; max?: number; min?: number } {
  if (!array.length) {
    return { sum: 0, avg: 0 };
  }

  const sum = array.reduce((a, b) => a + b, 0);
  return {
    sum,
    avg: sum / array.length,
    max: Math.max(...array),
    min: Math.min(...array),
  };
}

// ============================================================================
// 汎用的なソート/フィルタリング
// ============================================================================

/**
 * 汎用的なソート関数
 * 
 * @param array ソートする配列
 * @param getKey ソートキーを取得する関数
 * @param direction ソート方向
 * @returns ソートされた配列のコピー（元の配列は変更されない）
 * @example
 * // 名前でソート
 * sortBy(users, user => user.name);
 * 
 * // 年齢で降順ソート
 * sortBy(users, user => user.age, 'desc');
 */
export function sortBy<T, V>(
  array: T[],
  getKey: (item: T) => V,
  direction: 'asc' | 'desc' = 'asc'
): T[] {
  if (!array.length) return [];
  
  return [...array].sort((a, b) => {
    const keyA = getKey(a);
    const keyB = getKey(b);
    
    let comparison: number;
    if (typeof keyA === 'string' && typeof keyB === 'string') {
      comparison = keyA.localeCompare(keyB);
    } else if (keyA < keyB) {
      comparison = -1;
    } else if (keyA > keyB) {
      comparison = 1;
    } else {
      comparison = 0;
    }
    
    return direction === 'asc' ? comparison : -comparison;
  });
}

/**
 * 配列のフィルタリングと安全な例外処理を行う
 * 
 * @param array フィルタリングする配列
 * @param predicate フィルタリング条件関数
 * @returns フィルタリングされた配列
 * @example
 * // アクティブなユーザーのみを抽出
 * safeFilter(users, user => user.isActive);
 */
export function safeFilter<T>(
  array: T[],
  predicate: (item: T, index: number, array: T[]) => boolean
): T[] {
  if (!array?.length) return [];

  try {
    return array.filter(predicate);
  } catch (error) {
    logError('SYSTEM', 'ARRAY_OPERATION', `配列のフィルタリング中にエラーが発生しました: ${error}`);
    return [];
  }
}

// ============================================================================
// POI特化ユーティリティ
// ============================================================================

/**
 * POIを特定の座標からの距離順にソートする
 *
 * @param pois ソートするPOI配列
 * @param center 距離を計算する中心座標
 * @param direction ソート方向（'asc'または'desc'）
 * @returns ソートされたPOI配列
 * @example
 * // ユーザーの現在地から近い順にPOIをソート
 * sortByDistance(allPois, userLocation);
 */
export function sortByDistance(
  pois: Poi[],
  center: LatLngLiteral,
  direction: 'asc' | 'desc' = 'asc',
): Poi[] {
  if (!pois.length || !center) return [];

  try {
    return sortBy(
      pois,
      (poi) => poi.location ? calculateDistance(center, poi.location) : Infinity,
      direction
    );
  } catch (error) {
    logError('SYSTEM', 'SORT_ERROR', `距離によるソート中にエラーが発生しました: ${error}`);
    return [...pois]; // エラー時は元の配列のコピーを返す
  }
}

/**
 * テキスト検索条件でPOIをフィルタリングする
 *
 * @param pois フィルタリングするPOI配列
 * @param searchText 検索テキスト
 * @param fields 検索対象のフィールド
 * @returns フィルタリングされたPOI配列
 * @example
 * // 名前、ジャンル、カテゴリでPOIを検索
 * searchPois(allPois, 'ラーメン');
 */
export function searchPois(
  pois: Poi[],
  searchText: string,
  fields: Array<keyof Poi> = ['name', 'genre', 'category', 'area', 'address'],
): Poi[] {
  if (!pois.length) return [];
  if (!searchText) return pois;

  try {
    const normalizedText = searchText.toLowerCase().trim();

    return pois.filter((poi) => {
      return fields.some((field) => {
        const value = poi[field];
        if (value === undefined || value === null) return false;
        return String(value).toLowerCase().includes(normalizedText);
      });
    });
  } catch (error) {
    logError('SYSTEM', 'SEARCH_ERROR', `POI検索中にエラーが発生しました: ${error}`);
    return [];
  }
}

/**
 * 検索テキストとの関連度スコア付きでPOIを検索する
 *
 * @param pois 検索対象のPOI配列
 * @param searchText 検索テキスト
 * @param fields 検索対象のフィールド
 * @returns スコア付きのPOI配列
 * @example
 * // 検索テキストとの関連度スコア付きで検索
 * const results = searchWithScore(allPois, 'カフェ');
 * results.forEach(({poi, score}) => console.log(`${poi.name}: ${score}`));
 */
export function searchWithScore(
  pois: Poi[],
  searchText: string,
  fields: Array<keyof Poi> = ['name', 'genre', 'category'],
): Array<{ poi: Poi; score: number }> {
  if (!pois.length) return [];
  if (!searchText) return pois.map((poi) => ({ poi, score: 1 }));

  try {
    const normalizedText = searchText.toLowerCase().trim();
    const results: Array<{ poi: Poi; score: number }> = [];

    for (const poi of pois) {
      let maxScore = 0;

      for (const field of fields) {
        const value = poi[field];
        if (value === undefined || value === null) continue;

        const fieldValue = String(value).toLowerCase();

        // 完全一致は高いスコア
        if (fieldValue === normalizedText) {
          maxScore = Math.max(maxScore, 1.0);
        }
        // 部分一致はスコアを計算
        else if (fieldValue.includes(normalizedText)) {
          const score = normalizedText.length / fieldValue.length;
          maxScore = Math.max(maxScore, score);
        }
      }

      if (maxScore > 0) {
        results.push({ poi, score: maxScore });
      }
    }

    // スコアの高い順にソートして返す
    return results.sort((a, b) => b.score - a.score);
  } catch (error) {
    logError('SYSTEM', 'SEARCH_SCORE_ERROR', `スコア付き検索中にエラーが発生しました: ${error}`);
    return [];
  }
}