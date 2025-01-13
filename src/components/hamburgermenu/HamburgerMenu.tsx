import React, { useState } from 'react';
import './HamburgerMenu.css';
import FilterPanel from '../filterpanel/FilterPanel';
import type { Poi, AreaType } from '../../utils/types';

interface HamburgerMenuProps {
  pois: Poi[];
  setSelectedPoi: (poi: Poi | null) => void;
  setAreaVisibility: (visibility: Record<AreaType, boolean>) => void;
}

const HamburgerMenu: React.FC<HamburgerMenuProps> = ({
  pois,
  setSelectedPoi,
  setAreaVisibility,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const handleAreaClick = () => {
    setIsFilterPanelOpen(!isFilterPanelOpen);
    setIsOpen(false); // メニューを閉じる
  };

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
        <FilterPanel
          pois={pois}
          setSelectedPoi={setSelectedPoi}
          setAreaVisibility={setAreaVisibility}
          isFilterPanelOpen={isFilterPanelOpen}
          onClose={handleCloseFilterPanel}
        />
      )}
    </div>
  );
};

export default HamburgerMenu;
