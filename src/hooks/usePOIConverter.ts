import { useCallback, useMemo } from 'react';

import type { PointOfInterest, POI } from '@/types/poi';
import { createLogContext } from '@/utils/logContext';
import { logger, LogLevel } from '@/utils/logger';

// コンポーネント名を定数化（DRY原則）
const COMPONENT_NAME = 'usePOIConverter';

/**
 * POIデータ型変換に使用する入力型
 * POIからPointOfInterestへの変換時に必要な最低限のプロパティを定義
 */
export type POIInput =
  | POI
  | {
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
    };

// 必須フィールド検証のためのヘルパー関数（単一責任の原則）
const validatePOIData = (poi: POIInput): string[] => {
  const missingFields: string[] = [];

  if (!poi.id) missingFields.push('id');
  if (!poi.name) missingFields.push('name');

  return missingFields;
};

/**
 * POIデータをPointOfInterest型に変換するためのカスタムフック
 * @returns POIデータを変換する関数とバリデーション結果
 */
export function usePOIConverter() {
  /**
   * POI型データをPointOfInterest型に変換する関数
   * @param poi 変換するPOIデータ
   * @returns 変換されたPointOfInterestデータ
   */
  const convertPOItoPointOfInterest = useCallback((poi: POIInput): PointOfInterest => {
    // パフォーマンス計測を追加
    return logger.measureTime(
      'POI変換処理',
      () => {
        // 変換前のデータ検証
        const missingFields = validatePOIData(poi);

        if (missingFields.length > 0) {
          logger.warn(
            'POIデータに必須フィールドがありません',
            createLogContext(COMPONENT_NAME, {
              action: 'validate',
              missingFields,
              poiData: {
                id: poi.id || 'missing',
                name: poi.name || 'missing',
              },
            })
          );
        }

        // POIデータをPointOfInterest型に変換
        return {
          ...poi,
          lat: poi.position?.lat ?? 0, // nullish coalescingを使用
          lng: poi.position?.lng ?? 0, // nullish coalescingを使用
        } as PointOfInterest;
      },
      LogLevel.DEBUG // デバッグレベルで計測（パフォーマンスへの影響を最小化）
    );
  }, []);

  // API返却値をメモ化（不要な再レンダリング防止）
  return useMemo(
    () => ({
      convertPOItoPointOfInterest,
    }),
    [convertPOItoPointOfInterest]
  );
}
