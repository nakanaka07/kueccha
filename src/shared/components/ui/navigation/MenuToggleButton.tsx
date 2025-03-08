/*
 * 機能: ハンバーガーメニューの開閉ボタンを提供するプレゼンテーショナルコンポーネント
 * 依存関係:
 *   - React
 *   - HamburgerMenu.module.cssスタイルシート
 * 注意点:
 *   - アクセシビリティのためにaria-expanded属性とaria-controls属性を含んでいます
 *   - スクリーンリーダー用の非表示テキスト要素が含まれています
 */
import React from 'react';
import styles from './HamburgerMenu.module.css';

interface MenuToggleButtonProps {
  isOpen: boolean;
  onClick: () => void;
}

export const MenuToggleButton: React.FC<MenuToggleButtonProps> = ({ isOpen, onClick }) => {
  return (
    <button
      className={styles.hamburgerIcon}
      onClick={onClick}
      title="メニューを開閉"
      aria-expanded={isOpen}
      aria-controls="menu-content"
    >
      <span className={styles.bar}></span>
      <span className={styles.bar}></span>
      <span className={styles.bar}></span>
      <span className={styles.srOnly}>メニュー</span>
    </button>
  );
};
