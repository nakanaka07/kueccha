/*
 * 機能: マップの向きを北に戻すためのカスタムフック
 * 依存関係:
 *   - React (useCallback)
 *   - CONFIG（マップ設定）
 *   - google.maps.Map型（Googleマップインスタンス）
 * 注意点:
 *   - マップインスタンスがnullの場合は警告を出力
 *   - エラーハンドリングを実装
 *   - MapControlsPropsインターフェースの仕様に合わせた関数命名
 */

import { useCallback } from 'react';
import { CONFIG } from '../../../core/constants/config';

/**
 * マップの向きを北に戻すためのカスタムフック
 *
 * @param map - Google Maps APIのマップインスタンス
 * @returns マップコントロール関数を含むオブジェクト
 */
export const useMapNorthControl = (map: google.maps.Map | null) => {
  /**
   * マップの向きを北（0度）に設定します
   * MapControlsPropsインターフェースと一致する命名規則を使用
   */
  const onResetNorth = useCallback(() => {
    try {
      if (!map) {
        console.warn('マップが初期化されていないため、向きをリセットできません');
        return;
      }

      // マップの向きを北（0度）に設定
      map.setHeading(0);

      // オプションで追加のマップ設定を適用（必要に応じて）
      if (CONFIG.maps.options.zoomControl) {
        // 向きをリセットした後のカスタム動作をここに追加可能
      }
    } catch (error) {
      console.error('マップの向きリセット中にエラーが発生しました:', error);
    }
  }, [map]);

  // types.tsのMapControlsPropsインターフェースと一致するkeyを返す
  return {
    onResetNorth,
    // 将来的に他のマップコントロール機能を追加する場合、ここに追加できます
  };
};
