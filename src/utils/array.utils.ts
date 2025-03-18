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
 * 配列から特定の要素を削除する
 *
 * @param array 元の配列
 * @param valueOrPredicate 削除する値または条件関数
 * @returns 要素が削除された新しい配列
 */
export function remove<T>(array: T[], valueOrPredicate: T | ((item: T) => boolean)): T[] {
  if (!array.length) return [];

  const predicate =
    typeof valueOrPredicate === 'function'
      ? (valueOrPredicate as (item: T) => boolean)
      : (item: T) => item === valueOrPredicate;

  return array.filter((item) => !predicate(item));
}

// ============================================================================
// POIデータ向け特殊操作
// ============================================================================

/**
 * POIをID順にソートする
 *
 * @param pois ソートするPOI配列
 * @param direction ソート方向（'asc'または'desc'）
 * @returns ソートされたPOI配列
 */
export function sortById<T extends { id: string }>(pois: T[], direction: 'asc' | 'desc' = 'asc'): T[] {
  if (!pois.length) return [];

  return [...pois].sort((a, b) => {
    const comparison = a.id.localeCompare(b.id);
    return direction === 'asc' ? comparison : -comparison;
  });
}

/**
 * POIを名前順にソートする
 *
 * @param pois ソートするPOI配列
 * @param direction ソート方向（'asc'または'desc'）
 * @returns ソートされたPOI配列
 */
