// hooks/useMarkerInteraction.ts
import { useEffect } from 'react';
import styles from '../components/Marker.module.css';
import type { Poi } from '../../../../types/poi';

interface UseMarkerInteractionProps {
  marker: google.maps.marker.AdvancedMarkerElement | null;
  poi: Poi;
  onClick: (poi: Poi) => void;
  isSelected: boolean;
}

export function useMarkerInteraction({ marker, poi, onClick, isSelected }: UseMarkerInteractionProps) {
  // イベントハンドラ設定
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

      // 既存のイベントリスナーをクリア
      google.maps.event.clearInstanceListeners(marker);
      marker.addListener('gmp-click', handleClick);

      // キーボード操作のサポート
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

  // 選択状態の管理
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
