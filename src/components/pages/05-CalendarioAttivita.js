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
  // Stato per controllare la visibilità delle sezioni per ogni reparto  
  const [visibleSections, setVisibleSections] = useState({
    1: false,  // Reparto Software
    2: false,  // Reparto Elettrico
    3: false,  // Reparto Meccanico
    13: false, // Reparto Commerciale
    14: false, // Reparto Tecnico elettrico
    15: false, // Reparto Quadri
    16: false, // Reparto Tecncio meccanico
    18: false, // Reparto Service
  });
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
  // Effetto: Scrolla automaticamente alla colonna corrispondente ad oggi
  // ------------------------------------------------------------------
  useEffect(() => {
    if (todayRef.current) {
      // Seleziona il contenitore della tabella
      const parentContainer = document.querySelector(".Gen-table-container");
      if (parentContainer) {
        // Calcola la posizione della colonna oggi
        const todayPosition = todayRef.current.offsetLeft;
        const parentWidth = parentContainer.clientWidth;
        const columnWidth = todayRef.current.offsetWidth;
        const scrollPosition = todayPosition - parentWidth / 2 + columnWidth / 2;
        parentContainer.scrollTo({
          left: scrollPosition,
          behavior: "smooth",
        });
      }
    }
  }, [daysInMonth]);

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
  // Funzioni Helper per Gestire le Date e le Attività
  // ------------------------------------------------------------------
  /**

   * Restituisce le attività per una data specifica e per una determinata risorsa.
   * Confronta la data normalizzata dell'attività (inizio e fine) con il giorno corrente.
   */
  /**
 * Filtra le attività per una determinata risorsa e per un giorno specifico,
 * spostando indietro l'intervallo di un giorno.
 *
 * In altre parole, viene sottratto un giorno (86400000 ms) sia al giorno da confrontare
 * che alla data di inizio dell'attività, per correggere eventuali problemi di offset.
 *
 * @param {number} resourceId - L'ID della risorsa da filtrare.
 * @param {Date} day - Il giorno (Date object) per il quale cercare le attività.
 * @returns {Array} Un array di attività che soddisfano i criteri.
 */

  // ------------------------------------------------------------------
  // Gestione della Visibilità delle Sezioni per Reparto
  // ------------------------------------------------------------------
  /**
   * Alterna la visibilità della sezione per un reparto specifico.
   */
  const toggleSectionVisibility = (repartoId) => {
    setVisibleSections((prev) => ({
      ...prev,
      [repartoId]: !prev[repartoId],
    }));
  };

  /**
   * Renderizza la sezione di un reparto.
   * Mostra un'intestazione con un pulsante per espandere/contrarre e, se visibile,
   * una tabella con le attività per ogni risorsa del reparto.
   */
  const renderRepartoSection = (repartoId, repartoName) => {
    const isVisible = visibleSections[repartoId];
    const repartoResources = resources.filter(
      (resource) => Number(resource.reparto_id) === repartoId
    );
    return (
      <React.Fragment key={repartoId}>
        <thead>
          <tr>
            <th colSpan={daysInMonth.length + 1}>
              <button
                className="btn w-200 btn--shiny btn--pill"
                onClick={() => toggleSectionVisibility(repartoId)}
              >
                {isVisible ? "▼" : "▶"} {repartoName}
              </button>
            </th>
          </tr>
          {isVisible && (
            <tr>
              {daysInMonth.map((day, index) => {
                const isWeekend = day.getDay() === 0 || day.getDay() === 6;
                const isToday = day.toDateString() === new Date().toDateString();
                const dateClass = isToday
                  ? "Gen-today-date"
                  : isWeekend
                  ? "Gen-weekend-date"
                  : "";
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
                  <th key={index} ref={isToday ? todayRef : null}>
                    <span className={dateClass}>{day.toLocaleDateString()}</span>
                    
          {showWeekNumber && (
            <div className="week-number">
              Settimana {weekNumber}
            </div>
          )}
                  </th>
                );
              })}
            </tr>
          )}
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
            <div key={activity.id} className={`activity ${activityClass}`}>
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
          <table className="Calendario-table">
            {renderRepartoSection(1, "Reparto Software")}
            {renderRepartoSection(2, "Reparto Elettrico")}
            {renderRepartoSection(15, "Reparto Quadri")}
            {renderRepartoSection(18, "Reparto Service")}
            {renderRepartoSection(3, "Reparto Meccanico")}
            {renderRepartoSection(14, "Reparto Tecnico elettrico")}
            {renderRepartoSection(16, "Reparto Tecncio meccanico")}
          </table>
        </div>
      </div>
  );
}

export default CalendarioAttivita;
