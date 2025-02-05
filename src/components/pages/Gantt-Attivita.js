import React, { useEffect, useState, useRef } from "react";
import { fetchCommesse } from "../services/API/commesse-api"; 
import { fetchAttivitaCommessa } from "../services/API/attivitaCommesse-api" ;
import "./VisualizzaAttivita.css";
import logo from "../img/Animation - 1738249246846.gif";
import "react-toastify/dist/ReactToastify.css";
import { ToastContainer, toast } from "react-toastify";

function VisualizzaAttivita() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [numeroCommessa, setNumeroCommessa] = useState(""); // Numero di commessa inserito dall'utente
  const todayRef = useRef(null); // Per scorrere automaticamente a oggi
  const [suggestions, setSuggestions] = useState([]);

  const reparti = [
    { id: 1, name: "Reparto Software" },
    { id: 2, name: "Reparto Elettrico" },
    { id: 3, name: "Reparto Meccanico" },
    { id: 15, name: "Reparto Quadristi" },
    { id: 18, name: "Reparto Service" },
  ];
  // Funzione per ottenere i suggerimenti delle commesse
  useEffect(() => {
    const fetchSuggestions = async () => {
      try {
        setSuggestions(await fetchCommesse());
      } catch (error) {
        console.error("Errore nel recupero dei suggerimenti:", error);
        toast.error("Errore nel recupero dei suggerimenti:", error);
      }
    };
    fetchSuggestions();
  }, []);

  const filteredSuggestions = suggestions.filter(
    (commessa) =>
      commessa.numero_commessa &&
      commessa.numero_commessa.toString().toLowerCase().includes(numeroCommessa.toLowerCase())
  );
  
  
  
  
// Calcola i giorni del mese
const getDaysInMonth= () => {
  const days = [];
  const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
  const endOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);

  // Trova il giorno della settimana del primo giorno del mese (0 = Domenica, 6 = Sabato)
  const startDayOfWeek = startOfMonth.getDay();
  const endDayOfWeek = endOfMonth.getDay();

  // Aggiungi i giorni del mese precedente fino all'inizio della settimana
  if (startDayOfWeek !== 1) { // Se non è lunedì
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const prevDate = new Date(startOfMonth);
      prevDate.setDate(startOfMonth.getDate() - i - 1);
      days.push(prevDate);
    }
  }

  // Aggiungi i giorni del mese corrente
  for (let d = startOfMonth; d <= endOfMonth; d.setDate(d.getDate() + 1)) {
    days.push(new Date(d));
  }

  // Aggiungi i giorni del mese successivo fino a completare la settimana
  if (endDayOfWeek !== 0) { // Se non è domenica
    for (let i = 1; i <= 6 - endDayOfWeek; i++) {
      const nextDate = new Date(endOfMonth);
      nextDate.setDate(endOfMonth.getDate() + i);
      days.push(nextDate);
    }
  }

  return days;
};

