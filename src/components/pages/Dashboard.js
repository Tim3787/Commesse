import React, { useEffect, useState } from "react";
import axios from "axios";
import "./Dashboard.css";
import logo from "../assets/unitech-packaging.png";
import { jwtDecode } from "jwt-decode";

function Dashboard() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [monthlyActivities, setMonthlyActivities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [userName, setUserName] = useState("Utente");
  const token = sessionStorage.getItem("token");

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
        headers: { Authorization: `Bearer ${token}` },
        params: { startDate: monthStartDate.toISOString() },
      });
      setMonthlyActivities(response.data);
    } catch (error) {
      console.error("Errore durante il recupero delle attività mensili:", error);
    } finally {
      setLoading(false);
    }
  };

    useEffect(() => {
    const fetchUserName = async () => {
      if (token) {
        try {
          const decoded = jwtDecode(token); // Decodifica il token
          const userId = decoded.id; // Ottieni l'ID utente

          // Recupera la lista di utenti
          const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/users`, {
            headers: { Authorization: `Bearer ${token}` },
          });

          // Filtra l'utente corrente dalla lista usando l'ID
          const currentUser = response.data.find((user) => user.id === userId);

          if (currentUser) {
            setUserName(currentUser.username || "Utente");
          } else {
            console.warn("Utente non trovato nella lista.");
          }
        } catch (error) {
          console.error("Errore durante il recupero del nome utente:", error);
        }
      }
    };

    fetchUserName();
  }, [token]);


  useEffect(() => {
    const monthStartDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    fetchActivities(monthStartDate);
  }, [currentMonth]);

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
      const endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + activity.durata - 1);
      return startOfDay >= startDate && startOfDay <= endDate;
    });
  };

  const daysInMonth = getDaysInMonth(currentMonth);
  const today = new Date().toLocaleDateString();

  return (
    <div>
      <h1>Bacheca {userName}</h1>
      <div className="container">
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
                  <div></div>
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
