import React from 'react';

interface MenuToggleButtonProps {
  isOpen: boolean;
  onClick: () => void;
}

export const MenuToggleButton: React.FC<MenuToggleButtonProps> = ({ isOpen, onClick }) => {
  return (
    <button onClick={onClick} title="メニューを開閉" aria-expanded={isOpen} aria-controls="menu-content">
      <span></span>
      <span></span>
      <span></span>
      <span>メニュー</span>
    </button>
  );
};
