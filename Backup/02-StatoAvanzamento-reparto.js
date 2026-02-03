import { useState, useEffect } from 'react';
import apiClient from '../config/axiosConfig';
import CommessaDettagli from '../popup/CommessaDettagli';
import logo from '../img/Animation - 1738249246846.gif';
import '../style/02-StatoAvanzamento-reparto.css';
import AttivitaCrea from '../popup/AttivitaCrea';

// Import per il drag & drop
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

// Import per Trello (cards e liste)
import { getBoardCards, getBoardLists } from '../services/API/trello-api';

// Import di componenti di alert per warning e attività non completate
import WarningDetails from '../assets/WarningDetails';
import UnfinishedActivities from '../assets/UnfinishedActivities';
import { updateActivityNotes } from '../services/API/notifiche-api';
// Import per gestire il routing e leggere i parametri dall'URL
import { useParams } from 'react-router-dom';

// Import del componente per le colonne trascinabili
import DraggableColumn from '../assets/DraggableColumn';

// Import per ordinare gli stati di avanzamento (API)
import { ordinaStatiAvanzamento } from '../services/API/StatiAvanzamento-api';

// Import per le notifiche
import 'react-toastify/dist/ReactToastify.css';
import { ToastContainer, toast } from 'react-toastify';

// Import delle icone di FontAwesome
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEyeSlash, faCalendarWeek, faCalendar } from '@fortawesome/free-solid-svg-icons';

