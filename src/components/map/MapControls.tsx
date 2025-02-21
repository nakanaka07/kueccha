import React from 'react';
import styles from './MapControls.module.css';
import resetNorthIcon from '../../utils/images/ano_icon04.png';
import recommendIcon from '../../utils/images/ano_icon_recommend.png';
import currentLocationIcon from '../../utils/images/shi_icon04.png';

type MapControlsProps = {
  onResetNorth: () => void;
  onGetCurrentLocation: () => void;
  onToggleRecommendations: () => void;
};

export const MapControls: React.FC<MapControlsProps> = ({
  onResetNorth,
  onGetCurrentLocation,
  onToggleRecommendations,
}) => (
  <div className={styles.mapControlsContainer}>
    <button
      onClick={onResetNorth}
      className={styles.mapControlButton}
      title="北向きにリセットします。"
    >
      <img src={resetNorthIcon} alt="北向きにリセット" />
    </button>
    <button
      onClick={onGetCurrentLocation}
      className={styles.mapControlButton}
      title="現在地を取得します。"
    >
      <img src={currentLocationIcon} alt="現在地を取得" />
    </button>
    <button
      onClick={onToggleRecommendations}
      className={styles.mapControlButton}
      title="おすすめエリアの表示を切り替えます。"
    >
      <img src={recommendIcon} alt="おすすめエリアの表示を切り替え" />
    </button>
  </div>
);
