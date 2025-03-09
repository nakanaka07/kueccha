/*
 * 機能: マーカーのz-indexを管理するためのカスタムフック
 * 依存関係:
 *   - React (useCallback)
 *   - 型定義: AreaType, Poi
 * 注意点:
 *   - エリアタイプに応じたz-index優先度を設定（RECOMMEND > CURRENT_LOCATION > その他）
 *   - マーカーの重なり順を制御するために使用
 *   - z-indexが高いほど前面に表示される
 */

import { useCallback } from 'react';
import type { AreaType } from '../../../core/types/map';
// Poi型は使用されていないため、インポートを削除するか、コメントアウトします
// import type { Poi } from '../../../core/types/poi';

export function useMapMarkers() {
  const getMarkerZIndex = useCallback((areaType: AreaType): number => {
    switch (areaType) {
      case 'RECOMMEND':
        return 100;
      case 'CURRENT_LOCATION':
        return 90;
      default:
        return 10;
    }
  }, []);

  return { getMarkerZIndex };
}
