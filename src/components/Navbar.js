import React, { useState } from "react";
import { Link } from "react-router-dom";
import "./Navbar.css";

function Navbar({ isAuthenticated, userRole, handleLogout }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  if (!isAuthenticated) {
    return null;
  }

  const navLinks = {
    user: [
      { to: "/Dashboard", label: "Bacheca" },
      { to: "/visualizzazione-commesse", label: "Visualizza le commesse" },
      { to: "/visualizzazione-attivita", label: "Visualizza le attività" },
      { to: "/calendario-attivita", label: "Calendario delle attività" },
    ],
    manager: [
      { to: "/gestione-commesse", label: "Crea o modifica commessa" },
      { to: "/assegna-attivita", label: "Assegna un'attività" },
      { to: "/gestione-stati-avanzamento", label: "Aggiorna stati avanzamento" },
      { to: "/CalendarioCommesse", label: "Calendario stati commesse" },
    ],
    admin: [
      { to: "/utenti", label: "Gestione utenti" },
      { to: "/reparti", label: "Gestione reparti" },
      { to: "/risorse", label: "Gestione risorse" },
      { to: "/statiCommessa", label: "Gestione stati commessa" },
      { to: "/stati", label: "Gestione stati avanzamento" },
      { to: "/attivita", label: "Gestione attività" },
    ],
  };

  const renderLinks = (links) =>
    links.map((link, index) => (
      <li key={index}>
        <Link to={link.to}>{link.label}</Link>
      </li>
    ));

  return (
    <nav className="navbar">
      <div className="navbar-header">
        <button className="menu-toggle" onClick={() => setIsMenuOpen(!isMenuOpen)}>
          ☰ Menu
        </button>
        <button className="logout-button" onClick={handleLogout}>
          Logout
        </button>
      </div>
      <div className={`menu ${isMenuOpen ? "open" : ""}`}>
        <ul className="menu-list">
          {renderLinks(navLinks.user)}
          {userRole <= 2 && renderLinks(navLinks.manager)}
          {userRole === 1 && renderLinks(navLinks.admin)}
        </ul>
      </div>
    </nav>
  );
}

export default Navbar;

