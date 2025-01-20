import React, { useEffect, useState } from "react";
import axios from "axios";
import "./Dashboard.css";
import logo from "../assets/unitech-packaging.png";
import AttivitaCrea from "../AttivitaCrea";
function DashboardSoftware() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [activities, setActivities] = useState([]);
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(false);
  const token = sessionStorage.getItem("token");
  const [showPopup, setShowPopup] = useState(false);
  const [commesse, setCommesse] = useState([]);
const [reparti, setReparti] = useState([]);
const [attivitaConReparto, setAttivitaConReparto] = useState([]); // Se necessario
const [formData, setFormData] = useState({
  commessa_id: "",
  reparto_id: "",
  risorsa_id: "",
  attivita_id: "",
  data_inizio: "",
  durata: "",
  stato: "",
});
const [isEditing, setIsEditing] = useState(false);
const [editId, setEditId] = useState(null);


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
  
        const filteredActivities = activitiesResponse.data.filter(
          (activity) => activity.reparto?.toLowerCase() === "software"
        );
        console.log("Attività filtrate per reparto software:", filteredActivities);
        setActivities(filteredActivities);
  
        // Recupera tutte le risorse
        const resourcesResponse = await axios.get(`${process.env.REACT_APP_API_URL}/api/risorse`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const filteredResources = resourcesResponse.data.filter(
          (resource) => Number(resource.reparto_id) === 1
        );
        console.log("Risorse filtrate per reparto software:", filteredResources);
        setResources(filteredResources);
  
        // Recupera commesse, reparti e attività definite
        const [commesseResponse, repartiResponse, attivitaDefiniteResponse] = await Promise.all([
          axios.get(`${process.env.REACT_APP_API_URL}/api/commesse`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get(`${process.env.REACT_APP_API_URL}/api/reparti`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get(`${process.env.REACT_APP_API_URL}/api/attivita`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);
  
        setCommesse(commesseResponse.data);
        setReparti(repartiResponse.data);
  
        // Trasforma le attività definite includendo il reparto_id
        const attivitaWithReparto = attivitaDefiniteResponse.data.map((attivita) => ({
          id: attivita.id,
          nome_attivita: attivita.nome || attivita.nome_attivita || "Nome non disponibile",
          reparto_id: attivita.reparto_id,
        }));
  
        console.log("Attività con reparto:", attivitaWithReparto);
  
        // Filtra solo le attività relative al reparto software
        const softwareActivities = attivitaWithReparto.filter(
          (attivita) => attivita.reparto_id === 1
        );
        setAttivitaConReparto(softwareActivities);
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
  
  const handleActivityClick = (activity) => {
    const dataInizio = activity.data_inizio
      ? new Date(activity.data_inizio).toISOString().split("T")[0]
      : "";
  
    setFormData({
      commessa_id: activity.commessa_id || "",
      reparto_id: 1, // ID reparto software
      risorsa_id: activity.risorsa_id || "",
      attivita_id: activity.attivita_id || "",
      data_inizio: dataInizio,
      durata: activity.durata || "",
      stato: activity.stato || "",
    });
    setIsEditing(true);
    setEditId(activity.id);
    setShowPopup(true);
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
                      <div key={activity.id} className="activity"  onClick={() => handleActivityClick(activity)}>
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
        {showPopup && (
  <AttivitaCrea
    formData={formData}
    setFormData={setFormData}
    isEditing={isEditing}
    setIsEditing={setIsEditing}
    editId={editId}
    fetchAttivita={() => {
      console.log("Ricarica attività...");
    }}
    setShowPopup={setShowPopup}
    commesse={commesse} // Passa le commesse recuperate
    reparti={reparti} // Passa i reparti recuperati
    risorse={resources} // Passa le risorse filtrate

    attivitaConReparto={attivitaConReparto} // (opzionale, se necessario)
  />
)}
      </div>
    </div>
  );
}

export default DashboardSoftware;
