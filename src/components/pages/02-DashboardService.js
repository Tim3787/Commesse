import React, { useEffect, useState, useRef } from "react";
import apiClient from "../config/axiosConfig";
import logo from "../img/Animation - 1738249246846.gif";
import AttivitaCrea from "../popup/AttivitaCrea";
import  "../style/02-Dashboard-reparto.css";

// Import per il drag & drop
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";

// Import per notifiche e tooltip
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Tooltip } from "react-tooltip";

// Import per la navigazione e la configurazione del reparto

import { getDaysInMonth } from "../assets/date";

// Import API per le attività e le note
import { updateActivityNotes } from "../services/API/notifiche-api";
import { deleteAttivitaCommessa} from "../services/API/attivitaCommesse-api";

// Import icone FontAwesome
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEyeSlash,faChevronLeft, faChevronRight  } from "@fortawesome/free-solid-svg-icons";

// ====== CONFIG ======
const SERVICE_REPARTO_ID = 18;
const SERVICE_ONLINE_RISORSA_ID = 52;
const SERVICE_ONLINE_ATTIVITA_ID = 45;
const LANES_COUNT = 7;
// ====== DATE HELPERS (UNA SOLA VOLTA) ======
function formatDateOnly(dateObj) {
  const y = dateObj.getFullYear();
  const m = String(dateObj.getMonth() + 1).padStart(2, "0");
  const d = String(dateObj.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

const normalizeDate = (date) => {
  const localDate = new Date(date);
  return new Date(localDate.getFullYear(), localDate.getMonth(), localDate.getDate());
};

const toLocalISOString = (date) => formatDateOnly(normalizeDate(date));

// ============================
// COMPONENTE: DashboardReparto
// ============================
function DashboardService() {
  // ----------------------------
  // Stati del componente
  // ----------------------------
  const [activities, setActivities] = useState([]); // Tutte le attività caricate
  const [filteredActivities, setFilteredActivities] = useState([]); // Attività filtrate in base ai filtri
  const [resources] = useState([]); // Risorse appartenenti al reparto
  const [loading, setLoading] = useState(false); // Stato di caricamento generale
  const token = sessionStorage.getItem("token");
  const [showPopup, setShowPopup] = useState(false); // Controlla la visualizzazione del popup per la creazione/modifica
  const [commesse, setCommesse] = useState([]); // Elenco delle commesse
  const [reparti, setReparti] = useState([]); // Elenco dei reparti
  const [attivitaConReparto, setAttivitaConReparto] = useState([]); // Attività definite per reparto
  const [activityViewMode, setActivityViewMode] = useState("full"); // Modalità di visualizzazione: "full" o "compact"
const [suggestionsRisorsa, setSuggestionsRisorsa] = useState([]);
const [showRisorsaSuggestions, setShowRisorsaSuggestions] = useState(false);

const [suggestionsAttivita] = useState([]);

const [showAttivitaSuggestions, setShowAttivitaSuggestions] = useState(false);

/**
 * Restituisce l'array di Date (inclusi o esclusi i weekend
 * in base a includedWeekends) corrispondenti ai giorni
 * contati nella durata dell'attività.
 */
function getActivityDates(activity) {
  const dates = [];
  const durata = Number(activity.durata) || 0;
  const start  = normalizeDate(activity.data_inizio);
  let cursor   = new Date(start);

  while (dates.length < durata) {
    const wd = cursor.getDay(); // 0=dom,6=sab

    if (wd >= 1 && wd <= 5) {
      // feriale → includi sempre
      dates.push(new Date(cursor));
    } else {
      // weekend → includi solo se l'utente lo ha spuntato in AttivitaCrea
      const iso = formatDateOnly(cursor);

      if (activity.includedWeekends?.includes(iso)) {
        dates.push(new Date(cursor));
      }
    }

    cursor.setDate(cursor.getDate() + 1);
  }

  return dates;
}

const getActivitiesForLaneAndDaySimple = (lane, day) => {
  const isoDay = normalizeDate(day).toISOString().split("T")[0];
  return filteredActivities.filter((act) => {
    if (Number(act.lane || 1) !== Number(lane)) return false;
    const dates = getActivityDates(act).map(d => d.toISOString().split("T")[0]);
    return dates.includes(isoDay);
  });
};

  const [formData, setFormData] = useState({
    commessa_id: "",
    reparto_id: SERVICE_REPARTO_ID,
    risorsa_id: SERVICE_ONLINE_RISORSA_ID,
    attivita_id: SERVICE_ONLINE_ATTIVITA_ID ,
    data_inizio: "",
    durata: 1,
    stato: "",
    descrizione: "",
    includedWeekends: [],  
    lane: 1,
  });
  const [isEditing, setIsEditing] = useState(false); // Indica se si sta modificando un'attività esistente
  const [editId, setEditId] = useState(null); // ID dell'attività in modifica
  const [loadingActivities, setLoadingActivities] = useState({}); // Stato di caricamento per le operazioni sulle attività
  const todayRef = useRef(null); // Riferimento alla cella "oggi" per lo scroll
  const containerRef = useRef(null); // Riferimento al contenitore della tabella
  const [currentMonth, setCurrentMonth] = useState(new Date()); // Mese attualmente visualizzato
  const daysInMonth = getDaysInMonth(currentMonth); // Array dei giorni del mese corrente
  const [clipboardActivity, setClipboardActivity] = useState(null);
const meseCorrente = currentMonth.toLocaleDateString("it-IT", {
  month: "long",
  year: "numeric",
}).replace(/^./, c => c.toUpperCase());


  const [filters, setFilters] = useState({
    commessa: "",
    risorsa: "",
    attivita: "",
  });

    // Suggerimenti per filtri (autocomplete)

    const [suggestionsCommessa, setSuggestionsCommessa] = useState([]);
    const [showCommessaSuggestions, setShowCommessaSuggestions] = useState(false);
  

  // Stato per il menu a burger (filtri e opzioni)
  const [isBurgerMenuOpen, setIsBurgerMenuOpen] = useState(false);

  // ----------------------------
  // Funzione per aprire/chiudere il menu a burger
  // ----------------------------
  const toggleBurgerMenu = () => {
    setIsBurgerMenuOpen((prev) => !prev);
  };

  // ----------------------------
  // opzioni
  // ----------------------------
const [ViewButtons, setViewButtons] = useState(true); 
const [ViewNote, setViewNote] = useState(true); 
const [ViewStato, setViewStato] = useState(true); 

  // ----------------------------
  // Note
  // ----------------------------
    // Chiudi la nota associata a un'attività
const CLOSED_PREFIX = "[CHIUSA] ";
const isClosedNote = (text) =>
  typeof text === "string" && text.trim().toUpperCase().startsWith(CLOSED_PREFIX.trim());
const closeNoteText = (text) =>
  isClosedNote(text) ? text : `${CLOSED_PREFIX}${text || ""}`.trim();

const activityDropOpRef = useRef(0);
const [movingActivityId, setMovingActivityId] = useState(null);

const getAxiosErrorMessage = (error) => {
  const status = error?.response?.status;
  const serverMsg =
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.response?.data?.msg;

  if (serverMsg) return serverMsg;

  if (status === 401) return "Sessione scaduta: fai login di nuovo.";
  if (status === 403) return "Azione non consentita (permessi).";
  if (status === 409) return "Spostamento rifiutato: attività aggiornata da un altro utente.";
  if (status === 400) return "Richiesta non valida.";
  if (status >= 500) return "Errore del server. Riprova tra poco.";

  return "Impossibile completare lo spostamento attività.";
};


  // ============================
// COPY/PASTE (tasto destro)
// ============================


const [contextMenu, setContextMenu] = useState({
  visible: false,
  x: 0,
  y: 0,
  type: null, // "activity" | "cell"
  activity: null,
  resourceId: null,
  day: null,
});

const closeContextMenu = () =>
  setContextMenu((p) => ({ ...p, visible: false, type: null, activity: null, resourceId: null, day: null }));

// Chiudi menu con click fuori / ESC
useEffect(() => {
  const onClick = () => closeContextMenu();
  const onKey = (e) => e.key === "Escape" && closeContextMenu();

  if (contextMenu.visible) {
    document.addEventListener("click", onClick);
    document.addEventListener("keydown", onKey);
  }
  return () => {
    document.removeEventListener("click", onClick);
    document.removeEventListener("keydown", onKey);
  };
}, [contextMenu.visible]);

// Calcola includedWeekends duplicando "gli offset" rispetto all'inizio
function buildIncludedWeekendsForNewStart(originalActivity, newStartDateObj) {
  const durata = Number(originalActivity.durata) || 0;
  const origStart = normalizeDate(originalActivity.data_inizio);
  const origIncluded = originalActivity.includedWeekends || [];

  // offset (0..durata-1) in cui l'originale includeva un weekend
  const includedOffsets = [];
  let c1 = new Date(origStart);

  for (let i = 0; i < durata; i++) {
    const iso = formatDateOnly(c1);
    const wd = c1.getDay();
    if ((wd === 0 || wd === 6) && origIncluded.includes(iso)) {
      includedOffsets.push(i);
    }
    c1.setDate(c1.getDate() + 1);
  }

  // applica gli stessi offset sul nuovo start (solo se il giorno risultante è weekend)
  const res = [];
  for (const off of includedOffsets) {
    const c2 = new Date(newStartDateObj);
    c2.setDate(c2.getDate() + off);
    const wd2 = c2.getDay();
    if (wd2 === 0 || wd2 === 6) {
      res.push(formatDateOnly(c2));
    }
  }
  return res;
}

// Incolla: crea una NUOVA attività duplicata in quella cella (se vuota)
const pasteActivityToCell = async (lane, day) => {
  if (!clipboardActivity) return;

  const existing = getActivitiesForLaneAndDaySimple(lane, day);
  if (existing.length > 0) {
    toast.warn("Cella già occupata.");
    return;
  }

  try {
    const newStart = normalizeDate(day);
    const isoDate = toLocalISOString(newStart);
    const laneValue = Number(lane);
    const includedWeekends = buildIncludedWeekendsForNewStart(
      clipboardActivity,
      newStart
    );

    const payload = {
      commessa_id: clipboardActivity.commessa_id || "",
      reparto_id: clipboardActivity.reparto_id || SERVICE_REPARTO_ID,
      attivita_id: clipboardActivity.attivita_id || "",
      durata: clipboardActivity.durata || 1,
      descrizione:
        clipboardActivity.descrizione_attivita ||
        clipboardActivity.descrizione ||
        "",
      includedWeekends,

      // posizione: risorsa fissa e lane variabile
      risorsa_id: SERVICE_ONLINE_RISORSA_ID,
      data_inizio: isoDate,
        lane: laneValue,          // ok per UI / compat
  service_lane: laneValue,  // ✅ questo è quello che conta in DB

      stato: 0,
      note: null,
    };

    await apiClient.post(
  "/api/attivita_commessa",
  payload,
  { headers: { Authorization: `Bearer ${token}` } }
);

    toast.success("Attività incollata!");
    await handleReloadActivities();
  } catch (err) {
    console.error("Errore incolla attività:", err);
    toast.error("Errore durante l'incolla.");
  }
};



  // ========================================================
  // FETCH DEI DATI INIZIALI (attività, risorse, commesse, reparti)
  // ========================================================
const fetchServiceCalendar = async () => {
  const firstOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
  const lastOfMonth  = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);

  // ✅ buffer per prendere attività che "sforano" dentro il mese
  const bufferDays = 45;

  const fromDate = new Date(firstOfMonth);
  fromDate.setDate(fromDate.getDate() - bufferDays);

  const toDate = new Date(lastOfMonth);
  toDate.setDate(toDate.getDate() + bufferDays);

  const from = formatDateOnly(fromDate);
  const to   = formatDateOnly(toDate);

  const res = await apiClient.get(
    `/api/attivita_commessa/service-calendar?from=${from}&to=${to}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );

  const data = (res.data || []).map((a) => ({
    ...a,
    lane: Number(a.lane || a.riga || a.service_lane || 1),
    note: a.note ?? a.notes ?? a.nota ?? null,
  }));

  setActivities(data);
};


  // dati generali per popup (commesse, reparti, attivita)
  const fetchCommonData = async () => {
    const [commesseRes, repartiRes, attivitaRes] = await Promise.all([
      apiClient.get("/api/commesse"),
      apiClient.get("/api/reparti"),
      apiClient.get("/api/attivita"),
    ]);

    setCommesse(commesseRes.data || []);
    setReparti(repartiRes.data || []);

    const mapped = (attivitaRes.data || []).map((a) => ({
      id: a.id,
      nome_attivita: a.nome || a.nome_attivita || "Nome non disponibile",
      reparto_id: a.reparto_id,
    }));
    setAttivitaConReparto(mapped);
  };

  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true);
        await Promise.all([fetchCommonData(), fetchServiceCalendar()]);
      } catch (e) {
        console.error(e);
        toast.error("Errore caricamento calendario assistenze");
      } finally {
        setLoading(false);
      }
    };
    run();

  }, [currentMonth]);

  // ========================================================
  // FILTRAGGIO DELLE ATTIVITÀ IN BASE A COMMESSA, RISORSA E ATTIVITÀ
  // ========================================================
  useEffect(() => {
    const fActivities = activities.filter((activity) => {
      const commessaMatch = filters.commessa
        ? activity.numero_commessa.toString().toLowerCase().includes(filters.commessa.toLowerCase())
        : true;
const risorsaMatch = filters.risorsa
   ? String(activity.nome_risorsa || activity.risorsa || activity.risorsa_nome || "")
      .toLowerCase()
      .includes(filters.risorsa.toLowerCase())
  : true;
      const attivitaMatch = filters.attivita
        ? (activity.nome_attivita && activity.nome_attivita.toLowerCase().includes(filters.attivita.toLowerCase()))
        : true;
      return commessaMatch && risorsaMatch && attivitaMatch;
    });
    setFilteredActivities(fActivities);
  }, [activities, filters]);

// Calcola i suggerimenti per "commessa" in base all'array delle commesse
useEffect(() => {
  const commessaSuggs = commesse
    .map((c) => c.numero_commessa)
    .filter((value, index, self) => self.indexOf(value) === index);
  setSuggestionsCommessa(commessaSuggs);
}, [commesse]);




// Suggerimenti per "risorsa": usa l'array "resources" già filtrato per il reparto corrente
useEffect(() => {
  const risorsaSuggs = resources
    .map((resource) => resource.nome)
    .filter((value, index, self) => self.indexOf(value) === index);
  setSuggestionsRisorsa(risorsaSuggs);
}, [resources]);

// Listener globale per chiudere i suggerimenti se si clicca fuori dagli input o dalle liste
useEffect(() => {
  const handleClickOutside = (event) => {
    if (
!event.target.closest(".input") && !event.target.closest(".w-200")
    ) {
      setShowCommessaSuggestions(false);
      setShowRisorsaSuggestions(false);
      setShowAttivitaSuggestions(false);
    }
  };
  document.addEventListener("click", handleClickOutside);
  return () => {
    document.removeEventListener("click", handleClickOutside);
  };
}, []);



  // ========================================================
  // FUNZIONI DI SCROLLING PER IL SCHEDULE
  // ========================================================
  // Scrolla alla colonna corrispondente ad oggi
  const scrollToToday = () => {
    const today = new Date();
    if (
      currentMonth.getMonth() !== today.getMonth() ||
      currentMonth.getFullYear() !== today.getFullYear()
    ) {
      // Se il mese visualizzato non corrisponde al mese corrente, aggiorna currentMonth
      setCurrentMonth(today);
      setTimeout(() => {
        if (todayRef.current && containerRef.current) {
          const containerRect = containerRef.current.getBoundingClientRect();
          const todayRect = todayRef.current.getBoundingClientRect();
          const offsetLeft = todayRect.left - containerRect.left;
          const additionalOffset = -50; // Regola l'offset se necessario
          const scrollLeft =
            offsetLeft - containerRef.current.clientWidth / 2 + todayRect.width / 2 + additionalOffset;
          containerRef.current.scrollTo({
            left: scrollLeft,
            behavior: "smooth",
          });
        }
      }, 100);
    } else {
      // Se il mese visualizzato è già quello corrente, scrolla direttamente
      if (todayRef.current && containerRef.current) {
        const containerRect = containerRef.current.getBoundingClientRect();
        const todayRect = todayRef.current.getBoundingClientRect();
        const offsetLeft = todayRect.left - containerRect.left;
        const scrollLeft =
          offsetLeft - containerRef.current.clientWidth / 2 + todayRect.width / 2;
        containerRef.current.scrollTo({
          left: scrollLeft,
          behavior: "smooth",
        });
      }
    }
  };

  // Naviga al mese precedente
  const goToPreviousMonth = () => {
    setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  // Naviga al mese successivo
  const goToNextMonth = () => {
    setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };


// === LANES HELPERS ===
const getActivitiesForLaneAndDay = (lane, day) => {
  const isoDay = normalizeDate(day).toISOString().split("T")[0];

  return filteredActivities.filter((act) => {
    // lane match
    if (Number(act.lane || 1) !== Number(lane)) return false;

    // giorno match (usa la stessa logica durata/weekend)
    const activityDates = getActivityDates(act).map((d) =>
      d.toISOString().split("T")[0]
    );
    return activityDates.includes(isoDay);
  });
};

// === CELL PER LANE (con DnD + doppio click + click) ===
function LaneCell({ lane, day, activitiesInCell }) {
  const normalizedDay = normalizeDate(day);

  const [{ isOver, canDrop }, drop] = useDrop(() => ({
    accept: "ACTIVITY",
    canDrop: (item) => movingActivityId !== item.id,
    drop: (item) => {
      // quando droppi su una lane, aggiorniamo "lane" (NON risorsa)
      const updated = { ...item, lane };
      return handleActivityDrop(updated, SERVICE_ONLINE_RISORSA_ID, normalizedDay);
    },
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  }));

  const isWeekend = normalizedDay.getDay() === 0 || normalizedDay.getDay() === 6;
  const cellClasses = `${isWeekend ? "weekend-cell" : ""} ${
    isOver && canDrop ? "highlight" : ""
  }`;

  return (
    <td
      ref={drop}
      className={cellClasses}
      onDoubleClick={() => {
        // crea nuova activity dentro lane
        if (activitiesInCell.length === 0) {
          setFormData((p) => ({
            ...p,
            reparto_id: SERVICE_REPARTO_ID,
            risorsa_id: SERVICE_ONLINE_RISORSA_ID,
            attivita_id: SERVICE_ONLINE_ATTIVITA_ID,
            data_inizio: toLocalISOString(normalizedDay),
            durata: 1,
            stato: "",
            descrizione: "",
            note: "",
            includedWeekends: [],
            lane, // 👈 fondamentale
          }));
          setIsEditing(false);
          setShowPopup(true);
        } else {
          toast.warn("Cella già occupata.");
        }
      }}
      onContextMenu={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setContextMenu({
          visible: true,
          x: e.clientX,
          y: e.clientY,
          type: "cell",
          activity: null,
          resourceId: lane, // usiamo resourceId come "slot" (lane)
          day: normalizedDay,
        });
      }}
    >
      {activitiesInCell.map((activity) => (
        <DraggableActivity
          key={activity.id}
          activity={activity}
          onDoubleClick={() => handleActivityClick(activity)}
          viewMode={activityViewMode}
        />
      ))}
    </td>
  );
}


 // Restituisce il numero di settimana
  const getWeekNumber = (d) => {
    // Crea una copia della data in UTC
    d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    // Sposta la data al giovedì della settimana corrente (necessario per il calcolo ISO)
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    // Calcola il primo giorno dell'anno in UTC
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    // Calcola il numero di settimane (differenza in giorni diviso per 7)
    return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  };
  

  // ========================================================
  // GESTIONE DELLE ATTIVITÀ (CLICK, DOPPIO CLICK, DELETE, UPDATE)
  // ========================================================
  // Apre il popup per modificare un'attività
  const handleActivityClick = (activity) => {
    const dataInizio = activity.data_inizio
      ? new Date(activity.data_inizio).toISOString().split("T")[0]
      : "";
    setFormData({
      commessa_id: activity.commessa_id || "",
      reparto_id: reparti.find((reparto) => reparto.nome === activity.reparto)?.id || "",
      risorsa_id: activity.risorsa_id || "",
      attivita_id: activity.attivita_id || "",
      data_inizio: dataInizio,
      durata: activity.durata || "",
      stato: activity.stato !== undefined && activity.stato !== null ? String(activity.stato) : "",
      descrizione: activity.descrizione_attivita || "",
      note: activity.note || "",
      includedWeekends: activity.includedWeekends || [] ,
      lane: Number(activity.lane || 1),
    });
    setIsEditing(true);
    setEditId(activity.id);
    setShowPopup(true);
  };


  // Elimina un'attività dopo conferma
const handleDelete = async (id) => {
  if (!window.confirm("Sei sicuro di voler eliminare questa attività?")) return;

  let snapshot;
  setActivities((prev) => {
    snapshot = prev;
    return prev.filter((a) => a.id !== id);
  });

  try {
    await deleteAttivitaCommessa(id, token, { headers: { Authorization: `Bearer ${token}` } });
    toast.success("Attività eliminata");
  } catch (error) {
    console.error(error);
    toast.error("Errore eliminazione: ripristino...");
    setActivities(snapshot);
  }
};





  // Apre il popup per aggiungere una nuova attività
const handleAddNew = () => {
  setFormData({
    commessa_id: "",
    reparto_id: SERVICE_REPARTO_ID,
    risorsa_id: SERVICE_ONLINE_RISORSA_ID,
    attivita_id: SERVICE_ONLINE_ATTIVITA_ID,
    data_inizio: "",
    durata: 1,
    stato: "",
    descrizione: "",
    note: "",
    includedWeekends: [],
    lane: 1,
  });
  setIsEditing(false);
  setShowPopup(true);
};

  // Aggiorna lo stato di un'attività (ad esempio da "non iniziata" a "iniziata" o "completata")
  const updateActivityStatus = async (activityId, newStatus) => {
  setLoadingActivities((prev) => ({ ...prev, [activityId]: true }));

  // ottimistico
  setActivities((prev) =>
    prev.map((a) => (a.id === activityId ? { ...a, stato: Number(newStatus) } : a))
  );

  try {
    await apiClient.put(
      `/api/attivita_commessa/${activityId}`,
      { stato: Number(newStatus) },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    await handleReloadActivities();
  } catch (err) {
    console.error("Errore update stato:", err);
    toast.error("Errore durante aggiornamento stato");
    await handleReloadActivities();
  } finally {
    setLoadingActivities((prev) => ({ ...prev, [activityId]: false }));
  }
};


  // ========================================================
  // GESTIONE DEL DRAG & DROP
  // ========================================================
  // Gestisce il drop di un'attività in una nuova cella (nuova risorsa e/o nuovo giorno)
const handleActivityDrop = async (activity, newResourceId, newDate) => {
  const opId = ++activityDropOpRef.current;
  setMovingActivityId(activity.id);

  try {
    const newStart = normalizeDate(newDate);
    const isoDate = toLocalISOString(newStart);
    const durata = Number(activity.durata) || 0;

    const originalIncluded = activity.includedWeekends || [];

    // ricostruisce includedWeekends coerente con la nuova data
    const updatedIncludedWeekends = [];
    let cursor = new Date(newStart);

    for (let i = 0; i < durata; i++) {
      const iso = formatDateOnly(cursor);
      const day = cursor.getDay();
      if ((day === 0 || day === 6) && originalIncluded.includes(iso)) {
        updatedIncludedWeekends.push(iso);
      }
      cursor.setDate(cursor.getDate() + 1);
    }

    // se il nuovo start è weekend, assicurati che sia incluso
    const newStartDay = newStart.getDay();
    if ((newStartDay === 0 || newStartDay === 6) && !updatedIncludedWeekends.includes(isoDate)) {
      updatedIncludedWeekends.push(isoDate);
    }

  const updatedActivity = {
  ...activity,
  risorsa_id: newResourceId,
  data_inizio: isoDate,
  descrizione: activity.descrizione_attivita || activity.descrizione || "",
  includedWeekends: updatedIncludedWeekends,
  lane: Number(activity.lane ?? 1), // ok
};


    // ✅ 1) UPDATE OTTIMISTICO (UI immediata)
    setActivities((prev) =>
      prev.map((a) => (a.id === activity.id ? { ...a, ...updatedActivity } : a))
    );

    // ✅ 2) SERVER UPDATE (dati + service_lane)
await apiClient.put(
  `/api/attivita_commessa/${activity.id}`,
  updatedActivity,
  { headers: { Authorization: `Bearer ${token}` } }
);

await apiClient.put(
  `/api/attivita_commessa/${activity.id}/service-lane`,
  { service_lane: Number(updatedActivity.lane) },
  { headers: { Authorization: `Bearer ${token}` } }
);

await handleReloadActivities();


    // ✅ 3) (opzionale) piccolo toast solo se è l'ultima operazione
    if (opId === activityDropOpRef.current) {
      toast.success("Attività spostata");
      setMovingActivityId(null);
    }
  } catch (error) {
    console.error("Errore durante l'aggiornamento dell'attività:", error);

    // se nel frattempo è partita un'altra operazione, ignora questo errore
    if (opId !== activityDropOpRef.current) return;

    toast.error(getAxiosErrorMessage(error));

    // ✅ rollback sicuro: refetch
    try {
  await handleReloadActivities(); // ricarica service-calendar
} catch (e) {
  toast.error("Errore nel ripristino attività: ricarica la pagina.");
} finally {
  setMovingActivityId(null);
}
  }
};


  // ========================================================
  // GESTIONE NOTE
  // ========================================================

// Chiudi la nota associata a un'attività (senza cancellarla)
const closeNote = async (activityId) => {
  try {
    const activity = activities.find((a) => a.id === activityId);
    if (!activity) return;

    const newText = closeNoteText(activity.note);
    await updateActivityNotes(activityId, newText, token);

    toast.success("Nota chiusa con successo!");
    setActivities((prev) =>
      prev.map((a) => (a.id === activityId ? { ...a, note: newText } : a))
    );
  } catch (error) {
    console.error("Errore durante la chiusura della nota:", error);
    toast.error("Errore durante la chiusura della nota.");
  }
};


  // Elimina la nota associata a un'attività
  const deleteNote = async (activityId) => {
             const first = window.confirm(
    `ATTENZIONE: vuoi ELIMINARE DEFINITIVAMENTE?`
  );
  if (!first) return;

  const second = window.confirm(
    "Conferma finale: l'operazione è irreversibile. Continuare?"
  );
  if (!second) return;
    try {
      await updateActivityNotes(activityId, null, token);
      
      toast.success("Nota eliminata con successo!");
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




  // ========================================================
  // COMPONENTE: DraggableActivity
  // Rappresenta un'attività trascinabile con due modalità di visualizzazione
  // ========================================================
  function DraggableActivity({ activity, onDoubleClick, viewMode }) {
    const [{ isDragging }, drag] = useDrag(() => ({
      type: "ACTIVITY",
      canDrag: () => movingActivityId !== activity.id, 
      item: { ...activity },
      collect: (monitor) => ({
        isDragging: !!monitor.isDragging(),
      }),
    }));
    const activityClass =
      activity.stato === 0
        ? "activity not-started"
        : activity.stato === 1
        ? "activity started"
        : "activity completed";

    // Modalità "compact": visualizzazione ridotta con tooltip
    if (viewMode === "compact") {
      const tooltipContent = `
        Attività: ${activity.nome_attivita}
        Stato: ${
          activity.stato === 0
            ? "Non iniziata"
            : activity.stato === 1
            ? "Iniziata"
            : "Completata"
        }
        Commessa: ${activity.numero_commessa}
      `;
      return (
        <>
          <div
            ref={drag}
            className={`activity compact ${activityClass}`}
            style={{
              opacity: isDragging ? 0.5 : 1,
              cursor: "move",
              width: "20px",
              height: "20px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            onDoubleClick={onDoubleClick}
            data-tooltip-id={`tooltip-${activity.id}`}
            onContextMenu={(e) => {
  e.preventDefault();
  e.stopPropagation();
  setContextMenu({
    visible: true,
    x: e.clientX,
    y: e.clientY,
    type: "activity",
    activity,
    resourceId: null,
    day: null,
  });
}}

          >

            
          </div>
          <Tooltip id={`tooltip-${activity.id}`} place="top" effect="solid"  style={{ zIndex: 9999 }}>
            <span style={{ whiteSpace: "pre-wrap" }}>{tooltipContent}</span>
          </Tooltip>
        </>
      );
    }



    // Modalità "full": visualizzazione dettagliata dell'attività
    // Modalità "full": visualizzazione dettagliata dell'attività (COMPATTATA)
return (
  <div
    ref={drag}
    className={`activity ${activityClass} ${isDragging ? "is-dragging" : ""}`}
    style={{
      opacity: isDragging ? 0.5 : 1,
      cursor: "move",
      minWidth: "150px",
    }}
    onDoubleClick={onDoubleClick}
    onContextMenu={(e) => {
      e.preventDefault();
      e.stopPropagation();
      setContextMenu({
        visible: true,
        x: e.clientX,
        y: e.clientY,
        type: "activity",
        activity,
        resourceId: null,
        day: null,
      });
    }}
  >
    {/* HEADER sempre visibile */}
    <div className="flex-column-center">
      <strong>{activity.numero_commessa}</strong>

      {activity.stato === 2 && activity.note && !isClosedNote(activity.note) && (
        <span className="warning-icon" title="Nota presente nell'attività completata">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="#e60000" viewBox="0 0 24 24">
            <path d="M12 0C5.372 0 0 5.372 0 12s5.372 12 12 12 12-5.372 12-12S18.628 0 12 0zm0 22c-5.523 0-10-4.477-10-10S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zm-1-15h2v6h-2zm0 8h2v2h-2z" />
          </svg>
        </span>
      )}
    </div>

    <strong>Attività: {activity.nome_attivita}</strong>
    <br />

    {/* TUTTO QUELLO CHE NON VUOI NEL GHOST va dentro queste sezioni */}
    <div className="activity-hover-actions">
      {ViewStato && (
        <strong>
          Stato:{" "}
          {activity.stato === 0 ? "Non iniziata" : activity.stato === 1 ? "Iniziata" : "Completata"}
        </strong>
      )}

      <br />

      {/* Nel service vuoi la descrizione */}
      <br />
      <strong>Descrizione: {activity.descrizione_attivita || ""}</strong>
      <br />

      <div className="flex-column-center" style={{ marginTop: "5px" }}>
        {ViewButtons && activity.stato === 1 && (
          <>
            <button
              className="btn w-100 btn--complete btn--pill"
              onClick={() => updateActivityStatus(activity.id, 2)}
              disabled={loadingActivities[activity.id]}
            >
              {loadingActivities[activity.id] ? "Caricamento..." : "Completa"}
            </button>

            <button className="btn w-100 btn--danger btn--pill" onClick={() => handleDelete(activity.id)}>
              Elimina attività
            </button>
          </>
        )}

        {ViewButtons && activity.stato === 0 && (
          <>
            <button
              className="btn w-100 btn--start btn--pill"
              onClick={() => updateActivityStatus(activity.id, 1)}
              disabled={loadingActivities[activity.id]}
            >
              {loadingActivities[activity.id] ? "Caricamento..." : "Inizia"}
            </button>

            <button
              className="btn w-100 btn--complete btn--pill"
              onClick={() => updateActivityStatus(activity.id, 2)}
              disabled={loadingActivities[activity.id]}
            >
              {loadingActivities[activity.id] ? "Caricamento..." : "Completa"}
            </button>

            <button className="btn w-100 btn--danger btn--pill" onClick={() => handleDelete(activity.id)}>
              Elimina attività
            </button>
          </>
        )}
      </div>
    </div>

    <div className="activity-hover-notes">
      <div className="flex-column-center">
        {ViewNote && activity.note && !isClosedNote(activity.note) && (
          <>
            <div className="note">Note: {activity.note}</div>

            <button className="btn btn--pill btn--warning w-100" onClick={() => closeNote(activity.id)}>
              Chiudi nota
            </button>
            <button className="btn w-100 btn--danger btn--pill" onClick={() => deleteNote(activity.id)}>
              Elimina Nota
            </button>
          </>
        )}
      </div>
    </div>
  </div>
);

  }

  // ========================================================
  // FUNZIONE PER RICARICARE LE ATTIVITÀ (es. dopo un aggiornamento)
  // ========================================================
const handleReloadActivities = async () => {
  try {
    await fetchServiceCalendar();
  } catch (error) {
    console.error("Errore durante il ricaricamento delle attività:", error);
    toast.error("Errore durante il ricaricamento delle attività.");
  }
};


  // ========================================================
  // RENDER DEL COMPONENTE
  // ========================================================
  return (
    <div className="page-wrapper">
              <ToastContainer position="top-left" autoClose={2000} hideProgressBar />
              {contextMenu.visible && (
  <div
    className="context-menu"
    style={{
      position: "fixed",
      top: contextMenu.y,
      left: contextMenu.x,
      zIndex: 99999,
      background: "#111",
      color: "#fff",
      borderRadius: "10px",
      padding: "6px",
      minWidth: "180px",
      boxShadow: "0 10px 30px rgba(0,0,0,0.35)",
    }}
    onClick={(e) => e.stopPropagation()}
  >
    {contextMenu.type === "activity" && (
      <>
        <button
          className="context-menu-item"
          onClick={() => {
            setClipboardActivity(contextMenu.activity);
            toast.info("Attività copiata");
            closeContextMenu();
          }}
          style={{ width: "100%", padding: "10px", border: 0, background: "transparent", color: "inherit", textAlign: "left", cursor: "pointer" }}
        >
          Copia attività
        </button>
      </>
    )}

    {contextMenu.type === "cell" && (
      <>
        <button
          className="context-menu-item"
          disabled={!clipboardActivity}
          onClick={async () => {
            await pasteActivityToCell(contextMenu.resourceId, contextMenu.day);
            closeContextMenu();
          }}
          style={{
            width: "100%",
            padding: "10px",
            border: 0,
            background: "transparent",
            color: !clipboardActivity ? "rgba(255,255,255,0.4)" : "inherit",
            textAlign: "left",
            cursor: !clipboardActivity ? "not-allowed" : "pointer",
          }}
        >
          Incolla attività
        </button>

        {!clipboardActivity && (
          <div style={{ padding: "0 10px 10px", fontSize: "12px", opacity: 0.7 }}>
            (Prima copia un’attività)
          </div>
        )}
      </>
    )}
  </div>
)}

      <div className="header">
        <h1>CALENDARIO ASSISTENZE (SERVICE ONLINE)</h1>

        <div className="flex-center header-row">
          <button onClick={goToPreviousMonth} className="btn w-50 btn--shiny btn--pill">
            <FontAwesomeIcon icon={faChevronLeft} />
          </button>

          <button onClick={scrollToToday} className="btn w-50 btn--shiny btn--pill">
            OGGI
          </button>

          <div className="header-row-month">{meseCorrente}</div>

          <button onClick={goToNextMonth} className="btn w-50 btn--shiny btn--pill">
            <FontAwesomeIcon icon={faChevronRight} />
          </button>
        </div>

        {loading && (
          <div className="loading-overlay">
            <img src={logo} alt="Logo" className="logo-spinner" />
          </div>
        )}
                           {/* Bottone per aprire/chiudere il menu */}
            <div className="burger-header" >
        <button onClick={toggleBurgerMenu} className="btn w-200 btn--shiny btn--pill">
          Filtri ed Opzioni
        </button>
        </div>
              </div>


      {/* BURGER MENU (Filtri e Opzioni) */}
      {isBurgerMenuOpen && (
        <div className="burger-menu">
          <div className="burger-menu-header">
            <button onClick={toggleBurgerMenu} className="btn w-50 btn--ghost">
              <FontAwesomeIcon icon={faEyeSlash} className="burger-menu-close" />
            </button>
          </div>
          <div className="burger-menu-content">
            {/* Opzioni di visualizzazione */}
              <h3>Opzioni</h3>
              <label>Visualizzazione Attività: </label>
              <select
                value={activityViewMode}
                onChange={(e) => setActivityViewMode(e.target.value)}
                className="w-200">
                <option value="full">Completa</option>
                <option value="compact">Compatta</option>
              </select>

                <label>
                  <input
                    type="checkbox"
                    checked={ViewButtons}
                    onChange={(e) => setViewButtons(e.target.checked)}
                  />
                  Vedi pulsanti
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={ViewStato}
                    onChange={(e) => setViewStato(e.target.checked)}
                  />
                  Vedi stato
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={ViewNote}
                    onChange={(e) => setViewNote(e.target.checked)}
                  />
                  Vedi note
                </label>
                <div className="suggestion-wrapper w-200 ">
    <input
      type="text"
      placeholder="Filtra per commessa"
      value={filters.commessa}
      onChange={(e) => setFilters({ ...filters, commessa: e.target.value })}
      onFocus={() => {
  setShowCommessaSuggestions(true);
}}
      className="w-200"
    />
    {showCommessaSuggestions && suggestionsCommessa.length > 0 && (
      <ul className="suggestions-list  w-200 ">
        {suggestionsCommessa
          .filter((value) =>
            value.toString().toLowerCase().includes(filters.commessa.toLowerCase())
          )
          .map((value, index) => (
            <li
              key={index}
              onClick={() => {
                setFilters({ ...filters, commessa: value });
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
      placeholder="Filtra per risorsa"
      value={filters.risorsa}
      onChange={(e) => setFilters({ ...filters, risorsa: e.target.value })}
      onFocus={() => setShowRisorsaSuggestions(true)}
      className="w-200"
    />
    {showRisorsaSuggestions && suggestionsRisorsa.length > 0 && (
      <ul className="suggestions-list  w-200 ">
        {suggestionsRisorsa
          .filter((value) =>
            value.toLowerCase().includes(filters.risorsa.toLowerCase())
          )
          .map((value, index) => (
            <li
              key={index}
              onClick={() => {
                setFilters({ ...filters, risorsa: value });
                setShowRisorsaSuggestions(false);
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
      placeholder="Filtra per attività"
      value={filters.attivita}
      onChange={(e) => setFilters({ ...filters, attivita: e.target.value })}
      onFocus={() => setShowAttivitaSuggestions(true)}
      className="w-200"
    />
    {showAttivitaSuggestions && suggestionsAttivita.length > 0 && (
      <ul className="suggestions-list w-200 ">
        {suggestionsAttivita
          .filter((value) =>
            value.toLowerCase().includes(filters.attivita.toLowerCase())
          )
          .map((value, index) => (
            <li
              key={index}
              onClick={() => {
                setFilters({ ...filters, attivita: value });
                setShowAttivitaSuggestions(false);
              }}
            >
              {value}
            </li>
          ))}
      </ul>
    )}
              <h3>Azioni</h3>
              <button onClick={handleAddNew} className="btn w-200 btn--blue btn--pill">
                Aggiungi Attività
              </button>
  </div>
</div>
  
            </div>
      )}

      {/* CONTENITORE PRINCIPALE */}
      <div className={`container ${isBurgerMenuOpen ? "shifted" : ""}`} ref={containerRef}>
         <div className= "Reparto-table-container mh-80 ">
        <DndProvider backend={HTML5Backend}>
        
              <table>
              <thead>
  <tr>
    <th>Risorsa</th>
    {daysInMonth.map((day, index) => {
      const isWeekend = day.getDay() === 0 || day.getDay() === 6;
      const isToday = day.toDateString() === new Date().toDateString();
      const weekNumber = getWeekNumber(day);
      // Mostra il numero settimana se è il primo elemento oppure se cambia rispetto al giorno precedente
      let showWeekNumber = false;
      if (index === 0) {
        showWeekNumber = true;
      } else {
        const prevWeekNumber = getWeekNumber(daysInMonth[index - 1]);
        if (weekNumber !== prevWeekNumber) {
          showWeekNumber = true;
        }
      }
      return (
        <th
          key={day.toISOString()}
          className={`${isToday ? "today" : ""} ${isWeekend ? "weekend" : ""}`}
          ref={isToday ? todayRef : null}
        >
          <div>{day.toLocaleDateString()}</div>
          {showWeekNumber && (
            <div className="week-number">
              Settimana {weekNumber}
            </div>
          )}
        </th>
      );
    })}
  </tr>
</thead>
<tbody>
                {Array.from({ length: LANES_COUNT }).map((_, idx) => {
                  const lane = idx + 1;
                  return (
                    <tr key={lane}>
                      <td style={{ minWidth: 120 }}>
                        <strong>Riga {lane}</strong>
                      </td>

                      {daysInMonth.map((day) => (
                        <LaneCell
                          key={`${lane}-${day.toISOString()}`}
                          lane={lane}
                          day={day}
                          activitiesInCell={getActivitiesForLaneAndDay(lane, day)}
                        />
                      ))}
                    </tr>
                  );
                })}
              </tbody>
              </table>
        </DndProvider>
</div>
        {/* Popup per la creazione/modifica di un'attività */}
        {showPopup && (
          <AttivitaCrea
            formData={formData}
            setFormData={setFormData}
            isEditing={isEditing}
            setIsEditing={setIsEditing}
            editId={editId}
            fetchAttivita={handleReloadActivities}
            setShowPopup={setShowPopup}
            commesse={commesse}
            reparti={reparti}
             risorse={[
              { id: SERVICE_ONLINE_RISORSA_ID, nome: "Service Online", reparto_id: SERVICE_REPARTO_ID },
            ]}
            attivitaConReparto={attivitaConReparto}
            reloadActivities={handleReloadActivities}
          />
        )}
      </div>
    </div>
  );
}



export default DashboardService;
