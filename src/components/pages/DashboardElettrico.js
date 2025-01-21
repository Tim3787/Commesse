import React, { useEffect, useState } from "react";
import axios from "axios";
import "./Dashboard.css";
import logo from "../assets/unitech-packaging.png";
import AttivitaCrea from "../AttivitaCrea";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";

function DashboardElettrico() {
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

  
        // Recupera tutte le attività
        const activitiesResponse = await axios.get(
          `${process.env.REACT_APP_API_URL}/api/attivita_commessa`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

  
        const filteredActivities = activitiesResponse.data.filter(
          (activity) => activity.reparto?.toLowerCase() === "software"
        );

        setActivities(filteredActivities);
  
        // Recupera tutte le risorse
        const resourcesResponse = await axios.get(`${process.env.REACT_APP_API_URL}/api/risorse`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const filteredResources = resourcesResponse.data.filter(
          (resource) => Number(resource.reparto_id) === 2
        );

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
  

  
        // Filtra solo le attività relative al reparto
        const softwareActivities = attivitaWithReparto.filter(
          (attivita) => attivita.reparto_id === 2
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
    normalized.setHours(0, 0, 0, 0); // Imposta l'ora a mezzanotte in UTC
    return normalized;
  };
  
// Nuova funzione per generare una stringa di data locale
const toLocalISOString = (date) => {
    const offset = date.getTimezoneOffset();
    const localDate = new Date(date.getTime() - offset * 60 * 1000);
    return localDate.toISOString().split("T")[0];
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
  
  
      return matches;
    });
  };
  
  const handleActivityClick = (activity) => {
    const dataInizio = activity.data_inizio
      ? new Date(activity.data_inizio).toISOString().split("T")[0]
      : "";
  
    setFormData({
      commessa_id: activity.commessa_id || "",
      reparto_id: 2, // ID reparto
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
  
  function ResourceCell({ resourceId, day, activities, onActivityDrop, onActivityClick }) {
    const normalizedDay = normalizeDate(day); // Normalizza il giorno per evitare offset
  
    const [{ isOver }, drop] = useDrop(() => ({
      accept: "ACTIVITY", // Deve essere uguale al tipo usato in DraggableActivity
      drop: (item) => onActivityDrop(item, resourceId, normalizedDay), // Usa la data normalizzata
      collect: (monitor) => ({
        isOver: !!monitor.isOver(),
      }),
    }));
  
    return (
      <td ref={drop} className={isOver ? "highlight" : ""}>
        {activities.map((activity) => (
          <DraggableActivity
            key={activity.id}
            activity={activity}
            onDoubleClick={() => onActivityClick(activity)} // Passa il doppio clic
          />
        ))}
      </td>
    );
  }
  
  

  function DraggableActivity({ activity, onDoubleClick }) {
    const [{ isDragging }, drag] = useDrag(() => ({
      type: "ACTIVITY", // Deve essere uguale a quello usato in ResourceCell
      item: { ...activity },
      collect: (monitor) => ({
        isDragging: !!monitor.isDragging(),
      }),
    }));
  
    // Determina la classe basata sullo stato dell'attività
    const activityClass =
      activity.stato === 0
        ? "activity-not-started"
        : activity.stato === 1
        ? "activity-started"
        : "activity-completed";
  
    return (
      <div
        ref={drag}
        className={`activity ${activityClass}`} // Applica dinamicamente la classe
        style={{ opacity: isDragging ? 0.5 : 1, cursor: "move" }}
        onDoubleClick={onDoubleClick} // Associa il doppio clic per aprire il pop-up
      >
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
    );
  }
  
  const handleActivityDrop = async (activity, newResourceId, newDate) => {
    try {
      const normalizedDate = normalizeDate(newDate); // Normalizza la data target
  
      const updatedActivity = {
        ...activity,
        risorsa_id: newResourceId,
        data_inizio: toLocalISOString(normalizedDate),
      };
  
      // Aggiorna il database
      await axios.put(
        `${process.env.REACT_APP_API_URL}/api/attivita_commessa/${activity.id}`,
        updatedActivity,
        { headers: { Authorization: `Bearer ${token}` } }
      );
  
      // Aggiorna lo stato locale
      setActivities((prev) =>
        prev.map((act) =>
          act.id === activity.id ? { ...act, ...updatedActivity } : act
        )
      );
      console.log("Data ricevuta per il drop:", newDate);
console.log("Data normalizzata e inviata:", normalizedDate.toISOString().split("T")[0]);

    } catch (error) {
      console.error("Errore durante l'aggiornamento dell'attività:", error);
    }
  };
  
  


  return (
    <div>
      <div className="container">
        <h1>Bacheca Reparto Elettrico</h1>
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
        <DndProvider backend={HTML5Backend}>
        <div className="table-container">
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
  {daysInMonth.map((day, index) => {
    const isWeekend = day.getDay() === 0 || day.getDay() === 6; // 0 = Domenica, 6 = Sabato
    const isToday = day.toDateString() === new Date().toDateString(); // Confronta con la data di oggi
    const dayClass = isToday ? "today" : isWeekend ? "weekend" : ""; // Aggiungi classe per oggi o weekend

    return (
      <tr key={index} className={dayClass}>
        <td>{day.toLocaleDateString()}</td>
        {resources.map((resource) => (
          <ResourceCell
            key={`${day}-${resource.id}`} // Chiave univoca combinando giorno e risorsa
            resourceId={resource.id} // ID della risorsa
            day={day} // Giorno corrente
            activities={getActivitiesForResourceAndDay(resource.id, day)} // Attività della risorsa per il giorno
            onActivityDrop={handleActivityDrop} // Funzione chiamata quando viene eseguito il drop
            onActivityClick={handleActivityClick}
          />
        ))}
      </tr>
    );
  })}
</tbody>

        </table>
        </div>
        </DndProvider>
        {showPopup && (
  <AttivitaCrea
    formData={formData}
    setFormData={setFormData}
    isEditing={isEditing}
    setIsEditing={setIsEditing}
    editId={editId}
    fetchAttivita={() => {

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

export default DashboardElettrico;
