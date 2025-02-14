import React, { useState, useEffect, useRef } from 'react'; // useEffectとuseRefを追加
import './HamburgerMenu.css'; // スタイルシートをインポート
import FilterPanel from '../filterpanel/FilterPanel'; // FilterPanelコンポーネントをインポート
import FeedbackForm from '../feedback/FeedbackForm'; // FeedbackFormコンポーネート
import SearchBar from '../searchbar/SearchBar'; // SearchBarをインポーネート
import SearchResults from '../searchresults/SearchResults'; // SearchResultsをインポート
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
  setShowWarning: React.Dispatch<React.SetStateAction<boolean>>; // 追加
  search: (query: string) => void; // 検索関数
  searchResults: Poi[]; // 検索結果
  handleSearchResultClick: (poi: Poi) => void; // 検索結果クリックハンドラー
}

const HamburgerMenu: React.FC<HamburgerMenuProps> = ({
  pois,
  setSelectedPoi,
  setAreaVisibility,
  localAreaVisibility,
  setLocalAreaVisibility,
  currentLocation,
  setCurrentLocation,
  setShowWarning, // 追加
  search,
  searchResults,
  handleSearchResultClick,
}) => {
  const [isOpen, setIsOpen] = useState(false); // メニューの開閉状態を管理するステート
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false); // フィルターパネルの開閉状態を管理するステート
  const [isFeedbackFormOpen, setIsFeedbackFormOpen] = useState(false); // フィードバックフォームの開閉状態を管理するステート
  const [isSearchBarVisible, setIsSearchBarVisible] = useState(false); // 検索バーの表示状態を管理するステート
  const menuRef = useRef<HTMLDivElement>(null); // メニューの参照を保持するためのref

  const toggleMenu = () => {
    setIsOpen(!isOpen); // メニューの開閉状態を切り替える
  };

  const handleAreaClick = () => {
    setIsFilterPanelOpen(!isFilterPanelOpen); // フィルターパネルの開閉状態を切り替える
    setIsOpen(false); // メニューを閉じる
  };

  const handleFeedbackClick = () => {
    setIsFeedbackFormOpen(!isFeedbackFormOpen); // フィードバックフォームの開閉状態を切り替える
    setIsOpen(false); // メニューを閉じる
  };

  const handleCloseFilterPanel = () => {
    setIsFilterPanelOpen(false); // フィルターパネルを閉じる
  };

  const handleCloseFeedbackForm = () => {
    setIsFeedbackFormOpen(false); // フィードバックフォームを閉じる
  };

  const toggleSearchBar = () => {
    setIsSearchBarVisible(!isSearchBarVisible); // 検索バーの表示状態を切り替える
  };

  const handleClickOutside = (event: MouseEvent) => {
    if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
      setIsOpen(false);
    }
  };

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div ref={menuRef}>
      <div className="hamburger-menu">
        <button
          className="hamburger-icon"
          onClick={toggleMenu}
          title="メニューを開閉"
        >
          <span className="bar"></span> {/* ハンバーガーアイコンのバー */}
          <span className="bar"></span> {/* ハンバーガーアイコンのバー */}
          <span className="bar"></span> {/* ハンバーガーアイコンのバー */}
        </button>
        <nav className={`menu ${isOpen ? 'open' : ''}`}>
          <ul>
            <li>
              <button onClick={handleAreaClick} title="表示するエリアを選択">
                表示するエリアを選択
              </button>{' '}
              {/* エリア選択ボタン */}
            </li>
            <li>
              <button onClick={handleFeedbackClick} title="フィードバック">
                フィードバック
              </button>{' '}
              {/* フィードバックボタン */}
            </li>
            <li>
              <button onClick={toggleSearchBar} title="検索">
                検索
              </button>{' '}
              {/* 「検索」ボタンの追加 */}
            </li>
          </ul>
          {isSearchBarVisible && (
            <>
              <SearchBar onSearch={search} pois={pois} />
              <SearchResults
                results={searchResults}
                onResultClick={handleSearchResultClick}
              />
            </>
          )}
        </nav>
      </div>
      <div
        className={`filter-panel-wrapper ${isFilterPanelOpen ? 'open' : ''}`}
      >
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
          setShowWarning={setShowWarning} // 追加
        />
      </div>
      {isFeedbackFormOpen && <FeedbackForm onClose={handleCloseFeedbackForm} />}
    </div>
  );
};

export default HamburgerMenu; // デフォルトエクスポート
