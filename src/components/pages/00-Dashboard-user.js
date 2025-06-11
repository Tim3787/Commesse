import React, { useEffect, useRef, useState } from "react";

import logo from "../img/Animation - 1738249246846.gif";
import  "../style/00-Dashboard-user.css";
import SezioneSchede from '../assets/SezioneSchede.js'; 
import SchedaTecnica from "../popup/SchedaTecnicaEdit.js";

// Import icone FontAwesome
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronLeft, faChevronRight } from "@fortawesome/free-solid-svg-icons";

// Import API per le varie entità
import { updateActivityStatusAPI, updateActivityNotes } from "../services/API/notifiche-api";
import { fetchFATDates } from "../services/API/commesse-api";
import { fetchDashboardActivities } from "../services/API/dashboard-api";
import { fetchUserName } from "../services/API/utenti-api";

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
  const [currentMonth, setCurrentMonth] = useState(new Date()); // Mese attualmente visualizzato
  const [monthlyActivities, setMonthlyActivities] = useState([]); // Attività del mese corrente
  const [loading, setLoading] = useState(false);                   // Stato di caricamento generale
  const [userName, setUserName] = useState("Utente");                // Nome dell'utente
  const token = sessionStorage.getItem("token");                   // Token JWT salvato in sessionStorage
  const [allFATDates, setAllFATDates] = useState([]);                // Elenco delle commesse con FAT
  const daysRefs = useRef([]);                                       // Ref per ogni giorno della dashboard (per lo scroll)
  const today = formatDateOnly(new Date());                  // Data di oggi in formato locale
  const [noteUpdates, setNoteUpdates] = useState({});                // Stato per gestire aggiornamenti temporanei delle note
  const calendarRef = useRef();
  const [schedeAperte, setSchedeAperte] = useState({});
  const [popupScheda, setPopupScheda] = useState(null);
  const [schedaInModifica, setSchedaInModifica] = useState(null);