export function sortByName<T extends { name: string }>(pois: T[], direction: 'asc' | 'desc' = 'asc'): T[] {
  if (!pois.length) return [];

  return [...pois].sort((a, b) => {
    const comparison = a.name.localeCompare(b.name);
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
export function sortByDistance(pois: Poi[], center: LatLngLiteral, direction: 'asc' | 'desc' = 'asc'): Poi[] {
  if (!pois.length || !center) return [];

  return [...pois].sort((a, b) => {
    if (!a.location || !b.location) return 0;

    const distanceA = calculateDistance(center, a.location);
    const distanceB = calculateDistance(center, b.location);

    const comparison = distanceA - distanceB;
    return direction === 'asc' ? comparison : -comparison;
  });
}

/**
 * POIをジャンル優先度でソートする
 *
 * @param pois ソートするPOI配列
 * @param genrePriorities ジャンル別優先度のマップオブジェクト
 * @param direction ソート方向（'asc'または'desc'）
 * @returns ソートされたPOI配列
 */
export function sortByGenrePriority(
  pois: Poi[],
  genrePriorities: Record<string, number>,
  direction: 'asc' | 'desc' = 'desc',
): Poi[] {
  if (!pois.length) return [];

  return [...pois].sort((a, b) => {
    const priorityA = genrePriorities[a.genre] || 0;
    const priorityB = genrePriorities[b.genre] || 0;

    const comparison = priorityA - priorityB;
    return direction === 'asc' ? comparison : -comparison;
  });
}

// ============================================================================
// グループ化と分類
// ============================================================================

/**
 * 配列をキーによってグループ化する
 *
 * @param array グループ化する配列
 * @param getKey グループ化キーを取得する関数
 * @returns キーごとにグループ化されたオブジェクト
 */
export function groupBy<T, K extends string | number | symbol>(array: T[], getKey: (item: T) => K): Record<K, T[]> {
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
 * POIをエリアによってグループ化する
 *
 * @param pois グループ化するPOI配列
 * @returns エリアごとにグループ化されたオブジェクト
 */
export function groupByArea(pois: Poi[]): Record<string, Poi[]> {
  return groupBy(pois, (poi) => poi.area);
}

/**
 * POIをジャンルによってグループ化する
 *
 * @param pois グループ化するPOI配列
 * @returns ジャンルごとにグループ化されたオブジェクト
 */
export function groupByGenre(pois: Poi[]): Record<string, Poi[]> {
  return groupBy(pois, (poi) => poi.genre);
}

/**
 * 配列をキーによって分類し、結果を変換する
 *
 * @param array 分類する配列
 * @param getKey 分類キーを取得する関数
 * @param transform 各グループを変換する関数
 * @returns 変換後のオブジェクト
 */
export function classify<T, K extends string | number | symbol, R>(
  array: T[],
  getKey: (item: T) => K,
  transform: (items: T[]) => R,
): Record<K, R> {
  if (!array.length) return {} as Record<K, R>;

  const grouped = groupBy(array, getKey);
  const result = {} as Record<K, R>;

  for (const key in grouped) {
    if (Object.prototype.hasOwnProperty.call(grouped, key)) {
      result[key as K] = transform(grouped[key as K]);
    }
  }

  return result;
}

// ============================================================================
// 検索とフィルタリング
// ============================================================================

/**
 * 配列から条件に一致する最初の要素を検索する
 *
 * @param array 検索対象の配列
 * @param predicate 検索条件
 * @returns 見つかった要素、または undefined
 */
export function findFirst<T>(array: T[], predicate: (item: T) => boolean): T | undefined {
  if (!array.length) return undefined;
  return array.find(predicate);
}

/**
 * IDで要素を検索する
 *
 * @param array 検索対象の配列
 * @param id 検索するID
 * @returns 見つかった要素、または undefined
 */
export function findById<T extends { id: string }>(array: T[], id: string): T | undefined {
  if (!array.length || !id) return undefined;
  return findFirst(array, (item) => item.id === id);
}

/**
 * 配列から複数条件でフィルタリングする
 *
 * @param array フィルタリングする配列
 * @param filters 適用するフィルタ関数の配列
 * @returns フィルタリングされた配列
 */
export function multiFilter<T>(array: T[], filters: Array<(item: T) => boolean>): T[] {
  if (!array.length) return [];
  if (!filters.length) return array;

  return array.filter((item) => filters.every((filter) => filter(item)));
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

// ============================================================================
// 変換と集計
// ============================================================================

/**
 * 配列の要素を変換する
 *
 * @param array 変換する配列
 * @param transform 変換関数
 * @returns 変換後の配列
 */
export function map<T, R>(array: T[], transform: (item: T, index: number) => R): R[] {
  if (!array.length) return [];
  return array.map(transform);
}

/**
 * 配列から特定のプロパティだけを抽出する
 *
 * @param array 対象の配列
 * @param property 抽出するプロパティ名
 * @returns プロパティ値の配列
 */
export function pluck<T, K extends keyof T>(array: T[], property: K): T[K][] {
  if (!array.length) return [];
  return array.map((item) => item[property]);
}

/**
 * POIデータを表示用にマッピングする
 *
 * @param pois マッピングするPOI配列
 * @param transformer POIをマッピングする関数
 * @returns マッピングされた表示用データ
 */
export function mapToDisplayData<R>(pois: Poi[], transformer: (poi: Poi) => R): R[] {
  if (!pois.length) return [];
  return pois.map(transformer);
}

/**
 * 数値の配列から合計値を計算する
 *
 * @param array 対象の数値配列
 * @returns 合計値
 */
export function sum(array: number[]): number {
  if (!array.length) return 0;
  return array.reduce((total, current) => total + current, 0);
}

/**
 * 数値の配列から平均値を計算する
 *
 * @param array 対象の数値配列
 * @returns 平均値、または配列が空の場合は0
 */
export function average(array: number[]): number {
  if (!array.length) return 0;
  return sum(array) / array.length;
}

/**
 * 数値の配列から最大値を返す
 *
 * @param array 対象の数値配列
 * @returns 最大値、または配列が空の場合はundefined
 */
export function max(array: number[]): number | undefined {
  if (!array.length) return undefined;
  return Math.max(...array);
}

/**
 * 数値の配列から最小値を返す
 *
 * @param array 対象の数値配列
 * @returns 最小値、または配列が空の場合はundefined
 */
export function min(array: number[]): number | undefined {
  if (!array.length) return undefined;
  return Math.min(...array);
}
