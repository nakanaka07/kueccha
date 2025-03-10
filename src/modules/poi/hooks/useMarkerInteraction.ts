/*
 * 機能: マーカーとのインタラクション（クリック、キーボード操作など）を管理するフック
 * 依存関係:
 *   - React useEffect
 *   - Google Maps JavaScript API (marker.AdvancedMarkerElement)
 *   - Marker.module.css (スタイリング)
 *   - Poi型定義
 * 注意点:
 *   - Google Maps APIが初期化されていることが前提
 *   - マーカーの選択状態のスタイル管理も行う
 *   - クリーンアップ処理でイベントリスナーを適切に削除
 */

import { useEffect } from 'react';
import styles from '../components/Marker.module.css';
import type { Poi } from '../../../core/types/poi';

interface UseMarkerInteractionProps {
  marker: google.maps.marker.AdvancedMarkerElement | null;
  poi: Poi;
  onClick: (poi: Poi) => void;
  isSelected: boolean;
}

export function useMarkerInteraction({ marker, poi, onClick, isSelected }: UseMarkerInteractionProps) {
  useEffect(() => {
    if (!marker || !window.google?.maps) return;

    try {
      const handleClick = () => onClick(poi);
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      };

      google.maps.event.clearInstanceListeners(marker);
      marker.addListener('gmp-click', handleClick);

      const element = marker.content;
      if (element instanceof HTMLElement) {
        element.removeEventListener('keydown', handleKeyDown);
        element.addEventListener('keydown', handleKeyDown);
      }

      return () => {
        google.maps.event.clearInstanceListeners(marker);
        if (marker.content instanceof HTMLElement) {
          marker.content.removeEventListener('keydown', handleKeyDown);
        }
      };
    } catch (error) {
      console.error('マーカーイベント設定中にエラーが発生しました:', error);
    }
  }, [marker, onClick, poi]);

  useEffect(() => {
    if (!marker || !(marker.content instanceof HTMLElement)) return;

    const content = marker.content as HTMLElement;

    if (isSelected) {
      content.classList.add(styles.markerSelected);
      content.setAttribute('aria-selected', 'true');
    } else {
      content.classList.remove(styles.markerSelected);
      content.setAttribute('aria-selected', 'false');
    }
  }, [marker, isSelected]);
}
