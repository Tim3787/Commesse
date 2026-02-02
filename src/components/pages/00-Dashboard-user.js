import React, { useEffect, useRef, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../img/Animation - 1738249246846.gif";
import  "../style/00-Dashboard-user.css";
import SezioneSchede from '../assets/SezioneSchede.js'; 
import SchedaTecnica from "../popup/SchedaTecnicaEdit.js";
import { fetchOpenNotesByCommessaReparto } from "../services/API/attivitaCommesse-api";



// Import API per le varie entità
import { updateActivityStatusAPI, updateActivityNotes } from "../services/API/notifiche-api";
import { fetchDashboardActivities,fetchDashboardActivityById,fetchDeptActivityById  } from "../services/API/dashboard-api";
import { fetchUserName } from "../services/API/utenti-api";
import { fetchMyOpenNotes, fetchMyOpenActivities,fetchRepartoDashboard  } from "../services/API/attivitaCommesse-api";
import { fetchClientiSpecifiche } from "../services/API/clientiSpecifiche-api";


// Import per Toastify (notifiche)
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
/**
 * Componente Dashboard
 * Visualizza una dashboard con le attività del mese, organizzate in un calendario.
 * Permette di navigare tra i mesi, aggiornare lo stato delle attività e gestire note.
 */

function Dashboard() {
  // ------------------------------------------------------------------
  // Stati e Ref
  // ------------------------------------------------------------------
  const [currentMonth, ] = useState(new Date()); // Mese attualmente visualizzato
  const [monthlyActivities, setMonthlyActivities] = useState([]); // Attività del mese corrente
  const [loading, setLoading] = useState(false);                   // Stato di caricamento generale
  const [userName, setUserName] = useState("Utente");                // Nome dell'utente
  const token = sessionStorage.getItem("token");
let userId = null;
const [selectedActivity, setSelectedActivity] = useState(null);
const [selectedLoading, setSelectedLoading] = useState(false);

if (token) {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    userId = payload.id;
  } catch (e) {
    console.error("Errore decodifica token:", e);
  }
}                // Token JWT salvato in sessionStorage
  const daysRefs = useRef([]);                                       // Ref per ogni giorno della dashboard (per lo scroll)              // Data di oggi in formato locale
  const [noteUpdates, setNoteUpdates] = useState({});                // Stato per gestire aggiornamenti temporanei delle note
  const calendarRef = useRef();
  const [schedeAperte, setSchedeAperte] = useState({});
  const [popupScheda, setPopupScheda] = useState(null);
  const [schedaInModifica, setSchedaInModifica] = useState(null);
  const [hasScrolledToToday, setHasScrolledToToday] = useState(false);
 const navigate = useNavigate();
const CLOSED_PREFIX = "[CHIUSA] ";
const CLOSED_RE = /^\[CHIUSA\]\s*/i; // parentesi quadre escapse, spazio opzionale
const [linkedOpenNotes, setLinkedOpenNotes] = useState([]);
const [linkedNotesLoading, setLinkedNotesLoading] = useState(false);
const [linkedNotesError, setLinkedNotesError] = useState(null);

const isClosedNote = (text) => CLOSED_RE.test(text ?? "");

const closeNoteText = (text) =>
  isClosedNote(text) ? text : `${CLOSED_PREFIX}${text || ""}`.trim();

const reopenNoteText = (text) =>
  (text ?? "").replace(CLOSED_RE, "");



const [deptData, setDeptData] = useState(null);
const managerRepartoMap = {
  26: 1, // User 12 vede reparto software (id 1)
  105: 3, // User 45 vede reparto meccanico 
  106: 3, // User 45 vede reparto meccanico 
  44: 2, // User 78 vede reparto elettrico 
  107: 14, // User 78 vede reparto Tecnico elettrico
  77: 18, // User 78 vede reparto Service
  84: 18, // User 78 vede reparto Service
  };
const repartoIdPerManager = managerRepartoMap[userId] ?? null;
  // ------------------------------------------------------------------
  // Funzione helper: calcola tutti i giorni del mese dato un oggetto Date
  // ------------------------------------------------------------------
  const getDaysInMonth = (date) => {
    const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    const days = [];
    for (let i = 1; i <= endOfMonth.getDate(); i++) {
      days.push(new Date(date.getFullYear(), date.getMonth(), i));
    }
    return days;
  };
  const daysInMonth = getDaysInMonth(currentMonth);
  
const [clienteSpecsPopup, setClienteSpecsPopup] = useState({
  open: false,
  loading: false,
  error: null,
  specs: [],
  clienteLabel: "",
  repartoId: null,
});



const openSelectedActivity = async (activityId) => {
  try {
    setSelectedLoading(true);
    setSelectedActivity(null);

    // se ce l’hai già in monthlyActivities, evita chiamata
    const local = monthlyActivities.find(a => a.id === activityId);
    if (local) {
      setSelectedActivity(local);
      return;
    }

    // altrimenti fetch dettaglio dal backend
    const full = await fetchDashboardActivityById(activityId, token);
    setSelectedActivity({
      ...full,
      includedWeekends: full.included_weekends || full.includedWeekends || [],
      clientHasSpecs: full.client_has_specs ?? full.clientHasSpecs ?? false,
    });
  } catch (e) {
    console.error("Errore caricamento attività selezionata", e);
    toast.error("Errore caricamento attività selezionata.");
  } finally {
    setSelectedLoading(false);
  }
};
const openSelectedDeptActivity = async (activityId) => {
  if (!repartoIdPerManager) {
    toast.error("Nessun reparto manager associato.");
    return;
  }

  try {
    setSelectedLoading(true);

    // se è già in monthlyActivities (mese corrente) usa local
    const local = monthlyActivities.find(a => a.id === activityId);
    if (local) {
      setSelectedActivity(local);
      return;
    }

    // chiama endpoint manager (reparto del manager)
    const full = await fetchDeptActivityById(repartoIdPerManager, activityId, token);

    setSelectedActivity({
      ...full,
      includedWeekends: full.included_weekends || full.includedWeekends || [],
      clientHasSpecs: full.client_has_specs ?? full.clientHasSpecs ?? false,
    });
  } catch (e) {
    console.error(e);
    toast.error("Errore caricamento attività reparto.");
  } finally {
    setSelectedLoading(false);
  }
};


  // ------------------------------------------------------------------
  // Helper per formattare date in YYYY-MM-DD senza shift
  // ------------------------------------------------------------------
  function formatDateOnly(dateObj) {
    const y = dateObj.getFullYear();
    const m = String(dateObj.getMonth() + 1).padStart(2, "0");
    const d = String(dateObj.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }

  // ------------------------------------------------------------------
  // Helper per normalizzare date
  // ------------------------------------------------------------------
  const normalizeDate = (dateObj) => {
    return new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate());
  };

  // ------------------------------------------------------------------
  // Calcola le date valide di un'attività includendo weekend selezionati
  // ------------------------------------------------------------------
  const getActivityDates = (activity) => {
    const dates = [];
    const start = normalizeDate(new Date(activity.data_inizio));
    const total = Number(activity.durata) || 0;
    let cursor = new Date(start);

    while (dates.length < total) {
      const wd = cursor.getDay(); // 0=Dom,6=Sab
      if (wd >= 1 && wd <= 5) {
        dates.push(new Date(cursor));
      } else {
        // weekend: includi solo se nel campo includedWeekends
        const iso = formatDateOnly(cursor);
        if (activity.includedWeekends?.includes(iso)) {
          dates.push(new Date(cursor));
        }
      }
      cursor.setDate(cursor.getDate() + 1);
    }
    return dates;
  };

  // ------------------------------------------------------------------
  // Funzione helper: restituisce le attività per un determinato giorno
  // ------------------------------------------------------------------
const getActivitiesForDay = (day) => {
  const isoDay = formatDateOnly(normalizeDate(day));

  return monthlyActivities.filter((activity) =>
    getActivityDates(activity)
      .map((d) => formatDateOnly(d))
      .includes(isoDay)
  );
};
const baseActivity = useMemo(() => {
  if (selectedActivity) return selectedActivity;

  const todayList = getActivitiesForDay(new Date());
  return todayList.length ? todayList[0] : null;
}, [selectedActivity, monthlyActivities]); 
useEffect(() => {
  if (!repartoIdPerManager) return;

  const loadDeptData = async () => {
    try {
      const data = await fetchRepartoDashboard(repartoIdPerManager, token);
      setDeptData(data);
    } catch (e) {
      console.error("Errore caricamento dashboard reparto", e);
    }
  };

  loadDeptData();
}, [repartoIdPerManager, token]);


  // ------------------------------------------------------------------
  // Effetto: Scrolla automaticamente al giorno corrente se non già fatto
  // ------------------------------------------------------------------
useEffect(() => {
  if (hasScrolledToToday) return;

  const todayIndex = daysInMonth.findIndex(
    (d) => formatDateOnly(d) === formatDateOnly(new Date())
  );

  if (todayIndex !== -1 && daysRefs.current[todayIndex]) {
    const todayEl = daysRefs.current[todayIndex];
    const scrollContainer = calendarRef.current;

    const offset = 200;

    setTimeout(() => {
      scrollContainer.scrollTo({
        top: todayEl.offsetTop - offset,
        behavior: "smooth",
      });

      setHasScrolledToToday(true);
    }, 200); // oppure 100ms se serve un piccolo ritardo in più
  }
}, [daysInMonth, hasScrolledToToday]);




  // ------------------------------------------------------------------
  // Effetto: Carica le attività della dashboard per il mese corrente
  // ------------------------------------------------------------------
  useEffect(() => {
    const monthStartDate = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth(),
      1
    );
    const fetchData = async () => {
      try {
        setLoading(true);
        const activities = await fetchDashboardActivities(monthStartDate, token);
        setMonthlyActivities(
  activities.map(a => ({
    ...a,
    includedWeekends: a.included_weekends || [], // normalizza
        clientHasSpecs: a.client_has_specs ?? false,
  }))
);
      } catch (error) {
        console.error("Errore durante il recupero delle attività mensili:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [currentMonth, token]);



  // ------------------------------------------------------------------
  // Effetto: Recupera il nome dell'utente
  // ------------------------------------------------------------------
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const user = await fetchUserName(token);
        setUserName(user);
      } catch (error) {
        console.error("Errore durante il recupero del nome utente:", error);
      }
    };
    fetchUserData();
  }, [token]);

  // ------------------------------------------------------------------
  // Stato per il caricamento individuale delle attività (per pulsanti, ecc.)
  // ------------------------------------------------------------------
  const [loadingActivities, setLoadingActivities] = useState({});

  // ------------------------------------------------------------------
  // Funzione per aggiornare lo stato di un'attività (es. da "non iniziata" a "iniziata" o "completata")
  // ------------------------------------------------------------------
const updateActivityStatus = async (activityId, newStatus) => {
  setLoadingActivities((prev) => ({ ...prev, [activityId]: true }));
  try {
    await updateActivityStatusAPI(activityId, newStatus, token);

    setMonthlyActivities((prev) =>
      prev.map((a) => (a.id === activityId ? { ...a, stato: newStatus } : a))
    );

    setSelectedActivity((prev) =>
      prev && prev.id === activityId ? { ...prev, stato: newStatus } : prev
    );

  } catch (error) {
    console.error("Errore durante l'aggiornamento dello stato:", error);
    alert("Si è verificato un errore durante l'aggiornamento dello stato.");
  } finally {
    setLoadingActivities((prev) => ({ ...prev, [activityId]: false }));
  }
};

  // ------------------------------------------------------------------
  // Gestione delle note per le attività
  // ------------------------------------------------------------------
  const handleNoteChange = (activityId, note) => {
    setNoteUpdates((prev) => ({ ...prev, [activityId]: note }));
  };

const saveNote = async (activityId) => {
  try {
    const current = monthlyActivities.find((a) => a.id === activityId);
    const text = noteUpdates[activityId] ?? current?.note ?? "";

    // Se la nota è chiusa, mantieni il prefisso anche se l’utente l’ha rimosso
    const finalText = isClosedNote(current?.note) ? closeNoteText(text) : text;

    await updateActivityNotes(activityId, finalText, token);
    toast.success("Nota aggiornata con successo!");
    setMonthlyActivities((prev) =>
      prev.map((a) => (a.id === activityId ? { ...a, note: finalText } : a))
    );
    setSelectedActivity(prev =>
  prev && prev.id === activityId ? { ...prev, note: finalText } : prev
);

    setNoteUpdates((prev) => ({ ...prev, [activityId]: finalText }));
  } catch (error) {
    console.error("Errore durante il salvataggio della nota:", error);
    toast.error("Errore durante il salvataggio della nota.");
  }
};


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
      // Invia null per eliminare la nota sul backend
      await updateActivityNotes(activityId, null, token);
      toast.success("Nota eliminata con successo!");
      // Aggiorna lo stato locale rimuovendo la nota
      setMonthlyActivities((prev) =>
        prev.map((activity) =>
          activity.id === activityId ? { ...activity, note: null } : activity
        )
      );
      setSelectedActivity(prev =>
  prev && prev.id === activityId ? { ...prev, note: null } : prev
);

      setNoteUpdates((prev) => ({ ...prev, [activityId]: "" }));
    } catch (error) {
      console.error("Errore durante l'eliminazione della nota:", error);
      toast.error("Errore durante l'eliminazione della nota.");
    }
  };

