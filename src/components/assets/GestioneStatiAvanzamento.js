import React from 'react';

function GestioneStatiAvanzamento({
  commessa,
  handleStatoAttualeChange,
  handleUpdateDate,
  handleRemoveDate,
  formatDate,
  handleStatoChange,
  statiCommessa,
}) {
  // Aggiungi un controllo per verificare se la commessa è valida
  if (!commessa || !commessa.stati_avanzamento) {
    return <p>Seleziona una commessa per gestire gli stati avanzamento.</p>;
  }

  return (
    <div className="commessa-container">
      <h2>Consegna: {new Date(commessa.data_consegna).toLocaleDateString()}</h2>
      <div className="commessa-container">
        <h2>
          Stato della commessa:
          <select
            style={{ marginLeft: '15px' }}
            value={commessa.stato || ''}
            onChange={(e) => handleStatoChange(commessa.commessa_id, Number(e.target.value))}
          >
            <option value="">Seleziona Stato</option>
            {Array.isArray(statiCommessa) &&
              statiCommessa.map((stato) => (
                <option key={stato.id} value={stato.id}>
                  {stato.nome_stato}
                </option>
              ))}
          </select>
        </h2>

        {(commessa?.stati_avanzamento ?? []).map((reparto) => (
          <div
            key={`stato-${commessa.commessa_id}-${reparto.reparto_id}`}
            className="reparto-container"
          >
            <h3>
              Reparto: {reparto.reparto_nome}
              <select
                className="w-200"
                style={{ marginLeft: '15px' }}
                value={reparto.stati_disponibili?.find((s) => s.isActive)?.stato_id || ''}
                onChange={(e) =>
                  handleStatoAttualeChange(
                    commessa.commessa_id,
                    reparto.reparto_id,
                    Number(e.target.value)
                  )
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
            </h3>
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
                        value={stato.data_inizio ? formatDate(stato.data_inizio) : ''}
                        onChange={(e) =>
                          handleUpdateDate(
                            commessa.commessa_id, // Usa commessa.commessa_id
                            reparto.reparto_id,
                            stato.stato_id,
                            'data_inizio',
                            e.target.value
                          )
                        }
                      />
                      {stato.data_inizio && (
                        <button
                          onClick={() =>
                            handleRemoveDate(
                              commessa.commessa_id, // Usa commessa.commessa_id
                              reparto.reparto_id,
                              stato.stato_id,
                              'data_inizio'
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
                        value={stato.data_fine ? formatDate(stato.data_fine) : ''}
                        onChange={(e) =>
                          handleUpdateDate(
                            commessa.commessa_id, // Usa commessa.commessa_id
                            reparto.reparto_id,
                            stato.stato_id,
                            'data_fine',
                            e.target.value
                          )
                        }
                      />
                      {stato.data_fine && (
                        <button
                          onClick={() =>
                            handleRemoveDate(
                              commessa.commessa_id,
                              reparto.reparto_id,
                              stato.stato_id,
                              'data_fine'
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
    </div>
  );
}

export default GestioneStatiAvanzamento;
