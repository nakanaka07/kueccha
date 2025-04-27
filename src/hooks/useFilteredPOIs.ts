import { useMemo } from 'react';

import type { PointOfInterest } from '@/types/poi';
import { logger, LogLevel } from '@/utils/logger';

/**
 * POIフィルタリングのパフォーマンス設定
 * ロギングとパフォーマンス計測の動作を制御します
 */
const PERFORMANCE_CONFIG = {
  // 詳細なパフォーマンス計測を有効にするかどうか
  ENABLE_DETAILED_METRICS: true,
  // フィルタリング時のログレベル
  LOG_LEVEL: LogLevel.DEBUG,
  // パフォーマンス警告しきい値（ミリ秒）
  SLOW_FILTER_THRESHOLD: 100,
  // POI処理時の詳細ロギングを有効にするかどうか
  ENABLE_POI_DEBUG: false,
};

/**
 * POIフィルタリングのオプション
 * 型安全性の向上と明確なデフォルト値の設定
 */
export interface FilterOptions {
  /**
   * カテゴリでフィルタリングする場合の対象カテゴリ配列
   * 指定された場合、配列内のいずれかのカテゴリに一致するPOIのみが返される
   * デフォルト: 空配列（フィルタリングなし）
   */
  categories?: readonly string[];

  /**
   * 営業中のみ表示するかどうか
   * trueの場合、閉店しているPOIや当日が定休日のPOIは除外される
   * デフォルト: false（すべての営業状態を表示）
   */
  isOpen?: boolean;

  /**
   * 検索テキスト
   * 名称、ジャンル、住所のいずれかが一致するPOIのみが返される
   * デフォルト: undefined（検索フィルタなし）
   *
   * 注意: 内部的に小文字に変換・トリムされて処理されます
   */
  searchText?: string;

  /**
   * フィルタリング処理の詳細ログを出力するかどうか
   * デフォルト: false
   */
  enableDetailedLogging?: boolean;
}

// コンポーネント識別子（ログ出力で使用）
const COMPONENT_NAME = 'useFilteredPOIs';

/**
 * カテゴリフィルタリングのロジック
 * @param poi 対象のPOI
 * @param categories フィルタリング対象のカテゴリ配列（読み取り専用可）
 * @returns 選択されたカテゴリに一致する場合はtrue
 */
