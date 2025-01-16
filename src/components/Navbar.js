import React from "react";
import { Link } from "react-router-dom";
import "./Navbar.css";

function Navbar({ isAuthenticated, userRole, handleLogout }) {
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

  if (userRole === null) {
    return (
      <nav>
        <p>Caricamento...</p>
      </nav>
    );
  }
 
  const renderLinks = (links) =>
    links.map((link, index) => (
      <li key={index}>
        <Link to={link.to}>{link.label}</Link>
      </li>
    ));

  return (
    <nav>
      <div className="navbar-row user-navbar">
        <ul>{renderLinks(navLinks.user)}</ul>
      </div>
      {userRole <= 2 && (
        <div className="navbar-row manager-navbar">
          <ul>{renderLinks(navLinks.manager)}</ul>
        </div>
      )}
      {userRole === 1 && (
        <div className="navbar-row admin-navbar">
          <ul>{renderLinks(navLinks.admin)}</ul>
        </div>
      )}
      <div className="navbar-row logout-navbar">
        <button onClick={handleLogout}>Logout</button>
      </div>
    </nav>
  );
}

export default Navbar;
