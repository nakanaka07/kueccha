import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import styles from './HamburgerMenu.module.css';
import { MENU_ITEMS } from '../../constants/ui';
import { SearchBar } from '../../features/search/components/SearchBar';
import { SearchResults } from '../../features/search/components/SearchResults';
import type { HamburgerMenuProps } from '../../types/filter';

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

  const items = useMemo(
    () =>
      MENU_ITEMS.map((item) => ({
        ...item,
        onClick: menuActions[item.action as keyof typeof menuActions],
      })),
    [menuActions],
  );

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [handleClickOutside]);

  return (
    <div ref={menuRef}>
      <div className={styles.hamburgerMenu}>
        <button
          className={styles.hamburgerIcon}
          onClick={toggleMenu}
          title="メニューを開閉"
          aria-expanded={isOpen}
          aria-controls="menu-content"
        >
          <span className={styles.bar}></span>
          <span className={styles.bar}></span>
          <span className={styles.bar}></span>
          <span className={styles.srOnly}>メニュー</span>
        </button>
        <nav className={`${styles.menu} ${isOpen ? styles.open : ''}`} id="menu-content" aria-hidden={!isOpen}>
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
