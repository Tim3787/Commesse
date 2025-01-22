import React, { useEffect, useState } from "react";
import axios from "axios";
import "./CalendarioCommesse.css";
import logo from "../assets/unitech-packaging.png";

function CalendarioCommesse() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [commesse, setCommesse] = useState([]);
  const [loading, setLoading] = useState(false);

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
      const emptyCellsStart = Array(week[0].getDay()).fill(null); // Celle vuote all'inizio
      const emptyCellsEnd = Array(6 - week[week.length - 1].getDay()).fill(null); // Celle vuote alla fine
      return [...emptyCellsStart, ...week, ...emptyCellsEnd];
    });
  };

  const weeksInMonth = getWeeksInMonth();

  useEffect(() => {
    const fetchCommesse = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/commesse`);
        setCommesse(response.data);
      } catch (error) {
        console.error("Errore durante il recupero delle commesse:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCommesse();
  }, []);

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
  
  function CalendarDay({ day }) {
    if (!day) {
      return <td className="Comm-empty-cell"></td>; // Celle vuote
    }
  
    const fatCommesse = getCommesseForDay(day, "FAT");
    const consegnaCommesse = getCommesseForDay(day, "Consegna");
    const todayClass = isToday(day) ? "Comm-today-cell" : ""; // Aggiunge la classe se è oggi

    return (
      <td className={`Comm-calendar-day ${todayClass}`}>
        <div className="Comm-day-header">{day.getDate()}</div>
  
        {fatCommesse.map((commessa) => (
          <div key={`${commessa.commessa_id}-FAT`} className="Comm-event fat">
                        <span>FAT:</span>
            <br />
            <strong>{commessa.numero_commessa}</strong>
            <br />
            <span>{commessa.cliente}</span>
          </div>
        ))}
  
        {consegnaCommesse.map((commessa) => (
          <div key={`${commessa.commessa_id}-Consegna`} className="Comm-event scadenza">
            <span>Scadenza:</span>
            <br />
            <strong>{commessa.numero_commessa}</strong>
            <br />
            <span>{commessa.cliente}</span>
          </div>
        ))}
      </td>
    );
  }
  
  return (
    <div>
      <div className="container">
        <h1>Calendario Commesse</h1>
        {loading && (
          <div className="loading-overlay">
            <img src={logo} alt="Logo" className="logo-spinner" />
          </div>
        )}

<div className="calendar-navigation">
  <button onClick={goToPreviousMonth} className="btn-Nav">
    ← Mese Precedente
  </button>
  <span className="current-month">{getMonthName()}</span>
  <button onClick={goToNextMonth} className="btn-Nav">
    Mese Successivo →
  </button>
</div>


        <div className="Comm-table-container">
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
        </div>
      </div>
    </div>
  );
}

export default CalendarioCommesse;
