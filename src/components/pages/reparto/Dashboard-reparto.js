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
import { updateActivityNotes } from "../../services/API/notifiche-api";
import { deleteAttivitaCommessa, fetchAttivitaCommessa } from "../../services/API/attivitaCommesse-api";
import { Tooltip } from "react-tooltip";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faEyeSlash,
} from "@fortawesome/free-solid-svg-icons";
function DashboardReparto() {
  const { reparto } = useParams(); // Ottieni il nome del reparto dall'URL
  const { RepartoID, RepartoName } = repartoConfig[reparto] || {};
  const [activities, setActivities] = useState([]);
  const [filteredActivities, setFilteredActivities] = useState([]);
  const [resources, setResources] = useState([]);
  const [serviceResources, setServiceResources] = useState([]); 
  const [loading, setLoading] = useState(false);
  const token = sessionStorage.getItem("token");
  const [showPopup, setShowPopup] = useState(false);
  const [commesse, setCommesse] = useState([]);
  const [reparti, setReparti] = useState([]);
  const [attivitaConReparto, setAttivitaConReparto] = useState([]); 
  const [selectedServiceResource, setSelectedServiceResource] = useState(null);
  const [activityViewMode, setActivityViewMode] = useState("full");
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
  const containerRef = useRef(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const daysInMonth = getDaysInMonth(currentMonth);
  const [filters, setFilters] = useState({
    commessa: "",
    risorsa: "",
    attivita: ""
  });

  // Stato per la visibilità del burger menu
  const [isBurgerMenuOpen, setIsBurgerMenuOpen] = useState(false);

  // Funzione per aprire/chiudere il burger menu
  const toggleBurgerMenu = () => {
    setIsBurgerMenuOpen((prev) => !prev);
  };

  // Recupera dati iniziali
  useEffect(() => {
    const fetchData = async () => {
      if (!RepartoID || !RepartoName) {
        console.error("Reparto non valido.");
        return;
      }
  
      try {
        setLoading(true);
  
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
  
        setActivities(activitiesResponse.data);
        setCommesse(commesseResponse.data);
        setReparti(repartiResponse.data);
  
        const attivitaConReparto = attivitaDefiniteResponse.data.map((attivita) => ({
          id: attivita.id,
          nome_attivita: attivita.nome || attivita.nome_attivita || "Nome non disponibile",
          reparto_id: attivita.reparto_id,
        }));
        setAttivitaConReparto(attivitaConReparto);
  
        const filteredResources = resourcesResponse.data.filter(
          (resource) => Number(resource.reparto_id) === RepartoID
        );
        setResources(filteredResources);
  
        const serviceFilteredResources = resourcesResponse.data.filter(
          (resource) => Number(resource.reparto_id) === repartoConfig.service.RepartoID
        );
        setServiceResources(serviceFilteredResources);
  
        if (reparto !== "service") {
          const defaultServiceId = repartoConfig[reparto]?.defaultServiceResourceId || null;
          setSelectedServiceResource(
            defaultServiceId && serviceFilteredResources.some((res) => res.id === defaultServiceId)
              ? defaultServiceId
              : serviceFilteredResources[0]?.id || null
          );
        } else {
          setSelectedServiceResource(null);
        }
  
      } catch (error) {
        console.error("Errore durante il recupero dei dati:", error);
      } finally {
        setLoading(false);
      }
    };
  
    fetchData();
  }, [RepartoID, RepartoName, reparto, token]);
  
  useEffect(() => {
    const fActivities = activities.filter(activity => {
      const commessaMatch = filters.commessa
        ? activity.numero_commessa.toString().toLowerCase().includes(filters.commessa.toLowerCase())
        : true;
      const risorsaMatch = filters.risorsa
        ? (activity.risorsa && activity.risorsa.toLowerCase().includes(filters.risorsa.toLowerCase()))
        : true;
      const attivitaMatch = filters.attivita
        ? (activity.nome_attivita && activity.nome_attivita.toLowerCase().includes(filters.attivita.toLowerCase()))
        : true;
      return commessaMatch && risorsaMatch && attivitaMatch;
    });
    setFilteredActivities(fActivities);
  }, [activities, filters]);
  
  const scrollToToday = () => {
    const today = new Date();
    // Se il mese visualizzato non è quello attuale, aggiorna lo stato currentMonth
    if (
      currentMonth.getMonth() !== today.getMonth() ||
      currentMonth.getFullYear() !== today.getFullYear()
    ) {
      setCurrentMonth(today);
      // Attendi il re-render (ad es. 100ms) per far apparire le celle del mese attuale
      setTimeout(() => {
        if (todayRef.current && containerRef.current) {
          const containerRect = containerRef.current.getBoundingClientRect();
          const todayRect = todayRef.current.getBoundingClientRect();
          const offsetLeft = todayRect.left - containerRect.left;
          const additionalOffset = -50; // o -10, in base al comportamento osservato
const scrollLeft =
  offsetLeft - containerRef.current.clientWidth / 2 + todayRect.width / 2 + additionalOffset;
containerRef.current.scrollTo({
  left: scrollLeft,
  behavior: "smooth",
});
        }
      }, 100);
    } else {
      // Se il mese visualizzato è già quello attuale, scrolla direttamente
      if (todayRef.current && containerRef.current) {
        const containerRect = containerRef.current.getBoundingClientRect();
        const todayRect = todayRef.current.getBoundingClientRect();
        const offsetLeft = todayRect.left - containerRect.left;
        const scrollLeft =
          offsetLeft - containerRef.current.clientWidth / 2 + todayRect.width / 2;
        containerRef.current.scrollTo({
          left: scrollLeft,
          behavior: "smooth"
        });
      }
    }
  };
  

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
      await axios.put(
        `${process.env.REACT_APP_API_URL}/api/notifiche/${activityId}/stato`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );
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
  
  const toLocalISOString = (date) => {
    const offset = date.getTimezoneOffset();
    const localDate = new Date(date.getTime() - offset * 60 * 1000);
    return localDate.toISOString().split("T")[0];
  };

  const getActivitiesForResourceAndDay = (resourceId, day) => {
    const normalizedDay = normalizeDate(day);
    return filteredActivities.filter((activity) => {
      const startDate = normalizeDate(activity.data_inizio);
      const endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + activity.durata - 1);
      return (
        Number(activity.risorsa_id) === Number(resourceId) &&
        normalizedDay >= startDate &&
        normalizedDay <= endDate
      );
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
      await updateActivityNotes(activityId, null, token);
      toast.success("Nota eliminata con successo!");
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

  function ResourceCell({ resourceId, day, activities, onActivityDrop, onActivityClick, isWeekend, viewMode }) {
    const normalizedDay = normalizeDate(day);
    const [{ isOver }, drop] = useDrop(() => ({
      accept: "ACTIVITY",
      drop: (item) => onActivityDrop(item, resourceId, normalizedDay),
      collect: (monitor) => ({
        isOver: !!monitor.isOver(),
      }),
    }));
    const cellClasses = `${isWeekend ? "weekend-cell" : ""} ${isOver ? "highlight" : ""}`;
    return (
      <td
        ref={drop}
        className={cellClasses}
        onDoubleClick={() =>
          activities.length === 0 && handleEmptyCellDoubleClick(resourceId, normalizedDay)
        }
      >
        {activities.map((activity) => (
          <DraggableActivity
            key={activity.id}
            activity={activity}
            onDoubleClick={() => onActivityClick(activity)}
            viewMode={viewMode}
          />
        ))}
      </td>
    );
  }
  
  function DraggableActivity({ activity, onDoubleClick, viewMode }) {
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
  
    if (viewMode === "compact") {
      const tooltipContent = `
        Attività: ${activity.nome_attivita}
        Stato: ${
          activity.stato === 0
            ? "Non iniziata"
            : activity.stato === 1
            ? "Iniziata"
            : "Completata"
        }
        Commessa: ${activity.numero_commessa}
      `;
      return (
        <>
          <div
            ref={drag}
            className={`activity compact ${activityClass}`}
            style={{
              opacity: isDragging ? 0.5 : 1,
              cursor: "move",
              width: "20px",
              height: "20px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            onDoubleClick={onDoubleClick}
            data-tooltip-id={`tooltip-${activity.id}`}
          >
          </div>
          <Tooltip id={`tooltip-${activity.id}`} place="top" effect="solid">
          <span style={{ whiteSpace: "pre-wrap" }}>
            {tooltipContent}</span>
          </Tooltip>
        </>
      );
    }
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
        <br />
        <strong>
          Stato:{" "}
          {activity.stato === 0
            ? "Non iniziata"
            : activity.stato === 1
            ? "Iniziata"
            : "Completata"}
        </strong>
        <br />
        {activity.reparto?.toLowerCase() === "service" && (
          <>
            <br />
            <strong>Descrizione: {activity.descrizione_attivita || ""}</strong>
            <br />
          </>
        )}
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
              <button className="btn btn-danger" onClick={() => handleDelete(activity.id)}>
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
              <button className="btn btn-danger" onClick={() => handleDelete(activity.id)}>
                Elimina
              </button>
            </>
          )}
        </div>
        <div className="note">Note: {activity.note}</div>
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
      setActivities(updatedActivities);
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
  
      await axios.put(
        `${process.env.REACT_APP_API_URL}/api/attivita_commessa/${activity.id}`,
        updatedActivity,
        { headers: { Authorization: `Bearer ${token}` } }
      );
  
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
    <div className="page-wrapper">
      {/* Header */}
      <div className="header">
        <h1>Bacheca Reparto {RepartoName}</h1>
        <div className="month-navigation">
          <button className="burger-icon" onClick={toggleBurgerMenu}>
            Filtri e opzioni
          </button>
          <button onClick={goToPreviousMonth} className="btn-Nav">
            ← Mese
          </button>
          <button onClick={scrollToToday} className="btn-Nav">
  OGGI
</button>

          <button onClick={goToNextMonth} className="btn-Nav">
            Mese →
          </button>
        </div>
        <ToastContainer position="top-left" autoClose={3000} hideProgressBar />
        {loading && (
          <div className="loading-overlay">
            <img src={logo} alt="Logo" className="logo-spinner" />
          </div>
        )}
      </div>
  
      {/* Burger Menu */}
      {isBurgerMenuOpen && (
        <div className="burger-menu">
          <div className="burger-menu-header">
            <button onClick={toggleBurgerMenu} className="close-burger">
            <FontAwesomeIcon icon={faEyeSlash} className="settings-icon" />
            </button>
          </div>
          <div className="burger-menu-content">
            <div className="filters-burger">
              <h3>Opzioni</h3>
              <label>Visualizzazione Attività: </label>
              <select
                value={activityViewMode}
                onChange={(e) => setActivityViewMode(e.target.value)}
              >
                <option value="full">Completa</option>
                <option value="compact">Compatta</option>
              </select>
            </div>
            {serviceResources.length > 0 && reparto !== "service" && (
              <div>
                <label htmlFor="serviceResourceSelect">Seleziona Risorsa del Service:</label>
                <select
                  id="serviceResourceSelect"
                  value={selectedServiceResource || ""}
                  onChange={(e) =>
                    setSelectedServiceResource(e.target.value ? Number(e.target.value) : null)
                  }
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
            <div className="filters-burger">
              <h3>Filtri</h3>
              <input
                type="text"
                placeholder="Filtra per commessa"
                value={filters.commessa}
                onChange={(e) => setFilters({ ...filters, commessa: e.target.value })}
                className="input-field-100"
              />
              <input
                type="text"
                placeholder="Filtra per risorsa"
                value={filters.risorsa}
                onChange={(e) => setFilters({ ...filters, risorsa: e.target.value })}
                className="input-field-100"
              />
              <input
                type="text"
                placeholder="Filtra per attività"
                value={filters.attivita}
                onChange={(e) => setFilters({ ...filters, attivita: e.target.value })}
                className="input-field-100"
              />
            </div>
            <div className="filters-burger">
              <h3>Azioni</h3>
              <button onClick={handleAddNew} className="btn btn-primary create-activity-btn">
                Aggiungi Attività
              </button>
            </div>
          </div>
        </div>
      )}
  
      {/* Contenuto principale: spostato a destra se il burger menu è aperto */}
      <div className={`main-container ${isBurgerMenuOpen ? "shifted" : ""}`}>
        <DndProvider backend={HTML5Backend}>
          <div className="container-Scroll">
            <div className="Gen-table-container" ref={containerRef}>
              <table className="software-schedule">
                <thead>
                  <tr>
                    <th>Risorsa</th>
                    {daysInMonth.map((day) => {
                      const isWeekend = day.getDay() === 0 || day.getDay() === 6;
                      const isToday = day.toDateString() === new Date().toDateString();
                      return (
                        <th
                          key={day.toISOString()}
                          className={`${isToday ? "today" : ""} ${isWeekend ? "weekend" : ""}`}
                          ref={isToday ? todayRef : null}
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
                      {daysInMonth.map((day) => {
                        const isWeekend = day.getDay() === 0 || day.getDay() === 6; 
                        return (
                          <ResourceCell
                            key={`${resource.id}-${day.toISOString()}`}
                            resourceId={resource.id}
                            day={day}
                            isWeekend={isWeekend}
                            activities={getActivitiesForResourceAndDay(resource.id, day)}
                            onActivityDrop={handleActivityDrop}
                            onActivityClick={handleActivityClick}
                            viewMode={activityViewMode}
                          />
                        );
                      })}
                    </tr>
                  ))}
  
                  {selectedServiceResource && (
                    <>
                      <tr>
                        <td colSpan={daysInMonth.length + 1} className="service-header">
                          <strong>Service:</strong>
                        </td>
                      </tr>
                      <tr>
                        <td>
                          {serviceResources.find((res) => res.id === selectedServiceResource)?.nome || "Risorsa non trovata"}
                        </td>
                        {daysInMonth.map((day) => {
                          const isWeekend = day.getDay() === 0 || day.getDay() === 6; 
                          return (
                            <ResourceCell
                              key={`${selectedServiceResource}-${day.toISOString()}`}
                              resourceId={selectedServiceResource}
                              day={day}
                              isWeekend={isWeekend}
                              activities={getActivitiesForResourceAndDay(selectedServiceResource, day)}
                              onActivityDrop={handleActivityDrop}
                              onActivityClick={handleActivityClick}
                              viewMode={activityViewMode}
                            />
                          );
                        })}
                      </tr>
                    </>
                  )}
                </tbody>
              </table>
            </div>
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
