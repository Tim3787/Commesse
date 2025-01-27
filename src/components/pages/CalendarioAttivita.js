import React, { useEffect, useState, useRef } from "react";
import { fetchAttivitaCommessa, fetchRisorse } from "../services/api"; 
import "./CalendarioAttivita.css";
import logo from "../assets/unitech-packaging.png";

function CalendarioAttivita() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [activities, setActivities] = useState([]);
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(false);
const todayRef = useRef(null);  //OGGI
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

  // Scorri automaticamente alla colonna di oggi //OGGI
// Scorri automaticamente alla colonna di oggi
useEffect(() => {
  if (todayRef.current) {
    // Cerca il contenitore scrollabile più vicino
    const parentContainer = document.querySelector(".Gen-table-container");

    if (parentContainer) {
      const todayPosition = todayRef.current.offsetLeft; // Posizione della colonna "oggi"
      const parentWidth = parentContainer.clientWidth; // Larghezza visibile del contenitore
      const columnWidth = todayRef.current.offsetWidth; // Larghezza della colonna

      // Calcola la posizione di scroll per centrare la colonna
      const scrollPosition = todayPosition - parentWidth / 2 + columnWidth / 2;

      // Effettua lo scroll orizzontale
      parentContainer.scrollTo({
        left: scrollPosition,
        behavior: "smooth", // Scroll fluido
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

  const renderRepartoSection = (repartoId, repartoName) => {
    const repartoResources = resources.filter(
      (resource) => Number(resource.reparto_id) === repartoId
    );

    return (
      <>
        <thead>
          <tr>
            <th colSpan={daysInMonth.length + 1}>{repartoName}</th>
          </tr>
          <tr>
            <th>Risorsa</th>
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
                ref={isToday ? todayRef : null} // Assegna il riferimento al giorno di oggi
              >
                  <span className={dateClass}>{day.toLocaleDateString()}</span>
                </th>
              );
            })}
          </tr>
        </thead>
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
      </>
    );
  };

  function ResourceCell({ activities, dayClass }) {
    return (
      <td className={dayClass}>
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
        <h1>Bacheca Attività</h1>
        {loading && (
          <div className="loading-overlay">
            <img src={logo} alt="Logo" className="logo-spinner" />
          </div>
        )}

        <div className="calendar-navigation">
          <button onClick={goToPreviousMonth} className="btn-Nav">
            ← Mese Precedente
          </button>
          <button onClick={goToNextMonth} className="btn-Nav">
            Mese Successivo →
          </button>
        </div>

        <div className="Gen-table-container">
          <table className="Gen-schedule">
            {renderRepartoSection(1, "Reparto Software")}
            {renderRepartoSection(2, "Reparto Elettrico")}
            {renderRepartoSection(15, "Reparto Quadri")}
          </table>
        </div>
      </div>
    </div>
  );
}

export default CalendarioAttivita;