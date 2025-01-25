import React, { useState } from 'react';
import './HamburgerMenu.css';
import FilterPanel from '../filterpanel/FilterPanel';
import type { Poi, AreaType } from '../../utils/types';

interface HamburgerMenuProps {
  pois: Poi[];
  setSelectedPoi: React.Dispatch<React.SetStateAction<Poi | null>>;
  setAreaVisibility: React.Dispatch<React.SetStateAction<Record<AreaType, boolean>>>;
  localAreaVisibility: Record<AreaType, boolean>;
  setLocalAreaVisibility: React.Dispatch<React.SetStateAction<Record<AreaType, boolean>>>;
}

const HamburgerMenu: React.FC<HamburgerMenuProps> = ({
  pois,
  setSelectedPoi,
  setAreaVisibility,
  localAreaVisibility,
  setLocalAreaVisibility,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const handleAreaClick = () => {
    setIsFilterPanelOpen(!isFilterPanelOpen);
    setIsOpen(false);
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
        <div className="filter-panel-wrapper">
          <FilterPanel
            pois={pois}
            setSelectedPoi={setSelectedPoi}
            setAreaVisibility={setAreaVisibility}
            isFilterPanelOpen={isFilterPanelOpen}
            onCloseClick={handleCloseFilterPanel}
            localAreaVisibility={localAreaVisibility}
            setLocalAreaVisibility={setLocalAreaVisibility}
          />
        </div>
      )}
    </div>
  );
};

export default HamburgerMenu;
