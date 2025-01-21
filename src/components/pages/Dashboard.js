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
  const [allFATDates, setAllFATDates] = useState([]);
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


  // Funzione per recuperare le commesse con data_FAT
  const fetchAllFATDates = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/commesse`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      // Filtra solo le commesse con data_FAT definita
      const commesseConFAT = response.data.filter((commessa) => commessa.data_FAT);
      setAllFATDates(commesseConFAT);
    } catch (error) {
      console.error("Errore durante il recupero delle commesse con FAT:", error);
    }
  };
  
  // Richiama la funzione quando il componente viene montato
  useEffect(() => {
    fetchAllFATDates();
  }, []);



    useEffect(() => {
    const fetchUserName = async () => {
      if (token) {
        try {
          const decoded = jwtDecode(token); // Decodifica il token
          const userId = decoded.id; // Ottieni l'ID utente
          console.log("Token decodificato:", decoded);
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
  }, [currentMonth, token]);

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
      endDate.setDate(startDate.getDate() + activity.durata );
      return startOfDay >= startDate && startOfDay <= endDate;
    });  
  };

  const daysInMonth = getDaysInMonth(currentMonth);
  const today = new Date().toLocaleDateString();

  const [loadingActivities, setLoadingActivities] = useState({});
  
  const updateActivityStatus = async (activityId, newStatus) => {

    setLoadingActivities((prev) => ({ ...prev, [activityId]: true }));
    try {
      const payload = { stato: newStatus };
      
      // Effettua la richiesta senza headers di autorizzazione
      const response = await axios.put(
        `${process.env.REACT_APP_API_URL}/api/notifiche/${activityId}/stato`,
        payload
      );
  
      setMonthlyActivities((prev) =>
        prev.map((activity) =>
          activity.id === activityId ? { ...activity, stato: newStatus } : activity
        )
      );
    } catch (error) {
      console.error("Errore durante l'aggiornamento dello stato dell'attività:", error);
  
      if (error.response) {
        console.error("Dettagli errore:", error.response.data);
      }
  
      alert("Si è verificato un errore durante l'aggiornamento dello stato.");
    } finally {
      setLoadingActivities((prev) => ({ ...prev, [activityId]: false }));
    }
  };
  
  
  
  
  
  return (
    <div>

      <div className="container">
      <h1>Bacheca {userName}</h1>
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

        <div className="calendar">
  {daysInMonth.map((day, index) => (
    <div
      key={index}
      className={`calendar-day ${day.toLocaleDateString() === today ? "today" : ""}`}
    >
      <div className="day-header">
        <strong>{day.toLocaleDateString()}</strong>
      </div>

      {/* Mostra le attività assegnate per il giorno */}
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
                    </button>
                    <button
                      className="btn btn-complete"
                      onClick={() => updateActivityStatus(activity.id, 2)}
                      >
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

      {/* Mostra le commesse con FAT per il giorno */}
      <div className="fat-dates">
        {allFATDates
          .filter((commessa) => {
            const fatDate = new Date(commessa.data_FAT).toLocaleDateString();
            return fatDate === day.toLocaleDateString();
          })
          .map((commessa) => (
            <div key={commessa.commessa_id} className="fat">
              <strong>FAT commessa:</strong> {commessa.numero_commessa} {" "}
            </div>
          ))}
      </div>
    </div>
  ))}
</div>

      </div>
    </div>
  );
}

export default Dashboard;
