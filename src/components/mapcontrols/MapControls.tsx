// Reactライブラリをインポートします。これにより、Reactコンポーネントを作成できます。
import React from 'react';
// CSSモジュールをインポートします。これにより、スタイルをコンポーネントに適用できます。
import styles from './MapControls.module.css';
// 画像ファイルをインポートします。これらはボタンのアイコンとして使用されます。
import fitMarkersIcon from '../../utils/images/ano_icon02.png'; // 新しいアイコン
import resetNorthIcon from '../../utils/images/ano_icon04.png';
import currentLocationIcon from '../../utils/images/shi_icon04.png';
// TypeScriptの型定義をインポートします。これにより、コンポーネントのプロパティの型を指定できます。
import { MapControlsProps } from '../../utils/types';

// MapControlsコンポーネントを定義します。
// 各ボタンを表示し、クリック時に対応する関数を呼び出します。
export const MapControls: React.FC<MapControlsProps> = ({
  onResetNorth, // 北向きにリセットする関数
  onGetCurrentLocation, // 現在地を取得する関数
  onFitMarkers, // マーカー範囲にフィットさせる関数
}) => (
  // コントロールボタンを含むコンテナを表示します。
  <div className={styles.mapControlsContainer}>
    {/* 北向きにリセットするボタンを表示します。 */}
    <button
      onClick={onResetNorth}
      className={styles.mapControlButton}
      title="北向きにリセットします。"
      aria-label="地図を北向きにリセット"
    >
      {/* ボタンのアイコンとして画像を表示します。 */}
      <img src={resetNorthIcon} alt="" aria-hidden="true" />
    </button>
    {/* 現在地を取得するボタンを表示します。 */}
    <button
      onClick={onGetCurrentLocation}
      className={styles.mapControlButton}
      title="現在地を取得します。"
      aria-label="現在地を取得"
    >
      {/* ボタンのアイコンとして画像を表示します。 */}
      <img src={currentLocationIcon} alt="" aria-hidden="true" />
    </button>
    {/* マーカーにフィットするボタンを表示します。 */}
    <button
      onClick={onFitMarkers}
      className={styles.mapControlButton}
      title="すべてのマーカーが表示される範囲に調整します。"
      aria-label="マーカー全体を表示"
    >
      {/* ボタンのアイコンとして画像を表示します。 */}
      <img src={fitMarkersIcon} alt="" aria-hidden="true" />
    </button>
  </div>
);
