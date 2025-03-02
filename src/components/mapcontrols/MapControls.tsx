import React from 'react';
import { MapControlsProps } from '../../utils/types';
import styles from './MapControls.module.css';
import fitMarkersIcon from '../../utils/images/ano_icon02.png';
import resetNorthIcon from '../../utils/images/ano_icon04.png';
import currentLocationIcon from '../../utils/images/shi_icon04.png';

export const MapControls: React.FC<MapControlsProps> = ({
  onResetNorth,
  onGetCurrentLocation,
  onFitMarkers,
}) => (
  <div className={styles.mapControlsContainer}>
    <button
      onClick={onResetNorth}
      className={styles.mapControlButton}
      title="北向きにリセットします。"
      aria-label="地図を北向きにリセット"
    >
      <img src={resetNorthIcon} alt="" aria-hidden="true" />
    </button>
    <button
      onClick={onGetCurrentLocation}
      className={styles.mapControlButton}
      title="現在地を取得します。"
      aria-label="現在地を取得"
    >
      <img src={currentLocationIcon} alt="" aria-hidden="true" />
    </button>
    <button
      onClick={onFitMarkers}
      className={styles.mapControlButton}
      title="すべてのマーカーが表示される範囲に調整します。"
      aria-label="マーカー全体を表示"
    >
      <img src={fitMarkersIcon} alt="" aria-hidden="true" />
    </button>
  </div>
);
