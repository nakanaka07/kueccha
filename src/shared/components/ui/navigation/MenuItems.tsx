/*
 * 機能: ハンバーガーメニューの項目リストを表示するプレゼンテーショナルコンポーネント
 * 依存関係:
 *   - React
 *   - HamburgerMenu.module.cssスタイルシート
 *   - MENU_ITEMS定数（UI設定）
 * 注意点:
 *   - 各メニュー項目には対応するアクション関数が必要です
 *   - メニュー項目の追加・削除はMENU_ITEMS定数の変更で行います
 */
import React from 'react';
import styles from './MenuItems.module.css';
import { MENU_ITEMS, MenuItem, MenuItemWithHandler } from '../../../../core/constants/ui';

interface MenuItemsProps {
  menuActions: Record<string, () => void>;
}

export const MenuItems: React.FC<MenuItemsProps> = ({ menuActions }) => {
  // ここで型を明確にする
  const items: MenuItemWithHandler[] = MENU_ITEMS.map((item: MenuItem) => ({
    ...item,
    onClick: menuActions[item.action as keyof typeof menuActions] || (() => {}),
  }));

  return (
    <ul className={styles.menuList}>
      {items.map((item, index) => (
        <li key={index} className={styles.menuItem}>
          <button onClick={item.onClick} title={item.title} className={styles.menuButton}>
            {item.icon && <span className={`${styles.icon} ${styles[item.icon]}`} />}
            {item.label}
          </button>
        </li>
      ))}
    </ul>
  );
};