// Chiudi la nota associata a un'attività (senza cancellarla)
const closeNote = async (activityId) => {
  try {
    const activity = monthlyActivities.find((a) => a.id === activityId) || selectedActivity;
    if (!activity) return;

    const newText = closeNoteText(activity.note);
    await updateActivityNotes(activityId, newText, token);

    toast.success("Nota chiusa con successo!");

    setMonthlyActivities((prev) =>
      prev.map((a) => (a.id === activityId ? { ...a, note: newText } : a))
    );

    setSelectedActivity((prev) =>
      prev && prev.id === activityId ? { ...prev, note: newText } : prev
    );

    setNoteUpdates((prev) => ({ ...prev, [activityId]: newText }));
  } catch (error) {
    console.error("Errore durante la chiusura della nota:", error);
    toast.error("Errore durante la chiusura della nota.");
  }
};


// (Opzionale) Riapri la nota se serve
const reopenNote = async (activityId) => {
  try {
    const activity = monthlyActivities.find((a) => a.id === activityId) || selectedActivity;
    if (!activity) return;

    const newText = reopenNoteText(activity.note);
    await updateActivityNotes(activityId, newText, token);

    toast.success("Nota riaperta!");

    setMonthlyActivities((prev) =>
      prev.map((a) => (a.id === activityId ? { ...a, note: newText } : a))
    );

    setSelectedActivity((prev) =>
      prev && prev.id === activityId ? { ...prev, note: newText } : prev
    );

    setNoteUpdates((prev) => ({ ...prev, [activityId]: newText }));
  } catch (error) {
    console.error("Errore durante la riapertura della nota:", error);
    toast.error("Errore durante la riapertura della nota.");
  }
};


  // ------------------------------------------------------------------
  // Schede
  // ------------------------------------------------------------------
  const toggleSchede = (commessaId) => {
  setSchedeAperte(prev => ({
    ...prev,
    [commessaId]: !prev[commessaId]
  }));
};

