import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "../style.css";
import logo from "../img/unitech-packaging.png";

// Import Toastify per le notifiche
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

/**
 * Componente LoginRegister
 *
 * Gestisce il form per il login, la registrazione e il recupero password.
 * Il form mostra campi differenti in base al tipo di operazione (login, register, recover).
 *
 * Props:
 *  - onLogin: funzione chiamata al successo del login con i parametri (username, password, token, role)
 */
function LoginRegister({ onLogin }) {
  // ------------------------------------------------------------------
  // Stati del componente
  // ------------------------------------------------------------------
  // Tipo di form attivo: "login", "register" oppure "recover"
  const [formType, setFormType] = useState("login");

  // Dati del form: username, email e password
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
  });

  // Stato per il caricamento (per disabilitare il pulsante e mostrare "Caricamento...")
  const [isLoading, setIsLoading] = useState(false);

  // Hook per la navigazione (React Router)
  const navigate = useNavigate();

  // ------------------------------------------------------------------
  // Funzione helper: Validazione del form
  // ------------------------------------------------------------------
  const validateForm = () => {
    // Per "register" e "recover" l'email è obbligatoria
    if ((formType === "register" || formType === "recover") && !formData.email) {
      return "L'email è obbligatoria.";
    }
    // Per "register" e "login" username e password sono obbligatori
    if ((formType === "register" || formType === "login") && !formData.username) {
      return "L'username è obbligatorio.";
    }
    if ((formType === "register" || formType === "login") && !formData.password) {
      return "La password è obbligatoria.";
    }
    return null;
  };

  // ------------------------------------------------------------------
  // Funzione helper: Effettua una richiesta HTTP all'endpoint specificato
  // ------------------------------------------------------------------
  const makeRequest = async (endpoint, successMessage) => {
    setIsLoading(true);
    try {
      // Effettua una POST all'endpoint con i dati del form
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}${endpoint}`,
        formData
      );

      // Se il form è di login, salva token e ruolo e chiama onLogin
      if (formType === "login") {
        sessionStorage.setItem("token", response.data.token);
        sessionStorage.setItem("role", response.data.role_id);

        // Passa username, password, token e role al parent
        onLogin(formData.username, formData.password, response.data.token, response.data.role_id);
        navigate("/dashboard");
      } else {
        // Se il form non è di login, mostra un messaggio di successo
        toast.success(successMessage);
        // Dopo la registrazione, passa al form di login
        if (formType === "register") setFormType("login");
      }
    } catch (error) {
      console.error("Errore durante l'operazione:", error);
      // Mostra il messaggio di errore se presente, altrimenti un messaggio generico
      toast.error(error.response?.data?.message || "Errore durante l'operazione.");
    } finally {
      setIsLoading(false);
    }
  };

  // ------------------------------------------------------------------
  // Funzione: Gestione del submit del form
  // ------------------------------------------------------------------
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    // Validazione del form
    const validationError = validateForm();
    if (validationError) {
      toast.error(validationError);
      setIsLoading(false);
      return;
    }

    // In base al tipo di form, invoca la richiesta appropriata
    try {
      if (formType === "login") {
        await makeRequest("/api/users/login", "");
      }
      if (formType === "register") {
        await makeRequest(
          "/api/users/register",
          "Registrazione completata! Ora puoi accedere."
        );
      }
      if (formType === "recover") {
        await makeRequest(
          "/api/users/forgot-password",
          "Se l'email esiste, riceverai un'email con il link per resettare la password."
        );
      }
    } catch (error) {
      console.error("Errore durante l'operazione:", error);
      toast.error("Errore durante l'operazione.");
    } finally {
      setIsLoading(false);
    }
  };

  // ------------------------------------------------------------------
  // Rendering del componente
  // ------------------------------------------------------------------
  return (
    <>
      {/* Contenitore per i Toast (notifiche) */}
      <ToastContainer position="top-left" autoClose={3000} hideProgressBar />

      <div className="login-container">
        {/* Titolo del form in base al tipo */}
        <h1>
          {formType === "login"
            ? "Login"
            : formType === "register"
            ? "Registrazione"
            : "Recupero Password"}
        </h1>

        {/* Form di login/registrazione/recupero */}
        <form onSubmit={handleSubmit}>
          {/* Mostra il campo username per login e registrazione */}
          {(formType === "register" || formType === "login") && (
            <div>
              <label htmlFor="username">Username:</label>
              <input
                id="username"
                type="text"
                value={formData.username}
                onChange={(e) =>
                  setFormData({ ...formData, username: e.target.value })
                }
                aria-label="Inserisci il tuo username"
              />
            </div>
          )}

          {/* Mostra il campo email per registrazione e recupero */}
          {(formType === "register" || formType === "recover") && (
            <div>
              <label htmlFor="email">Email:</label>
              <input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                aria-label="Inserisci il tuo indirizzo email"
              />
            </div>
          )}

          {/* Mostra il campo password per login e registrazione */}
          {(formType === "register" || formType === "login") && (
            <div>
              <label htmlFor="password">Password:</label>
              <input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                aria-label="Inserisci la tua password"
              />
            </div>
          )}

          {/* Pulsante per il submit del form */}
          <button type="submit" disabled={isLoading}>
            {isLoading
              ? "Caricamento..."
              : formType === "login"
              ? "Accedi"
              : formType === "register"
              ? "Registrati"
              : "Invia Email di Recupero"}
          </button>
        </form>

        {/* Pulsanti per cambiare tipo di form */}
        {formType !== "recover" && (
          <button
            onClick={() => setFormType(formType === "login" ? "register" : "login")}
          >
            {formType === "login" ? "Vai alla Registrazione" : "Torna al Login"}
          </button>
        )}
        {formType === "login" && (
          <button onClick={() => setFormType("recover")}>Recupera Password</button>
        )}
        {formType === "recover" && (
          <button onClick={() => setFormType("login")}>Torna al Login</button>
        )}

        {/* Logo dell'app con animazione se il form è in caricamento */}
        <img
          src={logo}
          alt="Logo"
          className={`login-logo ${isLoading ? "pulsing" : ""}`}
        />
      </div>
    </>
  );
}

export default LoginRegister;