const daysInMonth = getDaysInMonth();

  // Funzione per recuperare le attività filtrate per commessa
  const handleSearchCommessa = async () => {
    if (!numeroCommessa) {
      alert("Inserisci un numero di commessa!");
      return;
    }
  
    try {
      setLoading(true);
      const activitiesData = await fetchAttivitaCommessa(numeroCommessa); // Ottiene le attività dal backend

      // Filtra le attività per numero di commessa
      const filteredActivities = activitiesData.filter(
        (activity) =>
          String(activity.numero_commessa).trim().toLowerCase() === numeroCommessa.trim().toLowerCase()
      );
      

      setActivities(filteredActivities);
  
    } catch (error) {
      console.error("Errore durante il recupero delle attività:", error);
      alert("Errore durante il recupero delle attività!");
    } finally {
      setLoading(false);
    }
  };
  

  
  // Scorri automaticamente alla colonna di oggi
  useEffect(() => {
    if (todayRef.current) {
      const parentContainer = document.querySelector(".Gen-table-container");

      if (parentContainer) {
        const todayPosition = todayRef.current.offsetLeft;
        const parentWidth = parentContainer.clientWidth;
        const columnWidth = todayRef.current.offsetWidth;

        const scrollPosition = todayPosition - parentWidth / 2 + columnWidth / 2;

        parentContainer.scrollTo({
          left: scrollPosition,
          behavior: "smooth",
        });
      }
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
    normalized.setHours(0, 0, 0, 0); // Assicura che l'ora sia a mezzanotte
    return normalized;
  };
  
  


  const getActivitiesForRepartoAndDay = (repartoId, day) => {
    const normalizedDay = normalizeDate(day);
  
    const repartoName = reparti.find((r) => r.id === repartoId)?.name;

  
    const filteredActivities = activities.filter((activity) => {
      if (!activity.data_inizio || !activity.reparto) {

        return false;
      }
  
      const startDate = normalizeDate(activity.data_inizio);
      const endDate = normalizeDate(new Date(startDate));
      endDate.setDate(startDate.getDate() + (activity.durata || 1) - 1);
  
      const isInReparto =
        activity.reparto?.toLowerCase().trim() === repartoName?.toLowerCase().replace("reparto ", "").trim();
      const isInDateRange = normalizedDay >= startDate && normalizedDay <= endDate;
  

  
      return isInReparto && isInDateRange;
    });
  

  
    return filteredActivities;
  };
  
  
  

  const renderCalendar = () => (
    <table className="Gen-schedule">
      <thead>
        <tr>
          <th>Reparto</th>
           <ToastContainer position="top-left" autoClose={3000} hideProgressBar />
          {daysInMonth.map((day, index) => {
            const isToday = day.toDateString() === new Date().toDateString();
            const dayClass = isToday ? "Gen-today-date" : "";
  
            return (
              <th key={index} ref={isToday ? todayRef : null} className={dayClass}>
                {day.toLocaleDateString()}
              </th>
            );
          })}
        </tr>
      </thead>
      <tbody>
        {reparti.map((reparto) => (
          <tr key={reparto.id}>
            <td>{reparto.name}</td>
            {daysInMonth.map((day, index) => {
              const activitiesForDay = getActivitiesForRepartoAndDay(reparto.id, day);
  
              return (
                <td key={index}>
                  {activitiesForDay.length > 0 ? (
                    activitiesForDay.map((activity) => (
                      <div
                        key={activity.id}
                        className={`activity5 activity5-type-${activity.tipo_attivita || "default"}`}
                        title={`Tipo: ${activity.tipo_attivita || "Sconosciuto"} - Risorsa: ${activity.risorsa}`}
                      >
                        {activity.nome_attivita || "Attività"}
                      </div>
                    ))
                  ) : (
                    <span className="no-activity5">-</span> // Segnaposto se non ci sono attività
                  )}
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );
  
  return (
    <div>
      <div className="container-Scroll">
        <h1>Bacheca Attività</h1>
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

        <div className="filter-group">
  <input
    type="text"
    value={numeroCommessa}
    onChange={(e) => setNumeroCommessa(e.target.value)}
    placeholder="Inserisci numero commessa"
    className="input-field"
  />

  {/* Suggerimenti */}
  {numeroCommessa && filteredSuggestions.length > 0 && (
  <ul className="suggestions-list2">
    {filteredSuggestions.map((suggestion, index) => (
      <li
        key={index}
        onClick={() => setNumeroCommessa(suggestion.numero_commessa.toString())}

      >
        {suggestion.numero_commessa} - {suggestion.cliente || "Nessuna descrizione"}
      </li>

    ))}
  </ul>
)}
  <button onClick={handleSearchCommessa} className="btn-search-commessa" disabled={loading}>
    {loading ? "Caricamento..." : "Cerca"}
  </button>
</div>



        <div className="Gen-table-container">{renderCalendar()}</div>
      </div>
    </div>
  );
}

export default VisualizzaAttivita;
