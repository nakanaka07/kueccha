/**
 * 配列操作関連のユーティリティ関数
 *
 * POIデータや検索結果など、配列データの処理に便利な関数を提供します。
 */

import { calculateDistance } from './geo.utils';

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
 */
export function chunk<T>(array: T[], size: number): T[][] {
  if (!array.length || size <= 0) return [];

  return Array.from({ length: Math.ceil(array.length / size) }, (_, index) =>
    array.slice(index * size, (index + 1) * size),
  );
}

/**
 * 配列をシャッフル（ランダムに並べ替え）する
 *
 * @param array シャッフルする配列
 * @returns シャッフルされた新しい配列
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
 * 配列からランダムに要素を取得する
 *
 * @param array 元の配列
 * @param count 取得する要素数（デフォルト: 1）
 * @returns ランダムに選択された要素の配列
 */
export function sample<T>(array: T[], count: number = 1): T[] {
  if (!array.length || count <= 0) return [];
  if (count >= array.length) return shuffle(array);

  const shuffled = shuffle(array);
  return shuffled.slice(0, count);
}

/**
 * 配列をキーによってグループ化する
 *
 * @param array グループ化する配列
 * @param getKey グループ化キーを取得する関数
 * @returns キーごとにグループ化されたオブジェクト
 */
export function groupBy<T, K extends string | number | symbol>(
  array: T[],
  getKey: (item: T) => K,
): Record<K, T[]> {
  if (!array.length) return {} as Record<K, T[]>;

  return array.reduce(
    (result, item) => {
      const key = getKey(item);

      if (!result[key]) {
        result[key] = [];
      }

      result[key].push(item);
      return result;
    },
    {} as Record<K, T[]>,
  );
}

/**
 * 数値の配列から統計値を計算する
 * 
 * @param array 対象の数値配列
 * @returns 統計情報（合計、平均、最大、最小）
 */
export function stats(array: number[]): { sum: number; avg: number; max?: number; min?: number } {
  if (!array.length) return { sum: 0, avg: 0 };
  
  const sum = array.reduce((total, current) => total + current, 0);
  return {
    sum,
    avg: sum / array.length,
    max: Math.max(...array),
    min: Math.min(...array)
  };
}

// ============================================================================
// POI特化ユーティリティ
// ============================================================================

/**
 * 汎用的なソート関数
 * 
 * @param array ソートする配列
 * @param getKey ソートキーを取得する関数
 * @param direction ソート方向
 * @returns ソートされた配列
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
 * POIを特定の座標からの距離順にソートする
 *
 * @param pois ソートするPOI配列
 * @param center 距離を計算する中心座標
 * @param direction ソート方向（'asc'または'desc'）
 * @returns ソートされたPOI配列
 */
export function sortByDistance(
  pois: Poi[],
  center: LatLngLiteral,
  direction: 'asc' | 'desc' = 'asc',
): Poi[] {
  if (!pois.length || !center) return [];

  return sortBy(
    pois,
    (poi) => poi.location ? calculateDistance(center, poi.location) : Infinity,
    direction
  );
}

/**
 * テキスト検索条件でPOIをフィルタリングする
 *
 * @param pois フィルタリングするPOI配列
 * @param searchText 検索テキスト
 * @param fields 検索対象のフィールド
 * @returns フィルタリングされたPOI配列
 */
export function searchPois(
  pois: Poi[],
  searchText: string,
  fields: Array<keyof Poi> = ['name', 'genre', 'category', 'area', 'address'],
): Poi[] {
  if (!pois.length) return [];
  if (!searchText) return pois;

  const normalizedText = searchText.toLowerCase().trim();

  return pois.filter((poi) => {
    return fields.some((field) => {
      const value = poi[field];
      if (value === undefined || value === null) return false;
      return String(value).toLowerCase().includes(normalizedText);
    });
  });
}

/**
 * 類似度スコア付きの検索結果を返す
 *
 * @param pois 検索対象のPOI配列
 * @param searchText 検索テキスト
 * @param fields 検索対象のフィールド
 * @returns スコア付き検索結果の配列
 */
export function searchWithScore(
  pois: Poi[],
  searchText: string,
  fields: Array<keyof Poi> = ['name', 'genre', 'category'],
): Array<{ poi: Poi; score: number }> {
  if (!pois.length) return [];
  if (!searchText) return pois.map((poi) => ({ poi, score: 1 }));

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
}