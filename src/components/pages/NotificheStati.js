import React, { useState, useEffect } from "react";
import axios from "axios";
import "../style.css";

const NotificheStati = () => {
  const [notifiche, setNotifiche] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNotifiche = async () => {
      try {
        const response = await axios.get (`${process.env.REACT_APP_API_URL}/api/notifiche`);
        setNotifiche(response.data.notifiche || []);
        setLoading(false);
      } catch (error) {
        console.error("Errore durante il recupero delle notifiche:", error);
        setLoading(false);
      }
    };

    fetchNotifiche();
  }, []);

  if (loading) {
    return <p>Caricamento notifiche...</p>;
  }

  return (
    <div className="notifiche-container">
      <h1>Notifiche Stati Avanzamento</h1>
      {notifiche.length === 0 ? (
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
                <td>{notifica.numero_commessa}</td>
                <td>{notifica.reparto}</td>
                <td>{notifica.stato_atteso}</td>
                <td style={{ color: "red" }}>{notifica.stato_attuale}</td>
                <td>{new Date(notifica.data_inizio).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default NotificheStati;

