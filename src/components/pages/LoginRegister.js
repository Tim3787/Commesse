import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "../style.css";

function LoginRegister({ onLogin }) {
  const handleLogin = async () => {
    const response = await axios.post(`${process.env.REACT_APP_API_URL}/api/users/login`, formData);
    sessionStorage.setItem("authToken", response.data.token);
    sessionStorage.setItem("role", response.data.role_id);
    onLogin(response.data.token, response.data.role_id);
    navigate("/dashboard");
  };
  
  const handleRegister = async () => {
    await axios.post(`${process.env.REACT_APP_API_URL}/api/users/register`, formData);
    setMessage("Registrazione completata! Ora puoi accedere.");
    setFormType("login");
  };
  
  const handleRecover = async () => {
    await axios.post(`${process.env.REACT_APP_API_URL}/api/users/forgot-password`, formData);
    setMessage("Se l'email esiste, riceverai un'email con il link per resettare la password.");
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    try {
      if (formType === "login") await handleLogin();
      if (formType === "register") await handleRegister();
      if (formType === "recover") await handleRecover();
    } catch (error) {
      console.error("Errore durante l'operazione:", error);
      setError(error.response?.data || "Errore durante l'operazione");
    }
  };
  
  return (
    <div className="login-container">
      <h1>
        {formType === "login"
          ? "Login"
          : formType === "register"
          ? "Registrazione"
          : "Recupero Password"}
      </h1>
      <form onSubmit={handleSubmit}>
        {formType !== "recover" && (
          <div>
            <label>Username:</label>
            <input
              type="text"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              required={formType !== "recover"}
            />
          </div>
        )}
        {formType !== "login" && (
          <div>
            <label>Email:</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
          </div>
        )}
        {formType !== "recover" && (
          <div>
            <label>Password:</label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
            />
          </div>
        )}
        {error && <p className="error">{error}</p>}
        {message && <p className="message">{message}</p>}
        <button type="submit">
          {formType === "login"
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
    </div>
  );
}

export default LoginRegister;
