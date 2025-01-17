import React, { useEffect, useState } from "react";
import axios from "axios";
import "./Dashboard.css";

function Dashboard() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [monthlyActivities, setMonthlyActivities] = useState([]);
  const [loading, setLoading] = useState(false);


  const getDaysInMonth = (date) => {
    const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    const days = [];
    for (let i = 1; i <= endOfMonth.getDate(); i++) {
      days.push(new Date(date.getFullYear(), date.getMonth(), i));
    }
    return days;
  };

  const fetchActivities = async (monthStartDate) => {
    try {
      setLoading(true);
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/users/dashboard`, {
        headers: { Authorization: `Bearer ${sessionStorage.getItem("token")}` },
        params: { startDate: monthStartDate.toISOString() },
      });
      setMonthlyActivities(response.data);
    } catch (error) {
      console.error("Errore durante il recupero delle attività mensili:", error);
     
      
    } finally {
      setLoading(false);
      
    }
  };



  const updateActivityStatus = async (activityId, newStatus) => {
    try {
      const response = await axios.put(
        `${process.env.REACT_APP_API_URL}/api/attivita_commessa/${activityId}`,
        { stato: newStatus },
        {
          headers: { Authorization: `Bearer ${sessionStorage.getItem("token")}` },
        }
      );
  
      if (response.status === 200) {
        setMonthlyActivities((prevActivities) =>
          prevActivities.map((activity) =>
            activity.id === activityId ? { ...activity, stato: newStatus } : activity
          )
        );
      } else {
        console.error("Errore nella risposta:", response.data);
      }
    } catch (error) {
      console.error("Errore durante l'aggiornamento dello stato dell'attività:", error);
    }
  };
  

  const getActivitiesForDay = (day) => {
    return monthlyActivities.filter((activity) => {
      const startDate = new Date(activity.data_inizio);
      const endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + (activity.durata - 1)); // Calcola l'ultimo giorno dell'attività
  
      return day >= startDate && day <= endDate; // Verifica se il giorno è nell'intervallo
    });
  };
  

  useEffect(() => {
    const monthStartDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    fetchActivities(monthStartDate);
  }, [currentMonth]);

  const goToPreviousMonth = () => {
    const newDate = new Date(currentMonth);
    newDate.setMonth(currentMonth.getMonth() - 1);
    setCurrentMonth(newDate);
  };

  const goToNextMonth = () => {
    const newDate = new Date(currentMonth);
    newDate.setMonth(currentMonth.getMonth() + 1);
    setCurrentMonth(newDate);
  };

  const daysInMonth = getDaysInMonth(currentMonth);
  const today = new Date().toLocaleDateString();

  return (
    <div>
      <h1>Bacheca Personale</h1>
      <div className="container">
        {loading && (
          <div className="loading-overlay">
            <div className="spinner"></div>
          </div>
        )}
        <div className="calendar-navigation">
          <button onClick={goToPreviousMonth}className="btn-Nav"> ← Mese Precedente</button>
          <button onClick={goToNextMonth}className="btn-Nav"> Mese Successivo →</button>
        </div>

        <h2>Attività Assegnate</h2>

        <div className="calendar">
  {daysInMonth.map((day, index) => (
    <div
      key={index}
      className={`calendar-day ${day.toLocaleDateString() === today ? "today" : ""}`}
    >
      <div className="day-header">
        <strong>{day.toLocaleDateString()}</strong>
      </div>
      <div className="activities">
        {getActivitiesForDay(day).length > 0 ? (
          getActivitiesForDay(day).map((activity) => (
            <div key={activity.id} className="activity">
              <strong>Commessa:</strong> {activity.numero_commessa} |{" "}
              <strong>Attività:</strong> {activity.nome_attivita}
              <div className="activity-actions">
                {activity.stato === 1 && (
                  <>
                    <span className="status-label">Iniziata</span>
                    <button
                      className="btn btn-complete"
                      onClick={() => updateActivityStatus(activity.id, 2)}
                    >
                      Completa
                    </button>
                  </>
                )}
                {activity.stato === 2 && <span className="status-label">Completata</span>}
                {activity.stato === 0 && (
                  <>
                    <button
                      className="btn btn-start"
                      onClick={() => updateActivityStatus(activity.id, 1)}
                    >
                      Inizia
                    </button>
                    <button
                      className="btn btn-complete"
                      onClick={() => updateActivityStatus(activity.id, 2)}
                    >
                      Completa
                    </button>
                  </>
                )}
              </div>
            </div>
          ))
        ) : (
          <div>No activities</div>
        )}
      </div>
    </div>
  ))}
</div>

      </div>
    </div>
  );
}

export default Dashboard;
