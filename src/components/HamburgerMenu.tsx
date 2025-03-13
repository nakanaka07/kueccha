// Reactと必要なフックをインポート
import React, {
  useState, // 状態管理のためのフック
  useEffect, // 副作用を扱うためのフック
  useRef, // DOM要素を参照するためのフック
  useCallback, // メモ化されたコールバックを作成するためのフック
  useMemo, // メモ化された値を作成するためのフック
} from 'react';
// CSSファイルをインポート
import './HamburgerMenu.module.css';
// 定数をインポート
import { MENU_ITEMS } from '../../utils/constants';
// 検索バーと検索結果コンポーネントをインポート
import SearchBar from '../searchbar/SearchBar';
import SearchResults from '../searchresults/SearchResults';
// 型定義をインポート
import type { HamburgerMenuProps } from '../../utils/types';

// HamburgerMenuコンポーネントを定義
const HamburgerMenu: React.FC<HamburgerMenuProps> = ({
  pois, // POI（ポイントオブインタレスト）のデータ
  search, // 検索関数
  searchResults, // 検索結果
  handleSearchResultClick, // 検索結果クリック時のハンドラー
}) => {
  // メニューの開閉状態を管理する状態変数
  const [isOpen, setIsOpen] = useState(false);
  // 検索バーの表示状態を管理する状態変数
  const [isSearchBarVisible, setIsSearchBarVisible] = useState(false);
  // メニューのDOM要素を参照するためのref
  const menuRef = useRef<HTMLDivElement>(null);

  // メニューの開閉をトグルする関数
  const toggleMenu = useCallback(() => {
    setIsOpen((prevIsOpen) => !prevIsOpen);
  }, [isOpen]);

  // メニューアクションをメモ化してパフォーマンスを最適化
  const menuActions = useMemo(
    () => ({
      toggleSearchBar: () => {
        setIsSearchBarVisible((prevIsVisible) => !prevIsVisible);
        setIsOpen(false);
      },
    }),
    [isSearchBarVisible],
  );

  // メニューの外側をクリックしたときにメニューを閉じる関数
  const handleClickOutside = useCallback((event: MouseEvent) => {
    if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
      setIsOpen(false);
    }
  }, []);

  // コンポーネントのマウント時とアンマウント時にクリックイベントリスナーを追加/削除
  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [handleClickOutside]);

  // メニューアイテムをメモ化してパフォーマンスを最適化
  const items = useMemo(
    () =>
      MENU_ITEMS.map((item) => ({
        ...item,
        onClick: menuActions[item.action as keyof typeof menuActions],
      })),
    [menuActions],
  );

  return (
    // メニューのコンテナ
    <div ref={menuRef}>
      <div className="hamburger-menu">
        {/* ハンバーガーアイコン */}
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
        {/* メニューのナビゲーション */}
        <nav className={`menu ${isOpen ? 'open' : ''}`} id="menu-content" aria-hidden={!isOpen}>
          <ul>
            {items.map((item, index) => (
              <li key={index}>
                <button onClick={item.onClick} title={item.title}>
                  {item.label}
                </button>
              </li>
            ))}
          </ul>
          {/* 検索バーと検索結果 */}
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

// コンポーネントをエクスポート
export default HamburgerMenu;
