import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from 'react';
import './HamburgerMenu.css';
import { MENU_ITEMS } from '../../utils/constants';
import FeedbackForm from '../feedback/FeedbackForm';
import FilterPanel from '../filterpanel/FilterPanel';
import SearchBar from '../searchbar/SearchBar';
import SearchResults from '../searchresults/SearchResults.module';
import type { HamburgerMenuProps } from '../../utils/types';

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

  const handleCloseFilterPanel = useCallback(() => {
    setIsFilterPanelOpen(false);
  }, []);

  const handleCloseFeedbackForm = useCallback(() => {
    setIsFeedbackFormOpen(false);
  }, []);

  const menuActions = {
    handleAreaClick: () => {
      setIsFilterPanelOpen(true);
      setIsOpen(false);
    },
    handleFeedbackClick: () => {
      setIsFeedbackFormOpen(true);
      setIsOpen(false);
    },
    toggleSearchBar: () => {
      setIsSearchBarVisible(!isSearchBarVisible);
      setIsOpen(false);
    },
  };

  const handleClickOutside = useCallback((event: MouseEvent) => {
    if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
      setIsOpen(false);
    }
  }, []);

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [handleClickOutside]);

  const items = useMemo(
    () =>
      MENU_ITEMS.map((item) => ({
        ...item,
        onClick: menuActions[item.action as keyof typeof menuActions],
      })),
    [menuActions], // menuActions を依存配列に追加
  );

  return (
    <div ref={menuRef}>
      <div className="hamburger-menu">
        <button
          className="hamburger-icon"
          onClick={toggleMenu}
          title="メニューを開閉"
          aria-expanded={isOpen}
          aria-controls="menu-content"
        >
          <span className="bar"></span>
          <span className="bar"></span>
          <span className="bar"></span>
          <span className="sr-only">メニュー</span>
        </button>
        <nav
          className={`menu ${isOpen ? 'open' : ''}`}
          id="menu-content"
          aria-hidden={!isOpen}
        >
          <ul>
            {items.map((item, index) => (
              <li key={index}>
                <button onClick={item.onClick} title={item.title}>
                  {item.label}
                </button>
              </li>
            ))}
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
