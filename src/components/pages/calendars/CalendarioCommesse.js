import React, { useEffect, useState, useRef } from "react";
import "./CalendarioCommesse.css";
import logo from "../../img/Animation - 1738249246846.gif";
import { fetchCommesse } from "../../services/API/commesse-api";
import "react-toastify/dist/ReactToastify.css";
import { ToastContainer, toast } from "react-toastify";
import CommessaDettagli from "../../popup/CommessaDettagli";  

function CalendarioCommesse() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [commesse, setCommesse] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedCommessa, setSelectedCommessa] = useState(null);
  // Ref per la cella di oggi, flag per evitare scroll multipli e ref per il container scrollabile
  const todayRef = useRef(null);
  const hasScrolledToToday = useRef(false);
  const containerRef = useRef(null);

  const getDaysInMonth = () => {
    const days = [];
    const start = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const end = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);

    for (let d = start; d <= end; d.setDate(d.getDate() + 1)) {
      days.push(new Date(d));
    }
    return days;
  };

  const getMonthName = () => {
    const monthNames = [
      "Gennaio",
      "Febbraio",
      "Marzo",
      "Aprile",
      "Maggio",
      "Giugno",
      "Luglio",
      "Agosto",
      "Settembre",
      "Ottobre",
      "Novembre",
      "Dicembre",
    ];
    return `${monthNames[currentMonth.getMonth()]} ${currentMonth.getFullYear()}`;
  };

  const getWeeksInMonth = () => {
    const days = getDaysInMonth();
    const weeks = [];
    let currentWeek = [];

    days.forEach((day) => {
      if (currentWeek.length === 0 || day.getDay() !== 0) {
        currentWeek.push(day);
      } else {
        weeks.push(currentWeek);
        currentWeek = [day];
      }
    });

    if (currentWeek.length > 0) {
      weeks.push(currentWeek);
    }

    return weeks.map((week) => {
      const emptyCellsStart = Array(week[0].getDay()).fill(null); // celle vuote all'inizio
      const emptyCellsEnd = Array(6 - week[week.length - 1].getDay()).fill(null); // celle vuote alla fine
      return [...emptyCellsStart, ...week, ...emptyCellsEnd];
    });
  };

  const weeksInMonth = getWeeksInMonth();

  useEffect(() => {
    const getCommesse = async () => {
      try {
        setLoading(true);
        const data = await fetchCommesse();
        setCommesse(data);
      } catch (error) {
        console.error("Errore durante il recupero delle commesse:", error);
        toast.error("Errore durante il recupero delle commesse:", error);
      } finally {
        setLoading(false);
      }
    };

    getCommesse();
  }, []);

  const handleCommessaClick = (commessa) => {
    setSelectedCommessa(commessa);
  };

  const handleClosePopup = () => {
    setSelectedCommessa(null);
  };

  const goToPreviousMonth = () => {
    setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
    // Resetta il flag per consentire il nuovo scroll se il mese corrente contiene la data di oggi
    hasScrolledToToday.current = false;
  };

  const goToNextMonth = () => {
    setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
    hasScrolledToToday.current = false;
  };

  const normalizeDate = (date) => {
    const normalized = new Date(date);
    normalized.setHours(0, 0, 0, 0);
    return normalized;
  };

  const isSameDay = (date1, date2) => {
    const d1 = normalizeDate(new Date(date1));
    const d2 = normalizeDate(new Date(date2));
    return d1.getTime() === d2.getTime();
  };

  const getCommesseForDay = (day, type) => {
    return commesse.filter((commessa) => {
      const consegna = commessa.data_consegna ? normalizeDate(commessa.data_consegna) : null;
      const fat = commessa.data_FAT ? normalizeDate(commessa.data_FAT) : null;

      if (type === "FAT") {
        return fat && isSameDay(fat, day);
      }
      if (type === "Consegna") {
        return consegna && isSameDay(consegna, day);
      }
      return false;
    });
  };

  const isToday = (day) => {
    const today = new Date();
    return (
      day.getDate() === today.getDate() &&
      day.getMonth() === today.getMonth() &&
      day.getFullYear() === today.getFullYear()
    );
  };

  // Componente per la visualizzazione di una cella del calendario
  function CalendarDay({ day }) {
    if (!day) {
      return <td className="Comm-empty-cell"></td>;
    }

    const fatCommesse = getCommesseForDay(day, "FAT");
    const consegnaCommesse = getCommesseForDay(day, "Consegna");
    const todayClass = isToday(day) ? "Comm-today-cell" : "";
    return (
      // Se la cella rappresenta oggi, assegna il ref per poterci scrollare sopra
      <td ref={isToday(day) ? todayRef : null} className={`Comm-calendar-day ${todayClass}`}>
        <div className="Comm-day-header">{day.getDate()}</div>

        {fatCommesse.map((commessa) => (
          <div key={`${commessa.commessa_id}-FAT`} className="Comm-event fat"onClick={() => handleCommessaClick(commessa)}>
            <span>FAT:</span>
            <br />
            <strong>{commessa.numero_commessa}</strong>
            <br />
            <span>{commessa.cliente}</span>
          </div>
        ))}

        {consegnaCommesse.map((commessa) => (
          <div key={`${commessa.commessa_id}-Consegna`} className="Comm-event scadenza"onClick={() => handleCommessaClick(commessa)}>
            <strong>{commessa.numero_commessa}</strong>
            <br />
            <span>{commessa.cliente}</span>
          </div>
        ))}
      </td>
    );
  }

  // useEffect per eseguire lo scroll al container in modo che la cella di oggi sia centrata
  useEffect(() => {
    if (todayRef.current && containerRef.current && !hasScrolledToToday.current) {
      // Calcola la posizione della cella di oggi rispetto al container
      const containerRect = containerRef.current.getBoundingClientRect();
      const todayRect = todayRef.current.getBoundingClientRect();
      const offsetLeft = todayRect.left - containerRect.left;
      const scrollLeft = offsetLeft - containerRef.current.clientWidth / 2 + todayRect.width / 2;

      containerRef.current.scrollTo({
        left: scrollLeft,
        behavior: "smooth",
      });
      hasScrolledToToday.current = true;
    }
  }, [weeksInMonth]);

  return (
    <div>
      <div className="container-Scroll">
        <h1>Calendario Commesse</h1>
        <ToastContainer position="top-left" autoClose={3000} hideProgressBar />
        {loading && (
          <div className="loading-overlay">
            <img src={logo} alt="Logo" className="logo-spinner" />
          </div>
        )}

        <div className="calendar-navigation">
          <button onClick={goToPreviousMonth} className="btn-Nav">
            ← Mese
          </button>
          
          <button onClick={goToNextMonth} className="btn-Nav">
            Mese →
          </button>
          <span className="current-month">{getMonthName()}</span>
        </div>

        {/* Assicurati che il container abbia overflow-x abilitato */}
        <div ref={containerRef} className="Comm-table-container">
          <table className="Comm-schedule">
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
          {selectedCommessa && <CommessaDettagli commessa={selectedCommessa} onClose={handleClosePopup} />}
        </div>
      </div>
    </div>
  );
}

export default CalendarioCommesse;
