// src/utils/dateUtils.js

/**
 * Calcola i giorni in un determinato mese, includendo i giorni precedenti e successivi
 * per completare la settimana (da lunedì a domenica).
 *
 * @param {Date} currentMonth - La data per il mese da calcolare.
 * @returns {Date[]} Un array di oggetti Date che rappresentano il mese e i giorni esterni.
 */
export const getDaysInMonth = (currentMonth) => {
  const days = [];
  const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
  const endOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);

  // Trova il giorno della settimana del primo giorno del mese (0 = Domenica, 6 = Sabato)
  const startDayOfWeek = startOfMonth.getDay();
  const endDayOfWeek = endOfMonth.getDay();

  // Aggiungi i giorni del mese precedente fino all'inizio della settimana
  if (startDayOfWeek !== 1) {
    // Se non è lunedì
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
  if (endDayOfWeek !== 0) {
    // Se non è domenica
    for (let i = 1; i <= 6 - endDayOfWeek; i++) {
      const nextDate = new Date(endOfMonth);
      nextDate.setDate(endOfMonth.getDate() + i);
      days.push(nextDate);
    }
  }

  return days;
};
