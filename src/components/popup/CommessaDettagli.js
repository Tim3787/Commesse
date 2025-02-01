import React, { useEffect, useState } from "react";
import ".././style.css";
import { fetchAttivitaCommessa } from "../services/api";


function CommessaDettagli({ commessa, onClose }) {
  const [attivita, setAttivita] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showStati, setShowStati] = useState(false);
  const [showAttivita, setShowAttivita] = useState(false);
  const [expandedReparti, setExpandedReparti] = useState({});
  const getStatiAttiviPerCommessa = (commessa) => {
    return commessa.stati_avanzamento
      .map((reparto) => {
        const statoAttivo = reparto.stati_disponibili.find((stato) => stato.isActive);
        return {
          reparto_nome: reparto.reparto_nome,
          stato: statoAttivo || null,
        };
      })
      .filter((reparto) => reparto.stato !== null);
  };
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

        // Filtra le attività manualmente per il numero di commessa
        const filteredActivities = result.filter(
          (activity) => String(activity.numero_commessa) === String(commessa.numero_commessa)
        );

        setAttivita(filteredActivities);
      } catch (error) {
        console.error("Errore nel caricamento delle attività:", error);
      } finally {
        setLoading(false);
      }
    };

    loadActivities();
  }, [commessa.numero_commessa]);

  const statiAttivi = getStatiAttiviPerCommessa(commessa);

// Funzione per alternare lo stato aperto/chiuso dei reparti
const toggleReparto = (reparto) => {
  setExpandedReparti((prev) => ({
    ...prev,
    [reparto]: !prev[reparto],
  }));
};

const groupedActivities = groupActivitiesByReparto(attivita);

  return (
<div className="popup-Big">
      <div className="popup-Big-content">
        <h2>Dettagli Commessa {commessa.numero_commessa}</h2>
        <p>
          <strong>Cliente:</strong> {commessa.cliente}
        </p>
        <p>
          <strong>Tipo Macchina:</strong> {commessa.tipo_macchina}
        </p>
        <p>
          <strong>Descrizione:</strong> {commessa.descrizione || "Nessuna descrizione"}
        </p>
        <p>
          <strong>Data FAT:</strong>{" "}
          {commessa.data_FAT
            ? new Date(commessa.data_FAT).toLocaleDateString()
            : "Nessuna data"}
        </p>
        <p>
          <strong>Data Consegna:</strong>{" "}
          {commessa.data_consegna
            ? new Date(commessa.data_consegna).toLocaleDateString()
            : "Nessuna data"}
        </p>

        <div className="collapsible-section">
          <h3 onClick={() => setShowStati(!showStati)}>
            Stati Avanzamento Attuali {showStati ? "▲" : "▼"}
          </h3>
          {showStati && (
            <ul>
              {statiAttivi.length > 0 ? (
                statiAttivi.map((reparto, index) => (
                  <li key={index}>
                    <strong>{reparto.reparto_nome}:</strong> {reparto.stato.nome_stato}
                    {reparto.stato.data_inizio && (
                      <span> (Inizio: {new Date(reparto.stato.data_inizio).toLocaleDateString()})</span>
                    )}
                    {reparto.stato.data_fine && (
                      <span> (Fine: {new Date(reparto.stato.data_fine).toLocaleDateString()})</span>
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
                <h3 onClick={() => toggleReparto(reparto)}>
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
     
        <button className="close-button" onClick={onClose}>
          Chiudi
        </button>
      </div>
    </div>
    </div>
  );
  
}

export default CommessaDettagli;
