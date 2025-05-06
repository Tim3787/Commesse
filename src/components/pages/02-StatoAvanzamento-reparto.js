import React, { useState, useEffect } from "react";
import axios from "axios";
import "./00-Dashboard.css";
import CommessaDettagli from "../popup/CommessaDettagli";

// Import per il drag & drop
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";

// Import per Trello (cards e liste)
import { getBoardCards, getBoardLists } from "../services/API/trello-api";

// Import di componenti di alert per warning e attività non completate
import WarningDetails from "../assets/WarningDetails";
import UnfinishedActivities from "../assets/UnfinishedActivities";

// Import per gestire il routing e leggere i parametri dall'URL
import { useParams } from "react-router-dom";

// Import del componente per le colonne trascinabili
import DraggableColumn from "../assets/DraggableColumn";

// Import per ordinare gli stati di avanzamento (API)
import { ordinaStatiAvanzamento } from "../services/API/StatiAvanzamento-api";

// Import per le notifiche
import "react-toastify/dist/ReactToastify.css";
import { ToastContainer, toast } from "react-toastify";

// Import delle icone di FontAwesome
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faEyeSlash,
  faCalendarWeek,
  faCalendar,
} from "@fortawesome/free-solid-svg-icons";

/**
 * Componente StatoAvanzamentoReparti
 * Visualizza lo stato di avanzamento delle commesse per un reparto specifico,
 * integrando dati provenienti dal backend e dalla board Trello.
 */
