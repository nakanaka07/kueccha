import React from 'react';

import resetNorthIcon from '../../utils/images/ano_icon04.png';
import recommendIcon from '../../utils/images/ano_icon_recommend.png';
import currentLocationIcon from '../../utils/images/shi_icon04.png';

import type { MapControlsProps } from '../../utils/types';

export const MapControls: React.FC<MapControlsProps> = ({
  onResetNorth,
  onGetCurrentLocation,
  onToggleRecommendations,
}) => (
  <div>
    <button onClick={onResetNorth} title="北向きにリセットします。">
      <img src={resetNorthIcon} alt="北向きにリセット" />
    </button>
    <button onClick={onGetCurrentLocation} title="現在地を取得します。">
      <img src={currentLocationIcon} alt="現在地を取得" />
    </button>
    <button onClick={onToggleRecommendations} title="おすすめエリアの表示を切り替えます。">
      <img src={recommendIcon} alt="おすすめエリアの表示を切り替え" />
    </button>
  </div>
);
