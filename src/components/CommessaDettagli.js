import React from "react";
import "./style.css";


function CommessaDettagli({ commessa, onClose }) {

  // Funzione per ottenere gli stati attivi per ogni reparto di una commessa
  const getStatiAttiviPerCommessa = (commessa) => {
    return commessa.stati_avanzamento.map((reparto) => {
      // Filtriamo per trovare lo stato attivo per ogni reparto
      const statoAttivo = reparto.stati_disponibili.find((stato) => stato.isActive);
      // Se c'è uno stato attivo, ritorna il reparto con lo stato attivo
      return {
        reparto_nome: reparto.reparto_nome,
        stato: statoAttivo || null // Se non c'è stato attivo, restituiamo null
      };
    }).filter((reparto) => reparto.stato !== null); // Filtra per mostrare solo i reparti con stato attivo
  };

  const statiAttivi = getStatiAttiviPerCommessa(commessa); // Otteniamo gli stati attivi

  return (
    <div className="popup">
      <div className="popup-content">
        <h2>Dettagli Commessa #{commessa.numero_commessa}</h2>
        <p><strong>Cliente:</strong> {commessa.cliente}</p>
        <p><strong>Tipo Macchina:</strong> {commessa.tipo_macchina}</p>
        <p><strong>Descrizione:</strong> {commessa.descrizione || "N/A"}</p>
        <p><strong>Data Consegna:</strong> {new Date(commessa.data_consegna).toLocaleDateString()}</p>

        {/* Stati avanzamento */}
        <h3>Stati Avanzamento:</h3>
        <ul>
          {statiAttivi.length > 0 ? (
            statiAttivi.map((reparto, index) => (
              <li key={index}>
                <strong>{reparto.reparto_nome}:</strong>
                <div>
                  - {reparto.stato.nome_stato}
                  {reparto.stato.data_inizio && (
                    <span>
                      {" "} (Inizio: {new Date(reparto.stato.data_inizio).toLocaleDateString()})
                    </span>
                  )}
                  {reparto.stato.data_fine && (
                    <span>
                      {" "} (Fine: {new Date(reparto.stato.data_fine).toLocaleDateString()})
                    </span>
                  )}
                </div>
              </li>
            ))
          ) : (
            <span>Nessun stato attivo</span>
          )}
        </ul>

        <button onClick={onClose}>Chiudi</button>
      </div>
    </div>
  );
}

export default CommessaDettagli;
