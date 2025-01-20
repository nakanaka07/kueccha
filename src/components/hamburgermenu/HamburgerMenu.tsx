import React, { useState } from 'react'; // ReactとuseStateフックをインポート
import './HamburgerMenu.css'; // スタイルをインポート
import FilterPanel from '../filterpanel/FilterPanel'; // FilterPanelコンポーネントをインポート
import type { Poi, AreaType } from '../../utils/types'; // 型定義をインポート

// HamburgerMenuコンポーネントのプロパティの型定義
interface HamburgerMenuProps {
  pois: Poi[]; // POIのリスト
  setSelectedPoi: React.Dispatch<React.SetStateAction<Poi | null>>; // POIを選択する関数
  setAreaVisibility: React.Dispatch<React.SetStateAction<Record<AreaType, boolean>>>; // エリアの表示状態を設定する関数
  onOpenFilterPanel: () => void; // フィルターパネルを開く関数
}

// HamburgerMenuコンポーネントの定義
const HamburgerMenu: React.FC<HamburgerMenuProps> = ({ pois, setSelectedPoi, setAreaVisibility, onOpenFilterPanel }) => {
  const [isOpen, setIsOpen] = useState(false); // メニューの開閉状態を管理するローカルステート
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false); // フィルターパネルの開閉状態を管理するローカルステート

  // メニューの開閉を切り替える関数
  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  // エリア選択ボタンがクリックされたときにフィルターパネルの開閉を切り替える関数
  const handleAreaClick = () => {
    setIsFilterPanelOpen(!isFilterPanelOpen);
    setIsOpen(false); // メニューを閉じる
  };

  // フィルターパネルを閉じる関数
  const handleCloseFilterPanel = () => {
    setIsFilterPanelOpen(false);
  };

  return (
    <div className="hamburger-menu">
      <button className="hamburger-icon" onClick={toggleMenu}>
        <span className="bar"></span>
        <span className="bar"></span>
        <span className="bar"></span>
      </button>
      <nav className={`menu ${isOpen ? 'open' : ''}`}>
        <ul>
          <li>
            <button onClick={handleAreaClick}>表示するエリアを選択</button>
          </li>
        </ul>
      </nav>
      {isFilterPanelOpen && (
        <div className="filter-panel-wrapper">
          <FilterPanel
            pois={pois}
            setSelectedPoi={setSelectedPoi}
            setAreaVisibility={setAreaVisibility}
            isFilterPanelOpen={isFilterPanelOpen}
            onCloseClick={handleCloseFilterPanel}
          />
        </div>
      )}
    </div>
  );
};

export default HamburgerMenu; // HamburgerMenuコンポーネントをエクスポート
