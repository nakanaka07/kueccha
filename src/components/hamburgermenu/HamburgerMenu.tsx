import React, { useState } from 'react';
import './HamburgerMenu.css';

interface HamburgerMenuProps {
  onAreaClick: () => void;
  onFeedbackClick: () => void;
  onTourClick: () => void;
}

const HamburgerMenu: React.FC<HamburgerMenuProps> = ({
  onAreaClick,
  onFeedbackClick,
  onTourClick,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className="hamburger-menu">
      <button className="hamburger-icon" onClick={toggleMenu}>
        <span className="bar"></span>
        <span className="bar"></span>
        <span className="bar"></span>
      </button>
      <nav className={`menu ${isOpen ? 'open' : ''}`}>
        <ul>
          <li>
            <button onClick={onAreaClick}>表示するエリア</button>
          </li>
          <li>
            <button onClick={onFeedbackClick}>フィードバック</button>
          </li>
          <li>
            <button onClick={onTourClick}>ツアーを開始</button>
          </li>
        </ul>
      </nav>
    </div>
  );
};

export default HamburgerMenu;
