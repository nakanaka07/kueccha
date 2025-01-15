import React, { useState, useEffect } from 'react'; // Reactとフックをインポート
import type { AreaType, FilterPanelProps } from '../../utils/types'; // 型定義をインポート
import { AREAS } from '../../utils/constants'; // エリア定数をインポート
import { markerConfig } from '../../utils/config'; // マーカー設定をインポート
import './FilterPanel.css'; // スタイルをインポート

// 初期のエリア表示状態を定義
const INITIAL_VISIBILITY: Record<AreaType, boolean> = Object.keys(AREAS).reduce(
  (acc, area) => ({
    ...acc,
    [area]: area !== 'SNACK' && area !== 'PUBLIC_TOILET' && area !== 'PARKING', // 特定のエリアを除いて表示
  }),
  {} as Record<AreaType, boolean>,
);

export { INITIAL_VISIBILITY }; // 初期表示状態をエクスポート

// FilterPanelコンポーネントの定義
const FilterPanel: React.FC<FilterPanelProps> = ({
  pois, // POIのリスト
  setSelectedPoi, // POIを選択する関数
  setAreaVisibility, // エリアの表示状態を設定する関数
  isFilterPanelOpen, // フィルターパネルが開いているかどうか
  onCloseClick, // フィルターパネルを閉じる関数
}) => {
  // エリアの表示状態を管理するローカルステート
  const [areaVisibility, setLocalAreaVisibility] = useState<
    Record<AreaType, boolean>
  >(() => {
    const savedVisibility = localStorage.getItem('areaVisibility'); // ローカルストレージから表示状態を取得
    return savedVisibility ? JSON.parse(savedVisibility) : INITIAL_VISIBILITY; // 保存された表示状態があれば使用、なければ初期状態
  });

  // エリアの表示状態が変更されたときにローカルストレージに保存し、親コンポーネントに通知
  useEffect(() => {
    localStorage.setItem('areaVisibility', JSON.stringify(areaVisibility)); // ローカルストレージに保存
    setAreaVisibility(areaVisibility); // 親コンポーネントに通知
  }, [areaVisibility, setAreaVisibility]);

  // 各エリアのPOIの数を計算
  const areaCounts = pois.reduce(
    (acc: Record<AreaType, number>, poi) => ({
      ...acc,
      [poi.area]: (acc[poi.area] || 0) + 1, // 各エリアのPOI数をカウント
    }),
    {} as Record<AreaType, number>,
  );

  // エリア情報を配列に変換
  const areas = Object.entries(AREAS).map(([area, name]) => ({
    area: area as AreaType, // エリアタイプ
    name, // エリア名
    count: areaCounts[area as AreaType] ?? 0, // POI数
    isVisible: areaVisibility[area as AreaType], // 表示状態
    color: markerConfig.colors[area as AreaType], // マーカーの色
  }));

  return (
    <div className={`filterpanel-container ${isFilterPanelOpen ? 'open' : ''}`}>
      {isFilterPanelOpen && ( // フィルターパネルが開いている場合に表示
        <div
          role="region"
          aria-label="エリアフィルター"
          className="filter-panel"
        >
          <button className="close-button" onClick={onCloseClick}>
            ×
          </button>
          <div>
            <div>表示するエリア（表示数）</div>
            <div>
              {areas.map(({ area, name, count, isVisible, color }) => ( // 各エリアのフィルタ項目を表示
                <label key={area} className="filter-item">
                  <input
                    type="checkbox"
                    checked={isVisible} // 表示状態
                    onChange={(e) => {
                      setLocalAreaVisibility((prev) => ({
                        ...prev,
                        [area]: e.target.checked, // チェックボックスの状態を更新
                      }));
                      setSelectedPoi(null); // 選択されたPOIをクリア
                    }}
                    aria-label={`${name}を表示 (${count}件)`} // アクセシビリティラベル
                  />
                  <span
                    className="custom-checkbox"
                    style={{ borderColor: color }} // カスタムチェックボックスの色
                  ></span>
                  <div className="filter-details">
                    <span
                      className="marker-color"
                      style={{ backgroundColor: color }} // マーカーの色
                      aria-hidden="true"
                    />
                    <span className="area-name" data-fullname={name}>
                      {name}
                    </span>
                    <span>({count})</span>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FilterPanel; // FilterPanelコンポーネントをエクスポート
