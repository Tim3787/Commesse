import React, { useEffect, useState } from "react";
import ".././style.css";
import { fetchAttivitaCommessa } from "../services/API/attivitaCommesse-api";
import {  toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import axios from "axios";
import { jwtDecode } from "jwt-decode";


function CommessaDettagli({ commessa, onClose, onStatusUpdated }) {
  const [attivita, setAttivita] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showStati, setShowStati] = useState(false);
  const [showAttivita, setShowAttivita] = useState(false);
  const [expandedReparti, setExpandedReparti] = useState({});
  const [statiCommessa, setStatiCommessa] = useState([]);
  const token = sessionStorage.getItem("token");

  // Gestione locale della commessa per aggiornare il valore visualizzato
  const [localCommessa, setLocalCommessa] = useState(commessa);

  // Decodifica del token per ottenere il ruolo, qui usiamo "role_id"
  const decodeToken = (token) => {
    try {
      const decoded = jwtDecode(token);
      const currentTime = Date.now() / 1000;
      return decoded.exp > currentTime ? decoded : null;
    } catch (error) {
      console.error("Errore nella decodifica del token:", error);
      return null;
    }
  };

  const decodedToken = token ? decodeToken(token) : null;
  const finalUserRole = decodedToken && decodedToken.role_id ? Number(decodedToken.role_id) : 0;

  // Aggiorna il localCommessa se la prop commessa cambia
  useEffect(() => {
    setLocalCommessa(commessa);
  }, [commessa]);

  // Funzione per ottenere gli stati attivi e disponibili per ogni reparto
  const getStatiAttiviPerCommessa = (commessaObj) => {
    return commessaObj.stati_avanzamento
      .map((reparto) => {
        const statoAttivo = reparto.stati_disponibili.find((stato) => stato.isActive);
        return {
          reparto_nome: reparto.reparto_nome,
          stato: statoAttivo || null,
          stati_disponibili: reparto.stati_disponibili,
        };
      })
      .filter((reparto) => reparto.stato !== null);
  };

  const statiAttivi = getStatiAttiviPerCommessa(localCommessa);

  // Raggruppa le attività per reparto
  const groupActivitiesByReparto = (activities) => {
    return activities.reduce((acc, activity) => {
      const reparto = activity.reparto || "Sconosciuto";
      if (!acc[reparto]) {
        acc[reparto] = [];
      }
      acc[reparto].push(activity);
      return acc;
    }, {});
  };

  useEffect(() => {
    const loadActivities = async () => {
      try {
        setLoading(true);
        const result = await fetchAttivitaCommessa();
        // Filtra le attività per il numero di commessa
        const filteredActivities = result.filter(
          (activity) => String(activity.numero_commessa) === String(localCommessa.numero_commessa)
        );
        setAttivita(filteredActivities);
      } catch (error) {
        console.error("Errore nel caricamento delle attività:", error);
      } finally {
        setLoading(false);
      }
    };

    loadActivities();
  }, [localCommessa.numero_commessa]);

  const groupedActivities = groupActivitiesByReparto(attivita);

  // Carica gli stati della commessa dall'API
  useEffect(() => {
    const fetchStati = async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/stato-commessa`);
        setStatiCommessa(response.data);
      } catch (error) {
        console.error("Errore durante il recupero degli stati della commessa:", error);
        toast.error("Errore durante il recupero degli stati della commessa:", error);
      }
    };
    fetchStati();
  }, []);

  // Handler per aggiornare lo stato della commessa.
  // Riceve "commessaId" ed "newStateId", e dopo il successo aggiorna il localCommessa e chiama il callback onStatusUpdated.
  const handleStatoChange = async (commessaId, newStateId) => {
    try {
      await axios.put(
        `${process.env.REACT_APP_API_URL}/api/commesse/${commessaId}/stato`,
        { stato_commessa: newStateId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Stato aggiornato correttamente.");
      // Aggiorna il localCommessa con il nuovo stato
      setLocalCommessa((prev) => ({ ...prev, stato: newStateId }));
      // Chiama il callback per aggiornare il componente principale
      if (typeof onStatusUpdated === "function") {
        onStatusUpdated();
      }
    } catch (error) {
      console.error("Errore durante l'aggiornamento dello stato:", error);
      toast.error("Errore durante l'aggiornamento dello stato.");
    }
  };

  const handleClosePopup = () => {
    onClose();
  };

  return (
    <div className="popup-Big">
      <div className="popup-Big-content">
        <h2>Dettagli Commessa {localCommessa.numero_commessa}</h2>
        <p>
          <strong>Cliente:</strong> {localCommessa.cliente}
        </p>
        <p>
          <strong>Tipo Macchina:</strong> {localCommessa.tipo_macchina}
        </p>
        <p>
          <strong>Descrizione:</strong> {localCommessa.descrizione || "Nessuna descrizione"}
        </p>
        <p>
          <strong>Data FAT:</strong>{" "}
          {localCommessa.data_FAT ? new Date(localCommessa.data_FAT).toLocaleDateString() : "Nessuna data"}
        </p>
        <p>
          <strong>Data Consegna:</strong>{" "}
          {localCommessa.data_consegna ? new Date(localCommessa.data_consegna).toLocaleDateString() : "Nessuna data"}
        </p>
        <p>
          <strong>Stato:</strong>{" "}
          {finalUserRole === 1 ? (
            <select
              name="stato"
              value={Number(localCommessa.stato)}
              onChange={(e) =>
                handleStatoChange(Number(localCommessa.commessa_id), Number(e.target.value))
              }
              required
              className="input-field-100"
            >
              <option value="">Seleziona uno stato</option>
              {statiCommessa.map((st) => (
                <option key={st.id} value={Number(st.id)}>
                  {st.nome_stato}
                </option>
              ))}
            </select>
          ) : (
            <span>
              {statiCommessa.find((st) => Number(st.id) === Number(localCommessa.stato))?.nome_stato || "Non assegnato"}
            </span>
          )}
        </p>

        <div className="collapsible-section">
          <h3 onClick={() => setShowStati(!showStati)}>
            Stati Avanzamento Attuali {showStati ? "▲" : "▼"}
          </h3>
          {showStati && (
            <ul>
              {statiAttivi.length > 0 ? (
                statiAttivi.map((repartoInfo, index) => (
                  <li key={index}>
                    <strong>{repartoInfo.reparto_nome}:</strong> {repartoInfo.stato.nome_stato}
                    {repartoInfo.stato.data_inizio && (
                      <span> (Inizio: {new Date(repartoInfo.stato.data_inizio).toLocaleDateString()})</span>
                    )}
                    {repartoInfo.stato.data_fine && (
                      <span> (Fine: {new Date(repartoInfo.stato.data_fine).toLocaleDateString()})</span>
                    )}
                  </li>
                ))
              ) : (
                <span>Nessun stato attivo</span>
              )}
            </ul>
          )}
        </div>

        <div className="collapsible-section">
          <h3 onClick={() => setShowAttivita(!showAttivita)}>
            Attività della Commessa {showAttivita ? "▲" : "▼"}
          </h3>
          {showAttivita && (
            <>
              {loading ? (
                <p>Caricamento attività...</p>
              ) : Object.keys(groupedActivities).length > 0 ? (
                Object.keys(groupedActivities).map((reparto) => (
                  <div key={reparto} className="reparto-section">
                    <h3
                      onClick={() =>
                        setExpandedReparti((prev) => ({
                          ...prev,
                          [reparto]: !prev[reparto],
                        }))
                      }
                    >
                      {reparto} {expandedReparti[reparto] ? "▲" : "▼"}
                    </h3>
                    {expandedReparti[reparto] && (
                      <table className="activities2-table">
                        <thead>
                          <tr>
                            <th>Nome Attività</th>
                            <th>Data Inizio</th>
                            <th>Durata (giorni)</th>
                            <th>Risorsa</th>
                            <th>Stato</th>
                            <th>Descrizione</th>
                            <th>Note</th>
                          </tr>
                        </thead>
                        <tbody>
                          {groupedActivities[reparto].map((activity) => (
                            <tr key={activity.id}>
                              <td>{activity.nome_attivita || "N/A"}</td>
                              <td>{new Date(activity.data_inizio).toLocaleDateString()}</td>
                              <td>{activity.durata || "1"}</td>
                              <td>{activity.risorsa || "Non assegnata"}</td>
                              <td>
                                {activity.stato === 0
                                  ? "Non iniziata"
                                  : activity.stato === 1
                                  ? "Iniziata"
                                  : "Completata"}
                              </td>
                              <td>{activity.descrizione_attivita|| "Nessuna descrizione"}</td>
                              <td>{activity.note || "Nessuna nota"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                ))
              ) : (
                <p>Nessuna attività trovata.</p>
              )}
            </>
          )}
        </div>

        <button className="close-button" onClick={handleClosePopup}>
          Chiudi
        </button>
      </div>
    </div>
  );
}

export default CommessaDettagli;