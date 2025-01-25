import React, { useState, useEffect } from "react";
import axios from "axios";
import "../style.css";
import logo from "../assets/unitech-packaging.png";

const NotificheStati = () => {
  const [notifiche, setNotifiche] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNotifiche = async () => {
      setLoading(true);
      try {
        const token = sessionStorage.getItem("token"); // Recupera il token dal sessionStorage
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/notifiche`, {
          headers: { Authorization: `Bearer ${token}` }, // Aggiunge il token nelle intestazioni
        });
        setNotifiche(response.data.notifiche || []);
      } catch (error) {
        console.error("Errore durante il recupero delle notifiche:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifiche();
  }, []);

  return (
    <div className="notifiche-container">
      {loading && (
        <div className="loading-overlay">
          <img src={logo} alt="Logo" className="logo-spinner" />
        </div>
      )}
      <h1>Notifiche Stati Avanzamento</h1>
      {notifiche.length === 0 && !loading ? (
        <p style={{ color: "green" }}>Nessuna anomalia rilevata!</p>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>Commessa</th>
              <th>Reparto</th>
              <th>Stato Atteso</th>
              <th>Stato Attuale</th>
              <th>Data Inizio</th>
            </tr>
          </thead>
          <tbody>
            {notifiche.map((notifica, index) => (
              <tr key={index}>
                <td>{notifica.numero_commessa || "N/A"}</td>
                <td>{notifica.reparto || "N/A"}</td>
                <td>{notifica.stato_atteso || "N/A"}</td>
                <td style={{ color: notifica.stato_attuale ? "red" : "black" }}>
                  {notifica.stato_attuale || "N/A"}
                </td>
                <td>
                  {notifica.data_inizio
                    ? new Date(notifica.data_inizio).toLocaleDateString("it-IT")
                    : "N/A"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default NotificheStati;
