import React, { useEffect, useState } from "react";
import axios from "axios";
import "./Dashboard.css";

function Dashboard() {
  const [currentMonth, setCurrentMonth] = useState(new Date()); 
  const [monthlyActivities, setMonthlyActivities] = useState([]);
  const [loading, setLoading] = useState(false);

  // Funzione per calcolare tutti i giorni del mese corrente
  const getDaysInMonth = (date) => {
    const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    
    const days = [];
    for (let i = 1; i <= endOfMonth.getDate(); i++) {
      days.push(new Date(date.getFullYear(), date.getMonth(), i));
    }
    
    return days;
  };

  // Funzione per caricare le attività mensili
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
    }finally {
      setLoading(false);
    }
  };

  // Funzione per ottenere le attività di un determinato giorno
  const getActivitiesForDay = (day) => {
    return monthlyActivities.filter((activity) => 
      new Date(activity.data_inizio).toLocaleDateString() === day.toLocaleDateString());
  };

  // Effetto per caricare le attività quando la data cambia
  useEffect(() => {
    const monthStartDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    fetchActivities(monthStartDate); 
  }, [currentMonth]);

  // Funzione per passare al mese precedente
  const goToPreviousMonth = () => {
    const newDate = new Date(currentMonth);
    newDate.setMonth(currentMonth.getMonth() - 1); 
    setCurrentMonth(newDate);
  };

  // Funzione per passare al mese successivo
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
        <button onClick={goToPreviousMonth}>← Mese Precedente</button>
        <button onClick={goToNextMonth}>Mese Successivo →</button>
      </div>

      <h2>Attività Assegnate</h2>
      
      <div className="calendar">
        {daysInMonth.map((day, index) => (
          <div key={index} className={`calendar-day ${day.toLocaleDateString() === today ? "today" : ""}`}>
            <div className="day-header">
              <strong>{day.toLocaleDateString()}</strong> 
            </div>
            <div className="activities">
              {getActivitiesForDay(day).length > 0 ? (
                getActivitiesForDay(day).map((activity) => (
                  <div key={activity.id} className="activity">
                    <strong>Commessa:</strong> {activity.numero_commessa} | 
                    <strong>    Attività:</strong> {activity.nome_attivita}
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
