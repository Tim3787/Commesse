import React, { useState, useEffect } from "react";
import axios from "axios";
import "../Dashboard.css";
import CommessaDettagli from "../../popup/CommessaDettagli";  
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { getBoardCards, getBoardLists } from "../../services/API/trello-api";
import WarningDetails from "../../assets/WarningDetails";
import UnfinishedActivities from "../../assets/UnfinishedActivities";
import { useParams } from "react-router-dom"; 
import DraggableColumn from "../../assets/DraggableColumn"; // Assicurati del percorso corretto
import { ordinaStatiAvanzamento } from "../../services/API/StatiAvanzamento-api";
import "react-toastify/dist/ReactToastify.css";
import { ToastContainer, toast } from "react-toastify";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faEyeSlash,
  faCalendarWeek,   // <--- Importa icona per consegna settimana
  faCalendar   
} from "@fortawesome/free-solid-svg-icons";

function StatoAvanzamentoReparti() {
  const { reparto } = useParams();  // Legge il parametro dinamico dall'URL

  // Configurazione per i reparti
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
        "in entrata": ["E: In entrata", "E: In entrata", "E: Schema destinato a Luca", "E: Schema destinato a Alan",
        "E: Schema destinato a Alessio", "E: Schema destinato a Simone"],
        "analisi": ["E: Analisi documentazione"],
        "sviluppo": ["E: Sviluppo"],
        "controllo": ["E: Controllo schema prima del lancio", "E: Schema ok per BM", "E: Materiale impegnato da gestionale da ufficio acquisti", "E: Priorità commesse da prelevare"],
        "bm in preparazione": ["E: Materiale BM in preparazione"],
        "bm pronto": ["Materiale BM Completo"],
        "completate": ["E: Completate", "E: Documentazione da aggiornare", "E: Documentazione aggiornata, ok a mauro per invio schema definitivo"],
        "materiale elettrico in preparazione": ["E: in lavorazione ordine materiale BM e QE", "E: Materiale BM Ordinato",
        "E: Materiale BM in preparazione", "E: Materiale da sollecitare", "E: Materiale già sollecitato", "E: Materiale BM quasi completo", "E: Materiale BM Completo"],
        "macchina in cablaggio": ["E: Montaggio bordo macchina"],
        "macchina in pre-collaudo": ["E: Montaggio bordo macchina"],
        "macchina in smontaggio": ["E: Completate", "E: Documentazione da aggiornare", "E: Documentazione aggiornata, ok a mauro per invio schema definitivo"],
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

  const repartoData = repartoConfig[reparto] || {};
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
  const [columnOrder, setColumnOrder] = useState([]);
  const normalize = (str) => str?.trim().toLowerCase();
  const [confrontoConTrello, setConfrontoConTrello] = useState(true);
  const [esisteSuTrello, setesisteSuTrello] = useState(false);
  const [allarmiNote, setAllarmiNote] = useState(true);
  const [allarmiAttivitaAperte, setAllarmiAttivitaAperte] = useState(true);
  const [VediConsegnate, setVediConsegnate] = useState(false);
  const [ConsegnaMensile, setConsegnaMensile] = useState(true);
  const [ConsegnaSettimanale, setConsegnaSettimanale] = useState(true);
  const [selectedCommessa, setSelectedCommessa] = useState(null);
  const getListNameById = (listId) => {
    const list = lists.find((list) => list.id === listId);
    return list ? list.name : "Lista sconosciuta";
  };

  // Funzione helper per verificare se una data cade nella settimana corrente
  const isThisWeek = (dateString) => {
    if (!dateString) return false;
    const date = new Date(dateString);
    const now = new Date();
    const firstDayOfWeek = new Date(now);
    firstDayOfWeek.setDate(now.getDate() - now.getDay());
    firstDayOfWeek.setHours(0, 0, 0, 0);
    const lastDayOfWeek = new Date(firstDayOfWeek);
    lastDayOfWeek.setDate(firstDayOfWeek.getDate() + 6);
    lastDayOfWeek.setHours(23, 59, 59, 999);
    return date >= firstDayOfWeek && date <= lastDayOfWeek;
  };

  // Funzione helper per verificare se una data cade nel mese corrente
  const isThisMonth = (dateString) => {
    if (!dateString) return false;
    const date = new Date(dateString);
    const now = new Date();
    return (
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear()
    );
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
      if (!RepartoID) return;
      setLoading(true);
      try {
        const response = await axios.get(`${apiUrl}/api/commesse`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const parsedCommesse = response.data.map((commessa) => ({
          ...commessa,
          stati_avanzamento:
            typeof commessa.stati_avanzamento === "string"
              ? JSON.parse(commessa.stati_avanzamento)
              : commessa.stati_avanzamento,
        }));
        setCommesse(parsedCommesse);

        const statiResponse = await axios.get(`${apiUrl}/api/stati-avanzamento`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const statiValidi = statiResponse.data.filter((stato) => stato.reparto_id === RepartoID);
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
  const handleClosePopup = () => {
    setSelectedCommessa(null);
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

  // Imposta l'ordine iniziale delle colonne in base allo stato 'stati'
  useEffect(() => {
    if (stati.length > 0) {
      const ordered = stati
        .slice()
        .sort((a, b) => a.ordine - b.ordine);
      setColumnOrder(ordered);
    }
  }, [stati]);

  // Funzione per spostare una colonna da una posizione all'altra
  const moveColumn = (fromIndex, toIndex) => {
    setColumnOrder((prevOrder) => {
      const updatedOrder = [...prevOrder];
      const [removed] = updatedOrder.splice(fromIndex, 1);
      updatedOrder.splice(toIndex, 0, removed);
      return updatedOrder;
    });
  };

 // Funzione per salvare il nuovo ordine sul backend
const saveNewOrder = async () => {
  try {
    // Costruisci l'array degli stati con il nuovo ordine.
    // Anche se il backend imposta l'ordine in base alla posizione, è utile
    // inviare comunque l'ID di ogni stato.
    const statiDaAggiornare = columnOrder.map((stato, index) => ({
      stato_id: stato.id,      // Il backend usa questo per identificare il record
      ordine: index + 1,         // Anche se la query imposta ordine = index+1,
                                // qui lo includi per chiarezza (oppure puoi omettere questo campo se non serve)
    }));

    // Supponiamo di usare un id "dummy" per la rotta o magari un valore preso da un'altra variabile.
    // In questo esempio, id può essere ad esempio "1" o un valore specifico.
    const idDaUsare = 1; // Modifica questo valore in base alla tua logica

    // Usa la funzione appena creata per aggiornare tutti gli stati in una sola chiamata
    await ordinaStatiAvanzamento(idDaUsare, RepartoID, statiDaAggiornare);

    // Aggiorna localmente l'ordine (opzionale)
    setColumnOrder(prevOrder =>
      prevOrder.map((stato, index) => ({ ...stato, ordine: index + 1 }))
    );

    toast.success("Ordine aggiornato con successo!");
  } catch (error) {
    console.error("Errore durante il salvataggio del nuovo ordine:", error);
    toast.error("Errore durante l'aggiornamento dell'ordine.");
  }
};
const handleCommessaClick = (commessa) => {
  setSelectedCommessa(commessa);
};

  // Filtra le commesse in base ai filtri
  const filteredCommesse = commesse.filter((commessa) => {
    const matchesNumeroCommessa = commessa.numero_commessa.toString().includes(numeroCommessaFilter);
    const matchesCliente = commessa.cliente.toLowerCase().includes(clienteFilter.toLowerCase());
    const matchesTipoMacchina = commessa.tipo_macchina?.toLowerCase().includes(tipoMacchinaFilter.toLowerCase());
    let notDelivered = true;
    if (!VediConsegnate && commessa.data_consegna) {
      const deliveryDate = new Date(commessa.data_consegna);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      // Se la data di consegna è precedente a oggi, la commessa è considerata consegnata
      notDelivered = deliveryDate >= today;
    }
    return matchesNumeroCommessa && matchesCliente && matchesTipoMacchina && notDelivered;
  });

  // Componente DraggableCommessa (già definito nel tuo codice)
  function DraggableCommessa({ commessa, repartoId, activities, resources }) {
    const [{ isDragging }, drag] = useDrag(() => ({
      type: "COMMESSA",
      item: { commessaId: commessa.commessa_id, repartoId },
      collect: (monitor) => ({
        isDragging: !!monitor.isDragging(),
      }),
    }));

    // Warning e attività non completate
    const warningActivities = activities.filter(
      (activity) =>
        activity.stato === 2 &&
        activity.note &&
        activity.commessa_id === commessa.commessa_id &&
        activity.reparto?.toLowerCase() === RepartoName
    );

    const unfinishedActivities = activities.filter(
      (activity) =>
        activity.stato == 1 &&
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
      const date = new Date(dateString);
      return date.toISOString().split("T")[0];
    };

    const trelloDate = trelloCard?.due ? normalizeDate(trelloCard.due) : null;
    const appDate = commessa.data_consegna ? normalizeDate(commessa.data_consegna) : null;
    const isDateDifferent = trelloDate !== appDate;

    const handleAlignDate = async (commessaId, trelloDate) => {
      try {
        const normalizedTrelloDate = normalizeDate(trelloDate);
        if (!normalizedTrelloDate) {
          toast.error("La data fornita da Trello non è valida.");
          return;
        }
        const commessa = commesse.find((c) => c.commessa_id === commessaId);
        if (!commessa) {
          console.error("Commessa non trovata");
          toast.error("Commessa non trovata.");
          return;
        }
        await axios.put(
          `${apiUrl}/api/commesse/${commessaId}`,
          {
            numero_commessa: commessa.numero_commessa,
            tipo_macchina: commessa.tipo_macchina,
            data_consegna: normalizedTrelloDate,
          },
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setCommesse((prevCommesse) =>
          prevCommesse.map((c) =>
            c.commessa_id === commessaId ? { ...c, data_consegna: normalizedTrelloDate } : c
          )
        );
        toast.error("Data allineata con successo.");
      } catch (error) {
        console.error("Errore durante l'allineamento della data:", error);
        toast.error("Errore durante l'allineamento della data.");
      }
    };

    return (
      <div
        ref={drag}
        className="commessa"
        style={{
          opacity: isDragging ? 0.5 : 1,
          backgroundColor: confrontoConTrello && trelloCard ? ( confrontoConTrello && isDateDifferent ? "#ffcccc" : "#fff") : "white",
          border: esisteSuTrello && isListDifferent ? "2px solid red" : "1px solid black",
        }}
        onClick={() => handleCommessaClick(commessa)}  // Aggiungi qui il click
    >
        <strong>{commessa.numero_commessa}</strong>
        <div>{commessa.cliente}</div>
{/* Nuovo blocco: icone di alert per consegna questa settimana e questo mese */}
<div className="delivery-alerts">
          {ConsegnaSettimanale && isThisWeek(commessa.data_consegna) && (
            <FontAwesomeIcon
              icon={faCalendarWeek}
              title="Consegna questa settimana"
              style={{ marginRight: "5px", color: "RED" }}
            />
          )}
            {!isThisWeek(commessa.data_consegna) && ConsegnaMensile && isThisMonth(commessa.data_consegna) && (
            <FontAwesomeIcon
              icon={faCalendar}
              title="Consegna questo mese"
              style={{ color: "blue" }}
            />
          )}
        </div>
        {allarmiNote && warningActivities.length > 0 && (
          <WarningDetails warningActivities={warningActivities} resources={resources} />
        )}

        {allarmiAttivitaAperte &&unfinishedActivities.length > 0 && (
          <UnfinishedActivities unfinishedActivities={unfinishedActivities} resources={resources} />
        )}

        {esisteSuTrello && !trelloCard && (
          <div style={{ color: "red", fontStyle: "italic" }}>
            Non esiste su Trello
          </div>
        )}

        <div>
          {confrontoConTrello && trelloCard && isDateDifferent && (
            <div style={{ color: "red" }}>
              Data App: {appDate}<br />
              Data Trello: {trelloDate}<br />
              <button onClick={() => handleAlignDate(commessa.commessa_id, trelloCard.due)}>
                Allinea Data
              </button>
            </div>
          )}
        </div>

        {confrontoConTrello && trelloCard && isListDifferent && (
          <div style={{ color: "red" }}>
            <div>Lista Trello: {trelloListName}</div>
          </div>
        )}
      </div>
    );
  }
  // Stato per il burger menu per filtri ed opzioni
  const [isBurgerMenuOpen, setIsBurgerMenuOpen] = useState(false);
  const toggleBurgerMenu = () => {
    setIsBurgerMenuOpen((prev) => !prev);
  };

  // Componente DropZone per il drag & drop sulle colonne
  function DropZone({ stato, commesse, repartoId, activities, resources }) {
    const [{ isOver }, drop] = useDrop(() => ({
      accept: "COMMESSA",
      drop: (item) => handleActivityDrop(item.commessaId, repartoId, stato.id),
      collect: (monitor) => ({
        isOver: !!monitor.isOver(),
      }),
    }));
  
    return (
      <td ref={drop} className={`dropzone ${isOver ? "highlight" : ""}`}>
        {commesse.length === 0 ? (
          <div className="dropzone-placeholder">
            Drop here
          </div>
        ) : (
          commesse.map((commessa) => (
            <DraggableCommessa
              key={commessa.commessa_id} 
              commessa={commessa}
              repartoId={repartoId}
              activities={activities}
              resources={resources}
            />
          ))
        )}
      </td>
    );
  }

  return (
    <div className="page-wrapper">
      {/* Header */}
      <div className="header">
        <h1>Stato Avanzamento {RepartoName}</h1>
        <div className="month-navigation">
          <button className="burger-icon" onClick={toggleBurgerMenu}>
            Filtri e opzioni
          </button>
          <button onClick={() => {}} className="btn-Nav">
            ← Mese
          </button>
          <button onClick={() => {}} className="btn-Nav">
            Mese →
          </button>
        </div>
        <ToastContainer position="top-left" autoClose={3000} hideProgressBar />
        {loading && <div className="loading-overlay">Caricamento...</div>}
      </div>

       {/* Burger Menu */}
       {isBurgerMenuOpen && (
        <div className="burger-menu">
          <div className="burger-menu-header">
            <button onClick={toggleBurgerMenu} className="close-burger"> 
<FontAwesomeIcon icon={faEyeSlash} className="settings-icon" />

            </button>
          </div>
          <div className="burger-menu-content">
            <div className="filters-burger">
              <h3>Filtri</h3>
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
          <h3>Opzioni </h3>
          <div className="filters-burger">
                <label>
                  <input
                    type="checkbox"
                    checked={confrontoConTrello}
                    onChange={(e) => setConfrontoConTrello(e.target.checked)}
                  />
                  Confronto con lista Trello
                </label>
              </div>
              <div className="filters-burger">
                <label>
                  <input
                    type="checkbox"
                    checked={esisteSuTrello}
                    onChange={(e) => setesisteSuTrello(e.target.checked)}
                  />
                  Confronto esistenza su Trello
                </label>
              </div>
              <div className="filters-burger">
                <label>
                  <input
                    type="checkbox"
                    checked={allarmiNote}
                    onChange={(e) => setAllarmiNote(e.target.checked)}
                  />
                  Allarmi Note
                </label>
              </div>
              <div className="filters-burger">
                <label>
                  <input
                    type="checkbox"
                    checked={allarmiAttivitaAperte}
                    onChange={(e) => setAllarmiAttivitaAperte(e.target.checked)}
                  />
                  Allarmi Attività Aperte
                </label>
              </div>
              <div className="filters-burger">
                <label>
                  <input
                    type="checkbox"
                    checked={VediConsegnate}
                    onChange={(e) => setVediConsegnate(e.target.checked)}
                  />
                  Vedi anche consegnate
                </label>
              </div>
              <div className="filters-burger">
                <label>
                  <input
                    type="checkbox"
                    checked={ConsegnaMensile}
                    onChange={(e) => setConsegnaMensile(e.target.checked)}
                  />
                  Allarme consegna nel mese
                </label>
              </div>
              <div className="filters-burger">
                <label>
                  <input
                    type="checkbox"
                    checked={ConsegnaSettimanale}
                    onChange={(e) => setConsegnaSettimanale(e.target.checked)}
                  />
                  Allarme consegna nella settimana
                </label>
              </div>
        </div>
            <div className="filters-burger">
              <h3>Azioni</h3>
              <button onClick={saveNewOrder}>Salva ordine colonne</button>
            </div>
          </div>
        </div>
      )}

            {/* Contenuto principale: spostato a destra se il burger menu è aperto */}
            <div className={`main-container ${isBurgerMenuOpen ? "shifted" : ""}`}>
      <DndProvider backend={HTML5Backend}>
        <div className="Gen-table-container">
          <table className="software2-schedule">
            <thead>
              <tr>
                {columnOrder.map((stato, index) => (
                  <DraggableColumn
                    key={stato.id}
                    id={stato.id}
                    index={index}
                    moveColumn={moveColumn}
                  >
                    {stato.nome_stato}
                  </DraggableColumn>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                {columnOrder.map((stato) => (
                  <td key={stato.id}>
                    <DropZone
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
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
          {selectedCommessa && (
          <CommessaDettagli
            commessa={selectedCommessa}
            onClose={handleClosePopup}
          />
        )}
        </div>
      </DndProvider>
     
    </div>
    </div>
  );
}

export default StatoAvanzamentoReparti;
