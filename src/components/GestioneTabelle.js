import React from "react";
import { Link } from "react-router-dom";
import "./style.css";
import GestioneReparti from "./GestioneReparti"; 

function GestioneTabelle() {
  return (
    <div className="gestione-tabelle-container">
      <h1>Gestione Tabelle</h1>
      <div className="navigation-buttons">
        <Link to="/reparti" className="btn">
          Gestione Reparti
        </Link>
        <Link to="/stati" className="btn">
          Gestione Stati di Avanzamento
        </Link>
        <Link to="/attivita" className="btn">
          Gestione Attività
        </Link>
        <Link to="/risorse" className="btn">
          Gestione Risorse
        </Link>
      </div>
    </div>
  );
}

export default GestioneTabelle;
