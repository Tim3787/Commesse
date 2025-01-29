import React, { useEffect, useState, useRef  } from "react";
import axios from "axios";
import "./Dashboard.css";
import logo from "../assets/unitech-packaging.png";
import AttivitaCrea from "../AttivitaCrea";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import {
  deleteAttivitaCommessa,
  fetchAttivitaCommessa,
} from "../services/api";

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
  descrizione: "",
});
const [isEditing, setIsEditing] = useState(false);
const [editId, setEditId] = useState(null);
const [loadingActivities, setLoadingActivities] = useState({});
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
        // Recupera tutte le attività
        const activitiesResponse = await axios.get(
          `${process.env.REACT_APP_API_URL}/api/attivita_commessa`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        const filteredActivities = activitiesResponse.data.filter(
          (activity) => activity.reparto?.toLowerCase() === "elettrico"
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
  
  
// Scorri automaticamente alla colonna di oggi //OGGI
useEffect(() => {
  if (todayRef.current) {
    todayRef.current.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
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
    normalized.setHours(0, 0, 0, 0); // Imposta l'ora a mezzanotte in UTC
    return normalized;
  };
  
  const updateActivityStatus = async (activityId, newStatus) => {
    setLoadingActivities((prev) => ({ ...prev, [activityId]: true }));
    try {
      const payload = { stato: newStatus };
  
      // Effettua la richiesta API per aggiornare lo stato
      const response = await axios.put(
        `${process.env.REACT_APP_API_URL}/api/notifiche/${activityId}/stato`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );
  
      console.log("Risposta PUT:", response.data);
  
      // Aggiorna lo stato locale delle attività
      setActivities((prev) =>
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
      stato: activity.stato !== undefined && activity.stato !== null ? String(activity.stato) : "",
      descrizione: activity.descrizione_attivita || "",
    });
    setIsEditing(true);
    setEditId(activity.id);
    setShowPopup(true);
  };
  
  
    const handleEmptyCellDoubleClick = (resourceId, day) => {
      const formattedDate = toLocalISOString(day);
      setFormData((prev) => ({
        ...prev,
        risorsa_id: resourceId,
        data_inizio: formattedDate,
        reparto_id: 2, // Reparto Software (ID predefinito)
      }));
      setShowPopup(true); // Mostra il popup
      setIsEditing(false); // Indica che si sta creando una nuova attività
      setEditId(null); // Non modifica un'attività esistente
    };

    const handleDelete = async (id) => {
        if (window.confirm("Sei sicuro di voler eliminare questa attività?")) {
          try {
            await deleteAttivitaCommessa(id);
      
            // Aggiorna lo stato locale eliminando l'attività dall'elenco
            setActivities((prevActivities) =>
              prevActivities.filter((activity) => activity.id !== id)
            );
      
            console.log("Attività eliminata con successo!");
          } catch (error) {
            console.error("Errore durante l'eliminazione dell'attività:", error);
            alert("Si è verificato un errore durante l'eliminazione dell'attività.");
          }
        }
      };

    const handleAddNew = () => {
      setFormData({
        commessa_id: "",
        reparto_id: 2, 
        risorsa_id: "",
        attivita_id: "",
        data_inizio: "",
        durata: 1,
        stato: "",
        descrizione: "",
      });
      setIsEditing(false);
      setShowPopup(true);
    };
  
    
    function ResourceCell({ resourceId, day, activities, onActivityDrop, onActivityClick }) {
        const normalizedDay = normalizeDate(day);
      
        // Configurazione del drop
        const [{ isOver }, drop] = useDrop(() => ({
          accept: "ACTIVITY", // Tipo accettato
          drop: (item) => onActivityDrop(item, resourceId, normalizedDay), // Funzione chiamata durante il drop
          collect: (monitor) => ({
            isOver: !!monitor.isOver(),
          }),
        }));
      
        return (
          <td
            ref={drop} // Mantiene il riferimento per il drag and drop
            className={isOver ? "highlight" : ""}
            onDoubleClick={() =>
              activities.length === 0 && handleEmptyCellDoubleClick(resourceId, normalizedDay)
            } // Doppio clic sulle celle vuote
          >
            {activities.map((activity) => (
              <DraggableActivity
                key={activity.id}
                activity={activity}
                onDoubleClick={() => onActivityClick(activity)} // Doppio clic su un'attività
              />
            ))}
          </td>
        );
      }
    
  

  function DraggableActivity({ activity, onDoubleClick }) {
    const [{ isDragging }, drag] = useDrag(() => ({
      type: "ACTIVITY", 
      item: { ...activity },
      collect: (monitor) => ({
        isDragging: !!monitor.isDragging(),
      }),
    }));
  
    const activityClass =
      activity.stato === 0
        ? "activity-not-started"
        : activity.stato === 1
        ? "activity-started"
        : "activity-completed";
                
                      // Controlla se l'attività è una Trasferta
                      const isTrasferta = activity.nome_attivita?.toLowerCase().includes("trasferta");
                      
    return (
      <div
        ref={drag}
        className={`activity ${activityClass}`}
        style={{ opacity: isDragging ? 0.5 : 1, cursor: "move" }}
        onDoubleClick={onDoubleClick}
      >
        <strong>Commessa: {activity.numero_commessa}</strong>
        <br />
        <strong>Attività: {activity.nome_attivita}</strong>
        {isTrasferta && (
              <span className="trasferta-icon" title="Trasferta">
                🚗
              </span>
            )}
        <br />
        <strong>Stato:{" "}
        {activity.stato === 0
          ? "Non iniziata"
          : activity.stato === 1
          ? "Iniziata"
          : "Completata"}</strong>
        <br />
  
        {/* Pulsanti per modificare lo stato */}
        <div className="activity-actions">
        <button
    className="btn btn-danger"
    onClick={() => handleDelete(activity.id)} // Passa l'ID corretto
  >
    Elimina
  </button>
          {activity.stato === 1 && (
            <>
              
              <button
                className="btn btn-complete"
                onClick={() => updateActivityStatus(activity.id, 2)}
                disabled={loadingActivities[activity.id]}
              >
                {loadingActivities[activity.id] ? "Caricamento..." : "Completa"}
              </button>
            </>
          )}
          
          {activity.stato === 0 && (
            <>
              <button
                className="btn btn-start"
                onClick={() => updateActivityStatus(activity.id, 1)}
                disabled={loadingActivities[activity.id]}
              >
                {loadingActivities[activity.id] ? "Caricamento..." : "Inizia"}
              </button>
              <button
                className="btn btn-complete"
                onClick={() => updateActivityStatus(activity.id, 2)}
                disabled={loadingActivities[activity.id]}
              >
                {loadingActivities[activity.id] ? "Caricamento..." : "Completa"}
              </button>
            </>
          )}
        </div>
      </div>
    );
  }
  
   const handleReloadActivities = async () => {
        try {
          const updatedActivities = await fetchAttivitaCommessa();
          setActivities(updatedActivities); // Aggiorna lo stato con le attività ricaricate
        } catch (error) {
          console.error("Errore durante il ricaricamento delle attività:", error);
        }
      };
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


    } catch (error) {
      console.error("Errore durante l'aggiornamento dell'attività:", error);
    }
  };
  
  


  return (
    <div>
      <div className="container-Scroll">
        <h1>Bacheca Reparto Elettrico</h1>
        {loading && (
          <div className="loading-overlay">
            <img src={logo} alt="Logo" className="logo-spinner" />
          </div>
        )}
 <button onClick={handleAddNew} className="btn btn-primary create-activity-btn">
          Aggiungi Attività
        </button>
        <div className="calendar-navigation">
          <button onClick={goToPreviousMonth} className="btn-Nav">
            ← Mese Precedente
          </button>
          <button onClick={goToNextMonth} className="btn-Nav">
            Mese Successivo →
          </button>
        </div>
        <DndProvider backend={HTML5Backend}>
        <div className="Gen-table-container">
  <table className="software-schedule">
    <thead>
      <tr>
        <th>Risorsa</th>
        {daysInMonth.map((day) => {
          const isWeekend = day.getDay() === 0 || day.getDay() === 6; // Domenica = 0, Sabato = 6
          const isToday = day.toDateString() === new Date().toDateString(); // Confronta con oggi

          return (
            <th
              key={day.toISOString()}
              className={`${isToday ? "today" : ""} ${isWeekend ? "weekend" : ""}`}
              ref={isToday ? todayRef : null} //OGGI
            >
              {day.toLocaleDateString()}
            </th>
          );
        })}
      </tr>
    </thead>
    <tbody>
      {resources.map((resource) => (
        <tr key={resource.id}>
          <td>{resource.nome}</td>
          {daysInMonth.map((day) => (
            <ResourceCell
              key={`${resource.id}-${day}`} // Chiave unica
              resourceId={resource.id}
              day={day}
              activities={getActivitiesForResourceAndDay(resource.id, day)}
              onActivityDrop={handleActivityDrop}
              onActivityClick={handleActivityClick}
            />
          ))}
        </tr>
      ))}
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
    reloadActivities={handleReloadActivities} 
  />
)}
      </div>
    </div>
  );
}

export default DashboardElettrico;
