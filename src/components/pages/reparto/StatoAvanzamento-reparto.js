import React, { useState, useEffect } from "react";
import axios from "axios";
import "../Dashboard.css";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { getBoardCards, getBoardLists } from "../../services/API/trello-api";
import WarningDetails from "../../assets/WarningDetails";
import UnfinishedActivities from "../../assets/UnfinishedActivities";
import { useParams } from "react-router-dom"; 
function StatoAvanzamentoReparti() {
  const { reparto } = useParams();  // Leggi il parametro dinamico dall'URL

  // Mappatura per ottenere i dati dinamici in base al reparto
  const repartoConfig = {
    software: {
      RepartoID: 1,
      RepartoName: "software",
      boardId: "606e8f6e25edb789343d0871",
      accoppiamentoStati: {
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
    },
    elettrico: {
      RepartoID: 2,
      RepartoName: "elettrico",
      boardId: "606efd4d2898f5705163448f",
      accoppiamentoStati: {
        "in entrata": ["E: In entrata","E: In entrata","E: Schema destinato a Luca","E: Schema destinato a Alan",
      "E: Schema destinato a Alessio","E: Schema destinato a Simone"],
    "analisi": ["E: Analisi documentazione"],
    "sviluppo": ["E: Sviluppo"],
    "controllo": ["E: Controllo schema prima del lancio", "E: Schema ok per BM", "E: Materiale impegnato da gestionale da ufficio acquisti", "E: Priorità commesse da prelevare"  ],
    "bm in preparazione": ["E: Materiale BM in preparazione"],
    "bm pronto": ["Materiale BM Completo"],
    "completate": ["E: Completate","E: Documentazione da aggiornare","E: Documentazione aggiornata, ok a mauro per invio schema definitivo"],
    "materiale elettrico in preparazione"	: ["	E: in lavorazione ordine materiale BM e QE","E: Materiale BM Ordinato",
      "E: Materiale BM in preparazione","E: Materiale da sollecitare","E: Materiale già sollecitato","E: Materiale BM quasi completo","E: Materiale BM Completo" ],
      "macchina in cablaggio"	 	: ["E: Montaggio bordo macchina"],
     "macchina in pre-collaudo"	 	: ["E: Montaggio bordo macchina"],
     "macchina in smontaggio"	 	: ["E: Completate","E: Documentazione da aggiornare", "E: Documentazione aggiornata, ok a mauro per invio schema definitivo"],

      },
    },
    quadristi: {
      RepartoID: 15,
      RepartoName: "quadristi",
      boardId: "606efd4d2898f5705163448f",
      accoppiamentoStati: {
       "analisi": ["E: Analisi documentazione"],
      },
    },
  };

  const repartoData = repartoConfig[reparto] || {}; // Seleziona i dati in base al reparto
  const { RepartoID, RepartoName, boardId, accoppiamentoStati } = repartoData;
  const [commesse, setCommesse] = useState([]);
  const [stati, setStati] = useState([]);
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
      if (!RepartoID) return; // Se il reparto non è valido, interrompi

      setLoading(true);
      try {
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
        const statiValidi = statiResponse.data.filter((stato) => stato.reparto_id === RepartoID); //REPARTO
        setStati(statiValidi);

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
  }, [RepartoID, boardId, apiUrl, token]);

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
        activity.reparto?.toLowerCase() === RepartoName
    );
    // Attività non completate
    const unfinishedActivities = activities.filter(
      (activity) =>
        activity.stato == 1 && // Stato non completato
        activity.commessa_id === commessa.commessa_id &&
        activity.reparto?.toLowerCase() === RepartoName
    );

    const trelloCard = cards.find((card) => {
      const trelloNumero = extractCommessaNumber(card.name);
      return commessa.numero_commessa === trelloNumero;
    });
  
  
    const trelloListName = trelloCard ? getListNameById(trelloCard.idList) : "N/A";

    const statiAttivi = getStatiAttiviPerCommessa(commessa);
    const statoAttivo = statiAttivi.find((s) => s.reparto_nome.toLowerCase() === RepartoName);


  
const isListDifferent = !accoppiamentoStati[normalize(statoAttivo?.stato?.nome_stato)]?.includes(trelloListName);

  
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
        border: isListDifferent ? "2px solid red" : "2px solid black",
      }}
    >
      <strong>{commessa.numero_commessa}</strong>
      <div>{commessa.cliente}</div>
  
      {/* Mostra warning attività completate */}
      {warningActivities.length > 0 && (
        <WarningDetails warningActivities={warningActivities} resources={resources} />
      )}
  
      {/* Mostra warning attività non completate */}
      {unfinishedActivities.length > 0 && (
        <UnfinishedActivities unfinishedActivities={unfinishedActivities} resources={resources} />
      )}
  
      {!trelloCard && (
        <div style={{ color: "red", fontStyle: "italic" }}>
          Non esiste su Trello
        </div>
      )}
  
      <div>
        
        {trelloCard && isDateDifferent && (
          
          <div style={{ color: "red" }}>
            Data App: {appDate}<br />
            Data Trello: {trelloDate}<br />
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
          
          {isListDifferent && (
            <div style={{ color: "red" }}>
             <div>Lista Trello: {trelloListName}</div>
             
            
            </div>
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
      <h1>Stato Avanzamento {RepartoName}</h1>
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
              {stati.sort((a, b) => a.ordine - b.ordine).map((stato) => (
                <th key={stato.id}>{stato.nome_stato}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
            {stati.sort((a, b) => a.ordine - b.ordine).map((stato) => (
  <DropZone
    key={stato.id}
    stato={stato}
    repartoId={RepartoID}
    commesse={filteredCommesse.filter((commessa) =>
      commessa.stati_avanzamento.some(
        (reparto) =>
          reparto.reparto_id === RepartoID &&
          reparto.stati_disponibili.some(
            (s) => s.stato_id === stato.id && s.isActive
          )
      )
    )}
    activities={activities}
    resources={resources}
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

export default StatoAvanzamentoReparti;
