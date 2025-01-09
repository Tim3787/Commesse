import React from "react";
import "./GestioneStatiAvanzamento.css";
import "./style.css";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";

function GestioneStatiAvanzamento({ commessa, handleStatoAttualeChange, handleUpdateDate, handleRemoveDate, formatDate, handleUpdateOrder }) {
  if (!commessa) {
    return <p>Seleziona una commessa per gestire gli stati avanzamento.</p>;
  }

    const onDragEnd = (result, reparto) => {
     if (!result.destination) return;

    const items = Array.from(reparto.stati_disponibili);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    handleUpdateOrder(commessa.id, reparto.reparto_id, items);
     };

  return (
    <div className="commessa-container">
      <h2>Commessa: {commessa.numero_commessa}</h2>
      <p>Tipo Macchina: {commessa.tipo_macchina}</p>

      {/* Aggiungi un controllo per verificare che stati_avanzamento esista e sia un array */}
      {Array.isArray(commessa.stati_avanzamento) && commessa.stati_avanzamento.length > 0 ? (
  commessa.stati_avanzamento.map((reparto) => (
    <div key={`stato-${commessa.id}-${reparto.reparto_id}`} className="reparto-container">
      <h3>Reparto: {reparto.reparto_nome}</h3>
      <select
        className="form-select"
        value={reparto.stato_attuale?.stato_id || ""}
        onChange={(e) =>
          handleStatoAttualeChange(commessa.id, reparto.reparto_id, Number(e.target.value))
        }
      >
        <option value="" disabled>
          Seleziona Stato
        </option>
        {reparto.stati_disponibili.map((stato) => (
          <option key={stato.stato_id} value={stato.stato_id}>
            {stato.nome_stato}
          </option>
        ))}
      </select>
      <DragDropContext onDragEnd={(result) => onDragEnd(result, reparto)}>
        <Droppable droppableId={`reparto-${reparto.reparto_id}`}>
          {(provided) => (
            <table ref={provided.innerRef} {...provided.droppableProps}>
              <thead>
                <tr>
                  <th>Stato</th>
                  <th>Data Inizio</th>
                  <th>Data Fine</th>
                </tr>
              </thead>
              <tbody>
                {reparto.stati_disponibili.map((stato, index) => (
                  <Draggable
                    key={stato.stato_id}
                    draggableId={`stato-${stato.stato_id}`}
                    index={index}
                  >
                    {(provided) => (
                      <tr
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                      >
                        <td>{stato.nome_stato}</td>
                        <td>
                          <input
                            type="date"
                            value={stato.data_inizio ? formatDate(stato.data_inizio) : ""}
                            onChange={(e) =>
                              handleUpdateDate(
                                commessa.id,
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
                                  commessa.id,
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
                                commessa.id,
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
                                  commessa.id,
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
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </tbody>
            </table>
          )}
        </Droppable>
      </DragDropContext>
    </div>
  ))
) : (
  <p>Nessun stato avanzamento disponibile per questa commessa.</p>
)}
    </div>
  );
}

export default GestioneStatiAvanzamento;


