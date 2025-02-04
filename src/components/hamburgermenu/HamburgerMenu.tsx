import React, { useState } from 'react'; // ReactとuseStateフックをインポート
import './HamburgerMenu.css'; // スタイルシートをインポート
import FilterPanel from '../filterpanel/FilterPanel'; // FilterPanelコンポーネントをインポート
import type { Poi, AreaType, LatLngLiteral } from '../../utils/types'; // 型定義をインポート

interface HamburgerMenuProps {
  pois: Poi[]; // POIの配列
  setSelectedPoi: React.Dispatch<React.SetStateAction<Poi | null>>; // POIを設定する関数
  setAreaVisibility: React.Dispatch<
    React.SetStateAction<Record<AreaType, boolean>>
  >; // エリア表示状態を設定する関数
  localAreaVisibility: Record<AreaType, boolean>; // ローカルエリアの表示状態
  setLocalAreaVisibility: React.Dispatch<
    React.SetStateAction<Record<AreaType, boolean>>
  >; // ローカルエリア表示状態を設定する関数
  currentLocation: LatLngLiteral | null; // 現在の位置
  setCurrentLocation: React.Dispatch<
    React.SetStateAction<LatLngLiteral | null>
  >; // 現在の位置を設定する関数
}

const HamburgerMenu: React.FC<HamburgerMenuProps> = ({
  pois,
  setSelectedPoi,
  setAreaVisibility,
  localAreaVisibility,
  setLocalAreaVisibility,
  currentLocation,
  setCurrentLocation,
}) => {
  const [isOpen, setIsOpen] = useState(false); // メニューの開閉状態を管理するステート
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false); // フィルターパネルの開閉状態を管理するステート

  const toggleMenu = () => {
    setIsOpen(!isOpen); // メニューの開閉状態を切り替える
  };

  const handleAreaClick = () => {
    setIsFilterPanelOpen(!isFilterPanelOpen); // フィルターパネルの開閉状態を切り替える
    setIsOpen(false); // メニューを閉じる
  };

  const handleCloseFilterPanel = () => {
    setIsFilterPanelOpen(false); // フィルターパネルを閉じる
  };

  return (
    <div className="hamburger-menu">
      <button className="hamburger-icon" onClick={toggleMenu}>
        <span className="bar"></span> {/* ハンバーガーアイコンのバー */}
        <span className="bar"></span> {/* ハンバーガーアイコンのバー */}
        <span className="bar"></span> {/* ハンバーガーアイコンのバー */}
      </button>
      <nav className={`menu ${isOpen ? 'open' : ''}`}>
        <ul>
          <li>
            <button onClick={handleAreaClick}>表示するエリアを選択</button>{' '}
            {/* エリア選択ボタン */}
          </li>
        </ul>
      </nav>
      {isFilterPanelOpen && (
        <div className="filter-panel-wrapper">
          <FilterPanel
            pois={pois} // POIの配列を渡す
            setSelectedPoi={setSelectedPoi} // POIを設定する関数を渡す
            setAreaVisibility={setAreaVisibility} // エリア表示状態を設定する関数を渡す
            isFilterPanelOpen={isFilterPanelOpen} // フィルターパネルの開閉状態を渡す
            onCloseClick={handleCloseFilterPanel} // フィルターパネルを閉じる関数を渡す
            localAreaVisibility={localAreaVisibility} // ローカルエリアの表示状態を渡す
            setLocalAreaVisibility={setLocalAreaVisibility} // ローカルエリア表示状態を設定する関数を渡す
            currentLocation={currentLocation} // 現在の位置を渡す
            setCurrentLocation={setCurrentLocation} // 現在の位置を設定する関数を渡す
          />
        </div>
      )}
    </div>
  );
};

export default HamburgerMenu; // デフォルトエクスポート
