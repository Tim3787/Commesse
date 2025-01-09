import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./style.css";

function LoginRegister({ onLogin }) {
  const [formType, setFormType] = useState("login"); // "login", "register" o "recover"
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
  
    try {
      let endpoint;
      if (formType === "login") {
        endpoint = "/api/users/login";
      } else if (formType === "register") {
        endpoint = "/api/users/register";
      } else if (formType === "recover") {
        endpoint = "/api/users/forgot-password";
      }
  
      const response = await axios.post(`http://localhost:5000${endpoint}`, formData);
  
      if (formType === "login") {
        console.log("Login Response:", response.data); // Debug del token e ruolo
        localStorage.setItem("token", response.data.token);
        localStorage.setItem("role", response.data.role_id);
        onLogin(response.data.token, response.data.role_id);
        navigate("/dashboard");
      } else if (formType === "register") {
        setMessage("Registrazione completata! Ora puoi accedere.");
        setFormType("login");
      } else if (formType === "recover") {
        setMessage(
          "Se l'email esiste, riceverai un'email con il link per resettare la password."
        );
      }
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
