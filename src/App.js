import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar";
import LoginRegister from "./components/pages/LoginRegister";
import Dashboard from "./components/pages/Dashboard";
import VisualizzazioneCommesse from "./components/pages/VisualizzazioneCommesse";
import VisualizzazioneAttivita from "./components/pages/VisualizzazioneAttivita";
import CalendarioAttivita from "./components/pages/CalendarioAttivita";
import GestioneCommesse from "./components/pages/GestioneCommesse";
import AssegnaAttivita from "./components/pages/AssegnaAttivita";
import GestioneUtenti from "./components/pages/GestioneUtenti";
import GestioneReparti from "./components/pages/GestioneReparti";
import GestioneRisorse from "./components/pages/GestioneRisorse";
import GestioneStati from "./components/pages/GestioneStati";
import GestioneAttivita from "./components/pages/GestioneAttivita";
import GestioneStatiCommessa from "./components/pages/GestioneStatiCommessa";
import CalendarioCommesse from "./components/pages/CalendarioCommesse";
import NuovaPagina from "./components/pages/NuovaPagina";
import NotificheStati from "./components/pages/NotificheStati";


function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState(null);

  // Gestione login
  const handleLogin = (token, role) => {
    localStorage.setItem("token", token);
    localStorage.setItem("role", role);
    setIsAuthenticated(true);
    setUserRole(parseInt(role, 10)); // Converti in numero
  };

  // Gestione logout
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    setIsAuthenticated(false);
    setUserRole(null);
  };

  // Carica token e ruolo da localStorage all'avvio dell'app
  useEffect(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");
    if (token && role) {
      setIsAuthenticated(true);
      setUserRole(parseInt(role, 10)); // Converti in numero
    } else {
      setIsAuthenticated(false);
    }
  }, []);

  return (
    <Router>
      <div>
        {isAuthenticated && userRole !== null && (
          <Navbar isAuthenticated={isAuthenticated} userRole={userRole} handleLogout={handleLogout} />
        )}
        <Routes>
          {/* Rotta di default */}
          <Route
            path="/"
            element={isAuthenticated ? <Navigate to="/dashboard" /> : <Navigate to="/login" />}
          />
          
          {/* Rotta di login */}
          <Route path="/login" element={<LoginRegister onLogin={handleLogin} />} />
          
          {/* Rotte protette */}
          <Route
            path="/dashboard"
            element={isAuthenticated ? <Dashboard /> : <Navigate to="/login" />}
          />
          <Route
            path="/visualizzazione-commesse"
            element={isAuthenticated ? <VisualizzazioneCommesse /> : <Navigate to="/login" />}
          />
          <Route
            path="/visualizzazione-attivita"
            element={isAuthenticated ? <VisualizzazioneAttivita /> : <Navigate to="/login" />}
          />
          <Route
            path="/calendario-attivita"
            element={isAuthenticated ? <CalendarioAttivita /> : <Navigate to="/login" />}
          />
          <Route
            path="/gestione-commesse"
            element={isAuthenticated && userRole <= 2 ? <GestioneCommesse /> : <Navigate to="/login" />}
          />
          <Route
            path="/assegna-attivita"
            element={isAuthenticated && userRole <= 2 ? <AssegnaAttivita /> : <Navigate to="/login" />}
          />
          <Route
            path="/gestione-stati-avanzamento"
            element={isAuthenticated && userRole <= 2 ? <NuovaPagina /> : <Navigate to="/login" />}
          />
          <Route
            path="/CalendarioCommesse"
            element={isAuthenticated && userRole <= 2 ? <CalendarioCommesse /> : <Navigate to="/login" />}
          />
          <Route
            path="/utenti"
            element={isAuthenticated && userRole === 1 ? <GestioneUtenti /> : <Navigate to="/login" />}
          />
          <Route
            path="/reparti"
            element={isAuthenticated && userRole === 1 ? <GestioneReparti /> : <Navigate to="/login" />}
          />
          <Route
            path="/risorse"
            element={isAuthenticated && userRole === 1 ? <GestioneRisorse /> : <Navigate to="/login" />}
          />
          <Route
            path="/stati"
            element={isAuthenticated && userRole === 1 ? <GestioneStati /> : <Navigate to="/login" />}
          />
                    <Route
            path="/statiCommessa"
            element={isAuthenticated && userRole === 1 ? <GestioneStatiCommessa /> : <Navigate to="/login" />}
          />
          <Route
            path="/attivita"
            element={isAuthenticated && userRole === 1 ? <GestioneAttivita /> : <Navigate to="/login" />}
          />
          <Route
            path="/NotificheStati"
            element={isAuthenticated && userRole === 1 ? <NotificheStati /> : <Navigate to="/login" />}
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
