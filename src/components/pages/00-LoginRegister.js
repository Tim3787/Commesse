import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "../style.css";
import logo from "../assets/unitech-packaging.png";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";


function LoginRegister({ onLogin }) {
  const [formType, setFormType] = useState("login");
  const [formData, setFormData] = useState({ username: "", email: "", password: "" });
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const validateForm = () => {
    if ((formType === "register" || formType === "recover") && !formData.email) {
      return "L'email è obbligatoria.";
    }
    if ((formType === "register" || formType === "login") && !formData.username) {
      return "L'username è obbligatorio.";
    }
    if ((formType === "register" || formType === "login") && !formData.password) {
      return "La password è obbligatoria.";
    }
    return null;
  };


  const makeRequest = async (endpoint, successMessage) => {
    setIsLoading(true);
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}${endpoint}`,
        formData
      );
      if (formType === "login") {
        sessionStorage.setItem("token", response.data.token);
        sessionStorage.setItem("role", response.data.role_id);
        onLogin(response.data.token, response.data.role_id);
        navigate("/dashboard");
      } else {
        setMessage(successMessage);
        if (formType === "register") setFormType("login");
      }
    } catch (error) {
      console.error("Errore durante l'operazione:", error);
      toast.error(error.response?.data?.message || "Errore durante l'operazione.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    const validationError = validateForm();
    if (validationError) {
      toast.error(validationError);
      setIsLoading(false);
      return;
    }


    try {
      if (formType === "login") await makeRequest("/api/users/login", "");
      if (formType === "register")
        await makeRequest(
          "/api/users/register",
          "Registrazione completata! Ora puoi accedere."
        );
      if (formType === "recover")
        await makeRequest(
          "/api/users/forgot-password",
          "Se l'email esiste, riceverai un'email con il link per resettare la password."
        );
    } catch (error) {
      console.error("Errore durante l'operazione:", error);
      toast.error("Errore durante l'operazione.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
    <ToastContainer position="top-right" autoClose={3000} hideProgressBar />
    <div className="login-container">
  
      <h1>
        {formType === "login"
          ? "Login"
          : formType === "register"
          ? "Registrazione"
          : "Recupero Password"}
      </h1>
      <form onSubmit={handleSubmit}>
        {(formType === "register" || formType === "login") && (
          <div>
            <label htmlFor="username">Username:</label>
            <input
              id="username"
              type="text"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              aria-label="Inserisci il tuo username"
            />
          </div>
        )}
        {(formType === "register" || formType === "recover") && (
          <div>
            <label htmlFor="email">Email:</label>
            <input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              aria-label="Inserisci il tuo indirizzo email"
            />
          </div>
        )}
        {(formType === "register" || formType === "login") && (
          <div>
            <label htmlFor="password">Password:</label>
            <input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              aria-label="Inserisci la tua password"
            />
          </div>
        )}
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
      {formType !== "recover" && (
        <button onClick={() => setFormType(formType === "login" ? "register" : "login")}>
          {formType === "login" ? "Vai alla Registrazione" : "Torna al Login"}
        </button>
      )}
      {formType === "login" && (
        <button onClick={() => setFormType("recover")}>Recupera Password</button>
      )}
      {formType === "recover" && (
        <button onClick={() => setFormType("login")}>Torna al Login</button>
      )}
      <img src={logo} alt="Logo" className={`login-logo ${isLoading ? "pulsing" : ""}`} />
    </div>
    </>
  );
}

export default LoginRegister;
