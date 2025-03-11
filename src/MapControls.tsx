import React from 'react';
import resetNorthIcon from '../../../assets/images/icons/ano_icon04.png';
import currentLocationIcon from '../../../assets/images/icons/shi_icon04.png';
import { MapControlsProps } from '../../../core/types/map';

export const MapControls: React.FC<MapControlsProps> = ({ onResetNorth, onGetCurrentLocation }) => (
  <div className="mapControlsContainer">
    <button
      onClick={onResetNorth}
      className="mapControlButton"
      title="北向きにリセットします。"
      aria-label="地図を北向きにリセット"
    >
      <img src={resetNorthIcon} alt="" aria-hidden="true" />
    </button>
    <button
      onClick={onGetCurrentLocation}
      className="mapControlButton"
      title="現在地を取得します。"
      aria-label="現在地を取得"
    >
      <img src={currentLocationIcon} alt="" aria-hidden="true" />
    </button>
  </div>
);

export default MapControls;
