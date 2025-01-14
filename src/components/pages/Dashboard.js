import React, { useEffect, useState } from "react";
import axios from "axios";
import "./Dashboard.css";

function Dashboard() {
  const [attivita, setAttivita] = useState([]);
  const [currentMonth, setCurrentMonth] = useState(new Date()); // Data corrente
  const [monthlyActivities, setMonthlyActivities] = useState([]);

  // Funzione per calcolare tutti i giorni del mese corrente
  const getDaysInMonth = (date) => {
    const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
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
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/users/dashboard`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        params: { startDate: monthStartDate.toISOString() }, // Passa il primo giorno del mese
      });
      setMonthlyActivities(response.data);
    } catch (error) {
      console.error("Errore durante il recupero delle attività mensili:", error);
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
    fetchActivities(monthStartDate); // Carica attività mensili
  }, [currentMonth]);

  // Funzione per passare al mese precedente
  const goToPreviousMonth = () => {
    const newDate = new Date(currentMonth);
    newDate.setMonth(currentMonth.getMonth() - 1); // Cambia mese
    setCurrentMonth(newDate);
  };

  // Funzione per passare al mese successivo
  const goToNextMonth = () => {
    const newDate = new Date(currentMonth);
    newDate.setMonth(currentMonth.getMonth() + 1); // Cambia mese
    setCurrentMonth(newDate);
  };

  const daysInMonth = getDaysInMonth(currentMonth);
  const today = new Date().toLocaleDateString();

  return (
    <div>
      <h1>Bacheca Personale</h1>
      <div className="container">
      <div className="calendar-navigation">
        <button onClick={goToPreviousMonth}>← Mese Precedente</button>
        <button onClick={goToNextMonth}>Mese Successivo →</button>
      </div>

      <h2>Attività Assegnate</h2>
      
      <div className="calendar">
        {daysInMonth.map((day, index) => (
          <div key={index} className={`calendar-day ${day.toLocaleDateString() === today ? "today" : ""}`}>
            <div className="day-header">
              <strong>{day.toLocaleDateString()}</strong> {/* Mostra la data */}
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
