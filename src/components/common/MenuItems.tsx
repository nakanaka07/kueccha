// MenuItems.tsx
import React from 'react';
import styles from './HamburgerMenu.module.css';
import { MENU_ITEMS } from '../../constants/ui';

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