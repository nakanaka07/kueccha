/*
 * 機能: マップ上に表示するコントロールボタン（北向きリセット、現在地取得）を提供するコンポーネント
 * 依存関係:
 *   - React
 *   - MapControls.module.css（スタイル定義）
 *   - 画像アセット: resetNorthIcon, currentLocationIcon
 *   - 型定義: MapControlsProps
 * 注意点:
 *   - アクセシビリティ対応済み（title, aria-label属性）
 *   - ボタンクリックイベントは親コンポーネントから受け取る
 *   - 位置は絶対配置でマップの右下に固定
 */

import React from 'react';
import styles from './MapControls.module.css';
import { MapControlsProps } from '../../../core/types/map';
import resetNorthIcon from '../../../utils/images/ano_icon04.png';
import currentLocationIcon from '../../../utils/images/shi_icon04.png';

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
