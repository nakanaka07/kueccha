/*
 * 機能: ハンバーガーメニューのメインコンポーネント（開閉状態管理とサブコンポーネントの統合）
 * 依存関係:
 *   - React（useState, useEffect, useRef, useCallback, useMemo）
 *   - HamburgerMenu.module.cssスタイルシート
 *   - MenuItems, MenuToggleButton, SearchContainerコンポーネント
 *   - HamburgerMenuProps型定義
 * 注意点:
 *   - メニュー外のクリックでメニューが閉じる動作があります
 *   - 検索バー表示とメニュー表示は排他的な関係です（検索バー表示時にメニューは閉じる）
 */
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import styles from './HamburgerMenu.module.css';
import { MenuItems } from './MenuItems';
import { MenuToggleButton } from './MenuToggleButton';
import { SearchContainer } from './SearchContainer';
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

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [handleClickOutside]);

  return (
    <div ref={menuRef}>
      <div className={styles.hamburgerMenu}>
        <MenuToggleButton isOpen={isOpen} onClick={toggleMenu} />

        <nav className={`${styles.menu} ${isOpen ? styles.open : ''}`} id="menu-content" aria-hidden={!isOpen}>
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
