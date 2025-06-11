import React, { useState } from "react";
import axios from "axios";
import { useNavigate, useSearchParams } from "react-router-dom";
import logo from "../img/unitech-packaging.png";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const token = searchParams.get("token");

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!password || !confirmPassword) {
      toast.error("Entrambi i campi sono obbligatori.");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Le password non coincidono.");
      return;
    }

    setIsLoading(true);

    try {
      await axios.post(`${process.env.REACT_APP_API_URL}/api/users/reset-password`, {
        token,
        newPassword: password,
      });
      toast.success("Password reimpostata con successo! Ora puoi accedere.");
      navigate("/login");
    } catch (error) {
      console.error("Errore durante il reset della password:", error);
      toast.error(error.response?.data?.message || "Errore durante il reset della password.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <ToastContainer position="top-left" autoClose={2000} hideProgressBar />
      <div className="login-container">
        <h1>Reset Password</h1>
        <form onSubmit={handleSubmit}>
          <div>
            <label htmlFor="password">Nuova Password:</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              aria-label="Inserisci la nuova password"
            />
          </div>
          <div>
            <label htmlFor="confirmPassword">Conferma Password:</label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              aria-label="Conferma la nuova password"
            />
          </div>
          <button type="submit" disabled={isLoading}>
            {isLoading ? "Caricamento..." : "Reimposta Password"}
          </button>
        </form>
        <img src={logo} alt="Logo" className={`login-logo ${isLoading ? "pulsing" : ""}`} />
      </div>
    </>
  );
}

export default ResetPassword;
