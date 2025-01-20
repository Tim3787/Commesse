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
import GestioneStatiAvanzamento from "./components/pages/NuovaPagina";
import StatoAvanzamentoSoftware from "./components/pages/StatoAvanzamentoSoftware";
import CalendarioCommesse from "./components/pages/CalendarioCommesse";
import NotificheStati from "./components/pages/NotificheStati";
import DashboardSoftware from "./components/pages/DashboardSoftware";
import ProtectedRoute from "./components/ProtectedRoute";
import { jwtDecode } from "jwt-decode";


function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const isTokenValid = (token) => {
    try {
      const decoded = jwtDecode(token);
      const currentTime = Date.now() / 1000; // Tempo corrente in secondi
      return decoded.exp > currentTime; // Controlla se il token è ancora valido
    } catch (error) {
      return false; // Il token non è valido
    }
  };
  // Carica token e ruolo da sessionStorage all'avvio dell'app
  useEffect(() => {
    const token = sessionStorage.getItem("token");
    if (token && isTokenValid(token)) {
      setIsAuthenticated(true);
      setUserRole(parseInt(sessionStorage.getItem("role"), 10));
    } else {
      sessionStorage.removeItem("token");
      sessionStorage.removeItem("role");
      setIsAuthenticated(false);
      setUserRole(null);
    }
  }, []);
  // Gestione login
  const handleLogin = (token, role) => {
    sessionStorage.setItem("token", token);
    sessionStorage.setItem("role", role);
    setIsAuthenticated(true);
    setUserRole(parseInt(role, 10));
  };

  // Gestione logout
  const handleLogout = () => {
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("role");
    setIsAuthenticated(false);
    setUserRole(null);
  };
  
  useEffect(() => {
    let logoutTimer;
  
    if (isAuthenticated) {
      const token = sessionStorage.getItem("token");
      const decoded = jwtDecode(token);
      const timeToExpiration = decoded.exp * 1000 - Date.now(); // Tempo rimanente in millisecondi
  
      logoutTimer = setTimeout(() => {
        handleLogout();
        alert("Sessione scaduta. Effettua nuovamente il login.");
      }, timeToExpiration);
    }
  
    return () => clearTimeout(logoutTimer); // Cancella il timer al logout o smontaggio
  }, [isAuthenticated]);
  
  useEffect(() => {
      const token = sessionStorage.getItem("token");
      const role = sessionStorage.getItem("role");
    
      if (token && isTokenValid(token)) {
        setIsAuthenticated(true);
        setUserRole(parseInt(role, 10));
      } else {
        sessionStorage.removeItem("token");
        sessionStorage.removeItem("role");
        setIsAuthenticated(false);
        setUserRole(null);
      }
    }, []);


  const routes = [
    { path: "/dashboard", component: <Dashboard /> },
    { path: "/visualizzazione-commesse", component: <VisualizzazioneCommesse /> },
    { path: "/visualizzazione-attivita", component: <VisualizzazioneAttivita /> },
    { path: "/calendario-attivita", component: <CalendarioAttivita /> },
    { path: "/DashboardSoftware", component: <DashboardSoftware />, requiredRole: 1  },
    { path: "/gestione-commesse", component: <GestioneCommesse />, requiredRole: 2 },
    { path: "/assegna-attivita", component: <AssegnaAttivita />, requiredRole: 2 },
    { path: "/gestione-stati-avanzamento", component: <GestioneStatiAvanzamento />, requiredRole: 2 },
    { path: "/CalendarioCommesse", component: <CalendarioCommesse />, requiredRole: 2 },
    { path: "/utenti", component: <GestioneUtenti />, requiredRole: 1 },
    { path: "/reparti", component: <GestioneReparti />, requiredRole: 1 },
    { path: "/risorse", component: <GestioneRisorse />, requiredRole: 1 },
    { path: "/stati", component: <GestioneStati />, requiredRole: 1 },
    { path: "/statiCommessa", component: <GestioneStatiCommessa />, requiredRole: 1 },
    { path: "/attivita", component: <GestioneAttivita />, requiredRole: 1 },
    { path: "/NotificheStati", component: <NotificheStati />, requiredRole: 1 },
    { path: "/StatoAvanzamentoSoftware", component: <StatoAvanzamentoSoftware />, requiredRole: 1 },
  ];

  return (
    <Router>
      <div>
        {isAuthenticated && userRole !== null && (
          <Navbar isAuthenticated={isAuthenticated} userRole={userRole} handleLogout={handleLogout} />
        )}
        <Routes>
  {/* Rotta di login */}
  <Route path="/login" element={<LoginRegister onLogin={handleLogin} />} />

  {/* Rotta di default */}
  <Route path="/" element={<Navigate to="/dashboard" />} />

  {/* Rotte protette */}
  {routes.map(({ path, component, requiredRole }) => (
    <Route
      key={path}
      path={path}
      element={
        <ProtectedRoute requiredRole={requiredRole}>
          {component}
        </ProtectedRoute>
      }
    />
  ))}
</Routes>
      </div>
    </Router>
  );
}

export default App;
