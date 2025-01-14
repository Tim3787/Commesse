import React from "react";
import { Link } from "react-router-dom";
import "./Navbar.css";

function Navbar({ isAuthenticated, userRole, handleLogout }) {
  console.log("Ruolo caricato per navbar:", userRole); // Debug
  console.log("autenticato:", isAuthenticated); // Debug
  console.log("logout:", handleLogout); // Debug

  if (userRole === null) {
    return (
      <nav>
        <p>Caricamento...</p>
      </nav>
    );
  }
 
  return (
    <nav>
    {/* Navbar per tutti gli utenti */}
    {isAuthenticated && (
      <div className="navbar-row user-navbar">
        <ul>
        <li><Link to="/Dashboard">Bacheca</Link></li>
          <li><Link to="/visualizzazione-commesse">Visualizza le commesse</Link></li>
          <li><Link to="/visualizzazione-attivita">Visualizza le attività</Link></li>
          <li><Link to="/calendario-attivita">Calendario delle attività</Link></li>
        </ul>
      </div>
    )}

    {/* Navbar per Manager */}
    {isAuthenticated && (userRole === 2 || userRole === 1) && (
      <div className="navbar-row manager-navbar">
        <ul>
          <li><Link to="/gestione-commesse">Crea o modifica commessa</Link></li>
          <li><Link to="/assegna-attivita">Assegna un'attività</Link></li>
          <li><Link to="/gestione-stati-avanzamento">Aggiorna stati avanzamento</Link>  </li>  
          <li><Link to="/CalendarioCommesse">Calendario stati commesse</Link>  </li>  
        </ul>
      </div>
    )}

    {/* Navbar per Admin */}
    {isAuthenticated && userRole === 1 && (
      <div className="navbar-row admin-navbar">
        <ul>
          <li><Link to="/utenti">Gestione utenti</Link></li>
          <li><Link to="/reparti">Gestione reparti</Link></li>
          <li><Link to="/risorse">Gestione risorse</Link></li>
          <li><Link to="/statiCommessa">Gestione stati commessa</Link></li>         
          <li><Link to="/stati">Gestione stati avanzamento</Link></li>
          <li><Link to="/attivita">Gestione attività</Link></li>
        </ul>
      </div>
    )}

    {/* Logout */}
    {isAuthenticated && (
      <div className="navbar-row logout-navbar">
        <button onClick={handleLogout}>Logout</button>
      </div>
    )}
  </nav>
  );
}

export default Navbar;
