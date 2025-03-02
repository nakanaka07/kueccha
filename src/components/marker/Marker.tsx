import React, { useEffect, useRef, useCallback } from 'react';
import styles from './Marker.module.css';
import { MARKER_ICONS } from '../../utils/constants';
import { MarkerProps } from '../../utils/types';

const Marker = React.memo(
  ({ poi, onClick, map, isSelected, zIndex }: MarkerProps & { isSelected: boolean; zIndex?: number }) => {
    const markerRef = useRef<google.maps.marker.AdvancedMarkerElement | null>(null);

    const createMarkerElement = useCallback((iconUrl: string) => {
      const element = document.createElement('div');
      element.style.backgroundImage = `url(${iconUrl})`;
      element.style.backgroundSize = 'contain';
      element.style.width = '36px';
      element.style.height = '36px';
      element.setAttribute('tabindex', '0');
      element.classList.add(styles.markerContent);
      return element;
    }, []);

    useEffect(() => {
      if (!map || !window.google?.maps) return;

      try {
        if (markerRef.current) {
          markerRef.current.position = poi.location;
          return;
        }

        const iconUrl = MARKER_ICONS[poi.area] || MARKER_ICONS.DEFAULT;
        const iconElement = createMarkerElement(iconUrl);

        const marker = new google.maps.marker.AdvancedMarkerElement({
          position: poi.location,
          map,
          title: poi.name,
          content: iconElement,
          zIndex,
        });

        markerRef.current = marker;

        if (poi.area === 'RECOMMEND') {
          iconElement.classList.add(styles.markerRecommendation);
          iconElement.classList.add(styles.markerBlinking);
        } else if (poi.area === 'CURRENT_LOCATION') {
          iconElement.classList.add(styles.markerBlinking);
          iconElement.setAttribute('aria-label', '現在地');
        }

        return () => {
          if (markerRef.current) {
            google.maps.event.clearInstanceListeners(markerRef.current);
            markerRef.current.map = null;
            markerRef.current = null;
          }
        };
      } catch (error) {
        console.error('マーカー作成中にエラーが発生しました:', error);
      }
    }, [map, poi.location, poi.area, zIndex, createMarkerElement]);

    useEffect(() => {
      if (!markerRef.current || !window.google?.maps) return;

      try {
        const handleClick = () => onClick(poi);

        const handleKeyDown = (e: KeyboardEvent) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleClick();
          }
        };

        google.maps.event.clearInstanceListeners(markerRef.current);

        markerRef.current.addListener('gmp-click', handleClick);

        const element = markerRef.current.content;
        if (element instanceof HTMLElement) {
          element.removeEventListener('keydown', handleKeyDown);
          element.addEventListener('keydown', handleKeyDown);
        }

        return () => {
          if (markerRef.current) {
            google.maps.event.clearInstanceListeners(markerRef.current);

            if (markerRef.current.content instanceof HTMLElement) {
              markerRef.current.content.removeEventListener('keydown', handleKeyDown);
            }
          }
        };
      } catch (error) {
        console.error('マーカーイベント設定中にエラーが発生しました:', error);
      }
    }, [onClick]);

    useEffect(() => {
      if (!markerRef.current || !(markerRef.current.content instanceof HTMLElement)) {
        return;
      }

      const content = markerRef.current.content as HTMLElement;

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
