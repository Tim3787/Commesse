import React, { useEffect, useState, useRef } from "react";
import { fetchAttivitaCommessa, fetchRisorse } from "../services/api"; 
import "./CalendarioAttivita.css";
import logo from "../assets/unitech-packaging.png";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronLeft, faChevronRight } from "@fortawesome/free-solid-svg-icons";



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

  // Calcola i giorni del mese
  const getDaysInMonth = () => {
    const days = [];
    const start = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const end = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);

    for (let d = start; d <= end; d.setDate(d.getDate() + 1)) {
      days.push(new Date(d));
    }

    return days;
  };

  const daysInMonth = getDaysInMonth();

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
    const normalized = new Date(date);
    normalized.setHours(0, 0, 0, 0);
    return normalized;
  };

  const getActivitiesForResourceAndDay = (resourceId, day) => {
    const normalizedDay = normalizeDate(day);

    return activities.filter((activity) => {
      const startDate = normalizeDate(activity.data_inizio);
      const endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + activity.durata - 1);

      return (
        Number(activity.risorsa_id) === Number(resourceId) &&
        normalizedDay >= startDate &&
        normalizedDay <= endDate
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
