import React, { useEffect, useRef, useState } from "react";
import { fetchDashboardActivities, fetchFATDates, fetchUserName, updateActivityStatusAPI } from "../services/api";
import "./Dashboard.css";
import logo from "../assets/unitech-packaging.png";

function Dashboard() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [monthlyActivities, setMonthlyActivities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [userName, setUserName] = useState("Utente");
  const token = sessionStorage.getItem("token");
  const [allFATDates, setAllFATDates] = useState([]);
  const daysRefs = useRef([]); 
  const today = new Date().toLocaleDateString();

  const getDaysInMonth = (date) => {
    const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    const days = [];
    for (let i = 1; i <= endOfMonth.getDate(); i++) {
      days.push(new Date(date.getFullYear(), date.getMonth(), i));
    }
    return days;
  };

  const daysInMonth = getDaysInMonth(currentMonth);

  useEffect(() => {
    // Scorri automaticamente fino al giorno di oggi
    const todayIndex = daysInMonth.findIndex(
      (day) => day.toLocaleDateString() === today
    );
    if (todayIndex !== -1 && daysRefs.current[todayIndex]) {
      daysRefs.current[todayIndex].scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [daysInMonth, today]);

  useEffect(() => {
    const monthStartDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
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

  const goToPreviousMonth = () => {
    setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const getActivitiesForDay = (day) => {
    const startOfDay = new Date(day.getFullYear(), day.getMonth(), day.getDate());
    return monthlyActivities.filter((activity) => {
      const startDate = new Date(activity.data_inizio);
      startDate.setDate(startDate.getDate() - 1);
      const endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + activity.durata);
      return startOfDay >= startDate && startOfDay <= endDate;
    });
  };

  const [loadingActivities, setLoadingActivities] = useState({});

  const updateActivityStatus = async (activityId, newStatus) => {
    setLoadingActivities((prev) => ({ ...prev, [activityId]: true }));
    try {
      await updateActivityStatusAPI(activityId, newStatus, token);

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

  return (
    <div>
      <div className="container">
      <h1>Benvenuto, {userName}</h1>
     
        <div className="calendar-navigation">
        <button onClick={goToPreviousMonth} className="btn-nav">← Mese Precedente</button>
        <button onClick={goToNextMonth} className="btn-nav">Mese Successivo →</button>
        </div>
        {loading && (
          <div className="loading-overlay">
            <img src={logo} alt="Logo" className="logo-spinner" />
          </div>
        )}
        <div className="calendar">
          {daysInMonth.map((day, index) => {
            const isWeekend = day.getDay() === 0 || day.getDay() === 6; // Domenica = 0, Sabato = 6
            const isToday = day.toLocaleDateString() === today;
            return (
              <div
                key={index}
                className={`calendar-day ${isToday ? "today2" : ""} ${
                  isWeekend ? "weekend2" : ""
                }`}
                ref={(el) => (daysRefs.current[index] = el)} // Aggiungi il ref
              >
                <div className="day-header">
                  <strong>{day.toLocaleDateString()}</strong>
                </div>

                <div className="activities">
                  {getActivitiesForDay(day).length > 0 ? (
                    getActivitiesForDay(day).map((activity) => {
                      const activityClass =
                        activity.stato === 0
                          ? "activity-not-started"
                          : activity.stato === 1
                          ? "activity-started"
                          : "activity-completed";
                      const isTrasferta = activity.nome_attivita?.toLowerCase().includes("trasferta");

                      return (
                        <div key={activity.id} className={`activity ${activityClass}`}>
                          <div className="activity-content">
                            <strong>Commessa: {activity.numero_commessa} | </strong>
                            <strong>Attività: {activity.nome_attivita}</strong>
                            <strong>Note: {activity.descrizione}</strong>
                            {isTrasferta && (
                              <span className="trasferta-icon" title="Trasferta">
                                🚗
                              </span>
                            )}
                          </div>
                          <div className="activity-actions">
                            {activity.stato === 1 && (
                              <>
                                <span className="status-label">Attività iniziata</span>
                                <button
                                  className="btn btn-complete"
                                  onClick={() => updateActivityStatus(activity.id, 2)}
                                >
                                  Completa
                                </button>
                              </>
                            )}
                            {activity.stato === 2 && (
                              <span className="status-label">Attività completata</span>
                            )}
                            {activity.stato === 0 && (
                              <>
                                <button
                                  className="btn btn-start"
                                  onClick={() => updateActivityStatus(activity.id, 1)}
                                  disabled={loadingActivities[activity.id]}
                                >
                                  {loadingActivities[activity.id]
                                    ? "Caricamento..."
                                    : "Inizia"}
                                </button>
                                <button
                                  className="btn btn-complete"
                                  onClick={() => updateActivityStatus(activity.id, 2)}
                                  disabled={loadingActivities[activity.id]}
                                >
                                  {loadingActivities[activity.id]
                                    ? "Caricamento..."
                                    : "Completa"}
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div></div>
                  )}
                </div>
                {/* Mostra le commesse con FAT per il giorno */}
                <div className="fat-dates">
                  {allFATDates
                    .filter((commessa) => {
                      const fatDate = new Date(commessa.data_FAT).toLocaleDateString();
                      return fatDate === day.toLocaleDateString();
                    })
                    .map((commessa) => (
                      <div key={commessa.commessa_id} className="fat">
                        <strong>FAT commessa:</strong> {commessa.numero_commessa}{" "}
                      </div>
                    ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;