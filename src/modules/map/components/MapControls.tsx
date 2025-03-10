import React from 'react';
import { MapControlsProps } from '../../../core/types/map';
import resetNorthIcon from '../../../utils/images/ano_icon04.png';
import currentLocationIcon from '../../../utils/images/shi_icon04.png';

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