// Context
import { useAppData } from '../context/AppDataContext';

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
      RepartoName: 'software',
      boardId: '606e8f6e25edb789343d0871',
      accoppiamentoStati: {
        //Colonna APP
        'in entrata':
          //Colonne Trello
          ['S: In entrata', 'S-Ribo in entrata', 'S: Modifiche su macchina old'],
        analisi:
          //Colonne Trello
          ['S: Analisi', 'S: Modifiche su macchina old'],
        //Colonna APP
        'sviluppo programmato':
          //Colonne Trello
          ['S: In entrata', 'S: Analisi'],
        sviluppo:
          //Colonne Trello
          ['S: Sviluppo'],
        //Colonna APP
        'pronta per collaudo':
          //Colonne Trello
          [
            'S: pronto per messa in servizio',
            'S: Macchina quasi pronta per inizio collaudo (vedi data di massima inserita da Massimo)',
          ],
        collaudo:
          //Colonne Trello
          ['S: Collaudo'],
        //Colonna APP
        'avviamento terminato':
          //Colonne Trello
          ['S: Completate'],
        //Colonna APP
        'avviamento iniziato':
          //Colonne Trello
          ['S: Completate'],
        //Colonna APP
        'collaudo terminato':
          //Colonne Trello
          ['S: Completate'],
        //Colonna APP
        'no software':
          //Colonne Trello
          ['S: Nessun lavoro software', 'S: Modifiche su macchina old', 'S-Ribo in entrata'],
      },
    },
    elettrico: {
      RepartoID: 2,
      RepartoName: 'elettrico',
      boardId: '606efd4d2898f5705163448f',
      accoppiamentoStati: {
        'in entrata': [
          'E: In entrata',
          'E: In entrata',
          'E: Schema destinato a Luca',
          'E: Schema destinato a Alan',
          'E: Schema destinato a Alessio',
          'E: Schema destinato a Simone',
        ],
        analisi: ['E: Analisi documentazione'],
        sviluppo: ['E: Sviluppo'],
        controllo: [
          'E: Controllo schema prima del lancio',
          'E: Schema ok per BM',
          'E: Materiale impegnato da gestionale da ufficio acquisti',
          'E: Priorità commesse da prelevare',
        ],
        'bm in preparazione': ['E: Materiale BM in preparazione'],
        'bm pronto': ['Materiale BM Completo'],
        completate: [
          'E: Completate',
          'E: Documentazione da aggiornare',
          'E: Documentazione aggiornata, ok a mauro per invio schema definitivo',
        ],
        'materiale elettrico in preparazione': [
          'E: in lavorazione ordine materiale BM e QE',
          'E: Materiale BM Ordinato',
          'E: Materiale BM in preparazione',
          'E: Materiale da sollecitare',
          'E: Materiale già sollecitato',
          'E: Materiale BM quasi completo',
          'E: Materiale BM Completo',
        ],
        'macchina in cablaggio': ['E: Montaggio bordo macchina'],
        'macchina in pre-collaudo': ['E: Montaggio bordo macchina'],
        'macchina in smontaggio': [
          'E: Completate',
          'E: Documentazione da aggiornare',
          'E: Documentazione aggiornata, ok a mauro per invio schema definitivo',
        ],
      },
    },
    quadristi: {
      RepartoID: 15,
      RepartoName: 'quadristi',
      boardId: '606efd4d2898f5705163448f',
      accoppiamentoStati: {
        analisi: ['E: Analisi documentazione'],
      },
    },
    meccanico: {
      RepartoID: 3,
      RepartoName: 'meccanico',
      boardId: '607528abaa92290566c9407c',
      accoppiamentoStati: {
        'in entrata': [
          'M: In entrata',
          'M: Progettazione e/o realizzazione ESTERNA',
          'M: Prog. destinata a Alessandro',
          'M: Prog. destinata a Gianni',
          'M: Prog. destinata a Claudio',
          'M: Prog. destinata a Denis',
          'M: Prog. destinata a Paolo',
          'M: In attesa di conferma del lay-out / 3d da parte del cliente, per lancio commessa',
          'M: in attesa di info per procedere (solo se la commessa è totalmente bloccata)',
          'M: Proget. Meccanica',
          'M: Distinta Lanciata',
          'M: Inizio ordine materiale',
          'M: ord.matt. completo',
          'M: Priorità rispetto al calendario per priorità preparazione materiale',
          'M: Preparazione materiale in laovorazione',
          'M: pre. mat. quasi completo',
          'M: Materiale da sollecitare',
          'M: Materiale già sollecitato',
          'M: Materiale completo',
        ],

        'montaggio programmato': [
          'M: In entrata',
          'M: Progettazione e/o realizzazione ESTERNA',
          'M: Prog. destinata a Alessandro',
          'M: Prog. destinata a Gianni',
          'M: Prog. destinata a Claudio',
          'M: Prog. destinata a Denis',
          'M: Prog. destinata a Paolo',
          'M: In attesa di conferma del lay-out / 3d da parte del cliente, per lancio commessa',
          'M: in attesa di info per procedere (solo se la commessa è totalmente bloccata)',
          'M: Proget. Meccanica',
          'M: Distinta Lanciata',
          'M: Inizio ordine materiale',
          'M: ord.matt. completo',
          'M: Priorità rispetto al calendario per priorità preparazione materiale',
          'M: Preparazione materiale in laovorazione',
          'M: pre. mat. quasi completo',
          'M: Materiale da sollecitare',
          'M: Materiale già sollecitato',
          'M: Materiale completo',
        ],
        'montaggio in corso': [
          'M: Mont. mec. In corso',
          'M - Inizio bordomacchina e montaggio in corso (inserire data di massima nella scheda relativa)',
          'M: Line pronte al 80/90% messe in ordine prioritario per inizio collaudo (inserire data di massima nella scheda relativa)',
        ],
        'montaggio completato': [
          'M: Montaggio completo',
          'M: Bordo macchina in corso',
          'M: Collaudo',
          'M: Collaudo completato in attesa del FAT/smontaggio',
          'M: Altre attività extra da fare prima dello smontaggio/spedizione',
        ],
        'smontaggio programmato': [
          'M: Montaggio completo',
          'M: Bordo macchina in corso',
          'M: Collaudo',
          'M: Collaudo completato in attesa del FAT/smontaggio',
          'M: Altre attività extra da fare prima dello smontaggio/spedizione',
        ],
      },
    },
    service: {
      RepartoID: 18,
      RepartoName: 'service',
      boardId: '606efd4d2898f5705163448f',
      accoppiamentoStati: {
        analisi: ['E: Analisi documentazione'],
      },
    },
    tecnicoelettrico: {
      RepartoID: 14,
      RepartoName: 'tecnico elettrico',
      boardId: '606efd4d2898f5705163448f',
      accoppiamentoStati: {
        'in entrata': [
          'E: In entrata',
          'E: In entrata',
          'E: Schema destinato a Luca',
          'E: Schema destinato a Alan',
          'E: Schema destinato a Alessio',
          'E: Schema destinato a Simone',
        ],
        analisi: ['E: Analisi documentazione'],
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
  const [numeroCommessaFilter, setNumeroCommessaFilter] = useState('');
  const [clienteFilter, setClienteFilter] = useState('');
  const [tipoMacchinaFilter, setTipoMacchinaFilter] = useState('');
  const [cards, setCards] = useState([]); // Cards provenienti da Trello
  const [lists, setLists] = useState([]); // Liste provenienti da Trello
  const token = sessionStorage.getItem('token');
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
  const [filterR, setFilterR] = useState(false); // Mostra R-
  const [filterM, setFilterM] = useState(false); // Mostra M-
  const [ConsegnaSettimanale, setConsegnaSettimanale] = useState(true); // Abilita allarme consegna nella settimana
  const [selectedCommessa, setSelectedCommessa] = useState(null); // Commessa selezionata per i dettagli
  const normalize = (str) => str?.trim().toLowerCase();
  const [movingCommessa, setMovingCommessa] = useState(null);

  // Chiudi la nota associata a un'attività
  const CLOSED_PREFIX = '[CHIUSA] ';
  const isClosedNote = (text) =>
    typeof text === 'string' && text.trim().toUpperCase().startsWith(CLOSED_PREFIX.trim());
  const closeNoteText = (text) =>
    isClosedNote(text) ? text : `${CLOSED_PREFIX}${text || ''}`.trim();
  const reopenNoteText = (text) =>
    isClosedNote(text) ? text.replace(new RegExp(`^${CLOSED_PREFIX}`, 'i'), '') : text;

  // Suggerimenti per i filtri
  const [suggestionsCommessa, setSuggestionsCommessa] = useState([]);
  const [suggestionsCliente, setSuggestionsCliente] = useState([]);
  const [suggestionsTipoMacchina, setSuggestionsTipoMacchina] = useState([]);
  const [showCommessaSuggestions, setShowCommessaSuggestions] = useState(false);
  const [showClienteSuggestions, setShowClienteSuggestions] = useState(false);
  const [showTipoMacchinaSuggestions, setShowTipoMacchinaSuggestions] = useState(false);

  const [showPopup, setShowPopup] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState({});

  /* ===============================
     APP DATA
  =============================== */
  const { reparti, attivitaConReparto, refreshAttivitaProgrammate } = useAppData();

  // ----------------------------------------------------------------
  // Funzioni Helper
  // ----------------------------------------------------------------

  /**
   * Restituisce il nome della lista di Trello dato il suo ID.
   */
  const getListNameById = (listId) => {
    const list = lists.find((list) => list.id === listId);
    return list ? list.name : 'Lista sconosciuta';
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
      const response = await apiClient.get('/api/attivita_commessa');
      setActivities(response.data);
    } catch (error) {
      console.error('Errore durante il recupero delle attività:', error);
    }
  };

  useEffect(() => {
    if (RepartoName === 'service') {
      setConfrontoConTrello(false);
    }
  }, [RepartoName]);

  const handleEditActivity = (activity) => {
    const attivita = attivitaConReparto.find((a) => a.id === activity.attivita_id);
    const risorsa = resources.find((r) => r.id === activity.risorsa_id);

    setSelectedActivity({
      ...activity,
      reparto_id: attivita?.reparto_id || risorsa?.reparto_id || '',
      risorsa_id: activity.risorsa_id,
      attivita_id: activity.attivita_id,
      data_inizio: activity.data_inizio?.slice(0, 10),
      durata: activity.durata ?? 1,
      stato: activity.stato ?? 0,
      descrizione: activity.descrizione || '',
      includedWeekends: activity.included_weekends || [],
    });

    setIsEditing(true);
    setShowPopup(true);
  };

  // Elimina la nota associata a un'attività
  const deleteNote = async (activityId) => {
    try {
      await updateActivityNotes(activityId, null, token);

      toast.success('Nota eliminata con successo!');
      setActivities((prevActivities) =>
        prevActivities.map((activity) =>
          activity.id === activityId ? { ...activity, note: null } : activity
        )
      );
    } catch (error) {
      console.error("Errore durante l'eliminazione della nota:", error);
      toast.error("Errore durante l'eliminazione della nota.");
    }
  };

  // Chiudi la nota associata a un'attività (senza cancellarla)
  const closeNote = async (activityId) => {
    try {
      const activity = activities.find((a) => a.id === activityId);
      if (!activity) return;

      const newText = closeNoteText(activity.note);
      await updateActivityNotes(activityId, newText, token);

      toast.success('Nota chiusa con successo!');
      setActivities((prev) => prev.map((a) => (a.id === activityId ? { ...a, note: newText } : a)));
    } catch (error) {
      console.error('Errore durante la chiusura della nota:', error);
      toast.error('Errore durante la chiusura della nota.');
    }
  };

  // (Opzionale) Riapri la nota se serve
  const reopenNote = async (activityId) => {
    try {
      const activity = activities.find((a) => a.id === activityId);
      if (!activity) return;

      const newText = reopenNoteText(activity.note);
      await updateActivityNotes(activityId, newText, token);

      toast.success('Nota riaperta!');
      setActivities((prev) => prev.map((a) => (a.id === activityId ? { ...a, note: newText } : a)));
    } catch (error) {
      console.error('Errore durante la riapertura della nota:', error);
      toast.error('Errore durante la riapertura della nota.');
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
        const response = await apiClient.get('/api/commesse');

        const parsedCommesse = response.data.map((commessa) => ({
          ...commessa,
          stati_avanzamento:
            typeof commessa.stati_avanzamento === 'string'
              ? JSON.parse(commessa.stati_avanzamento)
              : commessa.stati_avanzamento,
        }));
        setCommesse(parsedCommesse);

        // Stati di avanzamento
        const statiResponse = await apiClient.get('/api/stati-avanzamento');
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
        console.error('Errore durante il recupero dei dati:', error);
      } finally {
        try {
          await fetchActivities(); // 👈 prova a recuperare le attività
        } catch (activityError) {
          console.error('Errore durante il recupero delle attività:', activityError);
          toast.error('Attenzione: non è stato possibile recuperare le attività.');
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
        const response = await apiClient.get('/api/risorse');
        setResources(response.data);
      } catch (error) {
        console.error('Errore durante il recupero delle risorse:', error);
      }
    };

    fetchResources();
  }, [apiUrl, token]);

  // Ricarica le attività programmate dalla API
  const handleReloadActivities = async () => {
    try {
      await refreshAttivitaProgrammate(); // aggiorna dal contesto
      toast.success('Attività ricaricate con successo');
    } catch (error) {
      console.error('Errore durante il ricaricamento delle attività:', error);
      toast.error('Errore durante il ricaricamento delle attività');
    }
  };
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
  /**
  const handleActivityDrop = async (commessaId, repartoId, newStatoId) => {
    try {
      await apiClient.put(`/api/commesse/${commessaId}/reparti/${repartoId}/stato`, {
   stato_id: newStatoId,
   is_active: true,
 });

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
  */
  const toNum = (v) => (v == null ? v : Number(v));

  const handleActivityDrop = async (commessaId, repartoId, newStatoId) => {
    const cId = toNum(commessaId);
    const rId = toNum(repartoId);
    const sId = toNum(newStatoId);

    // ✅ Aggiornamento ottimistico: la card si sposta subito
    setCommesse((prev) =>
      prev.map((c) => {
        if (toNum(c.commessa_id) !== cId) return c;

        const newStati = c.stati_avanzamento.map((r) => {
          if (toNum(r.reparto_id) !== rId) return r;

          return {
            ...r,
            stati_disponibili: r.stati_disponibili.map((s) => ({
              ...s,
              isActive: toNum(s.stato_id) === sId ? true : false,
            })),
          };
        });

        return { ...c, stati_avanzamento: newStati };
      })
    );

    try {
      await apiClient.put(`/api/commesse/${cId}/reparti/${rId}/stato`, {
        stato_id: sId,
        is_active: true,
      });
    } catch (error) {
      console.error("Errore durante l'aggiornamento dello stato:", error);
      // opzionale: fai un refetch per ripristinare lo stato corretto in caso di errore
      // await refetchCommesse();
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
        ordine: index + 1, // Ordine aggiornato
      }));

      // Esempio di id da usare (modifica in base alla logica della tua app)
      const idDaUsare = 1;

      // Aggiorna gli stati sul backend
      await ordinaStatiAvanzamento(idDaUsare, RepartoID, statiDaAggiornare);

      // Aggiorna localmente l'ordine delle colonne
      setColumnOrder((prevOrder) =>
        prevOrder.map((stato, index) => ({ ...stato, ordine: index + 1 }))
      );

      toast.success('Ordine aggiornato con successo!');
    } catch (error) {
      console.error('Errore durante il salvataggio del nuovo ordine:', error);
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
    const matchesTipoMacchina = commessa.tipo_macchina
      ?.toLowerCase()
      .includes(tipoMacchinaFilter.toLowerCase());

    const warningActivities = activities.filter(
      (a) =>
        a.stato === 2 &&
        a.note &&
        !isClosedNote(a.note) &&
        a.commessa_id === commessa.commessa_id &&
        normalize(a.reparto) === normalize(RepartoName)
    );
    const unfinishedActivities = activities.filter(
      (a) =>
        a.stato === 1 &&
        a.commessa_id === commessa.commessa_id &&
        normalize(a.reparto) === normalize(RepartoName)
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

    // Escludi commesse R- e M- se disabilitate e siamo nel reparto software
    if (RepartoName === 'software') {
      if (commessa.numero_commessa.startsWith('R-') && !filterR) {
        return false;
      }
      if (commessa.numero_commessa.startsWith('M-') && !filterM) {
        return false;
      }
    }
    // 🔹 Nuova condizione per il reparto "Service"
    if (
      RepartoName.toLowerCase() === 'service' &&
      !(commessa.numero_commessa.startsWith('M-') || commessa.numero_commessa.startsWith('R-'))
    ) {
      return false; // esclude le commesse che non iniziano con M- o R-
    }
    return (
      matchesNumeroCommessa && matchesCliente && matchesTipoMacchina && (notDelivered || shouldShow)
    );
  });

  // Listener globale per chiudere i suggerimenti cliccando fuori
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.input') && !event.target.closest('.w-200')) {
        setShowCommessaSuggestions(false);
        setShowClienteSuggestions(false);
        setShowTipoMacchinaSuggestions(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
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
      type: 'COMMESSA',
      item: { commessaId: commessa.commessa_id, repartoId },
      collect: (monitor) => ({
        isDragging: !!monitor.isDragging(),
      }),
    }));

    // Filtra le attività per mostrare eventuali warning (attività completate con note) e attività non completate
    const unfinishedActivities = activities.filter(
      (a) =>
        a.stato === 1 &&
        a.commessa_id === commessa.commessa_id &&
        normalize(a.reparto) === normalize(RepartoName)
    );

    const warningActivities = activities.filter(
      (a) =>
        a.stato === 2 &&
        a.note &&
        !isClosedNote(a.note) &&
        a.commessa_id === commessa.commessa_id &&
        normalize(a.reparto) === normalize(RepartoName)
    );

    // Cerca la card di Trello corrispondente (basata sul numero della commessa)
    const trelloCard = cards.find((card) => {
      const trelloNumero = extractCommessaNumber(card.name);
      return commessa.numero_commessa === trelloNumero;
    });

    // Recupera il nome della lista di Trello a cui appartiene la card
    const trelloListName = trelloCard ? getListNameById(trelloCard.idList) : 'N/A';

    // Recupera gli stati attivi per la commessa e seleziona quello relativo al reparto corrente
    const statiAttivi = getStatiAttiviPerCommessa(commessa);
    const statoAttivo = statiAttivi.find(
      (s) => normalize(s.reparto_nome) === normalize(RepartoName)
    );

    // Verifica se la lista Trello corrente corrisponde a quella attesa dall'accoppiamento
    const isListDifferent =
      !accoppiamentoStati[normalize(statoAttivo?.stato?.nome_stato)]?.includes(trelloListName);

    // Funzione per normalizzare una data (ottenendo la parte "YYYY-MM-DD")
    const normalizeDate = (dateString) => {
      if (!dateString) return null;
      const date = new Date(dateString);
      return date.toISOString().split('T')[0];
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
          toast.error('La data fornita da Trello non è valida.');
          return;
        }

        const commessa = commesse.find((c) => c.commessa_id === commessaId);
        if (!commessa) {
          console.error('Commessa non trovata');
          toast.error('Commessa non trovata.');
          return;
        }

        await apiClient.put(`/api/commesse/${commessaId}/data-consegna`, {
          data_consegna: normalizedTrelloDate,
        });

        // Aggiorna la data di consegna localmente
        setCommesse((prevCommesse) =>
          prevCommesse.map((c) =>
            c.commessa_id === commessaId ? { ...c, data_consegna: normalizedTrelloDate } : c
          )
        );

        toast.success('Data allineata con successo.');
      } catch (error) {
        console.error("Errore durante l'allineamento della data:", error);
        toast.error("Errore durante l'allineamento della data.");
      }
    };

    // Rendering della card della commessa
    return (
      <div
        ref={drag}
        className={`commessa
    ${isDragging ? 'commessa--dragging' : ''}
    ${confrontoConTrello && isDateDifferent ? 'commessa--date-warning' : ''}
    ${esisteSuTrello && isListDifferent ? 'commessa--list-warning' : ''}
  `}
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
              className="delivery-icon delivery-icon--week"
            />
          )}
          {!isThisWeek(commessa.data_consegna) &&
            ConsegnaMensile &&
            isThisMonth(commessa.data_consegna) && (
              <FontAwesomeIcon
                icon={faCalendar}
                title="Consegna questo mese"
                className="delivery-icon delivery-icon--month"
              />
            )}
        </div>

        {/* Mostra il componente WarningDetails se sono presenti warning (note) */}
        {allarmiNote && warningActivities.length > 0 && (
          <WarningDetails
            warningActivities={warningActivities}
            resources={resources}
            closeNote={closeNote}
            deleteNote={deleteNote}
            // 👈 prima passavi deleteNote
            // reopenNote={reopenNote} // opzionale, se vuoi riaprirle dai dettagli
          />
        )}

        {/* Mostra il componente UnfinishedActivities se sono presenti attività non completate */}
        {allarmiAttivitaAperte && unfinishedActivities.length > 0 && (
          <UnfinishedActivities
            unfinishedActivities={unfinishedActivities}
            resources={resources}
            onEdit={handleEditActivity}
          />
        )}

        {/* Se la commessa dovrebbe esistere su Trello ma non viene trovata, mostra un messaggio */}
        {esisteSuTrello && !trelloCard && (
          <div className="trello-warning trello-warning--missing">Non esiste su Trello</div>
        )}

        {/* Se la data tra l'app e Trello differisce, consente di allinearla */}
        <div>
          {confrontoConTrello && trelloCard && isDateDifferent && (
            <div className="trello-warning trello-warning--date">
              Data App: {appDate}
              <br />
              Data Trello: {trelloDate}
              <br />
              <div className="flex-column-center">
                <button
                  className="btn btn--pill w-100 btn--danger"
                  onClick={() => handleAlignDate(commessa.commessa_id, trelloCard.due)}
                >
                  Allinea Data
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Se la lista Trello è diversa da quella attesa, mostra il nome della lista */}
        {confrontoConTrello && trelloCard && isListDifferent && (
          <div className="trello-warning trello-warning--list">Lista Trello: {trelloListName}</div>
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
      accept: 'COMMESSA',
      drop: (item) => handleActivityDrop(item.commessaId, repartoId, stato.id),
      collect: (monitor) => ({
        isOver: !!monitor.isOver(),
      }),
    }));

    return (
      <td ref={drop} className={`dropzone ${isOver ? 'highlight' : ''}`}>
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
        <div className="flex-center header-row">
          <h1>STATO AVANZAMENTO {RepartoName.toUpperCase()}</h1>
        </div>

        {loading && (
          <div className="loading-overlay">
            <img src={logo} alt="Logo" className="logo-spinner" />
          </div>
        )}

        {/* Bottone per aprire/chiudere il menu */}
        <div className="burger-header">
          <button onClick={toggleBurgerMenu} className="btn w-200 btn--shiny btn--pill">
            Filtri ed Opzioni
          </button>
        </div>
      </div>
      <ToastContainer position="top-left" autoClose={2000} hideProgressBar />
      {/* BURGER MENU */}
      {isBurgerMenuOpen && (
        <div className="burger-menu">
          <div className="burger-menu-header">
            <button onClick={toggleBurgerMenu} className="btn w-50 btn--ghost">
              <FontAwesomeIcon icon={faEyeSlash} className="burger-menu-close" />
            </button>
          </div>
          <div className="burger-menu-content">
            <h3>Filtri</h3>
            <div className="suggestion-wrapper w-200 ">
              <input
                type="text"
                placeholder="Numero Commessa"
                value={numeroCommessaFilter}
                onChange={(e) => setNumeroCommessaFilter(e.target.value)}
                onFocus={() => setShowCommessaSuggestions(true)}
                className="w-200"
              />
              {showCommessaSuggestions && suggestionsCommessa.length > 0 && (
                <ul className="suggestions-list w-200">
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

            <div className="suggestion-wrapper w-200 ">
              <input
                type="text"
                placeholder="Cliente"
                value={clienteFilter}
                onChange={(e) => setClienteFilter(e.target.value)}
                onFocus={() => setShowClienteSuggestions(true)}
                className="w-200"
              />
              {showClienteSuggestions && suggestionsCliente.length > 0 && (
                <ul className="suggestions-list w-200">
                  {suggestionsCliente
                    .filter((value) => value.toLowerCase().includes(clienteFilter.toLowerCase()))
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

            <div className="suggestion-wrapper w-200 ">
              <input
                type="text"
                placeholder="Tipo Macchina"
                value={tipoMacchinaFilter}
                onChange={(e) => setTipoMacchinaFilter(e.target.value)}
                onFocus={() => setShowTipoMacchinaSuggestions(true)}
                className="w-200"
              />
              {showTipoMacchinaSuggestions && suggestionsTipoMacchina.length > 0 && (
                <ul className="suggestions-list w-200">
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

            <label>
              <input
                type="checkbox"
                checked={confrontoConTrello}
                onChange={(e) => setConfrontoConTrello(e.target.checked)}
              />
              Confronto con lista Trello
            </label>
            <label>
              <input
                type="checkbox"
                checked={esisteSuTrello}
                onChange={(e) => setesisteSuTrello(e.target.checked)}
              />
              Confronto esistenza su Trello
            </label>
            <label>
              <input
                type="checkbox"
                checked={allarmiNote}
                onChange={(e) => setAllarmiNote(e.target.checked)}
              />
              Allarmi Note
            </label>

            <label>
              <input
                type="checkbox"
                checked={allarmiAttivitaAperte}
                onChange={(e) => setAllarmiAttivitaAperte(e.target.checked)}
              />
              Allarmi Attività Aperte
            </label>

            <label>
              <input
                type="checkbox"
                checked={VediConsegnate}
                onChange={(e) => setVediConsegnate(e.target.checked)}
              />
              Vedi anche consegnate
            </label>

            <label>
              <input
                type="checkbox"
                checked={ConsegnaMensile}
                onChange={(e) => setConsegnaMensile(e.target.checked)}
              />
              Allarme consegna nel mese
            </label>

            <label>
              <input
                type="checkbox"
                checked={ConsegnaSettimanale}
                onChange={(e) => setConsegnaSettimanale(e.target.checked)}
              />
              Allarme consegna nella settimana
            </label>

            {RepartoName === 'software' && (
              <>
                <label>
                  <input
                    type="checkbox"
                    checked={filterR}
                    onChange={(e) => setFilterR(e.target.checked)}
                  />
                  Visualizza commesse R-
                </label>

                <label>
                  <input
                    type="checkbox"
                    checked={filterM}
                    onChange={(e) => setFilterM(e.target.checked)}
                  />
                  Visualizza commesse M-
                </label>
              </>
            )}

            <h3>Azioni</h3>
            <button className="btn w-200 btn--blue btn--pill " onClick={saveNewOrder}>
              Salva ordine colonne
            </button>
          </div>
        </div>
      )}

      {/* CONTENUTO PRINCIPALE */}
      <div className={`container ${isBurgerMenuOpen ? 'shifted' : ''}`}>
        <DndProvider backend={HTML5Backend}>
          <div className="mh-80  ">
            <table>
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
              <CommessaDettagli commessa={selectedCommessa} onClose={handleClosePopup} />
            )}
            {showPopup && (
              <AttivitaCrea
                formData={selectedActivity}
                setFormData={setSelectedActivity}
                isEditing={isEditing}
                editId={selectedActivity.id}
                setIsEditing={setIsEditing}
                setShowPopup={setShowPopup}
                commesse={commesse}
                reparti={reparti}
                risorse={resources}
                attivitaConReparto={attivitaConReparto}
                reloadActivities={handleReloadActivities}
              />
            )}
          </div>
        </DndProvider>
      </div>
    </div>
  );
}

export default StatoAvanzamentoReparti;
