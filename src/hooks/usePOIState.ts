import { useState, useCallback, useEffect } from 'react';

import type { PointOfInterest } from '@/types/poi';
import { logger, LogLevel } from '@/utils/logger';

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

  // 初期値設定
  useEffect(() => {
    if (convertedPOIs.length > 0) {
      setFilteredPOIs(convertedPOIs);
    }
  }, [convertedPOIs]);

  // POI詳細表示 - メモ化によるパフォーマンス最適化
  const handlePOISelect = useCallback((poi: PointOfInterest) => {
    logger.info('POI選択', {
      component: 'usePOIState',
      action: 'selectPOI',
      entityId: poi.id,
      entityName: poi.name,
      entityType: poi.type,
      category: poi.category,
    });

    setSelectedPOI(poi);
  }, []);

  // POI詳細を閉じる - メモ化
  const handleClosePOIDetails = useCallback(() => {
    logger.debug('POI詳細を閉じました', {
      component: 'usePOIState',
      action: 'closePOIDetails',
    });
    setSelectedPOI(null);
  }, []);

  // フィルタリングされたPOIの更新 - パフォーマンス測定とメモ化
  const handleFilterChange = useCallback(
    (filtered: PointOfInterest[]) => {
      const poisLength = convertedPOIs.length || 1; // 0除算防止
      const reductionPercentage = Math.round((1 - filtered.length / poisLength) * 100);

      logger.measureTime(
        'フィルター適用',
        () => {
          logger.debug('POIフィルター適用', {
            component: 'usePOIState',
            action: 'applyFilter',
            before: filteredPOIs.length,
            after: filtered.length,
            reduction: `${reductionPercentage}%`,
            remainingCategories: Array.from(new Set(filtered.map(poi => poi.category))),
          });

          setFilteredPOIs(filtered);
        },
        LogLevel.DEBUG,
        { component: 'usePOIState' },
        50 // 50ms以上かかった場合のみログ出力
      );
    },
    [filteredPOIs.length, convertedPOIs.length]
  );

  return {
    selectedPOI,
    filteredPOIs,
    handlePOISelect,
    handleClosePOIDetails,
    handleFilterChange,
  };
}