const [hasScrolledToToday, setHasScrolledToToday] = useState(false);


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
const meseCorrente = daysInMonth.length > 0
  ? daysInMonth[0].toLocaleDateString("it-IT", { month: "long", year: "numeric" }).replace(/^./, c => c.toUpperCase())
  : "";
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
    return monthlyActivities.filter((activity) => {
      if (activity.risorsa_id !== activity.risorsa_id) return false; // placeholder risorsa check
      return getActivityDates(activity)
        .map((d) => formatDateOnly(d))
        .includes(isoDay);
    });
  };

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
        setMonthlyActivities(activities);
      } catch (error) {
        console.error("Errore durante il recupero delle attività mensili:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [currentMonth, token]);

  // ------------------------------------------------------------------
  // Effetto: Carica le date FAT (commesse con FAT) dal backend
  // ------------------------------------------------------------------
  useEffect(() => {
    const fetchFATData = async () => {
      try {
        const fatDates = await fetchFATDates(token);
        setAllFATDates(fatDates);
      } catch (error) {
        console.error("Errore durante il recupero delle commesse con FAT:", error);
      }
    };
    fetchFATData();
  }, [token]);

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
  // Navigazione tra i mesi
  // ------------------------------------------------------------------
  const goToPreviousMonth = () => {
    setCurrentMonth((prev) =>
      new Date(prev.getFullYear(), prev.getMonth() - 1, 1)
    );
  };

  const goToNextMonth = () => {
    setCurrentMonth((prev) =>
      new Date(prev.getFullYear(), prev.getMonth() + 1, 1)
    );
  };

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
      // Aggiorna localmente lo stato dell'attività
      setMonthlyActivities((prev) =>
        prev.map((activity) =>
          activity.id === activityId ? { ...activity, stato: newStatus } : activity
        )
      );
    } catch (error) {
      console.error("Errore durante l'aggiornamento dello stato dell'attività:", error);
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
      // Trova l'attività da aggiornare
      const updatedActivity = monthlyActivities.find(
        (activity) => activity.id === activityId
      );
      // Imposta la nota aggiornata (anche se vuota)
      updatedActivity.note = noteUpdates[activityId] || "";
      // Invia la richiesta al backend per aggiornare la nota
      await updateActivityNotes(activityId, updatedActivity.note, token);
      toast.success("Nota aggiornata con successo!");
      // Aggiorna lo stato locale
      setMonthlyActivities((prev) =>
        prev.map((activity) =>
          activity.id === activityId ? { ...activity, note: updatedActivity.note } : activity
        )
      );
    } catch (error) {
      console.error("Errore durante il salvataggio della nota:", error);
      toast.error("Errore durante il salvataggio della nota.");
    }
  };

  const deleteNote = async (activityId) => {
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
      setNoteUpdates((prev) => ({ ...prev, [activityId]: "" }));
    } catch (error) {
      console.error("Errore durante l'eliminazione della nota:", error);
      toast.error("Errore durante l'eliminazione della nota.");
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


  // ------------------------------------------------------------------
  // Rendering del componente Dashboard
  // ------------------------------------------------------------------
  return (
    <div>

      <div className="container">
         <div className="flex-column-center">
        {/* Intestazione */}
        <h1>BACHECA PERSONALE</h1>
         <h1> {userName}</h1>
         </div>
        <ToastContainer position="top-left" autoClose={2000} hideProgressBar />
        {/* Navigazione tra i mesi */}
        <div className="flex-center header-row">
          <button onClick={goToPreviousMonth} className="btn w-50 h-30 btn--shiny btn--pill">
            <FontAwesomeIcon icon={faChevronLeft} />
          </button>
         <div className="header-row-month"> {meseCorrente}</div>
          <button onClick={goToNextMonth} className="btn w-50 h-30 btn--shiny btn--pill">
            <FontAwesomeIcon icon={faChevronRight} />
          </button>
        </div>

        {/* Overlay di caricamento */}
        {loading && (
          <div className="loading-overlay">
            <img src={logo} alt="Logo" className="logo-spinner" />
          </div>
        )}
      
        {/* Calendario: per ogni giorno del mese viene renderizzata una "cella" */}
        <div className="user-calendar" ref={calendarRef}>
          {daysInMonth.map((day, index) => {
            // Determina se il giorno è weekend e/o oggi
            const isWeekend = day.getDay() === 0 || day.getDay() === 6;
            const isToday = formatDateOnly(day) === today;
            return (
              <div
                key={index}
                className={`calendar-day ${isToday ? "user-calendar-today" : ""} ${
                  isWeekend ? "user-calendar-weekend" : ""
                }`}
                ref={(el) => (daysRefs.current[index] = el)}
              >
                <div className="day-header">
                  <strong>{day.toLocaleDateString("it-IT", { weekday: "long", day: "2-digit", month: "2-digit", year: "numeric" })}</strong>

                </div>

                {/* Sezione attività: per il giorno corrente vengono mostrate le attività associate */}

                  {getActivitiesForDay(day).length > 0 ? (
                    getActivitiesForDay(day).map((activity) => {
                      // Imposta una classe in base allo stato dell'attività
                      const activityClass =
                        activity.stato === 0
                          ? "activity not-started"
                          : activity.stato === 1
                          ? "activity started"
                          : "activity completed";
                      // Controlla se l'attività riguarda una trasferta (logica specifica)
                      const isTrasferta = activity.nome_attivita
                        ?.toLowerCase()
                        .includes("trasferta");

                      return (
                        <div key={activity.id} className={`activity ${activityClass}`}>
                          <div className="flex-column-center">
                            {/* Se l'attività è completata e contiene una nota, mostra un'icona di warning */}
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
                            <strong>Commessa: {activity.numero_commessa} </strong>
                            <strong>Attività: {activity.nome_attivita}</strong>
                            <strong>Descrizione: </strong> {activity.descrizione}
                            {isTrasferta && (
                              <span className="trasferta-icon" title="Trasferta">
                                🚗
                              </span>
                            )}
                          </div>

                          {/* Azioni relative all'attività: in base allo stato vengono mostrate le azioni appropriate */}
                          <div className="flex-column-center">
                            {activity.stato === 1 && (
                              <>
                                <span className="dashboasrd-user-activity-status">Attività iniziata</span>
                                <button
                                  className="btn w-100 btn--complete btn--pill"
                                  onClick={() => updateActivityStatus(activity.id, 2)}
                                >
                                  Completa
                                </button>
                              </>
                            )}
                            {activity.stato === 2 && (
                              <span className="dashboasrd-user-activity-status">Attività completata</span>
                            )}
                            {activity.stato === 0 && (
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
                              </>
                            )}
                          </div>

                          {/* Sezione note: textarea per aggiungere/modificare una nota e pulsanti per salvare o eliminare */}
                          <div className="flex-column-center">
                            <textarea
                              placeholder="Aggiungi una nota..."
                              className="textarea w-200"
                              value={
                                noteUpdates[activity.id] !== undefined
                                  ? noteUpdates[activity.id]
                                  : activity.note || ""
                              }
                              onChange={(e) => handleNoteChange(activity.id, e.target.value)}
                            />
                            <div className="flex-column-center">
                              <button className="btn w-100 btn--blue btn--pill" onClick={() => saveNote(activity.id)}>
                                Salva Nota
                              </button>
                              {activity.note && (
                                <button className="btn w-200 btn--danger btn--pill " onClick={() => deleteNote(activity.id)}>
                                  Elimina Nota
                                </button>
                              )}
                            </div>
                          </div>
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
                      );
                    })
                  ) : (
                    <div></div>
                  )}

                {/* Sezione FAT: visualizza le commesse con FAT se la data FAT corrisponde al giorno */}
                <div className="fat-dates">
                  {allFATDates
                    .filter((commessa) => {
                      const fatDate = new Date(commessa.data_FAT).toLocaleDateString();
                      return fatDate === day.toLocaleDateString();
                    })
                    .map((commessa) => (
                      <div key={commessa.commessa_id} className="fat">
                        <strong>FAT commessa:</strong> {commessa.numero_commessa}
                      </div>
                    ))}
                </div>
              </div>
            );
          })}
        </div>
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
    
  );
}

export default Dashboard;
