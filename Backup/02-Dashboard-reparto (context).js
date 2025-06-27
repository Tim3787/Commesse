import React, { useEffect, useState, useRef, useMemo  } from "react";
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
import { useParams } from "react-router-dom";
import repartoConfig from "../config/repartoConfig";
import { getDaysInMonth } from "../assets/date";

// Import API per le attività e le note
import { updateActivityNotes } from "../services/API/notifiche-api";
import { deleteAttivitaCommessa, fetchAttivitaCommessa } from "../services/API/attivitaCommesse-api";

// Import icone FontAwesome
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEyeSlash,faChevronLeft, faChevronRight  } from "@fortawesome/free-solid-svg-icons";

// Context
import { useAppData  } from "../context/AppDataContext";

// ============================
// COMPONENTE: DashboardReparto
// ============================
function DashboardReparto() {
  // Estrae il nome del reparto dai parametri dell'URL e ottiene la configurazione associata
  const { reparto } = useParams();
  const { RepartoID, RepartoName } = repartoConfig[reparto] || {};

  /* ===============================
     APP DATA
  =============================== */
const {
  commesse,
  statiCommessa,
  setCommesse,
  risorse,
  attivitaConReparto,
  loading,
  reparti,
} = useAppData();

  

  // ----------------------------
  // Stati del componente
  // ----------------------------
  const [activities, setActivities] = useState([]); // Tutte le attività caricate
  const [filteredActivities, setFilteredActivities] = useState([]); // Attività filtrate in base ai filtri
  const [serviceResources, setServiceResources] = useState([]); // Risorse del reparto "service"
  const token = sessionStorage.getItem("token");
  const [showPopup, setShowPopup] = useState(false); // Controlla la visualizzazione del popup per la creazione/modifica
  const [selectedServiceResource, setSelectedServiceResource] = useState(null); // Risorsa del service selezionata
  const [activityViewMode, setActivityViewMode] = useState("full"); // Modalità di visualizzazione: "full" o "compact"
  const [formData, setFormData] = useState({
    commessa_id: "",
    reparto_id: "",
    risorsa_id: "",
    attivita_id: "",
    data_inizio: "",
    durata: "",
    stato: "",
    descrizione: "",
    includedWeekends: [],  
  });
  const isDataReady = !loading && reparti.length && commesse.length && risorse.length;
  const [isEditing, setIsEditing] = useState(false); // Indica se si sta modificando un'attività esistente
  const [editId, setEditId] = useState(null); // ID dell'attività in modifica
  const [loadingActivities, setLoadingActivities] = useState({}); // Stato di caricamento per le operazioni sulle attività
  const todayRef = useRef(null); // Riferimento alla cella "oggi" per lo scroll
  const containerRef = useRef(null); // Riferimento al contenitore della tabella
  const [currentMonth, setCurrentMonth] = useState(new Date()); // Mese attualmente visualizzato
  const daysInMonth = getDaysInMonth(currentMonth); // Array dei giorni del mese corrente
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
    const [suggestionsRisorsa, setSuggestionsRisorsa] = useState([]);
    const [suggestionsAttivita, setSuggestionsAttivita] = useState([]);
    const [suggestionsCommessa, setSuggestionsCommessa] = useState([]);
    const [showRisorsaSuggestions, setShowRisorsaSuggestions] = useState(false);
    const [showAttivitaSuggestions, setShowAttivitaSuggestions] = useState(false);
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

  // ========================================================
  // FETCH DEI DATI INIZIALI (attività, risorse, commesse, reparti)
  // ========================================================
 useEffect(() => {
  if (!RepartoID || !risorse.length) return;

  const serviceFilteredResources = risorse.filter(
  (resource) => Number(resource.reparto_id) === repartoConfig.service.RepartoID
);

  setServiceResources(serviceFilteredResources);

  // Gestione risorsa service
  if (reparto !== "service") {
    const defaultServiceId = repartoConfig[reparto]?.defaultServiceResourceId || null;
    setSelectedServiceResource(
      defaultServiceId && serviceFilteredResources.some((res) => res.id === defaultServiceId)
        ? defaultServiceId
        : serviceFilteredResources[0]?.id || null
    );
  } else {
    setSelectedServiceResource(null);
  }
}, [RepartoID, risorse, reparto]);

useEffect(() => {
  handleReloadActivities();
}, []);

  // ========================================================
  // FILTRAGGIO DELLE ATTIVITÀ IN BASE A COMMESSA, RISORSA E ATTIVITÀ
  // ========================================================
  useEffect(() => {
    const fActivities = activities.filter((activity) => {
      const commessaMatch = filters.commessa
        ? activity.numero_commessa.toString().toLowerCase().includes(filters.commessa.toLowerCase())
        : true;
      const risorsaMatch = filters.risorsa
  ? (activity.risorsa?.toLowerCase()?.includes(filters.risorsa.toLowerCase()))
  : true;
const attivitaMatch = filters.attivita
  ? (activity.nome_attivita?.toLowerCase()?.includes(filters.attivita.toLowerCase()))
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


// Suggerimenti per "attività": usa attivitaConReparto e filtra in base al reparto corrente
useEffect(() => {
  const attivitaSuggs = attivitaConReparto
    .filter((a) => a.reparto_id === RepartoID) // solo attività del reparto corrente
    .map((a) => a.nome_attivita)
    .filter((value, index, self) => self.indexOf(value) === index);
  setSuggestionsAttivita(attivitaSuggs);
}, [attivitaConReparto, RepartoID]);

// Suggerimenti per "risorsa": usa l'array "resources" già filtrato per il reparto corrente
useEffect(() => {
  const risorsaSuggs = risorse
  .map((risorsa) => risorsa.nome)
  .filter((value, index, self) => self.indexOf(value) === index);
  setSuggestionsRisorsa(risorsaSuggs);
}, [risorse]);

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

  // Rimuove la componente oraria dalla data (normalizza la data)
  const normalizeDate = (date) => {
    const localDate = new Date(date);
    return new Date(localDate.getFullYear(), localDate.getMonth(), localDate.getDate());
  };


  const toLocalISOString = (date) => {
  const offset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - offset * 60 * 1000);
  return localDate.toISOString().split("T")[0];
};

// Restituisce YYYY-MM-DD puro, senza alcuno shift di fuso
function formatDateOnly(dateObj) {
  const y = dateObj.getFullYear();
  const m = String(dateObj.getMonth() + 1).padStart(2, "0");
  const d = String(dateObj.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

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

  // Restituisce le attività di una risorsa per un dato giorno
const activityMap = useMemo(() => {
  const map = new Map();
  filteredActivities.forEach((activity) => {
    const dates = getActivityDates(activity).map((d) => formatDateOnly(d));
    dates.forEach((dayStr) => {
      const key = `${activity.risorsa_id}-${dayStr}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(activity);
    });
  });
  return map;
}, [filteredActivities]);

const getActivitiesForResourceAndDay = (resourceId, day) => {
  const key = `${resourceId}-${formatDateOnly(day)}`;
  return activityMap.get(key) || [];
};


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
      includedWeekends: activity.includedWeekends || [] 
    });
    setIsEditing(true);
    setEditId(activity.id);
    setShowPopup(true);
  };

  // Apre il popup per creare una nuova attività (doppio click su una cella vuota)
  const handleEmptyCellDoubleClick = (resourceId, day) => {
    const formattedDate = toLocalISOString(day);
    const existingActivities = getActivitiesForResourceAndDay(resourceId, day);
    if (existingActivities.length === 0) {
      setFormData({
        commessa_id: "",
        reparto_id: RepartoID,
        risorsa_id: resourceId,
        data_inizio: formattedDate,
        durata: 1,
        stato: "",
        descrizione: "",
        note: "",
        includedWeekends: [],  
      });
      setIsEditing(false);
      setShowPopup(true);
    } else {
      toast.warn("Cella già occupata.");
    }
  };

  // Elimina un'attività dopo conferma
  const handleDelete = async (id) => {
    if (window.confirm("Sei sicuro di voler eliminare questa attività?")) {
      try {
        await deleteAttivitaCommessa(id, token, { headers: { Authorization: `Bearer ${token}` } });
        setActivities((prevActivities) =>
          prevActivities.filter((activity) => activity.id !== id)
        );
      } catch (error) {
        console.error("Errore durante l'eliminazione dell'attività:", error);
        toast.error("Si è verificato un errore durante l'eliminazione dell'attività.");
      }
    }
  };
  

  // Elimina la nota associata a un'attività
  const deleteNote = async (activityId) => {
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

  // Apre il popup per aggiungere una nuova attività
  const handleAddNew = () => {
    setFormData({
      commessa_id: "",
      reparto_id: RepartoID,
      risorsa_id: "",
      attivita_id: "",
      data_inizio: "",
      durata: 1,
      stato: "",
      descrizione: "",
      note: "",
      includedWeekends: [],  
    });
    setIsEditing(false);
    setShowPopup(true);
  };

  // Aggiorna lo stato di un'attività (ad esempio da "non iniziata" a "iniziata" o "completata")
  const updateActivityStatus = async (activityId, newStatus) => {
    setLoadingActivities((prev) => ({ ...prev, [activityId]: true }));
    try {
      const payload = { stato: newStatus };
      await apiClient.put(`/api/notifiche/${activityId}/stato`, payload);
      setActivities((prev) =>
        prev.map((activity) =>
          activity.id === activityId ? { ...activity, stato: newStatus } : activity
        )
      );
    } catch (error) {
      console.error("Errore durante l'aggiornamento dello stato dell'attività:", error);
      toast.error("Si è verificato un errore durante l'aggiornamento dello stato.");
    } finally {
      setLoadingActivities((prev) => ({ ...prev, [activityId]: false }));
    }
  };

  // ========================================================
  // GESTIONE DEL DRAG & DROP
  // ========================================================
  // Gestisce il drop di un'attività in una nuova cella (nuova risorsa e/o nuovo giorno)
const handleActivityDrop = async (activity, newResourceId, newDate) => {
  try {
    const newStart = normalizeDate(newDate);
    const isoDate = toLocalISOString(newStart);
    const durata = Number(activity.durata) || 0;
    const originalIncluded = activity.includedWeekends || [];

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

    const newStartDay = newStart.getDay();
    if ((newStartDay === 0 || newStartDay === 6) && !updatedIncludedWeekends.includes(isoDate)) {
      updatedIncludedWeekends.push(isoDate);
    }

    const updatedActivity = {
      ...activity,
      risorsa_id: newResourceId,
      data_inizio: isoDate,
      descrizione: activity.descrizione_attivita || "",
      includedWeekends: updatedIncludedWeekends,
    };

    // Salva lato server
    await apiClient.put(`/api/attivita_commessa/${activity.id}`, updatedActivity);

    // 🔄 Aggiorna solo quell'attività nel frontend
    setActivities(prev =>
      prev.map((a) => a.id === activity.id ? { ...a, ...updatedActivity } : a)
    );

    toast.success("Attività aggiornata!");
  } catch (error) {
    console.error("Errore durante l'aggiornamento dell'attività:", error);
    toast.error("Errore durante l'aggiornamento.");
  }
};


  // ========================================================
  // COMPONENTE: ResourceCell
  // Rappresenta una cella della tabella per una risorsa in un determinato giorno
  // ========================================================
  function ResourceCell({ resourceId, day, activities, onActivityDrop, onActivityClick, isWeekend, viewMode }) {
    const normalizedDay = normalizeDate(day);
    const [{ isOver }, drop] = useDrop(() => ({
      accept: "ACTIVITY",
      drop: (item) => onActivityDrop(item, resourceId, normalizedDay),
      collect: (monitor) => ({
        isOver: !!monitor.isOver(),
      }),
    }));
    const cellClasses = `${isWeekend ? "weekend-cell" : ""} ${isOver ? "highlight" : ""}`;
    return (
      <td
        ref={drop}
        className={cellClasses}
        onDoubleClick={() =>
          activities.length === 0 && handleEmptyCellDoubleClick(resourceId, normalizedDay)
        }
      >
        {activities.map((activity) => (
          <DraggableActivity
            key={activity.id}
            activity={activity}
            onDoubleClick={() => onActivityClick(activity)}
            viewMode={viewMode}
          />
        ))}
      </td>
    );
  }

  // ========================================================
  // COMPONENTE: DraggableActivity
  // Rappresenta un'attività trascinabile con due modalità di visualizzazione
  // ========================================================
  function DraggableActivity({ activity, onDoubleClick, viewMode }) {
    const [{ isDragging }, drag] = useDrag(() => ({
      type: "ACTIVITY",
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
          ></div>
          <Tooltip id={`tooltip-${activity.id}`} place="top" effect="solid"  style={{ zIndex: 9999 }}>
            <span style={{ whiteSpace: "pre-wrap" }}>{tooltipContent}</span>
          </Tooltip>
        </>
      );
    }



    // Modalità "full": visualizzazione dettagliata dell'attività
    return (
      <div
        ref={drag}
        className={`activity ${activityClass}`}
        style={{ opacity: isDragging ? 0.5 : 1, cursor: "move", minWidth: "150px" }}
        onDoubleClick={onDoubleClick}
      >
        {activity.stato === 2 && activity.note && (
          <span className="warning-icon" title="Nota presente nell'attività completata">
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
        )}
        <br />
        <strong>Commessa: {activity.numero_commessa}</strong>
        <br />
        <strong>Attività: {activity.nome_attivita}</strong>
        <br />
        {ViewStato && (
          <strong>
           Stato:{" "}
           {activity.stato === 0
            ? "Non iniziata"
            : activity.stato === 1
            ? "Iniziata"
            : "Completata"}
          </strong>
        )}

        <br />
        {activity.reparto?.toLowerCase() === "service" && (
          <>
            <br />
            <strong>Descrizione: {activity.descrizione_attivita || ""}</strong>
            <br />
          </>
        )}
        <div className="flex-column-center">
          {ViewButtons && activity.stato === 1 && (
            <>
              <button
                className="btn w-100 btn--complete btn--pill "
                onClick={() => updateActivityStatus(activity.id, 2)}
                disabled={loadingActivities[activity.id]}
              >
                {loadingActivities[activity.id] ? "Caricamento..." : "Completa"}
              </button>
              <button className="btn w-100 btn--danger btn--pill" onClick={() => handleDelete(activity.id)}>
                Elimina
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
                {loadingActivities[activity.id] ? "Caricamento..." : "Completa "}
              </button>
              <button className="btn w-100 btn--danger btn--pill" onClick={() => handleDelete(activity.id)}>
                Elimina
              </button>
            </>
          )}
        </div>
        {ViewNote && (
         <>
          <div className="note">Note: {activity.note}</div>
           {activity.note && (
            <button className="btn btn--danger btn--pill" onClick={() => deleteNote(activity.id)}>
             Elimina Nota
            </button>
           )}
         </>
        )}
      </div>
    );
  }

  // ========================================================
  // FUNZIONE PER RICARICARE LE ATTIVITÀ (es. dopo un aggiornamento)
  // ========================================================
  const handleReloadActivities = async () => {
    try {
      const updatedActivities = await fetchAttivitaCommessa();
      setActivities(updatedActivities);
      toast.success("Attività ricaricate con successo.");
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
      <div className=" header">
        <h1>BACHECA REPARTO {RepartoName.toUpperCase()}</h1>
        <div className="flex-center header-row">
          <button onClick={goToPreviousMonth} className="btn w-50 btn--shiny btn--pill">
            <FontAwesomeIcon icon={faChevronLeft} />
          </button>
          <button onClick={scrollToToday} className="btn w-50 btn--shiny btn--pill">
            OGGI
          </button>
         <div className="header-row-month"> {meseCorrente}</div>
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
              {/* Selezione della risorsa del Service (se applicabile) */}
            {serviceResources.length > 0 && reparto !== "service" && (
              <div>
                <label htmlFor="serviceResourceSelect">Seleziona Risorsa del Service:</label>
                <select  style={{ marginTop: '10px' }}
                  id="serviceResourceSelect"
                  value={selectedServiceResource || ""}
                  className="w-200"
                  onChange={(e) =>
                    setSelectedServiceResource(e.target.value ? Number(e.target.value) : null)
                  }
                >
                  <option value="">Nessuna risorsa selezionata</option>
                  {serviceResources.map((resource) => (
                    <option key={resource.id} value={resource.id}>
                      {resource.nome}
                    </option>
                  ))}
                </select>
              </div>
            )}
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
        {isDataReady ? (
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
                  {/* Renderizza una riga per ogni risorsa */}
                  {risorse.map((risorse) => (
                    <tr key={risorse.id}>
                      <td>{risorse.nome}</td>
                      {daysInMonth.map((day) => {
                        const isWeekend = day.getDay() === 0 || day.getDay() === 6;
                        return (
                          <ResourceCell
                            key={`${risorse.id}-${day.toISOString()}`}
                            resourceId={risorse.id}
                            day={day}
                            isWeekend={isWeekend}
                            activities={getActivitiesForResourceAndDay(risorse.id, day)}
                            onActivityDrop={handleActivityDrop}
                            onActivityClick={handleActivityClick}
                            viewMode={activityViewMode}
                          />
                        );
                      })}
                    </tr>
                  ))}

                  {/* Seleziona e renderizza la riga per le risorse del Service, se applicabile */}
                  {selectedServiceResource && (
                    <>
                      <tr>
                        <td colSpan={daysInMonth.length + 1} className="service-header">
                          <strong>Service:</strong>
                        </td>
                      </tr>
                      <tr>
                        <td>
                          {serviceResources.find((res) => res.id === selectedServiceResource)?.nome || "Risorsa non trovata"}
                        </td>
                        {daysInMonth.map((day) => {
                          const isWeekend = day.getDay() === 0 || day.getDay() === 6;
                          return (
                            <ResourceCell
                              key={`${selectedServiceResource}-${day.toISOString()}`}
                              resourceId={selectedServiceResource}
                              day={day}
                              isWeekend={isWeekend}
                              activities={getActivitiesForResourceAndDay(selectedServiceResource, day)}
                              onActivityDrop={handleActivityDrop}
                              onActivityClick={handleActivityClick}
                              viewMode={activityViewMode}
                            />
                          );
                        })}
                      </tr>
                    </>
                  )}
                </tbody>
              </table>
              ) : (
  <div className="loading-indicator">Caricamento dati...</div>
)}
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
            risorse={risorse}
            attivitaConReparto={attivitaConReparto}
            reloadActivities={handleReloadActivities}
          />
        )}
      </div>
    </div>
  );
}

export default DashboardReparto;
