import React, { useState, useEffect } from "react";
import axios from "axios";
import "../style.css";
import logo from"../assets/unitech-packaging.png";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";

function StatoAvanzamentoElettrico() {
  const [commesse, setCommesse] = useState([]);
  const [statiSoftware, setStatiSoftware] = useState([]);
  const [loading, setLoading] = useState(false);
  const token = sessionStorage.getItem("token");

  // Recupera le commesse e gli stati di avanzamento
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Recupera le commesse
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/commesse`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const parsedCommesse = response.data.map((commessa) => ({
          ...commessa,
          stati_avanzamento: typeof commessa.stati_avanzamento === "string"
            ? JSON.parse(commessa.stati_avanzamento)
            : commessa.stati_avanzamento,
        }));

        setCommesse(parsedCommesse);

        // Recupera gli stati software
        const statiResponse = await axios.get(`${process.env.REACT_APP_API_URL}/api/stati-avanzamento`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const statiValidi = statiResponse.data.filter((stato) => stato.reparto_id === 2);
        setStatiSoftware(statiValidi);
      } catch (error) {
        console.error("Errore durante il recupero dei dati:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token]);

  // Funzione per aggiornare lo stato di un'attività
  const handleActivityDrop = async (commessaId, repartoId, newStatoId) => {
    try {
      console.log("Aggiornamento stato iniziato", { commessaId, repartoId, newStatoId });
      const response = await axios.put(
        `${process.env.REACT_APP_API_URL}/api/commesse/${commessaId}/reparti/${repartoId}/stato`,
        { stato_id: newStatoId, is_active: true },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      console.log("Aggiornamento stato completato", response.data);
      

      // Aggiorna lo stato localmente
      setCommesse((prevCommesse) =>
        prevCommesse.map((commessa) => {
          if (commessa.commessa_id === commessaId) {
            return {
              ...commessa,
              stati_avanzamento: commessa.stati_avanzamento.map((reparto) => {
                if (reparto.reparto_id === repartoId) {
                  return {
                    ...reparto,
                    stati_disponibili: reparto.stati_disponibili.map((stato) => ({
                      ...stato,
                      isActive: stato.stato_id === newStatoId,
                    })),
                  };
                }
                return reparto;
              }),
            };
          }
          return commessa;
        })
      );
    } catch (error) {
      console.error("Errore durante l'aggiornamento dello stato:", error);
      alert("Errore durante l'aggiornamento dello stato.");
    }
  };

  function DraggableCommessa({ commessa, repartoId }) {
    const [{ isDragging }, drag] = useDrag(() => ({
      type: "COMMESSA",
      item: { commessaId: commessa.commessa_id, repartoId },
      collect: (monitor) => ({
        isDragging: !!monitor.isDragging(),
      }),
    }));

    return (
      <div
        ref={drag}
        className="commessa"
        style={{ opacity: isDragging ? 0.5 : 1 }}
      >
        <strong>{commessa.numero_commessa}</strong>
        <br />
        <div>{commessa.cliente}  </div>
        <div>{commessa.data_consegna ? new Date(commessa.data_consegna).toLocaleDateString() : "N/A"}</div>
      </div>
      
    );
  }

  function DropZone({ stato, commesse, repartoId, onDrop }) {
    const [{ isOver }, drop] = useDrop(() => ({
      accept: "COMMESSA",
      drop: (item) => onDrop(item.commessaId, repartoId, stato.id),
      collect: (monitor) => ({
        isOver: !!monitor.isOver(),
      }),
    }));

    return (
      <td ref={drop} className={`dropzone ${isOver ? "highlight" : ""}`}>
        {commesse.map((commessa) => (
          <DraggableCommessa
            key={commessa.commessa_id}
            commessa={commessa}
            repartoId={repartoId}
          />
        ))}
      </td>
    );
  }

  return (
    <div className="container">
      <h1>Stato Avanzamento elettrico</h1>
      {loading && (
        <div className="loading-overlay">
          <img src={logo} alt="Logo" className="logo-spinner" />
        </div>
      )}
      <DndProvider backend={HTML5Backend}>
        <table className="stati-software-table">
          <thead>
            <tr>
              {statiSoftware.map((stato) => (
                <th key={stato.id}>{stato.nome_stato}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              {statiSoftware.map((stato) => (
                <DropZone
                  key={stato.id}
                  stato={stato}
                  repartoId={2} // ID reparto software
                  commesse={commesse.filter((commessa) =>
                    commessa.stati_avanzamento.some(
                      (reparto) =>
                        reparto.reparto_id === 2 &&
                        reparto.stati_disponibili.some(
                          (s) => s.stato_id === stato.id && s.isActive
                        )
                    )
                  )}
                  onDrop={handleActivityDrop}
                />
              ))}
            </tr>
          </tbody>
        </table>
      </DndProvider>
    </div>
  );
}

export default StatoAvanzamentoElettrico;
