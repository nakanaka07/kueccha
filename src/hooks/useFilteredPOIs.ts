import { useMemo } from 'react';

import type { PointOfInterest } from '@/types/poi';
// ENV import might be needed if PERFORMANCE_CONFIG was just one usage
// import { ENV } from '@/utils/env';
import { logger, LogLevel } from '@/utils/logger';

/**
 * POIフィルタリングのオプション
 */
export interface FilterOptions {
  /**
   * カテゴリでフィルタリングする場合の対象カテゴリ配列
   * 指定された場合、配列内のいずれかのカテゴリに一致するPOIのみが返される
   */
  categories?: string[];

  /**
   * 営業中のみ表示するかどうか
   * trueの場合、閉店しているPOIや当日が定休日のPOIは除外される
   */
  isOpen?: boolean;

  /**
   * 検索テキスト
   * 名称、ジャンル、住所のいずれかが一致するPOIのみが返される
   */
  searchText?: string;
}

// コンポーネント識別子（ログ出力で使用）
const COMPONENT_NAME = 'useFilteredPOIs';

/**
 * カテゴリフィルタリングのロジック
 * @param poi 対象のPOI
 * @param categories フィルタリング対象のカテゴリ配列
 * @returns 選択されたカテゴリに一致する場合はtrue
 */
const matchesCategory = (poi: PointOfInterest, categories: string[] | undefined): boolean => {
  // カテゴリが未指定または空の場合は全て対象
  if (!categories || categories.length === 0) return true;

  // POIのcategoriesがない場合は一致しない
  if (!poi.categories || poi.categories.length === 0) return false;

  // いずれかのカテゴリが一致すればtrue
  return poi.categories.some(category => categories.includes(category));
};

/**
 * 営業状態フィルタリングのロジック (簡素化・セキュリティ修正)
 * @param poi 対象のPOI
 * @returns 現在営業中であればtrue
 */
const isOpenNow = (poi: PointOfInterest): boolean => {
  // 永久閉店している場合はfalse
  if (poi.isClosed === true) return false;

  // 現在の曜日を取得
  const day = new Date().getDay();

  // switch文で曜日ごとに安全に判定
  switch (day) {
    case 0:
      return !poi['日曜定休日']; // Sunday
    case 1:
      return !poi['月曜定休日']; // Monday
    case 2:
      return !poi['火曜定休日']; // Tuesday
    case 3:
      return !poi['水曜定休日']; // Wednesday
    case 4:
      return !poi['木曜定休日']; // Thursday
    case 5:
      return !poi['金曜定休日']; // Friday
    case 6:
      return !poi['土曜定休日']; // Saturday
    default:
      return true; // 予期しない曜日番号の場合は営業中とみなす
  }
};

/**
 * テキスト検索フィルタリングのロジック (簡素化)
 * @param poi 対象のPOI
 * @param searchText 検索テキスト（正規化済み）
 * @returns 検索テキストが含まれる場合はtrue
 */
const matchesSearchText = (poi: PointOfInterest, searchText: string | undefined): boolean => {
  // 検索テキストがない場合は常にtrue
  if (!searchText) return true;

  // 検索対象テキストをシンプルに連結して小文字に変換
  const searchableText = [
    poi.name,
    poi.genre,
    poi.address,
    poi.searchText, // 既存のsearchTextプロパティも考慮
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase(); // filter(Boolean)でnull/undefined/空文字列を除去

  // 連結したテキストに検索語が含まれるかチェック
  return searchableText.includes(searchText);
};

/**
 * POIのフィルタリングを実行する関数（純粋関数・簡素化）
 */
const filterPOIs = (
  pois: PointOfInterest[],
  filters: FilterOptions,
  normalizedSearchText?: string
): PointOfInterest[] => {
  // 入力データが空の場合は早期リターン
  if (!pois.length) return [];

  // フィルタが何もない場合は元の配列をそのまま返す
  const hasCategoryFilter = filters.categories && filters.categories.length > 0;
  const hasOpenFilter = filters.isOpen === true;
  const hasSearchFilter = Boolean(normalizedSearchText);

  if (!hasCategoryFilter && !hasOpenFilter && !hasSearchFilter) {
    return pois;
  }

  // フィルタリング実行 (短絡評価でシンプルに)
  return pois.filter(poi => {
    try {
      // 早期リターン戦略：コスト低・除外効果高の順に評価
      // 営業中でない場合除外
      if (hasOpenFilter && !isOpenNow(poi)) return false;
      // カテゴリが一致しない場合除外
      if (hasCategoryFilter && !matchesCategory(poi, filters.categories)) return false;
      // 検索テキストが一致しない場合除外
      // normalizedSearchText が undefined でないことを確認してから matchesSearchText を呼び出す
      if (hasSearchFilter && normalizedSearchText && !matchesSearchText(poi, normalizedSearchText))
        return false;

      // 全ての条件をクリアした場合に残す
      return true;
    } catch (error) {
      // エラーログを記録し、問題のあるPOIは除外
      logger.warn(`POI フィルタリングエラー`, {
        component: COMPONENT_NAME,
        action: 'filter_error',
        entityId: poi.id || 'unknown',
        poiName: poi.name || 'unknown',
        error:
          error instanceof Error ? { message: error.message, stack: error.stack } : String(error),
        // エラーコンテキストに必要な情報のみ含める
      });
      return false; // エラーが発生したPOIは結果から除外
    }
  });
};

/**
 * POIデータをフィルタリングするカスタムフック (簡素化・ロギング最適化)
 *
 * 指定された条件に基づいてPOIをフィルタリングし、結果をメモ化して返します。
 *
 * @param pois フィルタリング対象のPOIデータ配列
 * @param filters フィルタリング条件
 * @returns フィルタリングされたPOI配列
 */
export function useFilteredPOIs(
  pois: PointOfInterest[],
  filters: FilterOptions = {}
): PointOfInterest[] {
  // 検索テキストを正規化（メモ化の最適化のため）
  const normalizedSearchText = useMemo(
    // searchTextが存在する場合のみ処理、なければundefined
    () => (filters.searchText ? filters.searchText.toLowerCase().trim() : undefined),
    [filters.searchText]
  );

  // フィルタリング設定の安定した参照を作成 (簡素化)
  const stableFilters = useMemo(
    () => ({
      categories: filters.categories,
      isOpen: filters.isOpen,
      // searchTextはnormalizedSearchTextを使うので不要
    }),
    [filters.categories, filters.isOpen]
  );

  // フィルタリング結果をメモ化
  return useMemo(() => {
    // 基本的なパフォーマンス計測とロギング
    return logger.measureTime(
      'POIフィルタリング処理', // ログラベル
      () => filterPOIs(pois, stableFilters, normalizedSearchText), // 実行する関数
      LogLevel.DEBUG // ログレベル
      // 4番目の引数（ログコンテキスト）を削除
    );
  }, [pois, normalizedSearchText, stableFilters]); // 依存配列
}