const apriPopupScheda = ({ commessaId, numero_commessa, schedaInModifica }) => {
  setPopupScheda({ commessaId, numero_commessa });
  setSchedaInModifica(schedaInModifica || null); 
  setSchedeAperte(prev => ({
  ...prev,
  [commessaId]: false
}));
};


const [myOpenList, setMyOpenList] = useState([]);
const [myNotesList, setMyNotesList] = useState([]);

useEffect(() => {
  const load = async () => {
    if (!token) return;
    try {
      const [attive, note] = await Promise.all([
        fetchMyOpenActivities(token),
        fetchMyOpenNotes(token)
      ]);
      setMyOpenList(attive);
      setMyNotesList(note);
    } catch (e) {
      console.error("Errore caricamento attività personali", e);
    }
  };
  load();
}, [token]);

useEffect(() => {

}, [monthlyActivities]);

  // ------------------------------------------------------------------
  // Specifiche cliente
  // ------------------------------------------------------------------

const openClienteSpecs = async (clienteFull, repartoId) => {
  // Apri subito il popup in loading
  setClienteSpecsPopup({
    open: true,
    loading: true,
    error: null,
    specs: [],
    clienteLabel: clienteFull,
    repartoId,
  });

  try {
    // 🔎 chiamata API: filtra per cliente e reparto
    const data = await fetchClientiSpecifiche({
      cliente: clienteFull,
      reparto_id: repartoId,
    });

    setClienteSpecsPopup(prev => ({
      ...prev,
      loading: false,
      specs: data,
    }));
  } catch (e) {
    console.error("Errore caricamento specifiche cliente", e);
    setClienteSpecsPopup(prev => ({
      ...prev,
      loading: false,
      error: "Errore durante il caricamento delle specifiche.",
    }));
  }
};

