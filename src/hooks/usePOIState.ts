import { useState, useCallback, useEffect, useMemo } from 'react';

import type { PointOfInterest } from '@/types/poi';
import { createLogContext } from '@/utils/logContext';
import { logger, LogLevel } from '@/utils/logger';

// コンポーネント名を定数化（DRY原則）
const COMPONENT_NAME = 'usePOIState';

// フィルター変更のしきい値（msec）
const FILTER_PERFORMANCE_THRESHOLD = 50;

/**
 * POI状態管理用のカスタムフック
 * POIの選択状態、フィルタリング状態を管理します
 *
 * @param convertedPOIs 変換済みのPOIデータ配列
 * @returns POI状態と状態を変更するためのハンドラー関数
 */
export function usePOIState(convertedPOIs: PointOfInterest[]) {
  const [selectedPOI, setSelectedPOI] = useState<PointOfInterest | null>(null);
  const [filteredPOIs, setFilteredPOIs] = useState<PointOfInterest[]>([]);

  // POIデータ件数をメモ化（再計算防止）
  const totalCount = useMemo(() => convertedPOIs.length, [convertedPOIs]);

  // 初期値設定 - 依存配列を最適化
  useEffect(() => {
    if (totalCount > 0) {
      setFilteredPOIs(convertedPOIs);

      logger.debug(
        'POIデータ初期化',
        createLogContext(COMPONENT_NAME, {
          action: 'initialize',
          count: totalCount,
        })
      );
    }
  }, [convertedPOIs, totalCount]);

  // POI詳細表示 - メモ化によるパフォーマンス最適化
  const handlePOISelect = useCallback((poi: PointOfInterest) => {
    logger.info(
      'POI選択',
      createLogContext(COMPONENT_NAME, {
        action: 'selectPOI',
        entityId: poi.id,
        entityName: poi.name,
        entityType: poi.type,
        category: poi.category,
      })
    );

    setSelectedPOI(poi);
  }, []);

  // POI詳細を閉じる - メモ化
  const handleClosePOIDetails = useCallback(() => {
    // 現在選択中のPOIがある場合のみログ出力（不要なログを削減）
    if (selectedPOI) {
      logger.debug(
        'POI詳細を閉じました',
        createLogContext(COMPONENT_NAME, {
          action: 'closePOIDetails',
          entityId: selectedPOI.id,
        })
      );
    }

    setSelectedPOI(null);
  }, [selectedPOI]);

  /**
   * 安全なカテゴリ抽出ユーティリティ
   * @param pois POIデータ配列
   * @returns ユニークなカテゴリ名の配列
   */
  const extractCategories = useCallback((pois: PointOfInterest[]): string[] => {
    return Array.from(new Set(pois.map(poi => poi.category || '不明')))
      .filter(Boolean)
      .sort();
  }, []);

  // 安全な配列比較（参照比較ではなく内容比較）
  const areArraysEqual = useCallback(
    (arr1: PointOfInterest[], arr2: PointOfInterest[]): boolean => {
      if (arr1 === arr2) return true;
      if (arr1.length !== arr2.length) return false;

      // IDのみを使って比較（Object Injection対策）
      const ids1 = new Set(arr1.map(item => item.id));
      const ids2 = new Set(arr2.map(item => item.id));

      if (ids1.size !== ids2.size) return false;

      // 全てのIDが一致するか確認
      return Array.from(ids1).every(id => ids2.has(id));
    },
    []
  );

  // フィルタリングされたPOIの更新 - パフォーマンス測定とメモ化の最適化
  const handleFilterChange = useCallback(
    (filtered: PointOfInterest[]) => {
      // 値が変わらない場合は早期リターン（不要な再レンダリング防止）
      if (filteredPOIs === filtered || areArraysEqual(filteredPOIs, filtered)) {
        return;
      }

      // 現在のフィルタリング状態をローカル変数にキャッシュ
      const currentFilteredLength = filteredPOIs.length;
      const poisLength = totalCount || 1; // 0除算防止
      const reductionPercentage = Math.round((1 - filtered.length / poisLength) * 100);

      // パフォーマンス計測を最適化
      logger.measureTime(
        'フィルター適用',
        () => {
          // 結果カテゴリのメモリ効率化
          const remainingCategories = extractCategories(filtered);

          logger.debug(
            'POIフィルター適用',
            createLogContext(COMPONENT_NAME, {
              action: 'applyFilter',
              before: currentFilteredLength,
              after: filtered.length,
              reduction: `${reductionPercentage}%`,
              remainingCategories,
              categoryCount: remainingCategories.length,
              threshold: FILTER_PERFORMANCE_THRESHOLD, // しきい値をコンテキストに含める
            })
          );

          setFilteredPOIs(filtered);
        },
        LogLevel.DEBUG // 第3引数はLogLevelのみを指定
      );
    },
    [filteredPOIs, totalCount, extractCategories, areArraysEqual]
  );

  // 状態と操作をメモ化して返却（不要な再レンダリングを防止）
  return useMemo(
    () => ({
      selectedPOI,
      filteredPOIs,
      handlePOISelect,
      handleClosePOIDetails,
      handleFilterChange,
      totalCount,
    }),
    [
      selectedPOI,
      filteredPOIs,
      handlePOISelect,
      handleClosePOIDetails,
      handleFilterChange,
      totalCount,
    ]
  );
}
