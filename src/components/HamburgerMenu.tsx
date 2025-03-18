import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';

import { MENU_ITEMS } from '../../utils/constants';
import SearchBar from '../searchbar/SearchBar';
import SearchResults from '../searchresults/SearchResults';

import type { HamburgerMenuProps } from '../../utils/types';

const HamburgerMenu: React.FC<HamburgerMenuProps> = ({ pois, search, searchResults, handleSearchResultClick }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isSearchBarVisible, setIsSearchBarVisible] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const toggleMenu = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  const menuActions = useMemo(
    () => ({
      toggleSearchBar: () => {
        setIsSearchBarVisible((prev) => !prev);
        setIsOpen(false);
      },
    }),
    [],
  );

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
    [menuActions],
  );

  return (
    <div ref={menuRef}>
      <div>
        <button onClick={toggleMenu} title="メニューを開閉" aria-expanded={isOpen} aria-controls="menu-content">
          <span />
          <span />
          <span />
          <span>メニュー</span>
        </button>
        <nav id="menu-content" aria-hidden={!isOpen}>
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
              <SearchResults results={searchResults} onResultClick={handleSearchResultClick} />
            </>
          )}
        </nav>
      </div>
    </div>
  );
};

export default HamburgerMenu;
