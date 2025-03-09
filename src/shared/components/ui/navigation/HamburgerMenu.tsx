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
import { SearchContainer } from '../../../components/layout/SearchContainer';
import type { Poi } from '../../../../core/types/poi';

// 修正されたprops型定義
interface HamburgerMenuProps {
  pois: Poi[];
  search: (query: string) => void; // string型から関数型に変更
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
      <div className={styles.hamburgerMenu}>
        <MenuToggleButton isOpen={isOpen} onClick={toggleMenu} />

        <nav className={`${styles.menu} ${isOpen ? styles.open : ''}`} id="menu-content" aria-hidden={!isOpen}>
          <MenuItems menuActions={menuActions} />

          <SearchContainer
            isVisible={isSearchBarVisible}
            pois={pois}
            search={search} // これで型が一致
            searchResults={searchResults} // これで型が一致
            handleSearchResultClick={handleSearchResultClick} // これで型が一致
          />
        </nav>
      </div>
    </div>
  );
};

export default HamburgerMenu;
