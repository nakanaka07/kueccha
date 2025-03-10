import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { MenuItems } from './MenuItems';
import { MenuToggleButton } from './MenuToggleButton';
import { SearchContainer } from '../../../components/layout/SearchContainer';
import type { Poi } from '../../../../core/types/poi';

interface HamburgerMenuProps {
  pois: Poi[];
  search: (query: string) => void;
  searchResults: Poi[];
  handleSearchResultClick: (poi: Poi) => void;
}

const HamburgerMenu: React.FC<HamburgerMenuProps> = ({ pois, search, searchResults, handleSearchResultClick }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isSearchBarVisible, setIsSearchBarVisible] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const toggleMenu = useCallback(() => {
    setIsOpen((prevIsOpen) => !prevIsOpen);
  }, []);

  const handleClickOutside = useCallback((event: MouseEvent) => {
    if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
      setIsOpen(false);
    }
  }, []);

  const menuActions = useMemo(
    () => ({
      toggleSearchBar: () => {
        setIsSearchBarVisible((prevIsVisible) => !prevIsVisible);
        setIsOpen(false);
      },
    }),
    [],
  );

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [handleClickOutside]);

  return (
    <div ref={menuRef}>
      <div>
        <MenuToggleButton isOpen={isOpen} onClick={toggleMenu} />

        <nav id="menu-content" aria-hidden={!isOpen}>
          <MenuItems menuActions={menuActions} />

          <SearchContainer
            isVisible={isSearchBarVisible}
            pois={pois}
            search={search}
            searchResults={searchResults}
            handleSearchResultClick={handleSearchResultClick}
          />
        </nav>
      </div>
    </div>
  );
};

export default HamburgerMenu;
