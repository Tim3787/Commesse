// BurgerMenu.js
import React from 'react';
import { slide as Menu } from 'react-burger-menu';
import './BurgerMenu.css'; // Puoi creare un file CSS per personalizzare lo stile

const BurgerMenu = () => {
  return (
    <Menu>
      <a className="menu-item" href="/">
        Home
      </a>
      <a className="menu-item" href="/about">
        Chi siamo
      </a>
      <a className="menu-item" href="/services">
        Servizi
      </a>
      <a className="menu-item" href="/contact">
        Contatti
      </a>
    </Menu>
  );
};

export default BurgerMenu;