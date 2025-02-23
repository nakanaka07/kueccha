import React from 'react';
// CSSモジュールをインポートします。スタイルを適用するために使用します。
import styles from './MapControls.module.css';
// 各ボタンに使用するアイコン画像をインポートします。
import resetNorthIcon from '../../utils/images/ano_icon04.png';
import recommendIcon from '../../utils/images/ano_icon_recommend.png';
import currentLocationIcon from '../../utils/images/shi_icon04.png';

// MapControlsコンポーネントのプロパティの型を定義します。
// onResetNorth: 北向きにリセットするための関数。
// onGetCurrentLocation: 現在地を取得するための関数。
// onToggleRecommendations: おすすめエリアの表示を切り替えるための関数。
type MapControlsProps = {
  onResetNorth: () => void; // 北向きにリセットするための関数
  onGetCurrentLocation: () => void; // 現在地を取得するための関数
  onToggleRecommendations: () => void; // おすすめエリアの表示を切り替えるための関数
};

// MapControlsコンポーネントを定義します。
// 各ボタンを表示し、クリック時に対応する関数を呼び出します。
export const MapControls: React.FC<MapControlsProps> = ({
  onResetNorth,
  onGetCurrentLocation,
  onToggleRecommendations,
}) => (
  // コントロールボタンを含むコンテナを表示します。
  <div className={styles.mapControlsContainer}>
    {/* 北向きにリセットするボタンを表示します。 */}
    <button onClick={onResetNorth} className={styles.mapControlButton} title="北向きにリセットします。">
      <img src={resetNorthIcon} alt="北向きにリセット" />
    </button>
    {/* 現在地を取得するボタンを表示します。 */}
    <button onClick={onGetCurrentLocation} className={styles.mapControlButton} title="現在地を取得します。">
      <img src={currentLocationIcon} alt="現在地を取得" />
    </button>
    {/* おすすめエリアの表示を切り替えるボタンを表示します。 */}
    <button
      onClick={onToggleRecommendations}
      className={styles.mapControlButton}
      title="おすすめエリアの表示を切り替えます。"
    >
      <img src={recommendIcon} alt="おすすめエリアの表示を切り替え" />
    </button>
  </div>
);
