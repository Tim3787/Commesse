import React, { useEffect, useRef, useState } from "react";
import "../style/05-CalendarioAttivita.css";
import logo from "../img/Animation - 1738249246846.gif";
import { getDaysInMonth } from "../assets/date";

// Import icone FontAwesome
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronLeft, faChevronRight } from "@fortawesome/free-solid-svg-icons";

// Import API per le varie entità
import { fetchRisorse } from "../services/API/risorse-api";
import { fetchAttivitaCommessa } from "../services/API/attivitaCommesse-api";

// Import per Toastify (notifiche)
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

/**
 * Componente CalendarioAttivita
 * Visualizza un calendario mensile in cui vengono mostrate le attività 
 * per ciascuna risorsa, organizzate per reparti.
 */
function CalendarioAttivita() {
  // ------------------------------------------------------------------
  // Stati e Ref
  // ------------------------------------------------------------------
  const [currentMonth, setCurrentMonth] = useState(new Date()); // Mese attualmente visualizzato
  const [activities, setActivities] = useState([]);               // Elenco delle attività (prenotazioni) caricate
  const [resources, setResources] = useState([]);                 // Elenco delle risorse (utenti)
  const [loading, setLoading] = useState(false);                  // Stato di caricamento generale
  const [repartoSelezionato, setRepartoSelezionato] = useState(1); 
  const containerRef = useRef(null);
const [visibleSections, setVisibleSections] = useState({
  1: true,
  2: false,
  3: false,
  13: false,
  14: false,
  15: false,
  16: false,
  18: false,
});


  // Stato per controllare la visibilità delle sezioni per ogni reparto  
const repartiDisponibili = [
  { id: 1, nome: "Reparto Software" },
  { id: 2, nome: "Reparto Elettrico" },
  { id: 3, nome: "Reparto Meccanico" },
  { id: 13, nome: "Reparto Commerciale" },
  { id: 14, nome: "Reparto Tecnico elettrico" },
  { id: 15, nome: "Reparto Quadri" },
  { id: 16, nome: "Reparto Tecnico meccanico" },
  { id: 18, nome: "Reparto Service" },
];
  // Ref per la colonna corrispondente al giorno di oggi (per scroll automatico)
  const todayRef = useRef(null);
  // Calcola tutti i giorni del mese corrente utilizzando la funzione helper getDaysInMonth
  const daysInMonth = getDaysInMonth(currentMonth);
const meseCorrente = currentMonth.toLocaleDateString("it-IT", {
  month: "long",
  year: "numeric",
}).replace(/^./, c => c.toUpperCase());

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
 const formatDateOnly = dateObj => {
    const y = dateObj.getFullYear();
    const m = String(dateObj.getMonth() + 1).padStart(2, '0');
    const d = String(dateObj.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const normalizeDate = date => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
  };

  const getActivityDates = activity => {
    const dates = [];
    const start = normalizeDate(new Date(activity.data_inizio));
    const total = Number(activity.durata) || 0;
    let cursor = new Date(start);
    while (dates.length < total) {
      const wd = cursor.getDay();
      const clone = new Date(cursor.getTime());
      if (wd >= 1 && wd <= 5) {
        dates.push(clone);
      } else {
        const iso = formatDateOnly(cursor);
        if (activity.includedWeekends?.includes(iso)) {
          dates.push(clone);
        }
      }
      cursor.setDate(cursor.getDate() + 1);
    }
    return dates;
  };

  const getActivitiesForResourceAndDay = (resourceId, day) => {
    const isoDay = formatDateOnly(normalizeDate(day));
    return activities.filter((activity) => {
      if (Number(activity.risorsa_id) !== Number(resourceId)) return false;
      const dates = getActivityDates(activity).map((d) => formatDateOnly(d));
      return dates.includes(isoDay);
    });
  };

  // ------------------------------------------------------------------
  // Effetto: Fetch iniziale dei dati (attività e risorse)
  // ------------------------------------------------------------------
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Esegue in parallelo il fetch delle attività e delle risorse
        const [activitiesData, resourcesData] = await Promise.all([
          fetchAttivitaCommessa(),
          fetchRisorse(),
        ]);
        setActivities(activitiesData);
        setResources(resourcesData);
      } catch (error) {
        console.error("Errore durante il recupero dei dati:", error);
        toast.error("Errore durante il recupero dei dati:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [currentMonth]);


  // ------------------------------------------------------------------
  // Funzioni di Navigazione tra Mesi
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
    // Effetto: Scrolla automaticamente al giorno corrente se non già fatto
    // ------------------------------------------------------------------
  // Scrolla alla colonna corrispondente ad oggi
  const scrollToToday = () => {
    const today = new Date();
    const sameMonth = currentMonth.getMonth() === today.getMonth() && currentMonth.getFullYear() === today.getFullYear();
    const doScroll = () => {
      if (todayRef.current && containerRef.current) {
        const containerRect = containerRef.current.getBoundingClientRect();
        const todayRect = todayRef.current.getBoundingClientRect();
        const offsetLeft = todayRect.left - containerRect.left;
        containerRef.current.scrollTo({
          left: offsetLeft - containerRef.current.clientWidth / 2 + todayRect.width / 2,
          behavior: "smooth",
        });
      }
    };
   if (!sameMonth) {
  setCurrentMonth(today);
  setTimeout(() => {
    requestAnimationFrame(doScroll);
  }, 300); // più tempo per il rendering
} else {
  requestAnimationFrame(doScroll);
}
  };

  
const handleRepartoChange = (id) => {
  setRepartoSelezionato(id);
  setVisibleSections({
    ...Object.keys(visibleSections).reduce((acc, key) => {
      acc[key] = false;
      return acc;
    }, {}),
    [id]: true, // attiva solo il selezionato
  });
};

  /**
   * Renderizza la sezione di un reparto.
   * Mostra un'intestazione con un pulsante per espandere/contrarre e, se visibile,
   * una tabella con le attività per ogni risorsa del reparto.
   */
  const renderRepartoSection = (repartoId) => {
    const isVisible = visibleSections[repartoId];
    const repartoResources = resources.filter(
      (resource) => Number(resource.reparto_id) === repartoId
    );
    return (
      <React.Fragment key={repartoId}>
          <div
    className="Reparto-table-container mh-72"
    ref={containerRef}
    style={{ overflowX: "auto", whiteSpace: "nowrap" }}
  >
            <table > 
      <thead>
        <tr>
          <th>Risorsa</th>
          {daysInMonth.map((day, index) => {
            const isWeekend = day.getDay() === 0 || day.getDay() === 6;
            const isToday = day.toDateString() === new Date().toDateString();
            const weekNumber = getWeekNumber(day);
            const showWeekNumber =
              index === 0 || getWeekNumber(daysInMonth[index - 1]) !== weekNumber;

            return (
              <th
                key={day.toISOString()}
                className={`${isToday ? "today" : ""} ${isWeekend ? "weekend" : ""}`}
                ref={isToday ? todayRef : null}
              >
                <div>{day.toLocaleDateString()}</div>
                {showWeekNumber && (
                  <div className="week-number">Settimana {weekNumber}</div>
                )}
              </th>
            );
          })}
        </tr>
      </thead>

        {isVisible && (
          <tbody>
            {repartoResources.map((resource) => (
              <tr key={resource.id}>
                <td>{resource.nome}</td>
                {daysInMonth.map((day, index) => {
                  const activitiesForDay = getActivitiesForResourceAndDay(
                    resource.id,
                    day
                  );
                  return (
                    <ResourceCell
                      key={`${resource.id}-${index}`}
                      activities={activitiesForDay}
                    />
                  );
                })}
              </tr>
            ))}
          </tbody>
          
        )}
                </table>
        </div>
      </React.Fragment>
    );
  };

  // ------------------------------------------------------------------
  // Componente Interno: ResourceCell
  // Renderizza una cella della tabella per una risorsa, mostrando le attività del giorno
  // ------------------------------------------------------------------
  function ResourceCell({ activities }) {
    return (
      <td>
        {activities.map((activity) => {
          const activityClass =
            activity.stato === 0
              ? "activity not-started"
              : activity.stato === 1
              ? "activity started"
              : "activity completed";
          // Verifica se l'attività riguarda una trasferta (es. "trasferta" incluso nel nome)
          const isTrasferta = activity.nome_attivita
            ?.toLowerCase()
            .includes("trasferta");
          return (
            <div key={activity.id} className={`activity ${activityClass}`}
            style={{minWidth:"150px",minHeight:"70px", fontSize:"14px"}}
            >
              <strong>Commessa:</strong> {activity.numero_commessa}
              <br />
              <strong>Attività:</strong> {activity.nome_attivita}
              {isTrasferta && (
                <span className="trasferta-icon" title="Trasferta">
                  🚗
                </span>
              )}
              <br />
              <strong>Stato:</strong>{" "}
              {activity.stato === 0
                ? "Non iniziata"
                : activity.stato === 1
                ? "Iniziata"
                : "Completata"}
            </div>
          );
        })}
      </td>
    );
  }

  // ------------------------------------------------------------------
  // Rendering Principale
  // ------------------------------------------------------------------
  return (
   <div className="page-wrapper">
      <div className=" header">
        <h1>CALENDARIO ATTIVITÀ </h1>
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
        <ToastContainer position="top-left" autoClose={2000} hideProgressBar />
        {loading && (
          <div className="loading-overlay">
            <img src={logo} alt="Logo" className="logo-spinner" />
          </div>
        )}
      </div>
      
        {/* Tabella con il calendario e le sezioni per ciascun reparto */}
<div className="container">
  {/* 🔽 Selezione reparto fuori dalla tabella */}
  <div
  style={{marginLeft:"10px"}}
  >
    <select
      id="reparto-select"
      value={repartoSelezionato}
      onChange={(e) => handleRepartoChange(Number(e.target.value))}
      className="w-200"
    >
      {repartiDisponibili.map((rep) => (
        <option key={rep.id} value={rep.id}>
          {rep.nome}
        </option>
      ))}
    </select>
  </div>

{Object.entries(visibleSections).map(([id, visible]) =>
  visible
    ? renderRepartoSection(
        Number(id),
        repartiDisponibili.find((r) => r.id === Number(id))?.nome || ""
      )
    : null
)}
        </div>
      </div>
  );
}

export default CalendarioAttivita;
