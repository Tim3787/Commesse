import React, { useState, useEffect } from "react";
import axios from "axios";
import "./Dashboard.css";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { getBoardCards, getBoardLists } from "../services/api";


function StatoAvanzamentoSoftware() {
  const [commesse, setCommesse] = useState([]);
  const [statiSoftware, setStatiSoftware] = useState([]);
  const [loading, setLoading] = useState(false);
  const [numeroCommessaFilter, setNumeroCommessaFilter] = useState("");
  const [clienteFilter, setClienteFilter] = useState("");
  const [tipoMacchinaFilter, setTipoMacchinaFilter] = useState("");
  const [cards, setCards] = useState([]);
  const [lists, setLists] = useState([]);
  const token = sessionStorage.getItem("token");
  const [activities, setActivities] = useState([]);
  const apiUrl = process.env.REACT_APP_API_URL;
  const [resources, setResources] = useState([]);
  const boardId = "606e8f6e25edb789343d0871";

 //REPARTO
const accoppiamentoStati = {
  software: {
    "in entrata": ["S: In entrata", "S-Ribo in entrata", "S: Modifiche su macchina old"],
    "analisi": ["S: Analisi", "S: Modifiche su macchina old"],
    "sviluppo programmato": ["S: In entrata","S: Analisi" ],
    "sviluppo": ["S: Sviluppo"],
    "pronta per collaudo": ["S: pronto per messa in servizio","S: Macchina quasi pronta per inizio collaudo (vedi data di massima inserita da Massimo)" ],
    "collaudo": ["S: Collaudo"],
    "avviamento terminato": ["S: Completate"],
    "avviamento iniziato": ["S: Completate"],
    "collaudo terminato": ["S: Completate"],
    "no software": ["S: Nessun lavoro software"],
    },

  };

  const normalize = (str) => str?.trim().toLowerCase();

  const getListNameById = (listId) => {
    const list = lists.find((list) => list.id === listId);
    return list ? list.name : "Lista sconosciuta";
  };

  const getStatiAttiviPerCommessa = (commessa) => {
    return commessa.stati_avanzamento
      ?.map((reparto) => {
        const statoAttivo = reparto.stati_disponibili.find((stato) => stato.isActive);
        return {
          reparto_nome: reparto.reparto_nome,
          stato: statoAttivo || null,
        };
      })
      .filter((reparto) => reparto.stato !== null) || [];
  };

  // Funzione per recuperare le attività dal backend
  const fetchActivities = async () => {
    try {
      const response = await axios.get(`${apiUrl}/api/attivita_commessa`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setActivities(response.data);
    } catch (error) {
      console.error("Errore durante il recupero delle attività:", error);
    }
  };
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        const response = await axios.get(`${apiUrl}/api/commesse`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const parsedCommesse = response.data.map((commessa) => ({
          ...commessa,
          stati_avanzamento: typeof commessa.stati_avanzamento === "string"
            ? JSON.parse(commessa.stati_avanzamento)
            : commessa.stati_avanzamento,
        }));
        setCommesse(parsedCommesse);

        const statiResponse = await axios.get(`${apiUrl}/api/stati-avanzamento`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const statiValidi = statiResponse.data.filter((stato) => stato.reparto_id === 1); //REPARTO
        setStatiSoftware(statiValidi);

        const [boardLists, boardCards] = await Promise.all([
          getBoardLists(boardId),
          getBoardCards(boardId),
        ]);
        setLists(boardLists);
        setCards(boardCards);
        await fetchActivities();
      } catch (error) {
        console.error("Errore durante il recupero dei dati:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [apiUrl, token]);

  useEffect(() => {
    const fetchResources = async () => {
      try {
        const response = await axios.get(`${apiUrl}/api/risorse`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setResources(response.data);
      } catch (error) {
        console.error("Errore durante il recupero delle risorse:", error);
      }
    };
  
    fetchResources();
  }, [apiUrl, token]);

  const extractCommessaNumber = (trelloName) => {
    const match = trelloName.match(/^\d{5}/);
    return match ? match[0] : null;
  };

  const handleActivityDrop = async (commessaId, repartoId, newStatoId) => {
    try {
      await axios.put(
        `${apiUrl}/api/commesse/${commessaId}/reparti/${repartoId}/stato`,
        { stato_id: newStatoId, is_active: true },
        { headers: { Authorization: `Bearer ${token}` } }
      );

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
    }
  };

  
  function DraggableCommessa({ commessa, repartoId, activities, resources }) {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: "COMMESSA",
    item: { commessaId: commessa.commessa_id, repartoId },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }));

  
    // Funzione per filtrare le attività che generano il warning
    const warningActivities = activities.filter(
      (activity) =>
        activity.stato === 2 &&
        activity.note &&
        activity.commessa_id === commessa.commessa_id &&
        activity.reparto?.toLowerCase() === "software" // REPARTO
    );
    
  
    const trelloCard = cards.find((card) => {
      const trelloNumero = extractCommessaNumber(card.name);
      return commessa.numero_commessa === trelloNumero;
    });
  
  
    const trelloListName = trelloCard ? getListNameById(trelloCard.idList) : "N/A";

    const statiAttivi = getStatiAttiviPerCommessa(commessa);
    const statoAttivo = statiAttivi.find(
      (s) => s.reparto_nome.toLowerCase() === "software" //REPARTO
    );

    //REPARTO
    const expectedList = statoAttivo?.stato?.nome_stato
    ? accoppiamentoStati["software"]?.[normalize(statoAttivo.stato.nome_stato)]?.includes(
        trelloListName
      )
      ? trelloListName
      : "Non accoppiata"
    : "Non assegnata";
  //REPARTO
  const isListDifferent = !accoppiamentoStati["software"]?.[normalize(statoAttivo?.stato?.nome_stato)]?.includes(trelloListName);
  
  const normalizeDate = (dateString) => {
    if (!dateString) return null;
    const date = new Date(dateString); // Interpreta la data come UTC o locale (dipende dal formato)
    return date.toISOString().split("T")[0]; // Ritorna solo la parte YYYY-MM-DD
  };
  
  
  const trelloDate = trelloCard?.due ? normalizeDate(trelloCard.due) : null;
  const appDate = commessa.data_consegna ? normalizeDate(commessa.data_consegna) : null;
  const isDateDifferent = trelloDate !== appDate;
  
  const handleAlignDate = async (commessaId, trelloDate) => {
    try {
      const normalizedTrelloDate = normalizeDate(trelloDate);
  
      if (!normalizedTrelloDate) {
        alert("La data fornita da Trello non è valida.");
        return;
      }
  
      // Trova la commessa corrente
      const commessa = commesse.find((c) => c.commessa_id === commessaId);
      if (!commessa) {
        console.error("Commessa non trovata");
        alert("Commessa non trovata.");
        return;
      }
  
      // Aggiorna la data in backend
      await axios.put(
        `${apiUrl}/api/commesse/${commessaId}`,
        {
          numero_commessa: commessa.numero_commessa,
          tipo_macchina: commessa.tipo_macchina,
          data_consegna: normalizedTrelloDate, // Usa la data normalizzata
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
  
      // Aggiorna localmente la data
      setCommesse((prevCommesse) =>
        prevCommesse.map((c) =>
          c.commessa_id === commessaId ? { ...c, data_consegna: normalizedTrelloDate } : c
        )
      );
  
      alert("Data allineata con successo.");
    } catch (error) {
      console.error("Errore durante l'allineamento della data:", error);
      alert("Errore durante l'allineamento della data.");
    }
  };
  
    
    
    return (
      <div
        ref={drag}
        className="commessa"
        style={{
          opacity: isDragging ? 0.5 : 1,
          backgroundColor: trelloCard ? (isDateDifferent ? "#ffcccc" : "#fff") : "#f0f0f0",
          border: isListDifferent ? "2px solid red" : "none",
        }}
      >
        <strong>{commessa.numero_commessa}</strong>
        <div>{commessa.cliente}</div>
       
         {warningActivities.length > 0 && (
        <div className="warning-section">
          <span className="warning-icon" title="Nota presente in attività completata">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              fill="#e60000"
              viewBox="0 0 24 24"
            >
              <path d="M12 0C5.372 0 0 5.372 0 12s5.372 12 12 12 12-5.372 12-12S18.628 0 12 0zm0 22c-5.523 0-10-4.477-10-10S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zm-1-15h2v6h-2zm0 8h2v2h-2z" />
            </svg>
          </span>

          {/* Dettagli delle attività con warning */}
          <div className="warning-details">
          {warningActivities.map((activity) => {
  // Trova il nome della risorsa corrispondente a risorsa_id
  const resourceName = resources.find(
    (resource) => resource.id === activity.risorsa_id
  )?.nome || "Nome non disponibile"; // Gestisce il caso in cui non trovi la risorsa

  return (
    <div
      key={activity.id}
      style={{
        padding: "10px",
        backgroundColor: "#ffe6e6",
        border: "1px solid #e60000",
        marginBottom: "10px",
      }}
    >
      <strong>Attività:</strong> {activity.nome_attivita} <br />
      <strong>Data inizio:</strong> {new Date(activity.data_inizio).toLocaleDateString()} <br />
      <strong>Risorsa:</strong> {resourceName} <br />
      <strong>Nota:</strong> {activity.note} <br />
    </div>
  );
})}
          </div>
        </div>
      )}
       {!trelloCard && (
          <div style={{ color: "red", fontStyle: "italic" }}>
            Non esiste su Trello
          </div>
        )}
        <div>
          Data App: {appDate}
          {trelloCard && isDateDifferent && (
            <div style={{ color: "red" }}>
              Data Trello: {trelloDate}
              <button
                onClick={() =>
                  handleAlignDate(commessa.commessa_id, trelloCard.due)
                }
              >
                Allinea Data
              </button>
            </div>
          )}
        </div>
        {trelloCard && (
          <>
            <div>Lista Trello: {trelloListName}</div>
            <div>Stato atteso: {expectedList}</div>
            {isListDifferent && (
          <div style={{ color: "red" }}>Mismatch tra stato atteso e Trello</div>
            )}
          </>
        )}
      </div>
    );
  }
  

  function DropZone({ stato, commesse, repartoId }) {
    const [{ isOver }, drop] = useDrop(() => ({
      accept: "COMMESSA",
      drop: (item) => handleActivityDrop(item.commessaId, repartoId, stato.id),
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
            getListNameById={getListNameById}
            activities={activities} 
            resources={resources}
          />
        ))}

      </td>
       
    );
  }

  const filteredCommesse = commesse.filter((commessa) => {
    const matchesNumeroCommessa = commessa.numero_commessa.toString().includes(numeroCommessaFilter);
    const matchesCliente = commessa.cliente.toLowerCase().includes(clienteFilter.toLowerCase());
    const matchesTipoMacchina = commessa.tipo_macchina?.toLowerCase().includes(tipoMacchinaFilter.toLowerCase());
    return matchesNumeroCommessa && matchesCliente && matchesTipoMacchina;
  });

  return (
    <div className="container-Scroll">
      <h1>Stato Avanzamento Software</h1>
      {loading && <div className="loading-overlay">Caricamento...</div>}

      <div className="filters">
        <input
          type="text"
          placeholder="Numero Commessa"
          value={numeroCommessaFilter}
          onChange={(e) => setNumeroCommessaFilter(e.target.value)}
        />
        <input
          type="text"
          placeholder="Cliente"
          value={clienteFilter}
          onChange={(e) => setClienteFilter(e.target.value)}
        />
        <input
          type="text"
          placeholder="Tipo Macchina"
          value={tipoMacchinaFilter}
          onChange={(e) => setTipoMacchinaFilter(e.target.value)}
        />
      </div>

      <DndProvider backend={HTML5Backend}>
      <div className="Gen-table-container">
        <table className="software2-schedule">
          <thead>
            <tr>
              {statiSoftware.sort((a, b) => a.ordine - b.ordine).map((stato) => (
                <th key={stato.id}>{stato.nome_stato}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              {statiSoftware.sort((a, b) => a.ordine - b.ordine).map((stato) => (
                <DropZone
                  key={stato.id}
                  stato={stato}
                  repartoId={1}
                  commesse={filteredCommesse.filter((commessa) =>
                    commessa.stati_avanzamento.some(
                      (reparto) =>
                        reparto.reparto_id === 1 &&
                        reparto.stati_disponibili.some(
                          (s) => s.stato_id === stato.id && s.isActive
                        )//REPARTO
                    )
                  )}
                  activities={activities}
                />
              ))}
            </tr>
          </tbody>
        </table>
        </div>
      </DndProvider>
    </div>
  );
}

export default StatoAvanzamentoSoftware;
