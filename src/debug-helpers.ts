/**
 * デバッグ用ヘルパー関数
 *
 * マーカー表示の問題を診断するための関数群
 *
 * @author 佐渡で食えっちゃプロジェクトチーム
 * @version 1.0.0
 * @lastUpdate 2025年4月27日
 */

import type { PointOfInterest } from './types/poi';
import { logger } from './utils/logger';

/**
 * マーカーとPOIの状態をログに出力する
 *
 * @param markers マーカー配列
 * @param pois POI配列
 */
export function debugMarkersAndPOIs(
  markers: google.maps.marker.AdvancedMarkerElement[],
  pois: PointOfInterest[]
): void {
  try {
    // 無効なマーカーの検出
    const invalidMarkers = markers.filter(marker => !marker.position);
    const unmappedMarkers = markers.filter(marker => !marker.map);

    // 無効なPOIの検出
    const invalidPOIs = pois.filter(poi => !poi.id || (!poi.latitude && !poi.lat));

    // すべての情報をログに出力
    logger.info('マーカーとPOIのデバッグ情報', {
      component: 'debugMarkersAndPOIs',
      markerCount: markers.length,
      poiCount: pois.length,
      invalidMarkerCount: invalidMarkers.length,
      unmappedMarkerCount: unmappedMarkers.length,
      invalidPOICount: invalidPOIs.length,
    });

    // サンプルデータのログ出力（最初のマーカーと最初のPOI）
    if (markers.length > 0) {
      logger.info('最初のマーカーの詳細', {
        component: 'debugMarkersAndPOIs',
        hasPosition: !!markers[0].position,
        hasMap: !!markers[0].map,
        title: markers[0].title || 'タイトルなし',
      });
    }

    if (pois.length > 0) {
      logger.info('最初のPOIの詳細', {
        component: 'debugMarkersAndPOIs',
        id: pois[0].id,
        name: pois[0].name,
        hasLocation: !!(pois[0].latitude || pois[0].lat),
      });
    }
  } catch (error) {
    logger.error('デバッグ情報出力中にエラーが発生しました', {
      component: 'debugMarkersAndPOIs',
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

/**
 * マーカーの可視性状態をデバッグする
 *
 * @param visiblePOIs 可視状態のPOI配列
 * @param markers すべてのマーカー配列
 * @param mapRef マップへの参照
 */
export function debugMarkerVisibility(
  visiblePOIs: PointOfInterest[],
  markers: google.maps.marker.AdvancedMarkerElement[],
  mapRef: React.MutableRefObject<google.maps.Map | null>
): void {
  try {
    // 可視性の基本情報
    logger.info('マーカー可視性デバッグ情報', {
      component: 'debugMarkerVisibility',
      visibleCount: visiblePOIs.length,
      totalCount: markers.length,
      visibilityRatio: markers.length > 0 ? (visiblePOIs.length / markers.length) * 100 : 0,
    });

    const map = mapRef.current;
    if (map) {
      const bounds = map.getBounds();
      if (bounds) {
        // 境界情報
        const boundsInfo = {
          component: 'debugMarkerVisibility',
          north: bounds.getNorthEast().lat(),
          east: bounds.getNorthEast().lng(),
          south: bounds.getSouthWest().lat(),
          west: bounds.getSouthWest().lng(),
        };
        logger.info('マップ境界情報', boundsInfo);

        // 境界内にあるがマップに表示されていないマーカーを検出
        let inBoundsButHidden = 0;
        markers.forEach(marker => {
          if (marker.position) {
            const pos =
              marker.position instanceof google.maps.LatLng
                ? marker.position
                : new google.maps.LatLng(marker.position.lat, marker.position.lng);

            if (bounds.contains(pos) && !marker.map) {
              inBoundsButHidden++;
            }
          }
        });

        logger.warn('境界内だが非表示のマーカー検出', {
          component: 'debugMarkerVisibility',
          count: inBoundsButHidden,
          totalMarkers: markers.length,
        });
      } else {
        logger.warn('マップ境界が取得できません', {
          component: 'debugMarkerVisibility',
        });
      }
    } else {
      logger.warn('マップが初期化されていません', {
        component: 'debugMarkerVisibility',
      });
    }
  } catch (error) {
    logger.error('可視性デバッグ情報出力中にエラーが発生しました', {
      component: 'debugMarkerVisibility',
      error: error instanceof Error ? error.message : String(error),
    });
  }
}
