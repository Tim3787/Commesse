import { useEffect, useState, useRef } from 'react';
import apiClient from '../src/components/config/axiosConfig';
import logo from '../img/Animation - 1738249246846.gif';
import AttivitaCrea from '../src/components/popup/AttivitaCrea';
import '../style/02-Dashboard-reparto.css';

import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';

import { getDaysInMonth } from '../src/components/assets/date';
import { deleteAttivitaCommessa } from '../src/components/services/API/attivitaCommesse-api';

// ====== CONFIG ======
const SERVICE_REPARTO_ID = 18;
const SERVICE_ONLINE_RISORSA_ID = 52;
const LANES_COUNT = 7;

// YYYY-MM-DD puro
function formatDateOnly(dateObj) {
  const y = dateObj.getFullYear();
  const m = String(dateObj.getMonth() + 1).padStart(2, '0');
  const d = String(dateObj.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
const normalizeDate = (date) => {
  const localDate = new Date(date);
  return new Date(localDate.getFullYear(), localDate.getMonth(), localDate.getDate());
};
const toLocalISOString = (date) => formatDateOnly(normalizeDate(date));

// ============================
// COMPONENTE: DashboardReparto
// ============================
function DashboardService() {
  const token = sessionStorage.getItem('token');

  const [loading, setLoading] = useState(false);

  const [activities, setActivities] = useState([]);
  const [commesse, setCommesse] = useState([]);
  const [reparti, setReparti] = useState([]);
  const [attivitaConReparto, setAttivitaConReparto] = useState([]);

  const [showPopup, setShowPopup] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);

  const [formData, setFormData] = useState({
    commessa_id: '',
    reparto_id: SERVICE_REPARTO_ID,
    risorsa_id: SERVICE_ONLINE_RISORSA_ID,
    attivita_id: '',
    data_inizio: '',
    durata: 1,
    stato: '',
    descrizione: '',
    includedWeekends: [],
    service_lane: 1,
  });

  // mese / giorni
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const daysInMonth = getDaysInMonth(currentMonth);
  const meseCorrente = currentMonth
    .toLocaleDateString('it-IT', { month: 'long', year: 'numeric' })
    .replace(/^./, (c) => c.toUpperCase());

  const todayRef = useRef(null);
  const containerRef = useRef(null);

  // =============== FETCH PRINCIPALE (service-calendar) ===============
  const fetchServiceCalendar = async () => {
    const from = formatDateOnly(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1));
    const to = formatDateOnly(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0));

    const res = await apiClient.get(
      `/api/attivita_commessa/service-calendar?from=${from}&to=${to}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    setActivities(res.data || []);
  };

  // dati generali per popup (commesse, reparti, attivita)
  const fetchCommonData = async () => {
    const [commesseRes, repartiRes, attivitaRes] = await Promise.all([
      apiClient.get('/api/commesse'),
      apiClient.get('/api/reparti'),
      apiClient.get('/api/attivita'),
    ]);

    setCommesse(commesseRes.data || []);
    setReparti(repartiRes.data || []);

    const mapped = (attivitaRes.data || []).map((a) => ({
      id: a.id,
      nome_attivita: a.nome || a.nome_attivita || 'Nome non disponibile',
      reparto_id: a.reparto_id,
    }));
    setAttivitaConReparto(mapped);
  };

  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true);
        await Promise.all([fetchCommonData(), fetchServiceCalendar()]);
      } catch (e) {
        console.error(e);
        toast.error('Errore caricamento calendario assistenze');
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [currentMonth]);

  // =============== SCROLL / NAV MESE ===============
  const scrollToToday = () => {
    const today = new Date();
    if (
      currentMonth.getMonth() !== today.getMonth() ||
      currentMonth.getFullYear() !== today.getFullYear()
    ) {
      setCurrentMonth(today);
      setTimeout(() => scrollToToday(), 120);
      return;
    }
    if (todayRef.current && containerRef.current) {
      const containerRect = containerRef.current.getBoundingClientRect();
      const todayRect = todayRef.current.getBoundingClientRect();
      const offsetLeft = todayRect.left - containerRect.left;
      const scrollLeft = offsetLeft - containerRef.current.clientWidth / 2 + todayRect.width / 2;
      containerRef.current.scrollTo({ left: scrollLeft, behavior: 'smooth' });
    }
  };

  const goToPreviousMonth = () =>
    setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  const goToNextMonth = () =>
    setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));

  // =============== HELPERS ATTIVITA SU CELLA ===============
  const getActivitiesForLaneAndDay = (lane, day) => {
    const isoDay = formatDateOnly(day);
    return activities.filter((a) => {
      const aDay = formatDateOnly(new Date(a.data_inizio));
      return Number(a.service_lane || 1) === Number(lane) && aDay === isoDay;
    });
  };

  // =============== POPUP ===============
  const handleActivityClick = (activity) => {
    const dataInizio = activity.data_inizio ? formatDateOnly(new Date(activity.data_inizio)) : '';
    setFormData({
      commessa_id: activity.commessa_id || '',
      reparto_id: SERVICE_REPARTO_ID,
      risorsa_id: SERVICE_ONLINE_RISORSA_ID,
      attivita_id: activity.attivita_id || '',
      data_inizio: dataInizio,
      durata: activity.durata || 1,
      stato: activity.stato !== undefined && activity.stato !== null ? String(activity.stato) : '',
      descrizione: activity.descrizione_attivita || '',
      includedWeekends: activity.includedWeekends || [],
      service_lane: activity.service_lane || 1,
    });
    setIsEditing(true);
    setEditId(activity.id);
    setShowPopup(true);
  };

  const handleEmptyCellDoubleClick = (lane, day) => {
    const iso = toLocalISOString(day);
    const existing = getActivitiesForLaneAndDay(lane, day);
    if (existing.length > 0) {
      toast.warn('Cella già occupata.');
      return;
    }
    setFormData({
      commessa_id: '',
      reparto_id: SERVICE_REPARTO_ID,
      risorsa_id: SERVICE_ONLINE_RISORSA_ID,
      attivita_id: '',
      data_inizio: iso,
      durata: 1,
      stato: '',
      descrizione: '',
      includedWeekends: [],
      service_lane: lane,
    });
    setIsEditing(false);
    setEditId(null);
    setShowPopup(true);
  };

  // =============== DELETE ===============
  const handleDelete = async (id) => {
    if (!window.confirm('Sei sicuro di voler eliminare questa assistenza?')) return;

    const snapshot = activities;
    setActivities((prev) => prev.filter((a) => a.id !== id));

    try {
      await deleteAttivitaCommessa(id, token, { headers: { Authorization: `Bearer ${token}` } });
      toast.success('Assistenza eliminata');
    } catch (e) {
      console.error(e);
      toast.error('Errore eliminazione: ripristino...');
      setActivities(snapshot);
    }
  };

  // =============== DRAG & DROP ===============
  const updateLaneOnly = async (activityId, newLane) => {
    await apiClient.put(
      `/api/attivita_commessa/${activityId}/service-lane`,
      { service_lane: newLane },
      { headers: { Authorization: `Bearer ${token}` } }
    );
  };

  const updateDateAndLane = async (activity, newLane, newDay) => {
    const iso = toLocalISOString(newDay);

    // backend update completo su /attivita_commessa/:id
    // NB: qui usiamo la tua PUT già esistente
    const payload = {
      ...activity,
      reparto_id: SERVICE_REPARTO_ID,
      risorsa_id: SERVICE_ONLINE_RISORSA_ID,
      data_inizio: iso,
      descrizione: activity.descrizione_attivita || activity.descrizione || '',
      service_lane: newLane,
      includedWeekends: activity.includedWeekends || [],
    };

    await apiClient.put(`/api/attivita_commessa/${activity.id}`, payload, {
      headers: { Authorization: `Bearer ${token}` },
    });
  };

  const handleActivityDrop = async (activity, newLane, newDay) => {
    const oldDay = formatDateOnly(new Date(activity.data_inizio));
    const newIsoDay = formatDateOnly(newDay);
    const oldLane = Number(activity.service_lane || 1);

    // UI ottimistica
    setActivities((prev) =>
      prev.map((a) =>
        a.id === activity.id ? { ...a, service_lane: newLane, data_inizio: newIsoDay } : a
      )
    );

    try {
      // 1) stesso giorno -> aggiorno SOLO lane (più leggero)
      if (oldDay === newIsoDay && oldLane !== newLane) {
        await updateLaneOnly(activity.id, newLane);
      } else {
        // 2) giorno diverso (o vuoi comunque update completo) -> update completo
        await updateDateAndLane(activity, newLane, newDay);
      }

      toast.success('Assistenza spostata');
      await fetchServiceCalendar(); // riallineo dati DB (sicuro)
    } catch (e) {
      console.error(e);
      toast.error('Errore spostamento: ripristino...');
      await fetchServiceCalendar();
    }
  };

  // =============== COMPONENTI CELLA / CARD ===============
  function LaneCell({ lane, day, activitiesInCell }) {
    const normalizedDay = normalizeDate(day);

    const [{ isOver, canDrop }, drop] = useDrop(() => ({
      accept: 'ACTIVITY',
      drop: (item) => handleActivityDrop(item, lane, normalizedDay),
      collect: (monitor) => ({
        isOver: !!monitor.isOver(),
        canDrop: monitor.canDrop(),
      }),
    }));

    const isWeekend = normalizedDay.getDay() === 0 || normalizedDay.getDay() === 6;
    const cellClasses = `${isWeekend ? 'weekend-cell' : ''} ${isOver && canDrop ? 'highlight' : ''}`;

    return (
      <td
        ref={drop}
        className={cellClasses}
        onDoubleClick={() =>
          activitiesInCell.length === 0 && handleEmptyCellDoubleClick(lane, normalizedDay)
        }
      >
        {activitiesInCell.map((activity) => (
          <DraggableAssistenza
            key={activity.id}
            activity={activity}
            onDoubleClick={() => handleActivityClick(activity)}
            onDelete={() => handleDelete(activity.id)}
          />
        ))}
      </td>
    );
  }

  function DraggableAssistenza({ activity, onDoubleClick, onDelete }) {
    const [{ isDragging }, drag] = useDrag(() => ({
      type: 'ACTIVITY',
      item: { ...activity },
      collect: (monitor) => ({ isDragging: !!monitor.isDragging() }),
    }));

    const cls =
      activity.stato === 0
        ? 'activity not-started'
        : activity.stato === 1
          ? 'activity started'
          : 'activity completed';

    return (
      <div
        ref={drag}
        className={`activity ${cls}`}
        style={{ opacity: isDragging ? 0.5 : 1, cursor: 'move', minWidth: '150px' }}
        onDoubleClick={onDoubleClick}
      >
        <strong>Commessa: {activity.numero_commessa}</strong>
        <br />
        <strong>Attività: {activity.nome_attivita}</strong>
        <br />
        <strong>Lane: {activity.service_lane || 1}</strong>
        <br />
        <strong>Descrizione: {activity.descrizione_attivita || ''}</strong>
        <div style={{ marginTop: 6 }}>
          <button className="btn w-100 btn--danger btn--pill" onClick={onDelete}>
            Elimina
          </button>
        </div>
      </div>
    );
  }

  // =============== RENDER ===============
  return (
    <div className="page-wrapper">
      <ToastContainer position="top-left" autoClose={2000} hideProgressBar />

      <div className="header">
        <h1>CALENDARIO ASSISTENZE (SERVICE ONLINE)</h1>

        <div className="flex-center header-row">
          <button onClick={goToPreviousMonth} className="btn w-50 btn--shiny btn--pill">
            <FontAwesomeIcon icon={faChevronLeft} />
          </button>

          <button onClick={scrollToToday} className="btn w-50 btn--shiny btn--pill">
            OGGI
          </button>

          <div className="header-row-month">{meseCorrente}</div>

          <button onClick={goToNextMonth} className="btn w-50 btn--shiny btn--pill">
            <FontAwesomeIcon icon={faChevronRight} />
          </button>
        </div>

        {loading && (
          <div className="loading-overlay">
            <img src={logo} alt="Logo" className="logo-spinner" />
          </div>
        )}
      </div>

      <div className="container" ref={containerRef}>
        <div className="Reparto-table-container mh-80">
          <DndProvider backend={HTML5Backend}>
            <table>
              <thead>
                <tr>
                  <th>Lane</th>
                  {daysInMonth.map((day) => {
                    const isWeekend = day.getDay() === 0 || day.getDay() === 6;
                    const isToday = day.toDateString() === new Date().toDateString();
                    return (
                      <th
                        key={day.toISOString()}
                        className={`${isToday ? 'today' : ''} ${isWeekend ? 'weekend' : ''}`}
                        ref={isToday ? todayRef : null}
                      >
                        <div>{day.toLocaleDateString()}</div>
                      </th>
                    );
                  })}
                </tr>
              </thead>

              <tbody>
                {Array.from({ length: LANES_COUNT }).map((_, idx) => {
                  const lane = idx + 1;
                  return (
                    <tr key={lane}>
                      <td style={{ minWidth: 120 }}>
                        <strong>Riga {lane}</strong>
                      </td>

                      {daysInMonth.map((day) => (
                        <LaneCell
                          key={`${lane}-${day.toISOString()}`}
                          lane={lane}
                          day={day}
                          activitiesInCell={getActivitiesForLaneAndDay(lane, day)}
                        />
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </DndProvider>
        </div>

        {showPopup && (
          <AttivitaCrea
            formData={formData}
            setFormData={setFormData}
            isEditing={isEditing}
            setIsEditing={setIsEditing}
            editId={editId}
            fetchAttivita={fetchServiceCalendar}
            setShowPopup={setShowPopup}
            commesse={commesse}
            reparti={reparti}
            risorse={[
              {
                id: SERVICE_ONLINE_RISORSA_ID,
                nome: 'Service Online',
                reparto_id: SERVICE_REPARTO_ID,
              },
            ]}
            attivitaConReparto={attivitaConReparto}
            reloadActivities={fetchServiceCalendar}
          />
        )}
      </div>
    </div>
  );
}

export default DashboardService;
