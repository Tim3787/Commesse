import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

import LoginRegister from "./components/pages/00-LoginRegister";

import GestioneUtenti from "./components/pages/configuration/GestioneUtenti";
import GestioneReparti from "./components/pages/configuration/GestioneReparti";
import GestioneRisorse from "./components/pages/configuration/GestioneRisorse";
import GestioneStati from "./components/pages/configuration/GestioneStati";
import GestioneAttivita from "./components/pages/configuration/GestioneAttivita";
import GestioneStatiCommessa from "./components/pages/configuration/GestioneStatiCommessa";

import GestioneCommesse from "./components/pages/CreaCommesse";
import Navbar from "./components/common/Navbar";
import Dashboard from "./components/pages/Dashboard-user" ;
import VisualizzazioneCommesse from "./components/pages/Visualizza-Commesse";
import VisualizzazioneAttivita from "./components/pages/Gantt-Attivita";
import CalendarioAttivita from "./components/pages/calendars/CalendarioAttivita";
import AssegnaAttivita from "./components/pages/TutteLeAttivita";
import StatiAvanzamento from "./components/pages/StatoAvanzamento";
import StatoAvanzamentoReparti from "./components/pages/StatoAvanzamento-reparto";
import CalendarioCommesse from "./components/pages/calendars/CalendarioCommesse";
import DashboardReparto from "./components/pages/Dashboard-reparto";
import ProtectedRoute from "./components/utils/ProtectedRoute";
import { jwtDecode } from "jwt-decode";
import TrelloBoardSoftware from "./components/pages/trello/TrelloBoardSoftware";
import TrelloBoardElettrico from "./components/pages/trello/TrelloBoardElettrico";
import MatchCommesse from "./components/pages/trello/TrelloMatchCommesse";

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
    { path: "/CalendarioCommesse", component: <CalendarioCommesse />},
    { path: "/Dashboard/:reparto", component: <DashboardReparto />, requiredRole: 2  },
    //{ path: "/DashboardElettrico", component: <DashboardElettrico />, requiredRole: 2  },
    //{ path: "/DashboardQuadri", component: <DashboardQuadri />, requiredRole: 2  },
    //{ path: "/DashboardService", component: <DashboardService/>, requiredRole: 2  },
    { path: "/gestione-commesse", component: <GestioneCommesse />, requiredRole: 2 },
    { path: "/assegna-attivita", component: <AssegnaAttivita />, requiredRole: 2 },
    { path: "/StatoAvanzamento/:reparto", component: <StatoAvanzamentoReparti />, requiredRole: 2 },

    { path: "/StatoAvanzamento:", component: <StatiAvanzamento />, requiredRole: 2 },
    //{ path: "/StatoAvanzamentoElettrico", component: <StatoAvanzamentoElettrico />, requiredRole: 2 },
    //{ path: "/StatoAvanzamentoQuadri", component: <StatoAvanzamentoQuadri />, requiredRole: 2 },
    { path: "/utenti", component: <GestioneUtenti />, requiredRole: 1 },
    { path: "/reparti", component: <GestioneReparti />, requiredRole: 1 },
    { path: "/risorse", component: <GestioneRisorse />, requiredRole: 1 },
    { path: "/stati", component: <GestioneStati />, requiredRole: 1 },
    { path: "/statiCommessa", component: <GestioneStatiCommessa />, requiredRole: 1 },
    { path: "/attivita", component: <GestioneAttivita />, requiredRole: 1 },
    { path: "/TrelloBoardSoftware", component: <TrelloBoardSoftware />, requiredRole: 1 },
    { path: "/TrelloBoardElettrico", component: <TrelloBoardElettrico/>, requiredRole: 1 },
    { path: "/MatchCommesse", component: <MatchCommesse/>, requiredRole: 1 },
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
