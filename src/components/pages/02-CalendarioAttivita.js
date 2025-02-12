import React, { useEffect, useRef, useState } from "react";
import "./02-CalendarioAttivita.css";
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
   * Normalizza una data impostando le ore a 0 (inizio della giornata)
   */
  const normalizeDate = (date) => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
  };

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
const getActivitiesForResourceAndDay = (resourceId, day) => {
  // Normalizza il giorno passato e sottrae un giorno (86400000 ms)
  const normalizedDay = new Date(normalizeDate(day).getTime());

  return activities.filter((activity) => {
    if (!activity.data_inizio) {
      return false;
    }
    // Normalizza la data di inizio dell'attività e sottrai un giorno per correggere l'offset
    const startDate = new Date(normalizeDate(activity.data_inizio).getTime() - 86400000); //DEBUG
    const endDate = new Date(startDate);
    // Se la durata non è specificata, si assume che l'attività duri 1 giorno.
    endDate.setDate(startDate.getDate() + (activity.durata || 1) - 1);
    
    return (
      Number(activity.risorsa_id) === Number(resourceId) &&
      normalizedDay.getTime() >= startDate.getTime() &&
      normalizedDay.getTime() <= endDate.getTime()
    );
  });
};


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
                className="toggle-button"
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
                return (
                  <th key={index} ref={isToday ? todayRef : null}>
                    <span className={dateClass}>{day.toLocaleDateString()}</span>
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
              ? "activity-not-started"
              : activity.stato === 1
              ? "activity-started"
              : "activity-completed";
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
    <div>
      <div className="container-Scroll">
        <h1>Calendario attività</h1>
        <ToastContainer position="top-left" autoClose={3000} hideProgressBar />
        {loading && (
          <div className="loading-overlay">
            <img src={logo} alt="Logo" className="logo-spinner" />
          </div>
        )}

        {/* Pulsanti di navigazione per il mese */}
        <div className="calendar-navigation">
          <button onClick={goToPreviousMonth} className="btn-Nav">
            <FontAwesomeIcon icon={faChevronLeft} /> Mese Precedente
          </button>
          <button onClick={goToNextMonth} className="btn-Nav">
            Mese Successivo <FontAwesomeIcon icon={faChevronRight} />
          </button>
        </div>

        {/* Tabella con il calendario e le sezioni per ciascun reparto */}
        <div className="Gen-table-container">
          <table className="Gen-schedule">
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
    </div>
  );
}

export default CalendarioAttivita;
