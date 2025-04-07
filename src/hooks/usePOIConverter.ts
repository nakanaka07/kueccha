import { useCallback } from 'react';

import type { PointOfInterest } from '@/types/poi';
import { logger } from '@/utils/logger';

/**
 * POIデータ型変換に使用する入力型
 * POIからPointOfInterestへの変換時に必要な最低限のプロパティを定義
 */
export interface POIInput {
  id: string;
  name: string;
  position?: {
    lat?: number;
    lng?: number;
  };
  isClosed: boolean;
  type: string;
  category?: string;
  categories?: string[];
  genre?: string;
  address: string;
  district?: string | number;
  [key: string]: unknown; // その他の動的プロパティを許容
}

/**
 * POIデータをPointOfInterest型に変換するためのカスタムフック
 * @returns POIデータを変換する関数
 */
export function usePOIConverter() {
  /**
   * POI型データをPointOfInterest型に変換する関数
   * @param poi 変換するPOIデータ
   * @returns 変換されたPointOfInterestデータ
   */
  const convertPOItoPointOfInterest = useCallback((poi: POIInput): PointOfInterest => {
    // 変換前のデータ検証
    if (!poi.id || !poi.name) {
      logger.warn('POIデータに必須フィールドがありません', {
        component: 'usePOIConverter',
        action: 'validate',
        missingFields: [!poi.id ? 'id' : null, !poi.name ? 'name' : null].filter(Boolean),
        poiData: { id: poi.id || 'missing', name: poi.name || 'missing' },
      });
    }

    // POIデータをPointOfInterest型に変換
    return {
      ...poi,
      lat: poi.position?.lat ?? 0, // nullish coalescingを使用
      lng: poi.position?.lng ?? 0, // nullish coalescingを使用
    } as PointOfInterest;
  }, []);

  return { convertPOItoPointOfInterest };
}
