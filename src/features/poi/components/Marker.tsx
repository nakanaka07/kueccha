import React, { useEffect, useRef, useCallback, useMemo } from 'react';
import styles from './Marker.module.css';
import { MARKER_ICONS } from '../../../constants/markers';
import { MarkerProps } from '../../../types/poi';

const Marker = React.memo(
  ({ poi, onClick, map, isSelected, zIndex }: MarkerProps & { isSelected: boolean; zIndex?: number }) => {
    const markerRef = useRef<google.maps.marker.AdvancedMarkerElement | null>(null);

    // マーカー要素作成処理を最適化
    const createMarkerElement = useCallback(() => {
      const iconUrl = MARKER_ICONS[poi.area] || MARKER_ICONS.DEFAULT;
      const element = document.createElement('div');

      // 基本スタイル設定
      element.style.backgroundImage = `url(${iconUrl})`;
      element.style.backgroundSize = 'contain';
      element.style.width = '36px';
      element.style.height = '36px';

      // アクセシビリティ設定
      element.setAttribute('tabindex', '0');
      element.setAttribute('role', 'button');
      element.setAttribute('aria-label', poi.area === 'CURRENT_LOCATION' ? '現在地' : poi.name);

      element.classList.add(styles.markerContent);

      // 特殊な状態のクラス追加
      if (poi.area === 'RECOMMEND') {
        element.classList.add(styles.markerRecommendation);
        element.classList.add(styles.markerBlinking);
      } else if (poi.area === 'CURRENT_LOCATION') {
        element.classList.add(styles.markerBlinking);
      }

      return element;
    }, [poi.area, poi.name]);

    // マーカーオプションをメモ化
    const markerOptions = useMemo(
      () => ({
        position: poi.location,
        map,
        title: poi.name,
        zIndex,
      }),
      [map, poi.location, poi.name, zIndex],
    );

    // マーカー生成と管理
    useEffect(() => {
      if (!map || !window.google?.maps) return;

      try {
        // 既存マーカーの位置更新
        if (markerRef.current) {
          markerRef.current.position = poi.location;
          return;
        }

        // 新規マーカー作成
        const iconElement = createMarkerElement();
        const marker = new google.maps.marker.AdvancedMarkerElement({
          ...markerOptions,
          content: iconElement,
        });

        markerRef.current = marker;
      } catch (error) {
        console.error('マーカー作成中にエラーが発生しました:', error);
      }

      // クリーンアップ
      return () => {
        if (markerRef.current) {
          google.maps.event.clearInstanceListeners(markerRef.current);
          markerRef.current.map = null;
          markerRef.current = null;
        }
      };
    }, [markerOptions, createMarkerElement]);

    // イベントハンドラ設定
    useEffect(() => {
      const marker = markerRef.current;
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
    }, [onClick, poi]);

    // 選択状態の管理
    useEffect(() => {
      const marker = markerRef.current;
      if (!marker || !(marker.content instanceof HTMLElement)) return;

      const content = marker.content as HTMLElement;

      if (isSelected) {
        content.classList.add(styles.markerSelected);
        content.setAttribute('aria-selected', 'true');
      } else {
        content.classList.remove(styles.markerSelected);
        content.setAttribute('aria-selected', 'false');
      }
    }, [isSelected]);

    return null;
  },
);

Marker.displayName = 'Marker';

export { Marker };
export default Marker;
