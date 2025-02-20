import React, { useState, useEffect } from "react";
import axios from "axios";

// Client API configurato (ad es. con interceptors, baseURL, ecc.)
import apiClient from "../src/components/config/axiosConfig";

// React Router: BrowserRouter, Routes, Route e Navigate per la navigazione
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

// Import delle pagine e dei componenti principali

//Navbar
import Navbar from "./components/common/Navbar";

//Utente
import LoginRegister from "./components/pages/00-LoginRegister";
import ResetPassword from './components/pages/00-ResetPassword';
import Notifications from "./components/pages/00-Notifications";
import Dashboard from "./components/pages/00-Dashboard-user";

//Gestione tabelle ed utenti
import GestioneTabelle from "./components/pages/01-GestioneTabelle";
import GestioneUtenti from "./components/pages/01-GestioneUtenti";

//Indicizzati per reparto
import DashboardReparto from "./components/pages/02-Dashboard-reparto";
import StatoAvanzamentoReparti from "./components/pages/02-StatoAvanzamento-reparto";

//Calendari
import CalendarioCommesse from "./components/pages/05-CalendarioCommesse";
import CalendarioAttivita from "./components/pages/05-CalendarioAttivita";
import VisualizzazioneAttivita from "./components/pages/05-Gantt-Attivita";

//Visualizza tutto
import VisualizzazioneCommesse from "./components/pages/06-VisualizzaTutteLeCommesse";
import VisualizzaTutteLeAttivita from "./components/pages/06-VisualizzaTutteLeAttivita";
import StatiAvanzamento from "./components/pages/06-VisualizzaStatoAvanzamento";

//Attività e commesse
import GestioneCommesse from "./components/pages/07-GestioneCommesse";

// Trello
import TrelloBoardSoftware from "./components/pages/08-TrelloBoardSoftware";
import TrelloBoardElettrico from "./components/pages/08-TrelloBoardElettrico";
import MatchCommesse from "./components/pages/08-TrelloMatchCommesse";

//Varie
import PrenotazioneSale from "./components/pages/09-PrenotazioneSale";

// Rotte protette
import ProtectedRoute from "./components/utils/ProtectedRoute";

// Import per il token e per la gestione delle notifiche (Firebase)
import { getDeviceToken } from "../src/components/services/firebase";

// Import jwt-decode (utilizzato per verificare e rinnovare il token)
import { jwtDecode } from "jwt-decode";

// Import per le notifiche (Toastify)
import "react-toastify/dist/ReactToastify.css";
// (Assicurati di aver configurato anche toast se usato, ad esempio, in altri componenti)


