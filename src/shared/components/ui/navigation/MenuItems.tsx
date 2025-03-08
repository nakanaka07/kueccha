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
import styles from './HamburgerMenu.module.css';
import { MENU_ITEMS } from '../constants/ui';

interface MenuItemsProps {
  menuActions: Record<string, () => void>;
}

export const MenuItems: React.FC<MenuItemsProps> = ({ menuActions }) => {
  const items = MENU_ITEMS.map((item) => ({
    ...item,
    onClick: menuActions[item.action as keyof typeof menuActions],
  }));

  return (
    <ul>
      {items.map((item, index) => (
        <li key={index}>
          <button onClick={item.onClick} title={item.title}>
            {item.label}
          </button>
        </li>
      ))}
    </ul>
  );
};
