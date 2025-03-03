import { useMemo } from 'react';
import { CURRENT_LOCATION_POI } from '../utils/constants';
import type { Poi } from '../utils/types';

/**
 * POIリストと現在地POIを結合するカスタムフック
 *
 * @param pois - データソースから取得したPOIリスト
 * @param currentLocationPoi - 現在地POI（位置情報が更新された場合）
 * @param showCurrentLocation - 現在地POIを表示するかどうかのフラグ（オプション）
 * @returns 結合されたPOIリスト
 */
export function useCombinedPois(
  pois: Poi[] | null | undefined,
  currentLocationPoi: Poi | null | undefined,
  showCurrentLocation = true,
): Poi[] {
  return useMemo(() => {
    // POIリストが存在しない場合
    if (!pois || pois.length === 0) {
      return showCurrentLocation && currentLocationPoi ? [currentLocationPoi] : [];
    }

    // 現在地POIが無効、または表示しない場合
    if (!showCurrentLocation || !currentLocationPoi) {
      return [...pois];
    }

    // IDが重複している場合は、現在地POIで上書き
    const hasCurrentLocationId = pois.some((poi) => poi.id === currentLocationPoi.id);

    if (hasCurrentLocationId) {
      return pois.map((poi) => (poi.id === currentLocationPoi.id ? currentLocationPoi : poi));
    }

    // 通常の結合処理
    return [currentLocationPoi, ...pois];
  }, [pois, currentLocationPoi, showCurrentLocation]);
}

/**
 * 現在地POIを作成/更新するユーティリティ関数
 *
 * @param location - 現在位置の座標
 * @returns 現在地のPOIオブジェクト
 */
export function createCurrentLocationPoi(location: { lat: number; lng: number }): Poi {
  return {
    ...CURRENT_LOCATION_POI,
    location: {
      lat: location.lat,
      lng: location.lng,
    },
  };
}
