import React from 'react';
import { MENU_ITEMS, MenuItem, MenuItemWithHandler } from '../../../../core/constants/ui';

interface MenuItemsProps {
  menuActions: Record<string, () => void>;
}

export const MenuItems: React.FC<MenuItemsProps> = ({ menuActions }) => {
  const items: MenuItemWithHandler[] = MENU_ITEMS.map((item: MenuItem) => ({
    ...item,
    onClick: menuActions[item.action as keyof typeof menuActions] || (() => {}),
  }));

  return (
    <ul>
      {items.map((item, index) => (
        <li key={index}>
          <button onClick={item.onClick} title={item.title}>
            {item.icon && <span />}
            {item.label}
          </button>
        </li>
      ))}
    </ul>
  );
};
