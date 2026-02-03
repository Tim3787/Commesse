import React, { useEffect, useState, useRef } from 'react';
import '../style/05-CalendarioCommesse.css';
import logo from '../img/Animation - 1738249246846.gif';
import CommessaDettagli from '../popup/CommessaDettagli';

// Import API per le varie entità
import { fetchCommesse } from '../services/API/commesse-api';
// Import icone FontAwesome
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';
// Import per Toastify (notifiche)
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

/**
 * Componente CalendarioCommesse
 * Visualizza un calendario mensile in cui sono indicate le commesse,
 * evidenziando le commesse con FAT e quelle con data di consegna.
 */
function CalendarioCommesse() {
  // ------------------------------------------------------------------
  // Stati e Ref
  // ------------------------------------------------------------------
  const [currentMonth, setCurrentMonth] = useState(new Date()); // Mese attualmente visualizzato
  const [commesse, setCommesse] = useState([]); // Elenco delle commesse recuperate dal backend
  const [loading, setLoading] = useState(false); // Stato di caricamento generale
  const [selectedCommessa, setSelectedCommessa] = useState(null); // Commessa selezionata per visualizzare i dettagli

  // Ref per lo scroll automatico
  const todayRef = useRef(null); // Ref assegnato alla cella che rappresenta il giorno corrente
  const hasScrolledToToday = useRef(false); // Flag per evitare scroll ripetuti
  const containerRef = useRef(null); // Ref per il container scrollabile

  // ------------------------------------------------------------------
  // Funzioni Helper: gestione delle date e organizzazione del calendario
  // ------------------------------------------------------------------

  /**
   * Calcola tutti i giorni del mese corrente.
   */
  const getDaysInMonth = () => {
    const days = [];
    const start = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const end = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);

    // Incrementa la data un giorno per volta e aggiunge una copia della data all'array
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      days.push(new Date(d));
    }
    return days;
  };

  /**
   * Organizza i giorni del mese in settimane. Aggiunge celle vuote all'inizio e alla fine
   * per completare la settimana.
   */
  const getWeeksInMonth = () => {
    const days = getDaysInMonth();
    const weeks = [];
    let currentWeek = [];

    days.forEach((day) => {
      // Se è l'inizio di una nuova settimana (giorno della settimana 0, ovvero Domenica) e il currentWeek non è vuoto,
      // termina la settimana precedente
      if (currentWeek.length > 0 && day.getDay() === 0) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
      currentWeek.push(day);
    });

    if (currentWeek.length > 0) {
      weeks.push(currentWeek);
    }

    // Aggiunge celle vuote per completare le settimane (all'inizio e alla fine)
    return weeks.map((week) => {
      const emptyCellsStart = Array(week[0].getDay()).fill(null);
      const emptyCellsEnd = Array(6 - week[week.length - 1].getDay()).fill(null);
      return [...emptyCellsStart, ...week, ...emptyCellsEnd];
    });
  };

  const weeksInMonth = getWeeksInMonth();
  const meseCorrente = currentMonth
    .toLocaleDateString('it-IT', {
      month: 'long',
      year: 'numeric',
    })
    .replace(/^./, (c) => c.toUpperCase());

  /**
   * Normalizza una data impostando le ore a zero.
   */
  const normalizeDate = (date) => {
    const normalized = new Date(date);
    normalized.setHours(0, 0, 0, 0);
    return normalized;
  };

  /**
   * Confronta due date per verificare se rappresentano lo stesso giorno.
   */
  const isSameDay = (date1, date2) => {
    return normalizeDate(date1).getTime() === normalizeDate(date2).getTime();
  };

  /**
   * Filtra le commesse per un dato giorno e per il tipo specifico ("FAT" o "Consegna").
   */
  const getCommesseForDay = (day, type) => {
    return commesse.filter((commessa) => {
      const consegna = commessa.data_consegna ? normalizeDate(commessa.data_consegna) : null;
      const fat = commessa.data_FAT ? normalizeDate(commessa.data_FAT) : null;
      if (type === 'FAT') {
        return fat && isSameDay(fat, day);
      }
      if (type === 'Consegna') {
        return consegna && isSameDay(consegna, day);
      }
      return false;
    });
  };

  /**
   * Verifica se un giorno è uguale a oggi.
   */
  const isToday = (day) => {
    return isSameDay(day, new Date());
  };

  // ------------------------------------------------------------------
  // Effetto: Fetch delle commesse dal backend
  // ------------------------------------------------------------------
  useEffect(() => {
    const getCommesse = async () => {
      try {
        setLoading(true);
        const data = await fetchCommesse();
        setCommesse(data);
      } catch (error) {
        console.error('Errore durante il recupero delle commesse:', error);
        toast.error('Errore durante il recupero delle commesse:', error);
      } finally {
        setLoading(false);
      }
    };
    getCommesse();
  }, []);

  // ------------------------------------------------------------------
  // Gestione del popup dei dettagli della commessa
  // ------------------------------------------------------------------
  const handleCommessaClick = (commessa) => {
    setSelectedCommessa(commessa);
  };

  const handleClosePopup = () => {
    setSelectedCommessa(null);
  };

  // ------------------------------------------------------------------
  // Navigazione tra i mesi: aggiornamento di currentMonth e reset del flag di scroll
  // ------------------------------------------------------------------
  const goToPreviousMonth = () => {
    setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
    hasScrolledToToday.current = false;
  };

  const goToNextMonth = () => {
    setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
    hasScrolledToToday.current = false;
  };

  // ------------------------------------------------------------------
  // Componente: CalendarDay
  // Visualizza una cella del calendario per un giorno specifico. Se il giorno è null (cella vuota),
  // viene renderizzata una cella vuota.
  // ------------------------------------------------------------------
  function CalendarDay({ day }) {
    if (!day) {
      return <td className="Calendario-commesse-empty-cell"></td>;
    }

    // Recupera le commesse per il giorno, separate per tipo "FAT" e "Consegna"
    const fatCommesse = getCommesseForDay(day, 'FAT');
    const consegnaCommesse = getCommesseForDay(day, 'Consegna');
    const todayClass = isToday(day) ? 'Calendario-commesse-today-cell' : '';
    return (
      // Se il giorno è oggi, assegna il ref per permettere lo scroll
      <td
        ref={isToday(day) ? todayRef : null}
        className={`Calendario-commesse-table-day ${todayClass}`}
      >
        <div className="Calendario-commesse-day-header">{day.getDate()}</div>

        {/* Renderizza le commesse FAT */}
        {fatCommesse.map((commessa) => (
          <div
            key={`${commessa.commessa_id}-FAT`}
            className="Calendario-commesse-event fat"
            onClick={() => handleCommessaClick(commessa)}
          >
            <span>FAT:</span>
            <br />
            <strong>{commessa.numero_commessa}</strong>
            <br />
            <span>{commessa.cliente}</span>
          </div>
        ))}

        {/* Renderizza le commesse di consegna */}
        {consegnaCommesse.map((commessa) => (
          <div
            key={`${commessa.commessa_id}-Consegna`}
            className="Calendario-commesse-event scadenza"
            onClick={() => handleCommessaClick(commessa)}
          >
            <strong>{commessa.numero_commessa}</strong>
            <br />
            <span>{commessa.cliente}</span>
          </div>
        ))}
      </td>
    );
  }

  // ------------------------------------------------------------------
  // Effetto: Scroll automatico per centrare la cella del giorno corrente
  // ------------------------------------------------------------------
  useEffect(() => {
    if (todayRef.current && containerRef.current && !hasScrolledToToday.current) {
      const containerRect = containerRef.current.getBoundingClientRect();
      const todayRect = todayRef.current.getBoundingClientRect();
      const offsetLeft = todayRect.left - containerRect.left;
      const scrollLeft = offsetLeft - containerRef.current.clientWidth / 2 + todayRect.width / 2;
      containerRef.current.scrollTo({
        left: scrollLeft,
        behavior: 'smooth',
      });
      hasScrolledToToday.current = true;
    }
  }, [weeksInMonth]);

  // ------------------------------------------------------------------
  // Rendering Principale
  // ------------------------------------------------------------------
  return (
    <div className="page-wrapper">
      <div className=" header">
        <h1>CALENDARIO COMMESSE E FAT </h1>
        <div className="flex-center header-row">
          <button onClick={goToPreviousMonth} className="btn w-50 btn--shiny btn--pill">
            <FontAwesomeIcon icon={faChevronLeft} />
          </button>
          <div className="header-row-month"> {meseCorrente}</div>
          <button onClick={goToNextMonth} className="btn w-50 btn--shiny btn--pill">
            <FontAwesomeIcon icon={faChevronRight} />
          </button>
        </div>
        <ToastContainer position="top-left" autoClose={2000} hideProgressBar />
        {loading && (
          <div className="loading-overlay">
            <img src={logo} alt="Logo" className="logo-spinner" />
          </div>
        )}
      </div>
      <div ref={containerRef} className="container">
        <table className="Calendario-commesse-table  mh-76 ">
          <thead>
            <tr>
              <th>Domenica</th>
              <th>Lunedì</th>
              <th>Martedì</th>
              <th>Mercoledì</th>
              <th>Giovedì</th>
              <th>Venerdì</th>
              <th>Sabato</th>
            </tr>
          </thead>
          <tbody>
            {weeksInMonth.map((week, weekIndex) => (
              <tr key={weekIndex}>
                {week.map((day, dayIndex) => (
                  <CalendarDay key={dayIndex} day={day} />
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        {selectedCommessa && (
          <CommessaDettagli commessa={selectedCommessa} onClose={handleClosePopup} />
        )}
      </div>
    </div>
  );
}

export default CalendarioCommesse;
