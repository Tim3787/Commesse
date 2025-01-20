import React, { useEffect, useState } from "react";
import axios from "axios";
import "./Dashboard.css";
import logo from "../assets/unitech-packaging.png";

function DashboardSoftware() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [activities, setActivities] = useState([]);
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(false);
  const token = sessionStorage.getItem("token");

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
        console.log("Inizio fetch dei dati...");

        // Recupera tutte le attività
        const activitiesResponse = await axios.get(
          `${process.env.REACT_APP_API_URL}/api/attivita_commessa`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        console.log("Tutte le attività:", activitiesResponse.data);

        // Filtra le attività del reparto software
        const filteredActivities = activitiesResponse.data.filter(
          (activity) => activity.reparto?.toLowerCase() === "software" // Assicurati che 'reparto' sia una stringa
        );

        console.log("Attività filtrate per reparto software:", filteredActivities);
        setActivities(filteredActivities);

        // Recupera tutte le risorse
const resourcesResponse = await axios.get(`${process.env.REACT_APP_API_URL}/api/risorse`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  
  // Mostra tutte le risorse per debug
  console.log("Tutte le risorse:", resourcesResponse.data);
  
  // Filtra risorse per reparto_id
  const filteredResources = resourcesResponse.data.filter(
    (resource) => Number(resource.reparto_id) === 1
  );
  
  // Debug: Risorse filtrate
  console.log("Risorse filtrate per reparto software:", filteredResources);
  
  // Imposta le risorse nello stato
  setResources(filteredResources);
      } catch (error) {
        console.error("Errore durante il recupero dei dati:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentMonth, token]);

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
  
      const matches =
        Number(activity.risorsa_id) === Number(resourceId) &&
        normalizedDay >= startDate &&
        normalizedDay <= endDate;
  
      console.log(
        `Risorsa: ${resourceId}, Giorno: ${normalizedDay.toLocaleDateString()}, Attività: ${activity.id}`,
        "Inizio:", startDate.toLocaleDateString(),
        "Fine:", endDate.toLocaleDateString(),
        "Match:", matches
      );
  
      return matches;
    });
  };
  

  return (
    <div>
      <div className="container">
        <h1>Bacheca Reparto Software</h1>
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

        <table className="software-schedule">
          <thead>
            <tr>
              <th>Giorno</th>
              {resources.map((resource) => (
                <th key={resource.id}>{resource.nome}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {daysInMonth.map((day, index) => (
              <tr key={index}>
                <td>{day.toLocaleDateString()}</td>
                {resources.map((resource) => (
                  <td key={resource.id}>
                    {getActivitiesForResourceAndDay(resource.id, day).map((activity) => (
                      <div key={activity.id} className="activity">
                        <strong>Commessa:</strong> {activity.numero_commessa}
                        <br />
                        <strong>Attività:</strong> {activity.nome_attivita}
                        <br />
                        <strong>Stato:</strong>{" "}
                        {activity.stato === 0
                          ? "Non iniziata"
                          : activity.stato === 1
                          ? "Iniziata"
                          : "Completata"}
                      </div>
                    ))}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default DashboardSoftware;
