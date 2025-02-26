// Reactライブラリをインポートします。これにより、Reactコンポーネントを作成できます。
import React from 'react';
// CSSモジュールをインポートします。これにより、スタイルをコンポーネントに適用できます。
import styles from './MapControls.module.css';
// 画像ファイルをインポートします。これらはボタンのアイコンとして使用されます。
import resetNorthIcon from '../../utils/images/ano_icon04.png';
import recommendIcon from '../../utils/images/ano_icon_recommend.png';
import currentLocationIcon from '../../utils/images/shi_icon04.png';
// TypeScriptの型定義をインポートします。これにより、コンポーネントのプロパティの型を指定できます。
import { MapControlsProps } from '../../utils/types';

// MapControlsコンポーネントを定義します。
// 各ボタンを表示し、クリック時に対応する関数を呼び出します。
export const MapControls: React.FC<MapControlsProps> = ({
  onResetNorth, // 北向きにリセットする関数
  onGetCurrentLocation, // 現在地を取得する関数
  onToggleRecommendations, // おすすめエリアの表示を切り替える関数
}) => (
  // コントロールボタンを含むコンテナを表示します。
  <div className={styles.mapControlsContainer}>
    {/* 北向きにリセットするボタンを表示します。 */}
    <button onClick={onResetNorth} className={styles.mapControlButton} title="北向きにリセットします。">
      {/* ボタンのアイコンとして画像を表示します。 */}
      <img src={resetNorthIcon} alt="北向きにリセット" />
    </button>
    {/* 現在地を取得するボタンを表示します。 */}
    <button onClick={onGetCurrentLocation} className={styles.mapControlButton} title="現在地を取得します。">
      {/* ボタンのアイコンとして画像を表示します。 */}
      <img src={currentLocationIcon} alt="現在地を取得" />
    </button>
    {/* おすすめエリアの表示を切り替えるボタンを表示します。 */}
    <button
      onClick={onToggleRecommendations}
      className={styles.mapControlButton}
      title="おすすめエリアの表示を切り替えます。"
    >
      {/* ボタンのアイコンとして画像を表示します。 */}
      <img src={recommendIcon} alt="おすすめエリアの表示を切り替え" />
    </button>
  </div>
);