const closeClienteSpecs = () => {
  setClienteSpecsPopup({
    open: false,
    loading: false,
    error: null,
    specs: [],
    clienteLabel: "",
    repartoId: null,
  });
};
const autoResize = (el) => {
  if (!el) return;
  el.style.height = "auto";
  el.style.height = `${el.scrollHeight}px`;
};
useEffect(() => {
  // aspetta che React abbia renderizzato il textarea
  const t = setTimeout(() => {
    const el = document.querySelector(".activity textarea");
    autoResize(el);
  }, 0);

  return () => clearTimeout(t);
}, [selectedActivity]);

useEffect(() => {
  const a = baseActivity;

  if (!a?.commessa_id || !a?.reparto_id) {
    setLinkedOpenNotes([]);
    setLinkedNotesError(null);
    setLinkedNotesLoading(false);
    return;
  }

  const run = async () => {
    try {
      setLinkedNotesLoading(true);
      setLinkedNotesError(null);

      const data = await fetchOpenNotesByCommessaReparto(
        {
          commessa_id: a.commessa_id,
          reparto_id: a.reparto_id,
          exclude_id: a.id,
        },
        token
      );

      setLinkedOpenNotes(data);
    } catch (e) {
      console.error(e);
      setLinkedNotesError("Errore caricamento note collegate.");
      setLinkedOpenNotes([]);
    } finally {
      setLinkedNotesLoading(false);
    }
  };

  run();
}, [baseActivity?.id, baseActivity?.commessa_id, baseActivity?.reparto_id, token]);


  // ------------------------------------------------------------------
  // Rendering del componente Dashboard
  // ------------------------------------------------------------------
  return (
    <div>

      <div className="container">

        <ToastContainer position="top-left" autoClose={2000} hideProgressBar />


        {/* Overlay di caricamento */}
        {loading && (
          <div className="loading-overlay">
            <img src={logo} alt="Logo" className="logo-spinner" />
          </div>
        )}
         <div className="user-dash" >
       <div className="flex-column-center">
  
<div className="center">
          {/* Intestazione */}
         <h1> Ciao {userName}</h1>
         </div>
         <div className="center">
  Hai {myOpenList.length} attività aperte

<ul>
  {myOpenList.map(a => (
    <li  style={{ marginBottom: "10px"}} 
    key={a.id}
      onClick={() => openSelectedActivity(a.id)}   // ✅ seleziona
    >
  {a.numero_commessa} — {a.nome_attivita}  

 --  Iniziata il : {new Date(a.data_inizio).toLocaleDateString('it-IT')}
</li>

  ))}
</ul>
</div>
<div className="center">
Hai {myNotesList.length} note aperte
<ul>
  {myNotesList.map(a => (
    <li
  key={a.id}
  title={a.note || "—"}                 // ✅ tooltip nota
  style={{ cursor: "pointer", marginBottom: "10px" }}
  onClick={() => openSelectedActivity(a.id)}   // ✅ seleziona
>
  {a.numero_commessa} — {a.nome_attivita}
  {" -- Iniziata il : "}
  {new Date(a.data_inizio).toLocaleDateString("it-IT")}
</li>


  ))}
</ul>
</div>
{deptData && (
  <div className="flex-column-center">
    <h2>Riepilogo reparto {deptData.reparto_nome}</h2>

   <ul>Nel reparto ci sono  {deptData.openActivitiesCount} attività aperte</ul>


      {deptData.openActivities.map(a => (
  <li
    key={a.id}
    style={{
 marginBottom: "10px",
    display: "flex",
    flexWrap: "wrap",
    gap: "6px",
     cursor: "pointer",
    
  }}
 onClick={() => {
  console.log("ROW CLICK:", a);
  openSelectedDeptActivity(a.id);
}}


>
  <span><strong>Commessa:</strong> {a.numero_commessa}</span>
  <span>—</span>
  <span><strong>Attività:</strong> {a.nome_attivita}</span>
  <span>—</span>
  <span><strong>Iniziata il:</strong> {new Date(a.data_inizio).toLocaleDateString("it-IT")}</span>
  <span>—</span>
  <span><strong>Da:</strong> {a.risorsa_nome || "—"}</span>
</li>
))}

    <ul> Nel reparto ci sono  {deptData.openNotesCount} note aperte</ul>

      {deptData.openNotes.map(a => (
         <li
    key={a.id}
      title={a.note || "—"}   
    style={{
 marginBottom: "10px",
    display: "flex",
    flexWrap: "wrap",
    gap: "6px",
     cursor: "pointer",
     
  }}
   onClick={() => {
  console.log("ROW CLICK:", a);
  openSelectedDeptActivity(a.id);
}}


>
           <span><strong>Commessa:</strong> {a.numero_commessa}</span>
  <span>—</span>
  <span><strong>Attività:</strong> {a.nome_attivita}</span>
  <span><strong>Creata da:</strong> {a.risorsa_nome || "—"}</span>
        </li>
      ))}

  </div>
)}


</div>
 <div className="flex-column-center">
  <button  className="btn btn--pill w-400 btn--blue" onClick={() => navigate("/00-Dashboard-user-calendar")}>Vai al calendario</button>

<hr style={{ margin: "10px 0" }} />

    {/* ATTIVITA DI OGGI */}
    <h1>{selectedActivity ? "ATTIVITÀ SELEZIONATA" : "ATTIVITÀ DI OGGI"}</h1>

{selectedActivity && (
  <button
    className="btn btn--pill w-200 btn--blue"
    onClick={() => setSelectedActivity(null)}
  >
    Torna ad oggi
  </button>
)}
</div>
{selectedLoading ? (
  <p>Caricamento attività...</p>
) : (() => {
  const list = selectedActivity ? [selectedActivity] : getActivitiesForDay(new Date());
  if (!list.length) return <p>✅ Nessuna attività oggi</p>;

  return list.map((activity) => {
const isBase = baseActivity && activity.id === baseActivity.id;
        const activityClass =
          activity.stato === 0 ? "activity not-started"
          : activity.stato === 1 ? "activity started"
          : "activity completed";
                      // Controlla se l'attività riguarda una trasferta (logica specifica)
                      const isTrasferta = activity.nome_attivita
                        ?.toLowerCase()
                        .includes("trasferta");

                      return (
                        <div className="flex-column-center">
                        <div key={activity.id} className={`activity ${activityClass}`} style={{minWidth: "300px"} } >
                          <div className="flex-column-center" style={{ marginTop:  "10px" }}>
                            {/* Se l'attività è completata e contiene una nota, mostra un'icona di warning */}
                            {activity.stato === 2 && activity.note && !isClosedNote(activity.note) && (
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

                            <strong>Commessa:  {activity.numero_commessa} </strong> 
                            <strong>Attività:  {activity.nome_attivita}</strong> 
                                                        
                       

{activity.clientHasSpecs && (
  <div className="flex-column-center">
    <span className="client-specs-text">
         <strong>Cliente con specifiche particolari. 👈</strong> 
    </span>
    <button
      className="btn w-100 btn--warning btn--pill"
      onClick={() => openClienteSpecs(activity.cliente, activity.reparto_id)}
    >
      Vedi specifiche
    </button>
  </div>
)}
                            {isTrasferta && (
                              <span className="trasferta-icon" title="Trasferta">
                                🚗
                              </span>
                            )}
                          </div>

                          {/* Azioni relative all'attività: in base allo stato vengono mostrate le azioni appropriate */}
                          <div className="flex-column-center">
                            <strong>Stato attività:{" "}
                            {activity.stato === 1 && (
                              <>
                                <span className="dashboasrd-user-activity-status">Iniziata</span>
                                  <div className="flex-column-center"  style={{ marginTop:  "10px" }}>
                                <button
                                  className="btn w-100 btn--complete btn--pill"
                                  onClick={() => updateActivityStatus(activity.id, 2)}
                                >
                                    Completa ✅
                                </button>
                                </div>
                              </>
                            )}
                            {activity.stato === 2 && (
                              <span className="dashboasrd-user-activity-status">Completata</span>
                            )}
                            {activity.stato === 0 && (
                              
                              <>
                              <span className="dashboasrd-user-activity-status">Non iniziata</span>
                               <div className="flex-column-center"  style={{ marginTop: "10px" }}>
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
                                </div>
                              </>
                            )}
                            </strong> 
                            {activity.descrizione?.trim() && (
  <div>
    <strong>Descrizione:</strong> {activity.descrizione}
  </div>
)}
                          </div>

                          {/* Sezione note: textarea per aggiungere/modificare una nota e pulsanti per salvare o eliminare */}
                          <div className="flex-column-center"
                              style={{ marginTop: "15px"}}
                          >
 <strong>Nota per questa attività:</strong>
  {(() => {
    const isClosed = isClosedNote(activity.note);
    return (
      <textarea
        style={{ maxWidth: "90%" }}
      
  ref={(el) => {
    // autosize subito quando monta / cambia activity
    if (el) autoResize(el);
  }}
  onInput={(e) => autoResize(e.target)} // autosize mentre scrivi/incolli
        placeholder={isClosed ? "Nota chiusa" : "Aggiungi una nota..."}
        className={`textarea  ${isClosed ? "is-locked" : ""}`}
        value={
          noteUpdates[activity.id] !== undefined
            ? noteUpdates[activity.id]
            : activity.note || ""
        }
        onChange={(e) => {
          if (!isClosed) handleNoteChange(activity.id, e.target.value);
        }}
        readOnly={isClosed}
        aria-readonly={isClosed}
      />
    );
  })()}

                            
                            <div className="flex-column-center">
                              { !isClosedNote(activity.note) && (
                              <button className="btn w-100 btn--blue btn--pill" onClick={() => saveNote(activity.id)}>
                                Salva Nota
                              </button>    )}
                              
                              {activity.note && !isClosedNote(activity.note) && (
<button className="btn w-100 btn--danger btn--pill " onClick={() => closeNote(activity.id)}>
  Chiudi nota
</button>
  )}

{isClosedNote(activity.note) && (
  <span className="badge badge--muted">Nota chiusa</span>
)}
{/* opzionale riapertura */}
{isClosedNote(activity.note) && (
  <button className="btn w-100 btn--blue btn--pill " onClick={() => reopenNote(activity.id)}>
    Riapri nota
  </button>
)}
                             {activity.note && (
                                <button className="btn w-100 btn--danger btn--pill " onClick={() => deleteNote(activity.id)}>
                                  Elimina Nota
                                </button>
                              )}
                            </div>
                          </div>
                          
                          {isBase && (
  <div className="linked-notes" style={{ marginTop: 10 }}>
     <div className="flex-column-center">
    <h3 style={{ marginBottom: 6 }}>
      Altre note aperte:
    </h3>

    {linkedNotesLoading && <p>Caricamento...</p>}
    {linkedNotesError && <p style={{ opacity: 0.8 }}>{linkedNotesError}</p>}

    {!linkedNotesLoading && !linkedNotesError && (
      linkedOpenNotes.length === 0 ? (
        <p>✅ Nessun’altra nota aperta</p>
      ) : (
        <div className="specs-list">
          {linkedOpenNotes.map(n => (
            <div
              key={n.id}
              className="spec-card"
              style={{ cursor: "pointer" }}

            >
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                <strong>{n.nome_attivita}</strong>
                <span>—</span>
                <span>{new Date(n.data_inizio).toLocaleDateString("it-IT")}</span>
                <span>—</span>
                <span>{n.risorsa_nome || "—"}</span>
              </div>
              <p style={{ whiteSpace: "pre-wrap" }}>{n.note}</p>
            </div>
          ))}
        </div>
      )
    )}
  </div>
      </div>
)}

 <div className="flex-column-center">
  <button
    className="btn btn-100 btn--blue btn--pill"
    onClick={() => toggleSchede(activity.commessa_id)}
  >
    {schedeAperte[activity.commessa_id] ? "Nascondi schede" : "Mostra schede"}
  </button>

  {schedeAperte[activity.commessa_id] && (
    <SezioneSchede
      commessaId={activity.commessa_id}
      numero_commessa={activity.numero_commessa}
       apriPopupScheda={apriPopupScheda}
               />
              )}
            </div>
          </div>
          
{clienteSpecsPopup.open && (
  <div className="modal-overlay" onClick={closeClienteSpecs}>
    <div
      className="modal"
      onClick={(e) => e.stopPropagation()} // evita chiusura cliccando dentro
    >
      <h2>
        Specifiche cliente<br />
        <span className="modal-subtitle">
          {clienteSpecsPopup.clienteLabel}
        </span>
      </h2>

      {clienteSpecsPopup.loading && <p>Caricamento specifiche...</p>}

      {clienteSpecsPopup.error && (
        <p className="modal-error">{clienteSpecsPopup.error}</p>
      )}

      {!clienteSpecsPopup.loading && !clienteSpecsPopup.error && (
        <>
          {clienteSpecsPopup.specs.length === 0 ? (
            <p>Nessuna specifica trovata per questo cliente/reparto.</p>
          ) : (
            <div className="specs-list">
              {clienteSpecsPopup.specs.map((spec) => (
                <div key={spec.id} className="spec-card">
                  <h3>{spec.titolo}</h3>
                  <p>{spec.descrizione}</p>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      <div className="modal-actions">
        <button
          className="btn btn--pill btn--blue"
          onClick={closeClienteSpecs}
        >
          Chiudi
        </button>
      </div>
    </div>
  </div>
)}
           </div>
        );
      });
    })()}
    
    </div>

{popupScheda && (
  <SchedaTecnica
    editable={true}
    commessaId={popupScheda.commessaId}
    numero_commessa={popupScheda.numero_commessa}
    schedaInModifica={schedaInModifica}
    setSchedaInModifica={setSchedaInModifica}
    onClose={() => {
      setPopupScheda(null);
      setSchedaInModifica(null);
    }}
  />
)}


</div>
    </div>
    
  );
}

export default Dashboard;
