import React from 'react';
import styles from './MapControls.module.css';
import { MapControlsProps } from '../../../types/map';
import resetNorthIcon from '../../../utils/images/ano_icon04.png'; // 画像パスの更新
import currentLocationIcon from '../../../utils/images/shi_icon04.png'; // 画像パスの更新

export const MapControls: React.FC<MapControlsProps> = ({ onResetNorth, onGetCurrentLocation }) => (
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
  </div>
);

export default MapControls;
