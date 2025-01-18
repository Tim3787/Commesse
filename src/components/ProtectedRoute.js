import React from "react";
import { Navigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";

const isTokenValid = (token) => {
  try {
    const decoded = jwtDecode(token); // Decodifica il token
    const currentTime = Date.now() / 1000; // Tempo corrente in secondi
    return decoded.exp > currentTime; // Verifica che il token non sia scaduto
  } catch (error) {
    console.error("Errore nella decodifica del token:", error);
    return false; // Il token non è valido
  }
};

const ProtectedRoute = ({ children, requiredRole = null }) => {
  const token = sessionStorage.getItem("token");
  const role = parseInt(sessionStorage.getItem("role"), 10);

  if (!token || !isTokenValid(token)) {
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("role");
    return (
      <Navigate
        to="/login"
        replace
        state={{ message: "Sessione scaduta. Effettua di nuovo il login." }}
      />
    );
  }

  if (requiredRole !== null && role > requiredRole) {
    return (
      <Navigate
        to="/dashboard"
        replace
        state={{ message: "Accesso negato: ruolo non autorizzato." }}
      />
    );
  }

  return children;
};

export default ProtectedRoute;
