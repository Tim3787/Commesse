import React from "react";
import { Navigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";

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
