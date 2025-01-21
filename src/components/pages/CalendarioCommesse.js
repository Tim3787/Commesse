import React, { useEffect, useState } from "react";
import axios from "axios";
import "./CalendarioCommesse.css";
import logo from "../assets/unitech-packaging.png";

function CalendarioCommesse() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [commesse, setCommesse] = useState([]);
  const [loading, setLoading] = useState(false);
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
    const fetchCommesse = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/commesse`);
        console.log("Dati ricevuti:", response.data); // Aggiungi questo
        setCommesse(response.data);
        setFilteredCommesse(response.data);
      } catch (error) {
        console.error("Errore durante il recupero delle commesse:", error);
      } finally {
        setLoading(false);
      }
    };
  
    fetchCommesse();
  }, []);
  

  // Funzioni per navigare tra i mesi
  const goToPreviousMonth = () => {
    setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
    setFilteredCommesse([]);
  };
  
  const goToNextMonth = () => {
    setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
    setFilteredCommesse([]);
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

  const getCommesseForDay = (day) => {
    return commesse.filter((commessa) => {
      const consegna = commessa.data_consegna ? normalizeDate(commessa.data_consegna) : null;
  
      return consegna && isSameDay(consegna, day);
    });
  };
  
  
  
  function CalendarDay({ day }) {
    const commesseForDay = getCommesseForDay(day);
  
    return (
      <td>
        {commesseForDay.length === 0 ? (
          <span className="no-event">Nessuna commessa</span>
        ) : (
          commesseForDay.map((commessa) => (
            <div key={commessa.commessa_id} className="event">
              <strong>{commessa.numero_commessa}</strong>
              <br />
              <span>{commessa.cliente}</span>
            </div>
          ))
        )}
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
          <button onClick={goToNextMonth} className="btn-Nav">
            Mese Successivo →
          </button>
        </div>

        <div className="Comm-table-container">
          <table className="Comm-schedule">
            <thead>
              <tr>
                {daysInMonth.map((day, index) => (
                  <th key={index}>{day.toLocaleDateString()}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                {daysInMonth.map((day, index) => (
                  <CalendarDay key={index} day={day} />
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default CalendarioCommesse;
