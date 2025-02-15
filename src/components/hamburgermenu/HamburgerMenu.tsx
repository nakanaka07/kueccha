import React, { useState, useEffect, useRef } from 'react';
import './HamburgerMenu.css';
import FeedbackForm from '../feedback/FeedbackForm';
import FilterPanel from '../filterpanel/FilterPanel';
import SearchBar from '../searchbar/SearchBar';
import SearchResults from '../searchresults/SearchResults';
import type { Poi, AreaType, LatLngLiteral } from '../../utils/types';

interface HamburgerMenuProps {
  pois: Poi[];
  setSelectedPoi: React.Dispatch<React.SetStateAction<Poi | null>>;
  setAreaVisibility: React.Dispatch<
    React.SetStateAction<Record<AreaType, boolean>>
  >;
  localAreaVisibility: Record<AreaType, boolean>;
  setLocalAreaVisibility: React.Dispatch<
    React.SetStateAction<Record<AreaType, boolean>>
  >;
  currentLocation: LatLngLiteral | null;
  setCurrentLocation: React.Dispatch<
    React.SetStateAction<LatLngLiteral | null>
  >;
  setShowWarning: React.Dispatch<React.SetStateAction<boolean>>;
  search: (query: string) => void;
  searchResults: Poi[];
  handleSearchResultClick: (poi: Poi) => void;
}

const HamburgerMenu: React.FC<HamburgerMenuProps> = ({
  pois,
  setSelectedPoi,
  setAreaVisibility,
  localAreaVisibility,
  setLocalAreaVisibility,
  currentLocation,
  setCurrentLocation,
  setShowWarning,
  search,
  searchResults,
  handleSearchResultClick,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const [isFeedbackFormOpen, setIsFeedbackFormOpen] = useState(false);
  const [isSearchBarVisible, setIsSearchBarVisible] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const handleAreaClick = () => {
    setIsFilterPanelOpen(!isFilterPanelOpen);
    setIsOpen(false);
  };

  const handleFeedbackClick = () => {
    setIsFeedbackFormOpen(!isFeedbackFormOpen);
    setIsOpen(false);
  };

  const handleCloseFilterPanel = () => {
    setIsFilterPanelOpen(false);
  };

  const handleCloseFeedbackForm = () => {
    setIsFeedbackFormOpen(false);
  };

  const toggleSearchBar = () => {
    setIsSearchBarVisible(!isSearchBarVisible);
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
          <span className="bar"></span>
          <span className="bar"></span>
          <span className="bar"></span>
        </button>
        <nav className={`menu ${isOpen ? 'open' : ''}`}>
          <ul>
            <li>
              <button onClick={handleAreaClick} title="表示するエリアを選択">
                表示するエリアを選択
              </button>
            </li>
            <li>
              <button onClick={handleFeedbackClick} title="フィードバック">
                フィードバック
              </button>
            </li>
            <li>
              <button onClick={toggleSearchBar} title="検索">
                検索
              </button>
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
          pois={pois}
          setSelectedPoi={setSelectedPoi}
          setAreaVisibility={setAreaVisibility}
          isFilterPanelOpen={isFilterPanelOpen}
          onCloseClick={handleCloseFilterPanel}
          localAreaVisibility={localAreaVisibility}
          setLocalAreaVisibility={setLocalAreaVisibility}
          currentLocation={currentLocation}
          setCurrentLocation={setCurrentLocation}
          setShowWarning={setShowWarning}
        />
      </div>
      {isFeedbackFormOpen && <FeedbackForm onClose={handleCloseFeedbackForm} />}
    </div>
  );
};

export default HamburgerMenu;