// =============================
// COMPONENTE: App
// =============================
function App() {
  // ------------------------------------------------------
  // Stato dell'applicazione: autenticazione e ruolo utente
  // ------------------------------------------------------
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState(null);

  // ------------------------------------------------------
  // Funzione per verificare se il token JWT è valido
  // ------------------------------------------------------
  const isTokenValid = (token) => {
    try {
      const decoded = jwtDecode(token);
      const currentTime = Date.now() / 1000;
      return decoded.exp > currentTime;
    } catch (error) {
      console.error("Errore nella decodifica del token JWT:", error);
      return false;
    }
  };

  // ------------------------------------------------------
  // Imposta lo stato di autenticazione e ruolo al caricamento dell'app
  // ------------------------------------------------------
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

  // ------------------------------------------------------
  // Registrazione del device token per le notifiche push
  // ------------------------------------------------------
  const registerDeviceToken = async () => {
    // Richiede il permesso per le notifiche
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      console.error("Permesso per le notifiche negato.");
      return;
    }

    // Ottiene il device token tramite Firebase
    const deviceToken = await getDeviceToken();
    if (!deviceToken) {
      console.error("Impossibile ottenere il device token.");
      return;
    }

    // Se esiste un token utente, registra il device token sul backend
    const userToken = sessionStorage.getItem("token");
    if (userToken) {
      try {
        await axios.post(
          `${process.env.REACT_APP_API_URL}/api/users/device-token`,
          { token: deviceToken },
          {
            headers: {
              Authorization: `Bearer ${userToken}`,
            },
          }
        );
      } catch (error) {
        console.error("Errore durante la registrazione del token dispositivo:", error);
      }
    }
  };

  // ------------------------------------------------------
  // Funzione per gestire il login (API request)
  // ------------------------------------------------------
  const handleLoginRequest = async (username, password) => {
    try {
      const response = await apiClient.post("/api/users/login", {
        username,
        password,
      });
      // Gestisce il login salvando token e ruolo
      handleLogin(response.data.token, response.data.role_id);
    } catch (error) {
      console.error("Errore durante il login:", error);
      // Mostra una notifica di errore (assicurati di aver importato e configurato toast)
      toast.error("Errore durante il login. Controlla le credenziali.");
    }
  };

  // ------------------------------------------------------
  // Funzione per gestire il login: salva token e ruolo, registra device token
  // ------------------------------------------------------
  const handleLogin = async (token, role) => {
    sessionStorage.setItem("token", token);
    sessionStorage.setItem("role", role);
    setIsAuthenticated(true);
    setUserRole(parseInt(role, 10));
    await registerDeviceToken();
  };

  // ------------------------------------------------------
  // Funzione per gestire il logout
  // ------------------------------------------------------
  const handleLogout = async () => {
    try {
      await apiClient.post(
        "/api/users/logout",
        {},
        { withCredentials: true }
      );
    } catch (error) {
      console.warn("Errore durante il logout dal server, eseguo il logout locale:", error);
    } finally {
      // Esegue il logout locale rimuovendo token e ruolo
      sessionStorage.removeItem("token");
      sessionStorage.removeItem("role");
      setIsAuthenticated(false);
      setUserRole(null);
    }
  };

  // ------------------------------------------------------
  // Effetto per rinnovare il token automaticamente ogni 5 minuti
  // ------------------------------------------------------
  useEffect(() => {
    const refreshToken = async () => {
      const token = sessionStorage.getItem("token");
      if (!token) return;
      try {
        const decoded = jwtDecode(token);
        const timeToExpiration = decoded.exp * 1000 - Date.now();
        // Se il token scade entro 5 minuti, richiama il refresh
        if (timeToExpiration < 5 * 60 * 1000) {
          const response = await apiClient.post("/api/users/refresh-token");
          if (response.data?.accessToken) {
            sessionStorage.setItem("token", response.data.accessToken);
          } else {
            console.error("Errore durante il rinnovo del token.");
            handleLogout();
          }
        }
      } catch (err) {
        console.error("Errore durante il rinnovo del token:", err);
        handleLogout();
      }
    };

    const interval = setInterval(refreshToken, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // ------------------------------------------------------
  // Definizione delle rotte protette e relative componenti
  // ------------------------------------------------------
  const routes = [
    { path: "/dashboard", component: <Dashboard /> },
    { path: "/visualizzazione-commesse", component: <VisualizzazioneCommesse /> },
    { path: "/visualizzazione-attivita", component: <VisualizzazioneAttivita /> },
    { path: "/calendario-attivita", component: <CalendarioAttivita /> },
    { path: "/CalendarioCommesse", component: <CalendarioCommesse /> },
    { path: "/PrenotazioneSale", component: <PrenotazioneSale /> },
    { path: "/Notifications", component: <Notifications /> },
    { path: "/Dashboard/:reparto", component: <DashboardReparto />, requiredRole: 2 },
    { path: "/gestione-commesse", component: <GestioneCommesse />, requiredRole: 2 },
    { path: "/VisualizzaTutteLeAttivita", component: <VisualizzaTutteLeAttivita />, requiredRole: 2 },
    { path: "/StatoAvanzamento/:reparto", component: <StatoAvanzamentoReparti />, requiredRole: 2 },
    { path: "/StatiAvanzamento", component: <StatiAvanzamento />, requiredRole: 2 },
    { path: "/utenti", component: <GestioneUtenti />, requiredRole: 1 },
    { path: "/TrelloBoardSoftware", component: <TrelloBoardSoftware />, requiredRole: 1 },
    { path: "/TrelloBoardElettrico", component: <TrelloBoardElettrico />, requiredRole: 1 },
    { path: "/MatchCommesse", component: <MatchCommesse />, requiredRole: 1 },
    { path: "/GestioneTabelle", component: <GestioneTabelle />, requiredRole: 1 },
  
  ];

  // ------------------------------------------------------
  // Rendering: Router, Navbar e definizione delle rotte
  // ------------------------------------------------------
  return (
    <Router>
      <div>
        {/* Se l'utente è autenticato, mostra la Navbar */}
        {isAuthenticated && userRole !== null && (
          <Navbar
            isAuthenticated={isAuthenticated}
            userRole={userRole}
            handleLogout={handleLogout}
          />
        )}

        <Routes>
          {/* Rotta per il login */}
          <Route path="/login" element={<LoginRegister onLogin={handleLoginRequest} />} />
          <Route path="/reset-password" element={<ResetPassword />} />  {/* <-- Route pubblica */}
          {/* Rotta di default: redirect a /dashboard */}
          <Route path="/" element={<Navigate to="/dashboard" />} />
          {/* Rotte protette: vengono renderizzate tramite il componente ProtectedRoute */}
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
