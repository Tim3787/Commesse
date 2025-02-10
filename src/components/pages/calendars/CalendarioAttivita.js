import React, { useEffect, useState, useRef } from "react";
import { fetchRisorse } from "../../services/API/risorse-api"; 
import { fetchAttivitaCommessa } from "../../services/API/attivitaCommesse-api"; 
import "./CalendarioAttivita.css";
import logo from "../../img/Animation - 1738249246846.gif";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronLeft, faChevronRight } from "@fortawesome/free-solid-svg-icons";
import { getDaysInMonth } from "../../assets/date";
import "react-toastify/dist/ReactToastify.css";
import { ToastContainer, toast } from "react-toastify";

function CalendarioAttivita() {
  
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [activities, setActivities] = useState([]);
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(false);
  const [visibleSections, setVisibleSections] = useState({
    1: false, // Reparto Software
    2: false, // Reparto Elettrico
    3: false, // Reparto Meccanico
    13: false, // Reparto Commerciale
    14: false, // Reparto Tecnico elettrico
    15: false, // Reparto Quadri
    16: false, // Reparto Tecncio meccanico
    18: false, // Reparto Service
  });
  const todayRef = useRef(null); // OGGI
const daysInMonth = getDaysInMonth(currentMonth);
  


  // Recupera dati iniziali
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Recupera tutte le attività e risorse
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

  // Scorri automaticamente alla colonna di oggi
  useEffect(() => {
    if (todayRef.current) {
      const parentContainer = document.querySelector(".Gen-table-container");

      if (parentContainer) {
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

  // Funzioni per navigare tra i mesi
  const goToPreviousMonth = () => {
    setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const normalizeDate = (date) => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
  };
  
  const getActivitiesForResourceAndDay = (resourceId, day) => {
    const normalizedDay = normalizeDate(day);
    
    return activities.filter((activity) => {
      if (!activity.data_inizio) {
        return false;
      }
      
      // Calcola la data di inizio normalizzata
      const startDate = normalizeDate(activity.data_inizio);
      
      // Calcola la data di fine, partendo dalla data di inizio
      const endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + (activity.durata || 1) - 1);
      
      // Confronta le date (usando getTime o direttamente, dato che sono normalizzate)
      return (
        Number(activity.risorsa_id) === Number(resourceId) &&
        normalizedDay.getTime() >= startDate.getTime() &&
        normalizedDay.getTime() <= endDate.getTime()
      );
    });
  };
  
  
  

  const toggleSectionVisibility = (repartoId) => {
    setVisibleSections((prev) => ({
      ...prev,
      [repartoId]: !prev[repartoId],
    }));
  };


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
                  <th
                    key={index}
                    ref={isToday ? todayRef : null}
                  >
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
                  
                  const activities = getActivitiesForResourceAndDay(resource.id, day);

                  return (
                    <ResourceCell
                      key={`${resource.id}-${index}`}
                      activities={activities}
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
          const isTrasferta = activity.nome_attivita?.toLowerCase().includes("trasferta");

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
<div className="calendar-navigation">
   <button onClick={goToPreviousMonth} className="btn-Nav">
     <FontAwesomeIcon icon={faChevronLeft} /> Mese Precedente
   </button>
   <button onClick={goToNextMonth} className="btn-Nav">
     Mese Successivo <FontAwesomeIcon icon={faChevronRight} />
   </button>
</div>

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
