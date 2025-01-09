import React, { useState, useEffect } from "react";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import axios from "axios";

function CommesseKanban() {
  const [reparti, setReparti] = useState([]);
  const [statiAvanzamento, setStatiAvanzamento] = useState([]);
  const [commesse, setCommesse] = useState([]);
  const [repartoSelezionato, setRepartoSelezionato] = useState(null);

  useEffect(() => {
    const fetchReparti = async () => {
      const response = await axios.get("http://server-commesseun.onrender.com/api/reparti");
      setReparti(response.data);
    };

    const fetchStatiAvanzamento = async () => {
      const response = await axios.get("http://server-commesseun.onrender.com/api/stati-avanzamento");
      setStatiAvanzamento(response.data);
    };

    fetchReparti();
    fetchStatiAvanzamento();
  }, []);

  useEffect(() => {
    if (repartoSelezionato) {
      const fetchCommesse = async () => {
        const response = await axios.get(
          `http://server-commesseun.onrender.com/api/commessa-stati/reparto/${repartoSelezionato}`
        );
        setCommesse(response.data);
      };
      fetchCommesse();
    }
  }, [repartoSelezionato]);

  const handleDragEnd = async (result) => {
    const { destination, source, draggableId } = result;

    if (!destination || destination.droppableId === source.droppableId) {
      return;
    }

    const statoAvanzamentoId = parseInt(destination.droppableId, 10);

    try {
      await axios.put(`http://server-commesseun.onrender.com/api/commessa-stati/${draggableId}`, {
        stato_avanzamento_id: statoAvanzamentoId,
      });

      setCommesse((prevCommesse) =>
        prevCommesse.map((commessa) =>
          commessa.id === parseInt(draggableId, 10)
            ? { ...commessa, stato_avanzamento_id: statoAvanzamentoId }
            : commessa
        )
      );
    } catch (error) {
      console.error("Errore durante l'aggiornamento dello stato avanzamento:", error);
    }
  };

  return (
    <div>
      <h1>Gestione Commesse</h1>
      <select
        value={repartoSelezionato || ""}
        onChange={(e) => setRepartoSelezionato(e.target.value)}
      >
        <option value="">Seleziona un reparto</option>
        {reparti.map((reparto) => (
          <option key={reparto.id} value={reparto.id}>
            {reparto.nome}
          </option>
        ))}
      </select>

      {repartoSelezionato && commesse.length === 0 && (
        <p style={{ color: "red" }}>Non ci sono commesse per questo reparto.</p>
      )}

      <DragDropContext onDragEnd={handleDragEnd}>
        <div style={{ display: "flex", gap: "10px" }}>
          {statiAvanzamento
            .filter((stato) => stato.reparto_id === parseInt(repartoSelezionato, 10))
            .map((stato) => (
              <Droppable droppableId={String(stato.id)} key={stato.id}>
                {(provided) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    style={{
                      width: "200px",
                      minHeight: "300px",
                      border: "1px solid black",
                      padding: "10px",
                      borderRadius: "8px",
                      backgroundColor: "#f8f9fa",
                    }}
                  >
                    <h3 style={{ textAlign: "center", color: "#007bff" }}>
                      {stato.nome_stato}
                    </h3>
                    {commesse
                      .filter((commessa) => commessa.stato_avanzamento_id === stato.id)
                      .map((commessa, index) => (
                        <Draggable
                          draggableId={String(commessa.id)}
                          index={index}
                          key={commessa.id}
                        >
                          {(provided) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              style={{
                                padding: "10px",
                                marginBottom: "10px",
                                border: "1px solid #ccc",
                                borderRadius: "4px",
                                background: "#ffffff",
                                boxShadow: "0px 4px 6px rgba(0,0,0,0.1)",
                              }}
                            >
                              {commessa.numero_commessa}
                            </div>
                          )}
                        </Draggable>
                      ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            ))}
        </div>
      </DragDropContext>
    </div>
  );
}

export default CommesseKanban;