function StatoAvanzamentoReparti() {
  // ----------------------------------------------------------------
  // Configurazione per i reparti (definita direttamente nel componente)
  // ----------------------------------------------------------------
  const repartoConfig = {
    software: {
      RepartoID: 1,
      RepartoName: "software",
      boardId: "606e8f6e25edb789343d0871",
      accoppiamentoStati: {
        "in entrata": [
          "S: In entrata",
          "S-Ribo in entrata",
          "S: Modifiche su macchina old",
        ],
        analisi: ["S: Analisi", "S: Modifiche su macchina old"],
        "sviluppo programmato": ["S: In entrata", "S: Analisi"],
        sviluppo: ["S: Sviluppo"],
        "pronta per collaudo": [
          "S: pronto per messa in servizio",
          "S: Macchina quasi pronta per inizio collaudo (vedi data di massima inserita da Massimo)",
        ],
        collaudo: ["S: Collaudo"],
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
        "in entrata": [
          "E: In entrata",
          "E: In entrata",
          "E: Schema destinato a Luca",
          "E: Schema destinato a Alan",
          "E: Schema destinato a Alessio",
          "E: Schema destinato a Simone",
        ],
        analisi: ["E: Analisi documentazione"],
        sviluppo: ["E: Sviluppo"],
        controllo: [
          "E: Controllo schema prima del lancio",
          "E: Schema ok per BM",
          "E: Materiale impegnato da gestionale da ufficio acquisti",
          "E: Priorità commesse da prelevare",
        ],
        "bm in preparazione": ["E: Materiale BM in preparazione"],
        "bm pronto": ["Materiale BM Completo"],
        completate: [
          "E: Completate",
          "E: Documentazione da aggiornare",
          "E: Documentazione aggiornata, ok a mauro per invio schema definitivo",
        ],
        "materiale elettrico in preparazione": [
          "E: in lavorazione ordine materiale BM e QE",
          "E: Materiale BM Ordinato",
          "E: Materiale BM in preparazione",
          "E: Materiale da sollecitare",
          "E: Materiale già sollecitato",
          "E: Materiale BM quasi completo",
          "E: Materiale BM Completo",
        ],
        "macchina in cablaggio": ["E: Montaggio bordo macchina"],
        "macchina in pre-collaudo": ["E: Montaggio bordo macchina"],
        "macchina in smontaggio": [
          "E: Completate",
          "E: Documentazione da aggiornare",
          "E: Documentazione aggiornata, ok a mauro per invio schema definitivo",
        ],
      },
    },
    quadristi: {
      RepartoID: 15,
      RepartoName: "quadristi",
      boardId: "606efd4d2898f5705163448f",
      accoppiamentoStati: {
        analisi: ["E: Analisi documentazione"],
      },
    },
  };

  // Legge il parametro dinamico "reparto" dall'URL e imposta i dati del reparto
  const { reparto } = useParams();
  const repartoData = repartoConfig[reparto] || {};
  const { RepartoID, RepartoName, boardId, accoppiamentoStati } = repartoData;

  // ----------------------------------------------------------------
  // Stati del componente
  // ----------------------------------------------------------------
  const [commesse, setCommesse] = useState([]); // Commesse caricate dal backend
  const [stati, setStati] = useState([]); // Stati di avanzamento validi per il reparto
  const [loading, setLoading] = useState(false);
  const [numeroCommessaFilter, setNumeroCommessaFilter] = useState("");
  const [clienteFilter, setClienteFilter] = useState("");
  const [tipoMacchinaFilter, setTipoMacchinaFilter] = useState("");
  const [cards, setCards] = useState([]); // Cards provenienti da Trello
  const [lists, setLists] = useState([]); // Liste provenienti da Trello
  const token = sessionStorage.getItem("token");
  const [activities, setActivities] = useState([]); // Attività relative alle commesse
  const apiUrl = process.env.REACT_APP_API_URL;
  const [resources, setResources] = useState([]); // Risorse (es. dipendenti)
  const [columnOrder, setColumnOrder] = useState([]); // Ordine delle colonne (stati)
  const [confrontoConTrello, setConfrontoConTrello] = useState(true); // Abilita il confronto con Trello
  const [esisteSuTrello, setesisteSuTrello] = useState(false); // Controlla se la commessa esiste su Trello
  const [allarmiNote, setAllarmiNote] = useState(true); // Abilita gli allarmi basati sulle note
  const [allarmiAttivitaAperte, setAllarmiAttivitaAperte] = useState(true); // Abilita allarmi per attività aperte
  const [VediConsegnate, setVediConsegnate] = useState(false); // Visualizza anche le commesse consegnate
  const [ConsegnaMensile, setConsegnaMensile] = useState(true); // Abilita allarme consegna nel mese
  const [ConsegnaSettimanale, setConsegnaSettimanale] = useState(true); // Abilita allarme consegna nella settimana
  const [selectedCommessa, setSelectedCommessa] = useState(null); // Commessa selezionata per i dettagli
  const normalize = (str) => str?.trim().toLowerCase();

// Suggerimenti per i filtri
const [suggestionsCommessa, setSuggestionsCommessa] = useState([]);
const [suggestionsCliente, setSuggestionsCliente] = useState([]);
const [suggestionsTipoMacchina, setSuggestionsTipoMacchina] = useState([]);
const [showCommessaSuggestions, setShowCommessaSuggestions] = useState(false);
const [showClienteSuggestions, setShowClienteSuggestions] = useState(false);
const [showTipoMacchinaSuggestions, setShowTipoMacchinaSuggestions] = useState(false);

  // ----------------------------------------------------------------
  // Funzioni Helper
  // ----------------------------------------------------------------

  /**
   * Restituisce il nome della lista di Trello dato il suo ID.
   */
  const getListNameById = (listId) => {
    const list = lists.find((list) => list.id === listId);
    return list ? list.name : "Lista sconosciuta";
  };

  /**
   * Verifica se una data (in formato stringa) cade nella settimana corrente.
   */
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

  /**
   * Verifica se una data (in formato stringa) cade nel mese corrente.
   */
  const isThisMonth = (dateString) => {
    if (!dateString) return false;
    const date = new Date(dateString);
    const now = new Date();
    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
  };

  /**
   * Restituisce gli stati attivi per una commessa.
   * Per ogni reparto nella commessa vengono estratti gli stati attivi.
   */
  const getStatiAttiviPerCommessa = (commessa) => {
    return (
      commessa.stati_avanzamento
        ?.map((reparto) => {
          const statoAttivo = reparto.stati_disponibili.find((stato) => stato.isActive);
          return {
            reparto_nome: reparto.reparto_nome,
            stato: statoAttivo || null,
          };
        })
        .filter((reparto) => reparto.stato !== null) || []
    );
  };

  // ----------------------------------------------------------------
  // Chiamate API per recuperare dati dal backend
  // ----------------------------------------------------------------

  /**
   * Recupera le attività dal backend e le imposta nello stato.
   */
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

  /**
   * Recupera dati relativi alle commesse, agli stati e alle board di Trello.
   */
  useEffect(() => {
    const fetchData = async () => {
      if (!RepartoID) return;
      setLoading(true);
      try {
        // Recupera le commesse
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
    
        // Stati di avanzamento
        const statiResponse = await axios.get(`${apiUrl}/api/stati-avanzamento`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const statiValidi = statiResponse.data.filter((stato) => stato.reparto_id === RepartoID);
        setStati(statiValidi);
    
        // Liste e cards da Trello (può fallire)
        const [boardLists, boardCards] = await Promise.all([
          getBoardLists(boardId),
          getBoardCards(boardId),
        ]);
        setLists(boardLists);
        setCards(boardCards);
    
      } catch (error) {
        console.error("Errore durante il recupero dei dati:", error);
      } finally {
        try {
          await fetchActivities(); // 👈 prova a recuperare le attività
        } catch (activityError) {
          console.error("Errore durante il recupero delle attività:", activityError);
          toast.error("Attenzione: non è stato possibile recuperare le attività.");
        }
        setLoading(false); // ✅ comunque chiudi il loading
      }
    };
    fetchData();
}, [RepartoID, boardId, apiUrl, token]);


  /**
   * Recupera le risorse dal backend.
   */
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

  /**
   * Estrae il numero della commessa (primi 5 caratteri) dal nome della card di Trello.
   */
  const extractCommessaNumber = (trelloName) => {
    const match = trelloName.match(/^\d{5}/);
    return match ? match[0] : null;
  };

  /**
   * Chiude il popup dei dettagli della commessa.
   */
  const handleClosePopup = () => {
    setSelectedCommessa(null);
  };

  /**
   * Gestisce il drop di un'attività (cambio di stato) e aggiorna la commessa.
   */
  const handleActivityDrop = async (commessaId, repartoId, newStatoId) => {
    try {
      await axios.put(
        `${apiUrl}/api/commesse/${commessaId}/reparti/${repartoId}/stato`,
        { stato_id: newStatoId, is_active: true },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Aggiorna localmente lo stato della commessa
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

  // ----------------------------------------------------------------
  // Gestione dell'ordine delle colonne
  // ----------------------------------------------------------------

  // Imposta l'ordine iniziale delle colonne in base al campo "ordine" degli stati
  useEffect(() => {
    if (stati.length > 0) {
      const ordered = stati.slice().sort((a, b) => a.ordine - b.ordine);
      setColumnOrder(ordered);
    }
  }, [stati]);

  /**
   * Permette di spostare una colonna da una posizione all'altra.
   */
  const moveColumn = (fromIndex, toIndex) => {
    setColumnOrder((prevOrder) => {
      const updatedOrder = [...prevOrder];
      const [removed] = updatedOrder.splice(fromIndex, 1);
      updatedOrder.splice(toIndex, 0, removed);
      return updatedOrder;
    });
  };

  /**
   * Salva il nuovo ordine delle colonne sul backend.
   */
  const saveNewOrder = async () => {
    try {
      // Costruisce l'array degli stati con il nuovo ordine
      const statiDaAggiornare = columnOrder.map((stato, index) => ({
        stato_id: stato.id, // Identificatore dello stato
        ordine: index + 1,  // Ordine aggiornato
      }));

      // Esempio di id da usare (modifica in base alla logica della tua app)
      const idDaUsare = 1;

      // Aggiorna gli stati sul backend
      await ordinaStatiAvanzamento(idDaUsare, RepartoID, statiDaAggiornare);

      // Aggiorna localmente l'ordine delle colonne
      setColumnOrder((prevOrder) =>
        prevOrder.map((stato, index) => ({ ...stato, ordine: index + 1 }))
      );

      toast.success("Ordine aggiornato con successo!");
    } catch (error) {
      console.error("Errore durante il salvataggio del nuovo ordine:", error);
      toast.error("Errore durante l'aggiornamento dell'ordine.");
    }
  };

  /**
   * Gestisce il click su una commessa, impostandola come selezionata per visualizzare i dettagli.
   */
  const handleCommessaClick = (commessa) => {
    setSelectedCommessa(commessa);
  };


  // ----------------------------------------------------------------
  // Filtraggio delle commesse
  // ----------------------------------------------------------------

  /**
   * Filtra le commesse in base ai filtri per numero, cliente e tipo macchina.
   * Se VediConsegnate è disattivato, esclude le commesse con data di consegna precedente a oggi.
   */
  const filteredCommesse = commesse.filter((commessa) => {
    const matchesNumeroCommessa = commessa.numero_commessa
      .toString()
      .includes(numeroCommessaFilter);
    const matchesCliente = commessa.cliente.toLowerCase().includes(clienteFilter.toLowerCase());
    const matchesTipoMacchina = commessa.tipo_macchina?.toLowerCase().includes(tipoMacchinaFilter.toLowerCase());
  
    const warningActivities = activities.filter(
      (activity) =>
        activity.stato === 2 &&
        activity.note &&
        activity.commessa_id === commessa.commessa_id &&
        activity.reparto?.toLowerCase() === RepartoName
    );
  
    const unfinishedActivities = activities.filter(
      (activity) =>
        activity.stato === 1 &&
        activity.commessa_id === commessa.commessa_id &&
        activity.reparto?.toLowerCase() === RepartoName
    );
  
    let notDelivered = true;
    //if (!VediConsegnate && commessa.data_consegna) {
     // const deliveryDate = new Date(commessa.data_consegna);
     //// today.setHours(0, 0, 0, 0);
     // notDelivered = deliveryDate >= today;
    //}

 
    if (!VediConsegnate) {
      notDelivered = Number(commessa.stato) !== 3;
    }
    
    // Mostra comunque le commesse completate con note attive o attività non completate
    const shouldShow = warningActivities.length > 0 || unfinishedActivities.length > 0;
  
    return matchesNumeroCommessa && matchesCliente && matchesTipoMacchina && (notDelivered || shouldShow);
  });
  
  // Listener globale per chiudere i suggerimenti cliccando fuori
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        !event.target.closest(".suggestions-list") &&
        !event.target.closest(".input-field-100")
      ) {
        setShowCommessaSuggestions(false);
        setShowClienteSuggestions(false);
        setShowTipoMacchinaSuggestions(false);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, []);

  // Aggiorna i suggerimenti per Numero Commessa basandosi sull'array delle commesse
  useEffect(() => {
    const commessaSuggs = commesse
      .map((c) => c.numero_commessa)
      .filter((value, index, self) => self.indexOf(value) === index);
    setSuggestionsCommessa(commessaSuggs);
  }, [commesse]);

  // Suggerimenti per Cliente
  useEffect(() => {
    const clienteSuggs = commesse
      .map((c) => c.cliente)
      .filter((value, index, self) => self.indexOf(value) === index);
    setSuggestionsCliente(clienteSuggs);
  }, [commesse]);

  // Suggerimenti per Tipo Macchina
  useEffect(() => {
    const tipoSuggs = commesse
      .map((c) => c.tipo_macchina)
      .filter((value, index, self) => self.indexOf(value) === index);
    setSuggestionsTipoMacchina(tipoSuggs);
  }, [commesse]);

  // ----------------------------------------------------------------
  // Componente Interno: DraggableCommessa
  // Rappresenta una card commessa trascinabile.
  // ----------------------------------------------------------------
  function DraggableCommessa({ commessa, repartoId, activities, resources }) {
    // Configura il drag per la commessa
    const [{ isDragging }, drag] = useDrag(() => ({
      type: "COMMESSA",
      item: { commessaId: commessa.commessa_id, repartoId },
      collect: (monitor) => ({
        isDragging: !!monitor.isDragging(),
      }),
    }));

    // Filtra le attività per mostrare eventuali warning (attività completate con note) e attività non completate
    const warningActivities = activities.filter(
      (activity) =>
        activity.stato === 2 &&
        activity.note &&
        activity.commessa_id === commessa.commessa_id &&
        activity.reparto?.toLowerCase() === RepartoName
    );

    const unfinishedActivities = activities.filter(
      (activity) =>
        activity.stato === 1 &&
        activity.commessa_id === commessa.commessa_id &&
        activity.reparto?.toLowerCase() === RepartoName
    );

    // Cerca la card di Trello corrispondente (basata sul numero della commessa)
    const trelloCard = cards.find((card) => {
      const trelloNumero = extractCommessaNumber(card.name);
      return commessa.numero_commessa === trelloNumero;
    });

    // Recupera il nome della lista di Trello a cui appartiene la card
    const trelloListName = trelloCard ? getListNameById(trelloCard.idList) : "N/A";

    // Recupera gli stati attivi per la commessa e seleziona quello relativo al reparto corrente
    const statiAttivi = getStatiAttiviPerCommessa(commessa);
    const statoAttivo = statiAttivi.find((s) => s.reparto_nome.toLowerCase() === RepartoName);

    // Verifica se la lista Trello corrente corrisponde a quella attesa dall'accoppiamento
    const isListDifferent = !accoppiamentoStati[normalize(statoAttivo?.stato?.nome_stato)]?.includes(trelloListName);

    // Funzione per normalizzare una data (ottenendo la parte "YYYY-MM-DD")
    const normalizeDate = (dateString) => {
      if (!dateString) return null;
      const date = new Date(dateString);
      return date.toISOString().split("T")[0];
    };

    // Estrae le date da Trello e dall'applicazione e confronta se sono differenti
    const trelloDate = trelloCard?.due ? normalizeDate(trelloCard.due) : null;
    const appDate = commessa.data_consegna ? normalizeDate(commessa.data_consegna) : null;
    const isDateDifferent = trelloDate !== appDate;

    /**
     * Allinea la data della commessa con quella presente in Trello.
     */
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
          `${apiUrl}/api/commesse/${commessaId}/data-consegna`,
          { data_consegna: normalizedTrelloDate },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        
        // Aggiorna la data di consegna localmente
        setCommesse((prevCommesse) =>
          prevCommesse.map((c) =>
            c.commessa_id === commessaId ? { ...c, data_consegna: normalizedTrelloDate } : c
          )
        );
    
        toast.success("Data allineata con successo.");
      } catch (error) {
        console.error("Errore durante l'allineamento della data:", error);
        toast.error("Errore durante l'allineamento della data.");
      }
    };

    // Rendering della card della commessa
    return (
      <div
        ref={drag}
        className="commessa"
        style={{
          opacity: isDragging ? 0.5 : 1,
          backgroundColor:
            confrontoConTrello && trelloCard
              ? confrontoConTrello && isDateDifferent
                ? "#ffcccc"
                : "#fff"
              : "white",
          border: esisteSuTrello && isListDifferent ? "2px solid red" : "1px solid black",
        }}
        onClick={() => handleCommessaClick(commessa)}
      >
        <strong>{commessa.numero_commessa}</strong>
        <div>{commessa.cliente}</div>
        {/* Blocchi per le icone di allarme relative alla consegna */}
        <div className="delivery-alerts">
          {ConsegnaSettimanale && isThisWeek(commessa.data_consegna) && (
            <FontAwesomeIcon
              icon={faCalendarWeek}
              title="Consegna questa settimana"
              style={{ marginRight: "5px", color: "ORANGE" }}
            />
          )}
          {!isThisWeek(commessa.data_consegna) &&
            ConsegnaMensile &&
            isThisMonth(commessa.data_consegna) && (
              <FontAwesomeIcon
                icon={faCalendar}
                title="Consegna questo mese"
                style={{ color: "blue" }}
              />
            )}
        </div>

        {/* Mostra il componente WarningDetails se sono presenti warning (note) */}
        {allarmiNote && warningActivities.length > 0 && (
          <WarningDetails warningActivities={warningActivities} resources={resources} />
        )}

        {/* Mostra il componente UnfinishedActivities se sono presenti attività non completate */}
        {allarmiAttivitaAperte && unfinishedActivities.length > 0 && (
          <UnfinishedActivities unfinishedActivities={unfinishedActivities} resources={resources} />
        )}

        {/* Se la commessa dovrebbe esistere su Trello ma non viene trovata, mostra un messaggio */}
        {esisteSuTrello && !trelloCard && (
          <div style={{ color: "red", fontStyle: "italic" }}>Non esiste su Trello</div>
        )}

        {/* Se la data tra l'app e Trello differisce, consente di allinearla */}
        <div>
          {confrontoConTrello && trelloCard && isDateDifferent && (
            <div style={{ color: "red" }}>
              Data App: {appDate}
              <br />
              Data Trello: {trelloDate}
              <br />
              <button onClick={() => handleAlignDate(commessa.commessa_id, trelloCard.due)}>
                Allinea Data
              </button>
            </div>
          )}
        </div>

        {/* Se la lista Trello è diversa da quella attesa, mostra il nome della lista */}
        {confrontoConTrello && trelloCard && isListDifferent && (
          <div style={{ color: "red" }}>
            <div>Lista Trello: {trelloListName}</div>
          </div>
        )}
      </div>
    );
  }

  // ----------------------------------------------------------------
  // Stato e funzioni per il Burger Menu (filtri e opzioni)
  // ----------------------------------------------------------------
  const [isBurgerMenuOpen, setIsBurgerMenuOpen] = useState(false);
  const toggleBurgerMenu = () => {
    setIsBurgerMenuOpen((prev) => !prev);
  };

  // ----------------------------------------------------------------
  // Componente Interno: DropZone
  // Rappresenta la cella di drop per il drag & drop delle commesse
  // ----------------------------------------------------------------
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
          <div className="dropzone-placeholder">Drop here</div>
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

  // ----------------------------------------------------------------
  // Rendering del componente
  // ----------------------------------------------------------------
  return (
    <div className="page-wrapper">
      {/* HEADER */}
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

      {/* BURGER MENU */}
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
        {/* Filtro per Numero Commessa */}
        <div className="filter-group">
          <input
            type="text"
            placeholder="Numero Commessa"
            value={numeroCommessaFilter}
            onChange={(e) => setNumeroCommessaFilter(e.target.value)}
            onFocus={() => setShowCommessaSuggestions(true)}
            className="input-field-100"
          />
          {showCommessaSuggestions && suggestionsCommessa.length > 0 && (
            <ul className="suggestions-list">
              {suggestionsCommessa
                .filter((value) =>
                  value.toString().toLowerCase().includes(numeroCommessaFilter.toLowerCase())
                )
                .map((value, index) => (
                  <li
                    key={index}
                    onClick={() => {
                      setNumeroCommessaFilter(value.toString());
                      setShowCommessaSuggestions(false);
                    }}
                  >
                    {value}
                  </li>
                ))}
            </ul>
          )}
        </div>

        {/* Filtro per Cliente */}
        <div className="filter-group">
          <input
            type="text"
            placeholder="Cliente"
            value={clienteFilter}
            onChange={(e) => setClienteFilter(e.target.value)}
            onFocus={() => setShowClienteSuggestions(true)}
            className="input-field-100"
          />
          {showClienteSuggestions && suggestionsCliente.length > 0 && (
            <ul className="suggestions-list">
              {suggestionsCliente
                .filter((value) =>
                  value.toLowerCase().includes(clienteFilter.toLowerCase())
                )
                .map((value, index) => (
                  <li
                    key={index}
                    onClick={() => {
                      setClienteFilter(value);
                      setShowClienteSuggestions(false);
                    }}
                  >
                    {value}
                  </li>
                ))}
            </ul>
          )}
        </div>

        {/* Filtro per Tipo Macchina */}
        <div className="filter-group">
          <input
            type="text"
            placeholder="Tipo Macchina"
            value={tipoMacchinaFilter}
            onChange={(e) => setTipoMacchinaFilter(e.target.value)}
            onFocus={() => setShowTipoMacchinaSuggestions(true)}
            className="input-field-100"
          />
          {showTipoMacchinaSuggestions && suggestionsTipoMacchina.length > 0 && (
            <ul className="suggestions-list">
              {suggestionsTipoMacchina
                .filter((value) =>
                  value.toLowerCase().includes(tipoMacchinaFilter.toLowerCase())
                )
                .map((value, index) => (
                  <li
                    key={index}
                    onClick={() => {
                      setTipoMacchinaFilter(value);
                      setShowTipoMacchinaSuggestions(false);
                    }}
                  >
                    {value}
                  </li>
                ))}
            </ul>
          )}
        </div>

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

      {/* CONTENUTO PRINCIPALE */}
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
                              reparto.stati_disponibili.some((s) => s.stato_id === stato.id && s.isActive)
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
