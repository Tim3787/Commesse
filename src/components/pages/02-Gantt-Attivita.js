import React, { useEffect, useState, useRef } from "react";
import "./02-Gantt-Attivita.css";
import logo from "../img/Animation - 1738249246846.gif";

// API per ottenere la lista delle commesse e le attività associate
import { fetchCommesse } from "../services/API/commesse-api";
import { fetchAttivitaCommessa } from "../services/API/attivitaCommesse-api";

// Import per Toastify (notifiche)
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

/**
 * Componente VisualizzaAttivita
 * 
 * Visualizza un calendario mensile delle attività. Permette di cercare le attività 
 * filtrandole per numero di commessa, di scorrere automaticamente al giorno corrente e 
 * di visualizzare le attività per reparto.
 */
function VisualizzaAttivita() {
  // ------------------------------------------------------------------
  // Stati e Ref
  // ------------------------------------------------------------------
  const [currentMonth, setCurrentMonth] = useState(new Date()); // Mese corrente da visualizzare
  const [activities, setActivities] = useState([]);               // Attività (filtrate) da visualizzare
  const [loading, setLoading] = useState(false);                    // Stato di caricamento
  const [numeroCommessa, setNumeroCommessa] = useState("");         // Numero di commessa inserito per la ricerca
  const [suggestions, setSuggestions] = useState([]);               // Suggerimenti (lista delle commesse)
  const suggestionsRef = useRef(null);                              // Ref per il box dei suggerimenti
  const todayRef = useRef(null);                                    // Ref per la cella del giorno corrente (usata per lo scroll)
  const hasScrolledToToday = useRef(false);                         // Flag per evitare scroll multipli

  // Array statico dei reparti
  const reparti = [
    { id: 1, name: "Reparto Software" },
    { id: 2, name: "Reparto Elettrico" },
    { id: 3, name: "Reparto Meccanico" },
    { id: 15, name: "Reparto Quadristi" },
    { id: 18, name: "Reparto Service" },
  ];

  // ------------------------------------------------------------------
  // Funzioni Helper: Gestione Date e Calendario
  // ------------------------------------------------------------------

  /**
   * Calcola tutti i giorni da visualizzare nel calendario.
   * Include i giorni del mese corrente, aggiungendo eventuali giorni del mese precedente 
   * e del mese successivo per completare le settimane.
   */
  const getDaysInMonth = () => {
    const days = [];
    const startOfMonth = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth(),
      1
    );
    const endOfMonth = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth() + 1,
      0
    );

    // Calcola il giorno della settimana del primo e dell'ultimo giorno del mese
    const startDayOfWeek = startOfMonth.getDay(); // 0 = Domenica, 1 = Lunedì, etc.
    const endDayOfWeek = endOfMonth.getDay();

    // Aggiungi i giorni del mese precedente fino a completare la settimana
    if (startDayOfWeek !== 1) { // se il primo giorno non è lunedì
      for (let i = startDayOfWeek - 1; i >= 0; i--) {
        const prevDate = new Date(startOfMonth);
        prevDate.setDate(startOfMonth.getDate() - i - 1);
        days.push(prevDate);
      }
    }

    // Aggiungi i giorni del mese corrente
    for (let d = new Date(startOfMonth); d <= endOfMonth; d.setDate(d.getDate() + 1)) {
      days.push(new Date(d));
    }

    // Aggiungi i giorni del mese successivo fino a completare la settimana
    if (endDayOfWeek !== 0) { // Se l'ultimo giorno non è domenica
      for (let i = 1; i <= 6 - endDayOfWeek; i++) {
        const nextDate = new Date(endOfMonth);
        nextDate.setDate(endOfMonth.getDate() + i);
        days.push(nextDate);
      }
    }

    return days;
  };

  const daysInMonth = getDaysInMonth();

  /**
   * Restituisce il nome del mese e l'anno correnti, ad esempio "Marzo 2025".
   */
  const getMonthName = () => {
    const monthNames = [
      "Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno",
      "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre",
    ];
    return `${monthNames[currentMonth.getMonth()]} ${currentMonth.getFullYear()}`;
  };

  /**
   * Normalizza una data impostando le ore a mezzanotte (0:00:00.000).
   */
  const normalizeDate = (date) => {
    const normalized = new Date(date);
    normalized.setHours(0, 0, 0, 0);
    return normalized;
  };

  
  // ------------------------------------------------------------------
  // Effetti
  // ------------------------------------------------------------------
  // Effetto: Ottieni i suggerimenti delle commesse dal backend
  useEffect(() => {
    const fetchSuggestions = async () => {
      try {
        const commesseData = await fetchCommesse();
        setSuggestions(commesseData);
      } catch (error) {
        console.error("Errore nel recupero dei suggerimenti:", error);
        toast.error("Errore nel recupero dei suggerimenti:", error);
      }
    };
    fetchSuggestions();
  }, []);

  // Effetto: Scroll automatico per centrare la colonna corrispondente al giorno corrente
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

  // Effetto: Esegue uno scroll extra (una sola volta) al giorno corrente al montaggio
  useEffect(() => {
    if (!hasScrolledToToday.current && todayRef.current) {
      todayRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
      const handleScrollEnd = () => {
        hasScrolledToToday.current = true;
        window.removeEventListener("scroll", handleScrollEnd);
      };
      window.addEventListener("scroll", handleScrollEnd);
    }
  }, []);

  // Effetto: Chiude il box dei suggerimenti se si clicca fuori dal contenitore
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(e.target)) {
        setSuggestions([]);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () =>
      document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ------------------------------------------------------------------
  // Funzioni di Ricerca e Navigazione
  // ------------------------------------------------------------------
  // Filtra i suggerimenti delle commesse in base al numero inserito
  const filteredSuggestions = suggestions.filter(
    (commessa) =>
      commessa.numero_commessa &&
      commessa.numero_commessa.toString().toLowerCase().includes(numeroCommessa.toLowerCase())
  );

  /**
   * Esegue la ricerca delle attività per il numero di commessa.
   */
  const handleSearchCommessa = async () => {
    if (!numeroCommessa) {
      alert("Inserisci un numero di commessa!");
      return;
    }
    try {
      setLoading(true);
      // Ottiene le attività dal backend in base al numero di commessa
      const activitiesData = await fetchAttivitaCommessa(numeroCommessa);
      // Filtra le attività confrontando esattamente il numero (trimmed e in minuscolo)
      const filteredActivities = activitiesData.filter(
        (activity) =>
          String(activity.numero_commessa).trim().toLowerCase() ===
          numeroCommessa.trim().toLowerCase()
      );
      setActivities(filteredActivities);
    } catch (error) {
      console.error("Errore durante il recupero delle attività:", error);
      alert("Errore durante il recupero delle attività!");
    } finally {
      setLoading(false);
    }
  };

  /**
   * Resetta il filtro di ricerca e carica tutte le attività.
   */
  const handleResetSearch = async () => {
    setNumeroCommessa("");
    try {
      setLoading(true);
      const activitiesData = await fetchAttivitaCommessa("");
      setActivities(activitiesData);
    } catch (error) {
      console.error("Errore durante il recupero di tutte le attività:", error);
      alert("Errore durante il recupero di tutte le attività!");
    } finally {
      setLoading(false);
    }
  };

  // Navigazione tra i mesi
  const goToPreviousMonth = () => {
    setCurrentMonth((prev) =>
      new Date(prev.getFullYear(), prev.getMonth() - 1, 1)
    );
  };

  const goToNextMonth = () => {
    setCurrentMonth((prev) =>
      new Date(prev.getFullYear(), prev.getMonth() + 1, 1)
    );
  };

  // ------------------------------------------------------------------
  // Funzioni per Filtrare le Attività per Reparto e Giorno
  // ------------------------------------------------------------------
  /**
   * Filtra le attività per un dato reparto e per un giorno specifico.
   */
  const getActivitiesForRepartoAndDay = (repartoId, day) => {
    const normalizedDay = normalizeDate(day);
    // Recupera il nome del reparto in base all'ID
    const repartoName = reparti.find((r) => r.id === repartoId)?.name;
    const filteredActivities = activities.filter((activity) => {
      if (!activity.data_inizio || !activity.reparto) {
        return false;
      }
      const startDate = normalizeDate(activity.data_inizio);
      const endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + (activity.durata || 1) - 1);
      // Verifica che l'attività appartenga al reparto e che il giorno rientri nell'intervallo
      const isInReparto =
        activity.reparto?.toLowerCase().trim() ===
        repartoName?.toLowerCase().replace("reparto ", "").trim();
      const isInDateRange = normalizedDay >= startDate && normalizedDay <= endDate;
      return isInReparto && isInDateRange;
    });
    return filteredActivities;
  };

  // ------------------------------------------------------------------
  // Rendering del Calendario
  // ------------------------------------------------------------------
  /**
   * Renderizza la tabella del calendario con intestazioni e righe per ciascun reparto.
   */
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
                        {numeroCommessa === ""
                          ? `${activity.numero_commessa} - ${activity.nome_attivita || "Attività"}`
                          : activity.nome_attivita || "Attività"}
                      </div>
                    ))
                  ) : (
                    <span className="no-activity5">-</span>
                  )}
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );

  // ------------------------------------------------------------------
  // Rendering Principale del Componente
  // ------------------------------------------------------------------
  return (
    <div>
      <div className="container-Scroll">
        <h1>Bacheca Attività</h1>
        <ToastContainer position="top-left" autoClose={3000} hideProgressBar />
        {loading && (
          <div className="loading-overlay">
            <img src={logo} alt="Logo" className="logo-spinner" />
          </div>
        )}
        <div className="calendar-navigation">
          {/* Campo di ricerca per il numero di commessa */}
          <input
            type="text"
            value={numeroCommessa}
            onChange={(e) => setNumeroCommessa(e.target.value)}
            placeholder="Inserisci numero commessa"
            className="input-field"
          />
          {/* Se ci sono suggerimenti, mostra il box dei suggerimenti */}
          {numeroCommessa && filteredSuggestions.length > 0 && (
            <ul className="suggestions-list2" ref={suggestionsRef}>
              {filteredSuggestions.map((suggestion, index) => (
                <li
                  key={index}
                  onClick={() => {
                    // Imposta il numero di commessa dal suggerimento e avvia automaticamente la ricerca
                    setNumeroCommessa(suggestion.numero_commessa.toString());
                    handleSearchCommessa();
                  }}
                >
                  {suggestion.numero_commessa} - {suggestion.cliente || "Nessuna descrizione"}
                </li>
              ))}
            </ul>
          )}
          {/* Pulsante per resettare il filtro e visualizzare tutte le attività */}
          <button onClick={handleResetSearch} className="btn-reset-search">
            Visualizza tutto
          </button>
          {/* Pulsanti per navigare tra i mesi */}
          <button onClick={goToPreviousMonth} className="btn-Nav">
            ← Mese
          </button>
          <button onClick={goToNextMonth} className="btn-Nav">
            Mese →
          </button>
          <span className="current-month">{getMonthName()}</span>
        </div>
        <div className="Gen-table-container">{renderCalendar()}</div>
      </div>
    </div>
  );
}

export default VisualizzaAttivita;