const matchesCategory = (
  poi: PointOfInterest,
  categories: readonly string[] | undefined
): boolean => {
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
/**
 * POIのフィルタリングを実行する関数（純粋関数・最適化済み）
 *
 * @param pois フィルタリング対象のPOI配列
 * @param filters フィルタリング条件
 * @param normalizedSearchText 正規化済み検索テキスト
 * @returns フィルタリングされたPOI配列
 */
const filterPOIs = (
  pois: readonly PointOfInterest[],
  filters: {
    categories: readonly string[];
    isOpen: boolean;
  },
  normalizedSearchText?: string
): PointOfInterest[] => {
  // 入力データが空の場合は早期リターン - 型安全性の向上
  if (!pois || !pois.length) return [];

  // フィルタ条件の存在確認を厳密化 - コードの堅牢性向上
  const hasCategoryFilter = filters.categories.length > 0;
  const hasOpenFilter = filters.isOpen === true;
  const hasSearchFilter = Boolean(normalizedSearchText?.trim());

  // 最適化: フィルタ条件が何もない場合は元の配列をコピーして返す
  if (!hasCategoryFilter && !hasOpenFilter && !hasSearchFilter) {
    return [...pois];
  }

  // フィルタリング処理のカウントを記録（詳細なメトリクス用）
  let processedCount = 0;
  let skippedCount = 0;
  let errorCount = 0;

  // フィルタリング実行 (最適化された短絡評価と堅牢なエラー処理)
  const filteredPOIs = pois.filter(poi => {
    processedCount++;

    try {
      // null/undefinedチェック - 型安全性の向上
      if (!poi) {
        skippedCount++;
        return false;
      }

      // 早期リターン戦略：コスト低・除外効果高の順に評価
      // 営業中でない場合除外
      if (hasOpenFilter && !isOpenNow(poi)) return false;

      // カテゴリが一致しない場合除外
      if (hasCategoryFilter && !matchesCategory(poi, filters.categories)) return false;

      // 検索テキストが一致しない場合除外
      if (hasSearchFilter && normalizedSearchText && !matchesSearchText(poi, normalizedSearchText))
        return false;

      // 全ての条件をクリアした場合に残す
      return true;
    } catch (error) {
      // エラーカウント増加
      errorCount++;

      // 改善されたエラーログ - より詳細なコンテキスト情報
      logger.warn(`POIフィルタリングエラー`, {
        component: COMPONENT_NAME,
        action: 'filter_error',
        entityId: poi.id || 'unknown',
        poiName: poi.name || 'unknown',
        poiData: PERFORMANCE_CONFIG.ENABLE_DETAILED_METRICS
          ? {
              // デバッグに役立つ最小限の情報のみ
              hasCategories: Boolean(poi.categories?.length),
              isClosed: poi.isClosed,
              hasSearchableText: Boolean(poi.name || poi.genre || poi.address),
            }
          : undefined,
        error:
          error instanceof Error
            ? {
                name: error.name,
                message: error.message,
                stack: error.stack,
              }
            : String(error),
      });

      return false; // エラーが発生したPOIは結果から除外
    }
  });

  // 詳細メトリクスが有効な場合、フィルタリング統計を記録
  if (PERFORMANCE_CONFIG.ENABLE_DETAILED_METRICS) {
    logger.debug(`POIフィルタリング統計`, {
      component: COMPONENT_NAME,
      totalItems: pois.length,
      filteredItems: filteredPOIs.length,
      processedCount,
      skippedCount,
      errorCount,
      filterCriteria: {
        categories: hasCategoryFilter ? filters.categories.length : 0,
        isOpen: hasOpenFilter,
        hasSearchText: hasSearchFilter,
      },
    });
  }

  return filteredPOIs;
};

/**
 * POIデータをフィルタリングするカスタムフック (最適化済み)
 *
 * 指定された条件に基づいてPOIをフィルタリングし、結果をメモ化して返します。
 * パフォーマンスを最適化するため、必要最小限の再計算のみ行います。
 *
 * @param pois フィルタリング対象のPOIデータ配列
 * @param filters フィルタリング条件
 * @returns フィルタリングされたPOI配列
 */
export function useFilteredPOIs(
  pois: PointOfInterest[] | readonly PointOfInterest[] | undefined,
  filters: FilterOptions = {}
): PointOfInterest[] {
  // 安全な入力値の確保（型安全性の向上）
  const safePois = useMemo(() => (Array.isArray(pois) ? pois : []), [pois]);

  // 検索テキストを正規化（メモ化の最適化のため）
  const normalizedSearchText = useMemo(
    // searchTextが存在する場合のみ処理、なければundefined
    () => {
      const searchText = filters.searchText;
      if (!searchText) return undefined;

      const normalized = searchText.toLowerCase().trim();
      // 空文字列になった場合はundefinedを返す
      return normalized ? normalized : undefined;
    },
    [filters.searchText]
  );
  // フィルタリング設定の安定した参照を作成 (最適化済み)
  const stableFilters = useMemo(
    () => ({
      // カテゴリが存在する場合のみ参照を保持（空配列をデフォルト値として使用）
      categories:
        filters.categories && filters.categories.length > 0
          ? filters.categories
          : ([] as readonly string[]),
      // 明示的にブール値に変換して安定した参照を確保
      isOpen: filters.isOpen === true,
      // detailedLoggingオプションをサポート
      enableDetailedLogging: filters.enableDetailedLogging === true,
    }),
    [filters.categories, filters.isOpen, filters.enableDetailedLogging]
  );
  // フィルタリング結果をメモ化し、不要な再計算を防止
  return useMemo(() => {
    // 詳細なパフォーマンス計測とロギング
    return logger.measureTime(
      'POIフィルタリング処理', // ログラベル
      () => {
        // フィルタが何もない場合は早期リターン（最適化）
        const hasFilters = Boolean(
          stableFilters.categories.length > 0 || stableFilters.isOpen || normalizedSearchText
        );

        if (!hasFilters && safePois.length > 0) {
          if (PERFORMANCE_CONFIG.ENABLE_POI_DEBUG) {
            logger.debug('フィルタなし - 元のPOI配列を返します', {
              component: COMPONENT_NAME,
              poiCount: safePois.length,
            });
          }
          return [...safePois]; // イミュータブルな配列としてコピーを返す
        }

        // フィルタリング処理開始
        const startTime = performance.now();

        // 型安全性の担保: PoIとfiltersを適切な型に整形
        const result = filterPOIs(
          safePois,
          {
            categories: stableFilters.categories,
            isOpen: stableFilters.isOpen,
          },
          normalizedSearchText
        );

        const duration = performance.now() - startTime;

        // パフォーマンス測定とログ出力
        if (PERFORMANCE_CONFIG.ENABLE_DETAILED_METRICS) {
          const filteringRatio =
            safePois.length > 0 ? ((safePois.length - result.length) / safePois.length) * 100 : 0;

          // パフォーマンス警告しきい値を超えた場合は警告ログ
          if (duration > PERFORMANCE_CONFIG.SLOW_FILTER_THRESHOLD) {
            logger.warn(`POIフィルタリングに時間がかかりました`, {
              component: COMPONENT_NAME,
              duration: `${duration.toFixed(2)}ms`,
              threshold: PERFORMANCE_CONFIG.SLOW_FILTER_THRESHOLD,
              itemCount: safePois.length,
              resultCount: result.length,
              filteringRatio: `${filteringRatio.toFixed(1)}%`,
              filters: {
                hasCategories: stableFilters.categories.length > 0,
                categories: stableFilters.categories.length,
                isOpenFilter: stableFilters.isOpen,
                searchTextLength: normalizedSearchText?.length || 0,
              },
            });
          } else if (stableFilters.enableDetailedLogging) {
            // 詳細ロギングが有効な場合は常に統計を出力
            logger.debug(`POIフィルタリング完了`, {
              component: COMPONENT_NAME,
              duration: `${duration.toFixed(2)}ms`,
              itemCount: safePois.length,
              resultCount: result.length,
              filteringRatio: `${filteringRatio.toFixed(1)}%`,
            });
          }
        }

        return result;
      },
      PERFORMANCE_CONFIG.LOG_LEVEL
    );
  }, [safePois, normalizedSearchText, stableFilters]); // 依存配列を最適化
}
