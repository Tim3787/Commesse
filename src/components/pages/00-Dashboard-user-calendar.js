import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import logo from '../img/Animation - 1738249246846.gif';
import '../style/00-Dashboard-user.css';
import SezioneSchede from '../assets/SezioneSchede.js';
import SchedaTecnica from '../popup/SchedaTecnicaEdit.js';

// Import icone FontAwesome
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';

// Import API per le varie entità
import { updateActivityStatusAPI, updateActivityNotes } from '../services/API/notifiche-api.js';
import { fetchFATDates } from '../services/API/commesse-api.js';
import { fetchDashboardActivities } from '../services/API/dashboard-api.js';
import { fetchUserName } from '../services/API/utenti-api.js';
import { fetchClientiSpecifiche } from '../services/API/clientiSpecifiche-api';

// Import per Toastify (notifiche)
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
/**
 * Componente Dashboard
 * Visualizza una dashboard con le attività del mese, organizzate in un calendario.
 * Permette di navigare tra i mesi, aggiornare lo stato delle attività e gestire note.
 */

function DashboardCalendar() {
  // ------------------------------------------------------------------
  // Stati e Ref
  // ------------------------------------------------------------------
  const [currentMonth, setCurrentMonth] = useState(new Date()); // Mese attualmente visualizzato
  const [monthlyActivities, setMonthlyActivities] = useState([]); // Attività del mese corrente
  const [loading, setLoading] = useState(false); // Stato di caricamento generale
  const [userName, setUserName] = useState('Utente'); // Nome dell'utente
  const token = sessionStorage.getItem('token'); // Token JWT salvato in sessionStorage
  const [allFATDates, setAllFATDates] = useState([]); // Elenco delle commesse con FAT
  const daysRefs = useRef([]); // Ref per ogni giorno della dashboard (per lo scroll)
  const today = formatDateOnly(new Date()); // Data di oggi in formato locale
  const [noteUpdates, setNoteUpdates] = useState({}); // Stato per gestire aggiornamenti temporanei delle note
  const calendarRef = useRef();
  const [schedeAperte, setSchedeAperte] = useState({});
  const [popupScheda, setPopupScheda] = useState(null);
  const [schedaInModifica, setSchedaInModifica] = useState(null);
  const [hasScrolledToToday, setHasScrolledToToday] = useState(false);
  const navigate = useNavigate();

  const CLOSED_PREFIX = '[CHIUSA] ';
  const CLOSED_RE = /^\[CHIUSA\]\s*/i; // parentesi quadre escapse, spazio opzionale

  const isClosedNote = (text) => CLOSED_RE.test(text ?? '');

  const closeNoteText = (text) =>
    isClosedNote(text) ? text : `${CLOSED_PREFIX}${text || ''}`.trim();

  const reopenNoteText = (text) => (text ?? '').replace(CLOSED_RE, '');

  // ------------------------------------------------------------------
  // Funzione helper: calcola tutti i giorni del mese dato un oggetto Date
  // ------------------------------------------------------------------
  const getDaysInMonth = (date) => {
    const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    const days = [];
    for (let i = 1; i <= endOfMonth.getDate(); i++) {
      days.push(new Date(date.getFullYear(), date.getMonth(), i));
    }
    return days;
  };
  const daysInMonth = getDaysInMonth(currentMonth);
  const meseCorrente =
    daysInMonth.length > 0
      ? daysInMonth[0]
          .toLocaleDateString('it-IT', { month: 'long', year: 'numeric' })
          .replace(/^./, (c) => c.toUpperCase())
      : '';
  // ------------------------------------------------------------------
  // Helper per formattare date in YYYY-MM-DD senza shift
  // ------------------------------------------------------------------
  function formatDateOnly(dateObj) {
    const y = dateObj.getFullYear();
    const m = String(dateObj.getMonth() + 1).padStart(2, '0');
    const d = String(dateObj.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  // ------------------------------------------------------------------
  // Helper per normalizzare date
  // ------------------------------------------------------------------
  const normalizeDate = (dateObj) => {
    return new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate());
  };

  // ------------------------------------------------------------------
  // Calcola le date valide di un'attività includendo weekend selezionati
  // ------------------------------------------------------------------
  const getActivityDates = (activity) => {
    const dates = [];
    const start = normalizeDate(new Date(activity.data_inizio));
    const total = Number(activity.durata) || 0;
    let cursor = new Date(start);

    while (dates.length < total) {
      const wd = cursor.getDay(); // 0=Dom,6=Sab
      if (wd >= 1 && wd <= 5) {
        dates.push(new Date(cursor));
      } else {
        // weekend: includi solo se nel campo includedWeekends
        const iso = formatDateOnly(cursor);
        if (activity.includedWeekends?.includes(iso)) {
          dates.push(new Date(cursor));
        }
      }
      cursor.setDate(cursor.getDate() + 1);
    }
    return dates;
  };

  // ------------------------------------------------------------------
  // Funzione helper: restituisce le attività per un determinato giorno
  // ------------------------------------------------------------------
  const getActivitiesForDay = (day) => {
    const isoDay = formatDateOnly(normalizeDate(day));
    return monthlyActivities.filter((activity) => {
      return getActivityDates(activity)
        .map((d) => formatDateOnly(d))
        .includes(isoDay);
    });
  };

  // ------------------------------------------------------------------
  // Effetto: Scrolla automaticamente al giorno corrente se non già fatto
  // ------------------------------------------------------------------
  useEffect(() => {
    if (hasScrolledToToday) return;

    const todayIndex = daysInMonth.findIndex(
      (d) => formatDateOnly(d) === formatDateOnly(new Date())
    );

    if (todayIndex !== -1 && daysRefs.current[todayIndex]) {
      const todayEl = daysRefs.current[todayIndex];
      const scrollContainer = calendarRef.current;

      const offset = 200;

      setTimeout(() => {
        scrollContainer.scrollTo({
          top: todayEl.offsetTop - offset,
          behavior: 'smooth',
        });

        setHasScrolledToToday(true);
      }, 200); // oppure 100ms se serve un piccolo ritardo in più
    }
  }, [daysInMonth, hasScrolledToToday]);

  // ------------------------------------------------------------------
  // Effetto: Carica le attività della dashboard per il mese corrente
  // ------------------------------------------------------------------
  useEffect(() => {
    const monthStartDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const fetchData = async () => {
      try {
        setLoading(true);
        const activities = await fetchDashboardActivities(monthStartDate, token);
        setMonthlyActivities(
          activities.map((a) => ({
            ...a,
            includedWeekends: a.included_weekends || [], // normalizza
            clientHasSpecs: a.client_has_specs ?? false,
          }))
        );
      } catch (error) {
        console.error('Errore durante il recupero delle attività mensili:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [currentMonth, token]);

  // ------------------------------------------------------------------
  // Effetto: Carica le date FAT (commesse con FAT) dal backend
  // ------------------------------------------------------------------
  useEffect(() => {
    const fetchFATData = async () => {
      try {
        const fatDates = await fetchFATDates(token);
        setAllFATDates(fatDates);
      } catch (error) {
        console.error('Errore durante il recupero delle commesse con FAT:', error);
      }
    };
    fetchFATData();
  }, [token]);

  // ------------------------------------------------------------------
  // Effetto: Recupera il nome dell'utente
  // ------------------------------------------------------------------
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const user = await fetchUserName(token);
        setUserName(user);
      } catch (error) {
        console.error('Errore durante il recupero del nome utente:', error);
      }
    };
    fetchUserData();
  }, [token]);

  // ------------------------------------------------------------------
  // Navigazione tra i mesi
  // ------------------------------------------------------------------
  const goToPreviousMonth = () => {
    setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  // ------------------------------------------------------------------
  // Stato per il caricamento individuale delle attività (per pulsanti, ecc.)
  // ------------------------------------------------------------------
  const [loadingActivities, setLoadingActivities] = useState({});

  // ------------------------------------------------------------------
  // Specifiche cliente
  // ------------------------------------------------------------------

  const [clienteSpecsPopup, setClienteSpecsPopup] = useState({
    open: false,
    loading: false,
    error: null,
    specs: [],
    clienteLabel: '',
    repartoId: null,
  });

  // ------------------------------------------------------------------
  // Funzione per aggiornare lo stato di un'attività (es. da "non iniziata" a "iniziata" o "completata")
  // ------------------------------------------------------------------
  const updateActivityStatus = async (activityId, newStatus) => {
    setLoadingActivities((prev) => ({ ...prev, [activityId]: true }));
    try {
      await updateActivityStatusAPI(activityId, newStatus, token);
      // Aggiorna localmente lo stato dell'attività
      setMonthlyActivities((prev) =>
        prev.map((activity) =>
          activity.id === activityId ? { ...activity, stato: newStatus } : activity
        )
      );
    } catch (error) {
      console.error("Errore durante l'aggiornamento dello stato dell'attività:", error);
      alert("Si è verificato un errore durante l'aggiornamento dello stato.");
    } finally {
      setLoadingActivities((prev) => ({ ...prev, [activityId]: false }));
    }
  };

  // ------------------------------------------------------------------
  // Gestione delle note per le attività
  // ------------------------------------------------------------------
  const handleNoteChange = (activityId, note) => {
    setNoteUpdates((prev) => ({ ...prev, [activityId]: note }));
  };

  const saveNote = async (activityId) => {
    try {
      const current = monthlyActivities.find((a) => a.id === activityId);
      const text = noteUpdates[activityId] ?? current?.note ?? '';

      // Se la nota è chiusa, mantieni il prefisso anche se l’utente l’ha rimosso
      const finalText = isClosedNote(current?.note) ? closeNoteText(text) : text;

      await updateActivityNotes(activityId, finalText, token);
      toast.success('Nota aggiornata con successo!');
      setMonthlyActivities((prev) =>
        prev.map((a) => (a.id === activityId ? { ...a, note: finalText } : a))
      );
      setNoteUpdates((prev) => ({ ...prev, [activityId]: finalText }));
    } catch (error) {
      console.error('Errore durante il salvataggio della nota:', error);
      toast.error('Errore durante il salvataggio della nota.');
    }
  };

  const deleteNote = async (activityId) => {
    const first = window.confirm(`ATTENZIONE: vuoi ELIMINARE DEFINITIVAMENTE?`);
    if (!first) return;

    const second = window.confirm("Conferma finale: l'operazione è irreversibile. Continuare?");
    if (!second) return;
    try {
      // Invia null per eliminare la nota sul backend
      await updateActivityNotes(activityId, null, token);
      toast.success('Nota eliminata con successo!');
      // Aggiorna lo stato locale rimuovendo la nota
      setMonthlyActivities((prev) =>
        prev.map((activity) =>
          activity.id === activityId ? { ...activity, note: null } : activity
        )
      );
      setNoteUpdates((prev) => ({ ...prev, [activityId]: '' }));
    } catch (error) {
      console.error("Errore durante l'eliminazione della nota:", error);
      toast.error("Errore durante l'eliminazione della nota.");
    }
  };

  // Chiudi la nota associata a un'attività (senza cancellarla)
  const closeNote = async (activityId) => {
    try {
      const activity = monthlyActivities.find((a) => a.id === activityId);
      if (!activity) return;

      const newText = closeNoteText(activity.note);
      await updateActivityNotes(activityId, newText, token);

      toast.success('Nota chiusa con successo!');
      setMonthlyActivities((prev) =>
        prev.map((a) => (a.id === activityId ? { ...a, note: newText } : a))
      );

      // Se stavi editando la textarea, sincronizza anche il buffer locale
      setNoteUpdates((prev) => ({ ...prev, [activityId]: newText }));
    } catch (error) {
      console.error('Errore durante la chiusura della nota:', error);
      toast.error('Errore durante la chiusura della nota.');
    }
  };

  // (Opzionale) Riapri la nota se serve
  const reopenNote = async (activityId) => {
    try {
      const activity = monthlyActivities.find((a) => a.id === activityId);
      if (!activity) return;

      const newText = reopenNoteText(activity.note);
      await updateActivityNotes(activityId, newText, token);

      toast.success('Nota riaperta!');
      setMonthlyActivities((prev) =>
        prev.map((a) => (a.id === activityId ? { ...a, note: newText } : a))
      );
      setNoteUpdates((prev) => ({ ...prev, [activityId]: newText }));
    } catch (error) {
      console.error('Errore durante la riapertura della nota:', error);
      toast.error('Errore durante la riapertura della nota.');
    }
  };

  // ------------------------------------------------------------------
  // Schede
  // ------------------------------------------------------------------
  const toggleSchede = (commessaId) => {
    setSchedeAperte((prev) => ({
      ...prev,
      [commessaId]: !prev[commessaId],
    }));
  };

  const apriPopupScheda = ({ commessaId, numero_commessa, schedaInModifica }) => {
    setPopupScheda({ commessaId, numero_commessa });
    setSchedaInModifica(schedaInModifica || null);
    setSchedeAperte((prev) => ({
      ...prev,
      [commessaId]: false,
    }));
  };

  // ------------------------------------------------------------------
  // Specifiche cliente
  // ------------------------------------------------------------------

  const openClienteSpecs = async (clienteFull, repartoId) => {
    // Apri subito il popup in loading
    setClienteSpecsPopup({
      open: true,
      loading: true,
      error: null,
      specs: [],
      clienteLabel: clienteFull,
      repartoId,
    });

    try {
      // 🔎 chiamata API: filtra per cliente e reparto
      const data = await fetchClientiSpecifiche({
        cliente: clienteFull,
        reparto_id: repartoId,
      });

      setClienteSpecsPopup((prev) => ({
        ...prev,
        loading: false,
        specs: data,
      }));
    } catch (e) {
      console.error('Errore caricamento specifiche cliente', e);
      setClienteSpecsPopup((prev) => ({
        ...prev,
        loading: false,
        error: 'Errore durante il caricamento delle specifiche.',
      }));
    }
  };

  const closeClienteSpecs = () => {
    setClienteSpecsPopup({
      open: false,
      loading: false,
      error: null,
      specs: [],
      clienteLabel: '',
      repartoId: null,
    });
  };

  // ------------------------------------------------------------------
  // Rendering del componente Dashboard
  // ------------------------------------------------------------------
  return (
    <div>
      <div className="container">
        <div className="flex-column-center">
          {/* Intestazione */}
          <h1>CALENDARIO PERSONALE</h1>
          <h1> {userName}</h1>
        </div>
        <div className="flex-column-center">
          <button className="btn btn--pill w-400 btn--blue" onClick={() => navigate('/dashboard')}>
            Vai alla bacheca personale
          </button>
        </div>
        <ToastContainer position="top-left" autoClose={2000} hideProgressBar />
        {/* Navigazione tra i mesi */}
        <div className="flex-center header-row">
          <button onClick={goToPreviousMonth} className="btn w-50 h-30 btn--shiny btn--pill">
            <FontAwesomeIcon icon={faChevronLeft} />
          </button>
          <div className="header-row-month"> {meseCorrente}</div>
          <button onClick={goToNextMonth} className="btn w-50 h-30 btn--shiny btn--pill">
            <FontAwesomeIcon icon={faChevronRight} />
          </button>
        </div>

        {/* Overlay di caricamento */}
        {loading && (
          <div className="loading-overlay">
            <img src={logo} alt="Logo" className="logo-spinner" />
          </div>
        )}

        <hr style={{ margin: '10px 0' }} />

        {/* Calendario: per ogni giorno del mese viene renderizzata una "cella" */}
        <div className="user-calendar" ref={calendarRef}>
          {daysInMonth.map((day, index) => {
            // Determina se il giorno è weekend e/o oggi
            const isWeekend = day.getDay() === 0 || day.getDay() === 6;
            const isToday = formatDateOnly(day) === today;
            return (
              <div
                key={index}
                className={`calendar-day ${isToday ? 'user-calendar-today' : ''} ${
                  isWeekend ? 'user-calendar-weekend' : ''
                }`}
                ref={(el) => (daysRefs.current[index] = el)}
              >
                <div className="day-header">
                  <strong>
                    {day.toLocaleDateString('it-IT', {
                      weekday: 'long',
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                    })}
                  </strong>
                </div>

                {/* Sezione attività: per il giorno corrente vengono mostrate le attività associate */}

                {getActivitiesForDay(day).length > 0 ? (
                  getActivitiesForDay(day).map((activity) => {
                    // Imposta una classe in base allo stato dell'attività
                    const activityClass =
                      activity.stato === 0
                        ? 'activity not-started'
                        : activity.stato === 1
                          ? 'activity started'
                          : 'activity completed';
                    // Controlla se l'attività riguarda una trasferta (logica specifica)
                    const isTrasferta = activity.nome_attivita?.toLowerCase().includes('trasferta');

                    return (
                      <div
                        key={activity.id}
                        className={`activity ${activityClass}`}
                        style={{ minWidth: '200px' }}
                      >
                        <div className="flex-column-center">
                          {/* Se l'attività è completata e contiene una nota, mostra un'icona di warning */}
                          {activity.stato === 2 &&
                            activity.note &&
                            !isClosedNote(activity.note) && (
                              <span
                                className="warning-icon"
                                title="Nota presente nell'attività completata"
                              >
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
                          <strong>Commessa: {activity.numero_commessa} </strong>
                          <strong>Attività: {activity.nome_attivita}</strong>
                          <strong>Descrizione: {activity.descrizione}</strong>

                          {activity.clientHasSpecs && (
                            <div className="flex-column-center">
                              <span className="client-specs-text">
                                <strong>Cliente con specifiche particolari. 👈</strong>
                              </span>
                              <button
                                className="btn w-100 btn--warning btn--pill"
                                onClick={() =>
                                  openClienteSpecs(activity.cliente, activity.reparto_id)
                                }
                              >
                                Vedi specifiche
                              </button>
                            </div>
                          )}
                          {isTrasferta && (
                            <span className="trasferta-icon" title="Trasferta">
                              🚗
                            </span>
                          )}
                        </div>

                        {/* Azioni relative all'attività: in base allo stato vengono mostrate le azioni appropriate */}
                        <div className="flex-column-center">
                          {activity.stato === 1 && (
                            <>
                              <span className="dashboasrd-user-activity-status">
                                Attività iniziata
                              </span>
                              <button
                                className="btn w-100 btn--complete btn--pill"
                                onClick={() => updateActivityStatus(activity.id, 2)}
                              >
                                Completa ✅
                              </button>
                            </>
                          )}
                          {activity.stato === 2 && (
                            <span className="dashboasrd-user-activity-status">
                              Attività completata
                            </span>
                          )}
                          {activity.stato === 0 && (
                            <>
                              <span className="dashboasrd-user-activity-status">
                                Attività non iniziata
                              </span>
                              <button
                                className="btn w-100 btn--start btn--pill"
                                onClick={() => updateActivityStatus(activity.id, 1)}
                                disabled={loadingActivities[activity.id]}
                              >
                                {loadingActivities[activity.id] ? 'Caricamento...' : 'Inizia'}
                              </button>
                              <button
                                className="btn w-100 btn--complete btn--pill"
                                onClick={() => updateActivityStatus(activity.id, 2)}
                                disabled={loadingActivities[activity.id]}
                              >
                                {loadingActivities[activity.id] ? 'Caricamento...' : 'Completa '}
                              </button>
                            </>
                          )}
                        </div>

                        {/* Sezione note: textarea per aggiungere/modificare una nota e pulsanti per salvare o eliminare */}
                        <div className="flex-column-center">
                          {(() => {
                            const isClosed = isClosedNote(activity.note);
                            return (
                              <textarea
                                placeholder={isClosed ? 'Nota chiusa' : 'Aggiungi una nota...'}
                                className={`textarea w-200 ${isClosed ? 'is-locked' : ''}`}
                                value={
                                  noteUpdates[activity.id] !== undefined
                                    ? noteUpdates[activity.id]
                                    : activity.note || ''
                                }
                                onChange={(e) => {
                                  if (!isClosed) handleNoteChange(activity.id, e.target.value);
                                }}
                                readOnly={isClosed}
                                aria-readonly={isClosed}
                              />
                            );
                          })()}

                          <div className="flex-column-center">
                            {!isClosedNote(activity.note) && (
                              <button
                                className="btn w-100 btn--blue btn--pill"
                                onClick={() => saveNote(activity.id)}
                              >
                                Salva Nota
                              </button>
                            )}

                            {activity.note && !isClosedNote(activity.note) && (
                              <button
                                className="btn w-100 btn--danger btn--pill "
                                onClick={() => closeNote(activity.id)}
                              >
                                Chiudi nota
                              </button>
                            )}

                            {isClosedNote(activity.note) && (
                              <span className="badge badge--muted">Nota chiusa</span>
                            )}
                            {/* opzionale riapertura */}
                            {isClosedNote(activity.note) && (
                              <button
                                className="btn w-100 btn--blue btn--pill "
                                onClick={() => reopenNote(activity.id)}
                              >
                                Riapri nota
                              </button>
                            )}
                            {activity.note && (
                              <button
                                className="btn w-100 btn--danger btn--pill "
                                onClick={() => deleteNote(activity.id)}
                              >
                                Elimina Nota
                              </button>
                            )}
                          </div>
                        </div>
                        <div className="flex-column-center">
                          <button
                            className="btn btn-100 btn--blue btn--pill"
                            onClick={() => toggleSchede(activity.commessa_id)}
                          >
                            {schedeAperte[activity.commessa_id]
                              ? 'Nascondi schede'
                              : 'Mostra schede'}
                          </button>

                          {schedeAperte[activity.commessa_id] && (
                            <SezioneSchede
                              commessaId={activity.commessa_id}
                              numero_commessa={activity.numero_commessa}
                              apriPopupScheda={apriPopupScheda}
                            />
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div></div>
                )}

                {/* Sezione FAT: visualizza le commesse con FAT se la data FAT corrisponde al giorno */}
                <div className="fat-dates">
                  {allFATDates
                    .filter((commessa) => {
                      const fatDate = new Date(commessa.data_FAT).toLocaleDateString();
                      return fatDate === day.toLocaleDateString();
                    })
                    .map((commessa) => (
                      <div key={commessa.commessa_id} className="fat">
                        <strong>FAT commessa:</strong> {commessa.numero_commessa}
                      </div>
                    ))}
                </div>

                {clienteSpecsPopup.open && (
                  <div className="modal-overlay" onClick={closeClienteSpecs}>
                    <div
                      className="modal"
                      onClick={(e) => e.stopPropagation()} // evita chiusura cliccando dentro
                    >
                      <h2>
                        Specifiche cliente
                        <br />
                        <span className="modal-subtitle">{clienteSpecsPopup.clienteLabel}</span>
                      </h2>

                      {clienteSpecsPopup.loading && <p>Caricamento specifiche...</p>}

                      {clienteSpecsPopup.error && (
                        <p className="modal-error">{clienteSpecsPopup.error}</p>
                      )}

                      {!clienteSpecsPopup.loading && !clienteSpecsPopup.error && (
                        <>
                          {clienteSpecsPopup.specs.length === 0 ? (
                            <p>Nessuna specifica trovata per questo cliente/reparto.</p>
                          ) : (
                            <div className="specs-list">
                              {clienteSpecsPopup.specs.map((spec) => (
                                <div key={spec.id} className="spec-card">
                                  <h3>{spec.titolo}</h3>
                                  <p>{spec.descrizione}</p>
                                </div>
                              ))}
                            </div>
                          )}
                        </>
                      )}

                      <div className="modal-actions">
                        <button className="btn btn--pill btn--blue" onClick={closeClienteSpecs}>
                          Chiudi
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
      {popupScheda && (
        <SchedaTecnica
          editable={true}
          commessaId={popupScheda.commessaId}
          numero_commessa={popupScheda.numero_commessa}
          schedaInModifica={schedaInModifica}
          setSchedaInModifica={setSchedaInModifica}
          onClose={() => {
            setPopupScheda(null);
            setSchedaInModifica(null);
          }}
        />
      )}
    </div>
  );
}

export default DashboardCalendar;
