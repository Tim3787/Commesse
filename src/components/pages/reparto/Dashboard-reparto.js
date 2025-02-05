import React, { useEffect, useState, useRef } from "react"; //OGGI
import axios from "axios";
import "../Dashboard.css";
import logo from "../../img/Animation - 1738249246846.gif";
import AttivitaCrea from "../../popup/AttivitaCrea";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useParams } from "react-router-dom"; 
import repartoConfig from "../../config/repartoConfig";
import { getDaysInMonth } from "../../assets/date";
import {updateActivityNotes} from "../../services/API/notifiche-api";
import {deleteAttivitaCommessa,fetchAttivitaCommessa} from "../../services/API/attivitaCommesse-api";


function DashboardReparto() {
  const { reparto } = useParams(); // Ottieni il nome del reparto dall'URL

  // Ottieni la configurazione per il reparto corrente
  const { RepartoID, RepartoName } = repartoConfig[reparto] || {};
  const [activities, setActivities] = useState([]);
  const [resources, setResources] = useState([]);
  const [serviceResources, setServiceResources] = useState([]); 
  const [loading, setLoading] = useState(false);
  const token = sessionStorage.getItem("token");
  const [showPopup, setShowPopup] = useState(false);
  const [commesse, setCommesse] = useState([]);
const [reparti, setReparti] = useState([]);
const [attivitaConReparto, setAttivitaConReparto] = useState([]); 
const [selectedServiceResource, setSelectedServiceResource] = useState(null);
const hasScrolledToToday = useRef(false);
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
const todayRef = useRef(null);  
const [currentMonth, setCurrentMonth] = useState(new Date());
const daysInMonth = getDaysInMonth(currentMonth);



  
  // Recupera dati iniziali
  useEffect(() => {
    const fetchData = async () => {
      if (!RepartoID || !RepartoName) {
        console.error("Reparto non valido.");
        return;
      }
  
      try {
        setLoading(true);
  
        // Recupera dati dal backend
        const [activitiesResponse, resourcesResponse, commesseResponse, repartiResponse, attivitaDefiniteResponse] = await Promise.all([
          axios.get(`${process.env.REACT_APP_API_URL}/api/attivita_commessa`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get(`${process.env.REACT_APP_API_URL}/api/risorse`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
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
  
        // Imposta i dati corretti
        setActivities(activitiesResponse.data);
        setCommesse(commesseResponse.data);
        setReparti(repartiResponse.data);
  
        // Imposta le attività del reparto con attivita_definite
        const attivitaConReparto = attivitaDefiniteResponse.data.map((attivita) => ({
          id: attivita.id,
          nome_attivita: attivita.nome || attivita.nome_attivita || "Nome non disponibile",
          reparto_id: attivita.reparto_id,
        }));
        setAttivitaConReparto(attivitaConReparto);
  
        // Risorse del reparto corrente
        const filteredResources = resourcesResponse.data.filter(
          (resource) => Number(resource.reparto_id) === RepartoID
        );
        setResources(filteredResources);
  
        // Risorse del reparto service
        const serviceFilteredResources = resourcesResponse.data.filter(
          (resource) => Number(resource.reparto_id) === repartoConfig.service.RepartoID
        );
        setServiceResources(serviceFilteredResources);
  
        
      // Imposta la risorsa di default solo se il reparto NON è "service"
      if (reparto !== "service") {
        const defaultServiceId = repartoConfig[reparto]?.defaultServiceResourceId || null;
        setSelectedServiceResource(
          defaultServiceId && serviceFilteredResources.some((res) => res.id === defaultServiceId)
            ? defaultServiceId
            : serviceFilteredResources[0]?.id || null
        );
      } else {
        setSelectedServiceResource(null); // Nascondi se il reparto è "service"
      }
  
      } catch (error) {
        console.error("Errore durante il recupero dei dati:", error);
      } finally {
        setLoading(false);
      }
    };
  
    fetchData();
  }, [RepartoID, RepartoName, reparto, token]);
  
  
  



  // Funzione per cambiare risorsa selezionata
  const handleServiceResourceChange = (e) => {
    const value = e.target.value;
    setSelectedServiceResource(value ? Number(value) : null);
  };
  
  // Funzione per ottenere le attività della risorsa selezionata
   //const getServiceActivities = () => {
    // if (!selectedServiceResource) return [];
    // return activities.filter((activity) => activity.risorsa_id === selectedServiceResource);
  // };
  
  
  
  
// Scorri automaticamente alla colonna di oggi 

useEffect(() => {
  // Scrolla al giorno di oggi solo se non è già stato fatto
  if (!hasScrolledToToday.current && todayRef.current) {
    todayRef.current.scrollIntoView({ behavior: "smooth", block: "center" });

    // Aggiungi un listener temporaneo per sapere quando lo scroll è finito
    const handleScrollEnd = () => {
      hasScrolledToToday.current = true; // Segna che lo scroll è stato eseguito
      window.removeEventListener("scroll", handleScrollEnd); // Rimuovi il listener
    };

    window.addEventListener("scroll", handleScrollEnd);
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
  const localDate = new Date(date);
  return new Date(localDate.getFullYear(), localDate.getMonth(), localDate.getDate());
};

  
  const updateActivityStatus = async (activityId, newStatus) => {
    setLoadingActivities((prev) => ({ ...prev, [activityId]: true }));
    try {
      const payload = { stato: newStatus };
  
      // Effettua la richiesta API per aggiornare lo stato
       await axios.put(
        `${process.env.REACT_APP_API_URL}/api/notifiche/${activityId}/stato`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );
  
     
  
      // Aggiorna lo stato locale delle attività
      setActivities((prev) =>
        prev.map((activity) =>
          activity.id === activityId ? { ...activity, stato: newStatus } : activity
        )
      );
    } catch (error) {
      console.error("Errore durante l'aggiornamento dello stato dell'attività:", error);
      toast.error("Si è verificato un errore durante l'aggiornamento dello stato.");
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
      reparto_id: reparti.find((reparto) => reparto.nome === activity.reparto)?.id || "",
      risorsa_id: activity.risorsa_id || "",
      attivita_id: activity.attivita_id || "",
      data_inizio: dataInizio,
      durata:  activity.durata || "",
      stato: activity.stato !== undefined && activity.stato !== null ? String(activity.stato) : "",
      descrizione: activity.descrizione_attivita || "",
      note: activity.note || "",
      
    });
    setIsEditing(true);
    setEditId(activity.id);
    setShowPopup(true);
  };
  
  const handleEmptyCellDoubleClick = (resourceId, day) => {
    const formattedDate = toLocalISOString(day);
    const existingActivities = getActivitiesForResourceAndDay(resourceId, day);
    
    if (existingActivities.length === 0) {
      setFormData({
        commessa_id: "",
        reparto_id: RepartoID,
        risorsa_id: resourceId,
        data_inizio: formattedDate,
        durata: 1,
        stato: "",
        descrizione: "",
        note: "",
      });
      setIsEditing(false);
      setShowPopup(true);
    } else {
      toast.warn("Cella già occupata.");
    }
  };
  

  const handleDelete = async (id) => {
    if (window.confirm("Sei sicuro di voler eliminare questa attività?")) {
      try {
        await deleteAttivitaCommessa(id);
  
        // Aggiorna lo stato locale eliminando l'attività dall'elenco
        setActivities((prevActivities) =>
          prevActivities.filter((activity) => activity.id !== id)
        );
  

      } catch (error) {
        console.error("Errore durante l'eliminazione dell'attività:", error);
        toast.error("Si è verificato un errore durante l'eliminazione dell'attività.");
      }
    }
  };
  
  const deleteNote = async (activityId) => {
    try {
      await updateActivityNotes(activityId, null, token); // Invia null al backend
      toast.success("Nota eliminata con successo!");
  
      // Aggiorna lo stato locale della nota a null senza rimuovere l'attività
      setActivities((prevActivities) =>
        prevActivities.map((activity) =>
          activity.id === activityId ? { ...activity, note: null } : activity
        )
      );
    } catch (error) {
      console.error("Errore durante l'eliminazione della nota:", error);
      toast.error("Errore durante l'eliminazione della nota.");
    }
  };
  

  const handleAddNew = () => {
    setFormData({
      commessa_id: "",
      reparto_id: RepartoID, 
      risorsa_id: "",
      attivita_id: "",
      data_inizio: "",
      durata: 1,
      stato: "",
      descrizione: "",
      note: "",
    });
    setIsEditing(false);
    setShowPopup(true);
  };

  
  function ResourceCell({ resourceId, day, activities, onActivityDrop, onActivityClick }) {
    const normalizedDay = normalizeDate(day);
  
    // Configurazione del drop
    const [{ isOver }, drop] = useDrop(() => ({
      accept: "ACTIVITY", // Tipo accettato
      drop: (item) => onActivityDrop(item, resourceId, normalizedDay), 
      collect: (monitor) => ({
        isOver: !!monitor.isOver(),
      }),
    }));
  
    return (
      <td
        ref={drop} 
        className={isOver ? "highlight" : ""}
        onDoubleClick={() =>
          activities.length === 0 && handleEmptyCellDoubleClick(resourceId, normalizedDay)
        } 
      >
        {activities.map((activity) => (
          <DraggableActivity
            key={activity.id}
            activity={activity}
            onDoubleClick={() => onActivityClick(activity)} 
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
  
                     
                      const isTrasferta = activity.nome_attivita?.toLowerCase().includes("trasferta");
                      
    return (
      <div
        ref={drag}
        className={`activity ${activityClass}`}
        style={{ opacity: isDragging ? 0.5 : 1, cursor: "move" }}
        onDoubleClick={onDoubleClick}
      >
        {activity.stato === 2 && activity.note && (
  <span className="warning-icon" title="Nota presente nell'attività completata">
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      fill="#e60000"
      viewBox="0 0 24 24"
    >
      <path d="M12 0C5.372 0 0 5.372 0 12s5.372 12 12 12 12-5.372 12-12S18.628 0 12 0zm0 22c-5.523 0-10-4.477-10-10S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zm-1-15h2v6h-2zm0 8h2v2h-2z" />
    </svg>
  </span>
)}
<br />
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
  
  {/** Mostra la descrizione solo se il reparto è "service" **/}
  {activity.reparto?.toLowerCase() === "service" && (
    <>
      <br />
      <strong>Descrizione: {activity.descrizione_attivita  || ""}</strong>
      <br />
    </>
  )}
        {/* Pulsanti per modificare lo stato */}
        <div className="activity-actions">

          {activity.stato === 1 && (
            <>
              
              <button
                className="btn btn-complete"
                onClick={() => updateActivityStatus(activity.id, 2)}
                disabled={loadingActivities[activity.id]}
              >
                {loadingActivities[activity.id] ? "Caricamento..." : "Completa"}
              </button>
              <button
    className="btn btn-danger"
    onClick={() => handleDelete(activity.id)} 
  >
    Elimina
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
              <button
    className="btn btn-danger"
    onClick={() => handleDelete(activity.id)} 
  >
    Elimina
  </button>

            </>
          )}
        </div>
        <div className="note"> Note: {activity.note}</div>
        {activity.note && (
        <button className="btn btn-delete" onClick={() => deleteNote(activity.id)}>
          Elimina Nota
        </button>
      )}
      </div>
    );
  }
  
  const handleReloadActivities = async () => {
    try {
      const updatedActivities = await fetchAttivitaCommessa(); 
      setActivities(updatedActivities); // Aggiorna solo con i dati ricevuti dal server
      toast.success("Attività ricaricate con successo.");
    } catch (error) {
      console.error("Errore durante il ricaricamento delle attività:", error);
      toast.error("Errore durante il ricaricamento delle attività.");
    }
  };
  

  
  
  const handleActivityDrop = async (activity, newResourceId, newDate) => {
    try {
      const normalizedDate = normalizeDate(newDate); 
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
        <h1>Bacheca Reparto {RepartoName}</h1>
        <ToastContainer position="top-left" autoClose={3000} hideProgressBar />
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
    <h2>Bacheca Attività</h2>

    {/* Dropdown per selezionare una risorsa "Service" specifica */}
    {serviceResources.length > 0 && reparto !== "service" && (
      <div>
      <label htmlFor="serviceResourceSelect">Seleziona Risorsa del Service:</label>
      <select
        id="serviceResourceSelect"
        value={selectedServiceResource || ""}
        onChange={handleServiceResourceChange}
      >
        <option value="">Nessuna risorsa selezionata</option>
        {serviceResources.map((resource) => (
          <option key={resource.id} value={resource.id}>
            {resource.nome}
          </option>
        ))}
      </select>
    </div>
    )}

    <table className="software-schedule">
      <thead>
        <tr>
          <th>Risorsa</th>
          {daysInMonth.map((day) => (
            <th
              key={day.toISOString()}
              className={day.toDateString() === new Date().toDateString() ? "today" : ""}
            >
              {day.toLocaleDateString()}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {/** Mostra le risorse del reparto corrente */}
        {resources.map((resource) => (
          <tr key={resource.id}>
            <td>{resource.nome}</td>
            {daysInMonth.map((day) => (
              <ResourceCell
                key={`${resource.id}-${day}`}
                resourceId={resource.id}
                day={day}
                activities={getActivitiesForResourceAndDay(resource.id, day)}
                onActivityDrop={handleActivityDrop}
                onActivityClick={handleActivityClick}
              />
            ))}
          </tr>
        ))}

        {/** Mostra solo la risorsa selezionata dal Service */}
        {selectedServiceResource && (
          <>
            <tr>
              <td colSpan={daysInMonth.length + 1} className="service-header">
                <strong>
                  Service:
                </strong>
              </td>
            </tr>
            <tr>
              <td>
                {
                  serviceResources.find((res) => res.id === selectedServiceResource)
                    ?.nome || "Risorsa non trovata"
                }
              </td>
              {daysInMonth.map((day) => (
                <ResourceCell
                  key={`${selectedServiceResource}-${day}`}
                  resourceId={selectedServiceResource}
                  day={day}
                  activities={getActivitiesForResourceAndDay(selectedServiceResource, day)}
                  onActivityDrop={handleActivityDrop}
                  onActivityClick={handleActivityClick}
                />
              ))}
            </tr>
          </>
        )}
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
  fetchAttivita={handleReloadActivities}
  setShowPopup={setShowPopup}
  commesse={commesse}
  reparti={reparti}
  risorse={resources}
  attivitaConReparto={attivitaConReparto}
  reloadActivities={handleReloadActivities}
/>

)}
      </div>
    </div>
  );
}

export default DashboardReparto;
