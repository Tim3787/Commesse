import React, { useEffect, useState, useRef } from 'react';
import '../style/05-Gantt-Attivita.css';
import logo from '../img/Animation - 1738249246846.gif';

// API per ottenere la lista delle commesse e le attività associate
import { fetchCommesse } from '../services/API/commesse-api';
import { fetchAttivitaCommessa } from '../services/API/attivitaCommesse-api';

// Import per Toastify (notifiche)
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
// Import icone FontAwesome
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';
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
  const [activities, setActivities] = useState([]); // Attività (filtrate) da visualizzare
  const [loading, setLoading] = useState(false); // Stato di caricamento
  const [numeroCommessa, setNumeroCommessa] = useState(''); // Numero di commessa inserito per la ricerca
  const [suggestions, setSuggestions] = useState([]); // Tutte le commesse
  const [showSuggestions, setShowSuggestions] = useState(false); // Mostra/nascondi la lista
  const suggestionsRef = useRef(null); // Ref per il box dei suggerimenti
  const todayRef = useRef(null); // Ref per la cella del giorno corrente (usata per lo scroll)
  const containerRef = useRef(null); // Riferimento al contenitore della tabella

  // Array statico dei reparti
  const reparti = [
    { id: 1, name: 'Reparto Software' },
    { id: 2, name: 'Reparto Elettrico' },
    { id: 3, name: 'Reparto Meccanico' },
    { id: 15, name: 'Reparto Quadristi' },
    { id: 18, name: 'Reparto Service' },
    { id: 14, name: 'Reparto Tecnico elettrico' },
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
    const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const endOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);

    // Calcola il giorno della settimana del primo e dell'ultimo giorno del mese
    const startDayOfWeek = startOfMonth.getDay(); // 0 = Domenica, 1 = Lunedì, etc.
    const endDayOfWeek = endOfMonth.getDay();

    // Aggiungi i giorni del mese precedente fino a completare la settimana
    if (startDayOfWeek !== 1) {
      // se il primo giorno non è lunedì
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
    if (endDayOfWeek !== 0) {
      // Se l'ultimo giorno non è domenica
      for (let i = 1; i <= 6 - endDayOfWeek; i++) {
        const nextDate = new Date(endOfMonth);
        nextDate.setDate(endOfMonth.getDate() + i);
        days.push(nextDate);
      }
    }

    return days;
  };

  const daysInMonth = getDaysInMonth();
  const meseCorrente = currentMonth
    .toLocaleDateString('it-IT', {
      month: 'long',
      year: 'numeric',
    })
    .replace(/^./, (c) => c.toUpperCase());

  /**
   * Normalizza una data impostando le ore a mezzanotte (0:00:00.000).
   */
  const normalizeDate = (date) => {
    const normalized = new Date(date);
    normalized.setHours(0, 0, 0, 0);
    return normalized;
  };

  // ------------------------------------------------------------------
  // Effetto: Scrolla automaticamente al giorno corrente se non già fatto
  // ------------------------------------------------------------------
  // Scrolla alla colonna corrispondente ad oggi
  const scrollToToday = () => {
    const today = new Date();
    const sameMonth =
      currentMonth.getMonth() === today.getMonth() &&
      currentMonth.getFullYear() === today.getFullYear();
    const doScroll = () => {
      if (todayRef.current && containerRef.current) {
        const containerRect = containerRef.current.getBoundingClientRect();
        const todayRect = todayRef.current.getBoundingClientRect();
        const offsetLeft = todayRect.left - containerRect.left;
        containerRef.current.scrollTo({
          left: offsetLeft - containerRef.current.clientWidth / 2 + todayRect.width / 2,
          behavior: 'smooth',
        });
      }
    };
    if (!sameMonth) {
      setCurrentMonth(today);
      setTimeout(() => {
        requestAnimationFrame(doScroll);
      }, 300); // più tempo per il rendering
    } else {
      requestAnimationFrame(doScroll);
    }
  };

  // Naviga al mese precedente
  const goToPreviousMonth = () => {
    setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  // Naviga al mese successivo
  const goToNextMonth = () => {
    setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  // Restituisce il numero di settimana
  const getWeekNumber = (d) => {
    // Crea una copia della data in UTC
    d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    // Sposta la data al giovedì della settimana corrente (necessario per il calcolo ISO)
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    // Calcola il primo giorno dell'anno in UTC
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    // Calcola il numero di settimane (differenza in giorni diviso per 7)
    return Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
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
        console.error('Errore nel recupero dei suggerimenti:', error);
        toast.error('Errore nel recupero dei suggerimenti:', error);
      }
    };
    fetchSuggestions();
  }, []);

  // Effetto: Scroll automatico per centrare la colonna corrispondente al giorno corrente
  useEffect(() => {
    if (todayRef.current) {
      const parentContainer = document.querySelector('.Gen-table-container');
      if (parentContainer) {
        const todayPosition = todayRef.current.offsetLeft;
        const parentWidth = parentContainer.clientWidth;
        const columnWidth = todayRef.current.offsetWidth;
        const scrollPosition = todayPosition - parentWidth / 2 + columnWidth / 2;
        parentContainer.scrollTo({
          left: scrollPosition,
          behavior: 'smooth',
        });
      }
    }
  }, [daysInMonth]);

  // Effetto: Chiude il box dei suggerimenti se si clicca fuori dal contenitore
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(e.target)) {
        setShowSuggestions(false); // invece di svuotare la lista
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
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
      alert('Inserisci un numero di commessa!');
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
      console.error('Errore durante il recupero delle attività:', error);
      alert('Errore durante il recupero delle attività!');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Resetta il filtro di ricerca e carica tutte le attività.
   */
  const handleResetSearch = async () => {
    setNumeroCommessa('');
    try {
      setLoading(true);
      const activitiesData = await fetchAttivitaCommessa('');
      setActivities(activitiesData);
    } catch (error) {
      console.error('Errore durante il recupero di tutte le attività:', error);
      alert('Errore durante il recupero di tutte le attività!');
    } finally {
      setLoading(false);
    }
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
        repartoName?.toLowerCase().replace('reparto ', '').trim();
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
    <div className="Reparto-table-container mh-72  ">
      <table>
        <thead>
          <tr>
            <th>Risorsa</th>
            {daysInMonth.map((day, index) => {
              const isWeekend = day.getDay() === 0 || day.getDay() === 6;
              const isToday = day.toDateString() === new Date().toDateString();
              const weekNumber = getWeekNumber(day);
              // Mostra il numero settimana se è il primo elemento oppure se cambia rispetto al giorno precedente
              let showWeekNumber = false;
              if (index === 0) {
                showWeekNumber = true;
              } else {
                const prevWeekNumber = getWeekNumber(daysInMonth[index - 1]);
                if (weekNumber !== prevWeekNumber) {
                  showWeekNumber = true;
                }
              }
              return (
                <th
                  key={day.toISOString()}
                  className={`${isToday ? 'today' : ''} ${isWeekend ? 'weekend' : ''}`}
                  ref={isToday ? todayRef : null}
                >
                  <div>{day.toLocaleDateString()}</div>
                  {showWeekNumber && <div className="week-number">Settimana {weekNumber}</div>}
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
                          className={`activity5 activity5-type-${activity.nome_attivita || 'default'}`}
                          title={`Tipo: ${activity.nome_attivita || 'Sconosciuto'} - Risorsa: ${activity.risorsa}`}
                        >
                          {numeroCommessa === ''
                            ? `${activity.numero_commessa} - ${activity.nome_attivita || 'Attività'} - ${activity.risorsa || 'Risorsa'}`
                            : activity.nome_attivita || 'Attività'}
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
    </div>
  );

  // ------------------------------------------------------------------
  // Rendering Principale del Componente
  // ------------------------------------------------------------------
  return (
    <div className="page-wrapper">
      {/* HEADER */}
      <div className=" header">
        <h1>VISUALIZZA LE ATTIVITA' DI</h1>
        <div className="flex-center header-row">
          <button onClick={goToPreviousMonth} className="btn w-50 btn--shiny btn--pill">
            <FontAwesomeIcon icon={faChevronLeft} />
          </button>
          <button onClick={scrollToToday} className="btn w-50 btn--shiny btn--pill">
            OGGI
          </button>
          <div className="header-row-month"> {meseCorrente}</div>
          <button onClick={goToNextMonth} className="btn w-50 btn--shiny btn--pill">
            <FontAwesomeIcon icon={faChevronRight} />
          </button>
        </div>
      </div>
      <div>
        <div className="row center" style={{ marginLeft: '10px' }}>
          <div className="flex-column-center" style={{ marginRight: '10px' }}>
            <h1>SCEGLI UNA COMMESSA</h1>
            <div className="suggestion-wrapper w-200 ">
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <input
                  type="text"
                  value={numeroCommessa}
                  onChange={(e) => {
                    setNumeroCommessa(e.target.value);
                    setShowSuggestions(true);
                  }}
                  placeholder="Inserisci numero commessa"
                  className="w-200"
                />
                {/* Se ci sono suggerimenti, mostra il box dei suggerimenti */}
                {numeroCommessa && filteredSuggestions.length > 0 && showSuggestions && (
                  <ul className="suggestions-list w-200" ref={suggestionsRef}>
                    {filteredSuggestions.map((suggestion, index) => (
                      <li
                        key={index}
                        onClick={() => {
                          setNumeroCommessa(suggestion.numero_commessa.toString());
                          setShowSuggestions(false);
                          handleSearchCommessa();
                        }}
                      >
                        {suggestion.numero_commessa} - {suggestion.cliente || '-'}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
          <div className="flex-column-center" style={{ marginLeft: '10px' }}>
            <h1>OPPURE VISUALIZZA TUTTE LE ATTIVITA'</h1>
            {/* Pulsante per resettare il filtro e visualizzare tutte le attività */}
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <button onClick={handleResetSearch} className="btn w-200 btn--shiny btn--pill">
                Visualizza tutto
              </button>
            </div>
          </div>
        </div>
        <ToastContainer position="top-left" autoClose={2000} hideProgressBar />
        {loading && (
          <div className="loading-overlay">
            <img src={logo} alt="Logo" className="logo-spinner" />
          </div>
        )}
      </div>

      <div className="container" ref={containerRef}>
        {renderCalendar()}
      </div>
    </div>
  );
}

export default VisualizzaAttivita;
