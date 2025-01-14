import React from "react";
import "./GestioneStatiAvanzamento.css";
import "./style.css";

function GestioneStatiAvanzamento({ commessa, handleStatoAttualeChange, handleUpdateDate, handleRemoveDate,  formatDate, handleStatoChange, statiCommessa }) {
  // Aggiungi un controllo per verificare se la commessa è valida
  if (!commessa || !commessa.stati_avanzamento) {
    return <p>Seleziona una commessa per gestire gli stati avanzamento.</p>;
  }

  console.log("Commessa:", commessa);
  console.log("commessa.id:", commessa.id);
  console.log("commessa.commessa_id:", commessa.commessa_id);
  console.log("commessa.stato:", commessa.stato);

  return (
    <div className="commessa-container">
      <h2>Commessa: {commessa.numero_commessa}</h2>
      <p>Tipo Macchina: {commessa.tipo_macchina}</p>
      
<div>
  <label>Seleziona Stato della Commessa:</label>
  <select
  value={commessa.stato} // Il valore selezionato è lo stato aggiornato
  onChange={(e) =>
    handleStatoChange(commessa.commessa_id, Number(e.target.value)) // Invio dell'ID dello stato
  }
>
  <option value="">Seleziona Stato</option>
  {statiCommessa.map((stato) => (
    <option key={stato.id} value={stato.id}>
      {stato.nome_stato}
    </option>
  ))}
</select>
</div>

      {commessa.stati_avanzamento.map((reparto) => (
        <div key={`stato-${commessa.commessa_id}-${reparto.reparto_id}`} className="reparto-container">
          <h3>Reparto: {reparto.reparto_nome}</h3>
          <select
            className="form-select"
            value={reparto.stati_disponibili?.find(stato => stato.isActive)?.stato_id || ""} // Seleziona lo stato attivo
            onChange={(e) =>
              handleStatoAttualeChange(commessa.commessa_id, reparto.reparto_id, Number(e.target.value)) // Usa commessa.commessa_id
            }
          >
            <option value="" disabled>
              Seleziona Stato
            </option>
            {reparto.stati_disponibili?.map((stato) => (
              <option key={stato.stato_id} value={stato.stato_id}>
                {stato.nome_stato}
              </option>
            ))}
          </select>
          <table>
            <thead>
              <tr>
                <th>Stato</th>
                <th>Data Inizio</th>
                <th>Data Fine</th>
              </tr>
            </thead>
            <tbody>
              {reparto.stati_disponibili?.map((stato) => (
                <tr key={stato.stato_id}>
                  <td>{stato.nome_stato}</td>
                  <td>
                    <input
                      type="date"
                      value={stato.data_inizio ? formatDate(stato.data_inizio) : ""}
                      onChange={(e) =>
                        handleUpdateDate(
                          commessa.commessa_id,  // Usa commessa.commessa_id
                          reparto.reparto_id,
                          stato.stato_id,
                          "data_inizio",
                          e.target.value
                        )
                      }
                    />
                    {stato.data_inizio && (
                      <button
                        onClick={() =>
                          handleRemoveDate(
                            commessa.commessa_id,  // Usa commessa.commessa_id
                            reparto.reparto_id,
                            stato.stato_id,
                            "data_inizio"
                          )
                        }
                      >
                        Rimuovi
                      </button>
                    )}
                  </td>
                  <td>
                    <input
                      type="date"
                      value={stato.data_fine ? formatDate(stato.data_fine) : ""}
                      onChange={(e) =>
                        handleUpdateDate(
                          commessa.commessa_id,  // Usa commessa.commessa_id
                          reparto.reparto_id,
                          stato.stato_id,
                          "data_fine",
                          e.target.value
                        )
                      }
                    />
                    {stato.data_fine && (
                      <button
                        onClick={() =>
                          handleRemoveDate(
                            commessa.commessa_id,  // Usa commessa.commessa_id
                            reparto.reparto_id,
                            stato.stato_id,
                            "data_fine"
                          )
                        }
                      >
                        Rimuovi
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
}

export default GestioneStatiAvanzamento;
