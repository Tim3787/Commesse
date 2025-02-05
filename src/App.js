import React, { useState, useEffect } from "react";
import axios from "axios";
import apiClient from "../src/components/config/axiosConfig";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import LoginRegister from "./components/pages/LoginRegister";
import GestioneUtenti from "./components/pages/configuration/GestioneUtenti";
import GestioneReparti from "./components/pages/configuration/GestioneReparti";
import GestioneRisorse from "./components/pages/configuration/GestioneRisorse";
import GestioneStati from "./components/pages/configuration/GestioneStati";
import GestioneAttivita from "./components/pages/configuration/GestioneAttivita";
import GestioneStatiCommessa from "./components/pages/configuration/GestioneStatiCommessa";
import GestioneCommesse from "./components/pages/CreaCommesse";
import Navbar from "./components/common/Navbar";
import Dashboard from "./components/pages/Dashboard-user" ;
import VisualizzazioneCommesse from "./components/pages/visualizza/Visualizza-Commesse";
import VisualizzazioneAttivita from "./components/pages/Gantt-Attivita";
import CalendarioAttivita from "./components/pages/calendars/CalendarioAttivita";
import AssegnaAttivita from "./components/pages/visualizza/TutteLeAttivita";
import StatiAvanzamento from "./components/pages/visualizza/StatoAvanzamento";
import StatoAvanzamentoReparti from "./components/pages/reparto/StatoAvanzamento-reparto";
import CalendarioCommesse from "./components/pages/calendars/CalendarioCommesse";
import DashboardReparto from "./components/pages/reparto/Dashboard-reparto";
import PrenotazioneSale from "./components/pages/PrenotazioneSale";
import ProtectedRoute from "./components/utils/ProtectedRoute";
import TrelloBoardSoftware from "./components/pages/trello/TrelloBoardSoftware";
import TrelloBoardElettrico from "./components/pages/trello/TrelloBoardElettrico";
import MatchCommesse from "./components/pages/trello/TrelloMatchCommesse";
import { getDeviceToken } from "./firebase";
import { jwtDecode } from "jwt-decode";
import "react-toastify/dist/ReactToastify.css";


function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState(null);

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
  

  const registerDeviceToken = async () => {
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      console.error("Permesso per le notifiche negato.");
      return;
    }
  
    const token = await getDeviceToken(); 
    if (!token) {
      console.error("Impossibile ottenere il device token.");
      return;
    }
  
    const userToken = sessionStorage.getItem("token");
    if (userToken) {
      try {
        await axios.post(
          `${process.env.REACT_APP_API_URL}/api/users/device-token`,
          { token },
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




// Funzione per gestire il login (chiamata API)
const handleLoginRequest = async (username, password) => {
  try {
    const response = await apiClient.post("/api/users/login", {
      username,
      password,
    });

    console.log("Risposta dal server:", response.data);

    handleLogin(response.data.token, response.data.role_id);  // ✅ Gestione corretta del token e del ruolo
  } catch (error) {
    console.error("Errore durante il login:", error);
    toast.error("Errore durante il login. Controlla le credenziali.");
  }
};




const handleLogin = async (token, role) => {
  sessionStorage.setItem("token", token);
  sessionStorage.setItem("role", role);
  setIsAuthenticated(true);
  setUserRole(parseInt(role, 10));

  await registerDeviceToken();
};



const handleLogout = async () => {
  try {
    await apiClient.post("/api/users/logout", {}, {
      withCredentials: true,
    });
  
  } catch (error) {
    console.warn("Errore durante il logout dal server, eseguo il logout locale:", error);
  } finally {
    // Esegui comunque il logout locale
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("role");
    setIsAuthenticated(false);
    setUserRole(null);
  }
};

useEffect(() => {
  const refreshToken = async () => {
    const token = sessionStorage.getItem("token");
    if (!token) return;

    try {
      const decoded = jwtDecode(token);
      const timeToExpiration = decoded.exp * 1000 - Date.now();

      if (timeToExpiration < 5 * 60 * 1000) {
        const response = await apiClient.post("/api/users/refresh-token");
        
        if (response.data?.accessToken) {
          sessionStorage.setItem("token", response.data.accessToken);
        } else {
          console.error("Errore durante il rinnovo del token.");
          handleLogout();  // Logout in caso di token mancante o errore
        }
      }
    } catch (err) {
      console.error("Errore durante il rinnovo del token:", err);
      handleLogout();  // Logout se il token è scaduto o non valido
    }
  };

  const interval = setInterval(refreshToken, 5 * 60 * 1000);  // Ogni 5 minuti
  return () => clearInterval(interval);
}, []);


  

  
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
    { path: "/PrenotazioneSale", component: <PrenotazioneSale />},
    { path: "/Dashboard/:reparto", component: <DashboardReparto />, requiredRole: 2  },

    { path: "/gestione-commesse", component: <GestioneCommesse />, requiredRole: 2 },
    { path: "/assegna-attivita", component: <AssegnaAttivita />, requiredRole: 2 },
    { path: "/StatoAvanzamento/:reparto", component: <StatoAvanzamentoReparti />, requiredRole: 2 },

    { path: "/StatoAvanzamento:", component: <StatiAvanzamento />, requiredRole: 2 },
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
  <Route path="/login" element={<LoginRegister onLogin={handleLoginRequest} />} />

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
