/*
 * 機能: 通常POIリストと現在地POIを統合管理するカスタムフック
 * 依存関係:
 *   - React useMemo
 *   - CURRENT_LOCATION_POI定数 (現在地POIのテンプレート)
 *   - Poi型定義
 * 注意点:
 *   - POIリストがない場合は現在地POIのみを表示（設定による）
 *   - 現在地POIが既存POIと重複する場合は適切に上書き処理
 *   - 設定により現在地POIの表示/非表示を切り替え可能
 */

import { useMemo } from 'react';
import { CURRENT_LOCATION_POI } from '../../../constants/areas';
import type { Poi } from '../../../types/poi';

export function useCombinedPois(
  pois: Poi[] | null | undefined,
  currentLocationPoi: Poi | null | undefined,
  showCurrentLocation = true,
): Poi[] {
  return useMemo(() => {
    if (!pois || pois.length === 0) {
      return showCurrentLocation && currentLocationPoi ? [currentLocationPoi] : [];
    }

    if (!showCurrentLocation || !currentLocationPoi) {
      return [...pois];
    }

    const hasCurrentLocationId = pois.some((poi) => poi.id === currentLocationPoi.id);

    if (hasCurrentLocationId) {
      return pois.map((poi) => (poi.id === currentLocationPoi.id ? currentLocationPoi : poi));
    }

    return [currentLocationPoi, ...pois];
  }, [pois, currentLocationPoi, showCurrentLocation]);
}

export function createCurrentLocationPoi(location: { lat: number; lng: number }): Poi {
  return {
    ...CURRENT_LOCATION_POI,
    location: {
      lat: location.lat,
      lng: location.lng,
    },
  };
}
