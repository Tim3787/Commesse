import React, { useEffect, useRef, useState } from 'react';
import '../style/05-CalendarioAttivita.css';
import logo from '../img/Animation - 1738249246846.gif';
import { getDaysInMonth } from '../assets/date';

// FontAwesome
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEyeSlash, faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';

// API
import { fetchRisorse } from '../services/API/risorse-api';
import { fetchAttivitaCommessa } from '../services/API/attivitaCommesse-api';

// Toastify
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function CalendarioAttivita() {
  // ------------------------------------------------------------------
  // Stati e Ref
  // ------------------------------------------------------------------
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [activities, setActivities] = useState([]);
  const [filteredActivities, setFilteredActivities] = useState([]); // ✅ NEW
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(false);

  const containerRef = useRef(null);

  // ✅ NEW: repartoSelezionato 0 = TUTTI
  const [repartoSelezionato, setRepartoSelezionato] = useState(0);

  // ✅ NEW: filtri come DashboardReparto
  const [filters, setFilters] = useState({
    commessa: '',
    risorsa: '',
    attivita: '',
  });

  // ✅ NEW: autocomplete
  const [suggestionsCommessa, setSuggestionsCommessa] = useState([]);
  const [suggestionsRisorsa, setSuggestionsRisorsa] = useState([]);
  const [suggestionsAttivita, setSuggestionsAttivita] = useState([]);

  const [showCommessaSuggestions, setShowCommessaSuggestions] = useState(false);
  const [showRisorsaSuggestions, setShowRisorsaSuggestions] = useState(false);
  const [showAttivitaSuggestions, setShowAttivitaSuggestions] = useState(false);

  // Stato visibilità sezioni per reparto
  const [visibleSections, setVisibleSections] = useState({
    1: true,
    2: false,
    3: false,
    13: false,
    14: false,
    15: false,
    16: false,
    18: false,
  });

  const repartiDisponibili = [
    { id: 0, nome: 'TUTTI I REPARTI' }, // ✅ NEW
    { id: 1, nome: 'Reparto Software' },
    { id: 2, nome: 'Reparto Elettrico' },
    { id: 3, nome: 'Reparto Meccanico' },
    { id: 13, nome: 'Reparto Commerciale' },
    { id: 14, nome: 'Reparto Tecnico elettrico' },
    { id: 15, nome: 'Reparto Quadri' },
    { id: 16, nome: 'Reparto Tecnico meccanico' },
    { id: 18, nome: 'Reparto Service' },
  ];

  const repartiMap = {
    1: 'Reparto Software',
    2: 'Reparto Elettrico',
    3: 'Reparto Meccanico',
    13: 'Reparto Commerciale',
    14: 'Reparto Tecnico elettrico',
    15: 'Reparto Quadri',
    16: 'Reparto Tecnico meccanico',
    18: 'Reparto Service',
  };

  // Risorse filtrate per reparto selezionato (0 = tutti)
  const resourcesForTable = resources.filter((r) =>
    repartoSelezionato === 0 ? true : Number(r.reparto_id) === Number(repartoSelezionato)
  );

  // Raggruppa per reparto_id
  const groupedByReparto = resourcesForTable.reduce((acc, r) => {
    const rid = Number(r.reparto_id);
    if (!acc[rid]) acc[rid] = [];
    acc[rid].push(r);
    return acc;
  }, {});

  // Ordine reparti (come il tuo)
  const repartoOrder = [1, 2, 3, 13, 14, 15, 16, 18];

  const daysInMonth = getDaysInMonth(currentMonth);

  const meseCorrente = currentMonth
    .toLocaleDateString('it-IT', { month: 'long', year: 'numeric' })
    .replace(/^./, (c) => c.toUpperCase());

  // ------------------------------------------------------------------
  // Helpers date
  // ------------------------------------------------------------------
  const getWeekNumber = (d) => {
    d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
  };

  const formatDateOnly = (dateObj) => {
    const y = dateObj.getFullYear();
    const m = String(dateObj.getMonth() + 1).padStart(2, '0');
    const d = String(dateObj.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const normalizeDate = (date) => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
  };

  const getActivityDates = (activity) => {
    const dates = [];
    const start = normalizeDate(new Date(activity.data_inizio));
    const total = Number(activity.durata) || 0;
    let cursor = new Date(start);

    while (dates.length < total) {
      const wd = cursor.getDay();
      const clone = new Date(cursor.getTime());

      if (wd >= 1 && wd <= 5) {
        dates.push(clone);
      } else {
        const iso = formatDateOnly(cursor);
        if (activity.includedWeekends?.includes(iso)) {
          dates.push(clone);
        }
      }
      cursor.setDate(cursor.getDate() + 1);
    }
    return dates;
  };

  // Stato per il menu a burger (filtri e opzioni)
  const [isBurgerMenuOpen, setIsBurgerMenuOpen] = useState(false);

  // ----------------------------
  // Funzione per aprire/chiudere il menu a burger
  // ----------------------------
  const toggleBurgerMenu = () => {
    setIsBurgerMenuOpen((prev) => !prev);
  };

  // ------------------------------------------------------------------
  // Fetch iniziale
  // ------------------------------------------------------------------
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [activitiesData, resourcesData] = await Promise.all([
          fetchAttivitaCommessa(),
          fetchRisorse(),
        ]);
        setActivities(activitiesData);
        setResources(resourcesData);
      } catch (error) {
        console.error('Errore durante il recupero dei dati:', error);
        toast.error('Errore durante il recupero dei dati');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [currentMonth]);

  // ------------------------------------------------------------------
  // ✅ FILTRI: calcolo filteredActivities
  // ------------------------------------------------------------------
  useEffect(() => {
    const f = activities.filter((a) => {
      const commessaMatch = filters.commessa
        ? String(a.numero_commessa || '')
            .toLowerCase()
            .includes(filters.commessa.toLowerCase())
        : true;

      const risorsaMatch = filters.risorsa
        ? String(a.risorsa || a.nome_risorsa || '')
            .toLowerCase()
            .includes(filters.risorsa.toLowerCase())
        : true;

      const attivitaMatch = filters.attivita
        ? String(a.nome_attivita || '')
            .toLowerCase()
            .includes(filters.attivita.toLowerCase())
        : true;

      return commessaMatch && risorsaMatch && attivitaMatch;
    });

    setFilteredActivities(f);
  }, [activities, filters]);

  // ------------------------------------------------------------------
  // ✅ SUGGERIMENTI (come DashboardReparto, ma adattato ai dati che hai qui)
  // ------------------------------------------------------------------
  useEffect(() => {
    const commesseSuggs = activities
      .map((a) => a.numero_commessa)
      .filter((v) => v !== null && v !== undefined)
      .filter((v, i, self) => self.indexOf(v) === i);
    setSuggestionsCommessa(commesseSuggs);
  }, [activities]);

  useEffect(() => {
    const risorsaSuggs = resources
      .map((r) => r.nome)
      .filter(Boolean)
      .filter((v, i, self) => self.indexOf(v) === i);
    setSuggestionsRisorsa(risorsaSuggs);
  }, [resources]);

  useEffect(() => {
    const attivitaSuggs = activities
      .map((a) => a.nome_attivita)
      .filter(Boolean)
      .filter((v, i, self) => self.indexOf(v) === i);
    setSuggestionsAttivita(attivitaSuggs);
  }, [activities]);

  // Chiudi suggestions cliccando fuori
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.suggestion-wrapper') && !event.target.closest('.w-200')) {
        setShowCommessaSuggestions(false);
        setShowRisorsaSuggestions(false);
        setShowAttivitaSuggestions(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // ------------------------------------------------------------------
  // Navigazione mesi
  // ------------------------------------------------------------------
  const goToPreviousMonth = () => {
    setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  // Scroll a oggi
  const scrollToToday = () => {
    const today = new Date();

    const doScrollForMonth = (monthDate) => {
      if (!containerRef.current) return;

      const monthDays = getDaysInMonth(monthDate);

      const dayIndex = monthDays.findIndex(
        (d) =>
          d.getDate() === today.getDate() &&
          d.getMonth() === today.getMonth() &&
          d.getFullYear() === today.getFullYear()
      );

      if (dayIndex === -1) return;

      const table = containerRef.current.querySelector('table');
      const ths = table?.querySelectorAll('thead th');
      const th = ths?.[dayIndex + 1]; // +1 perché prima colonna è "Reparto/Risorsa"
      if (!th) return;

      const containerRect = containerRef.current.getBoundingClientRect();
      const thRect = th.getBoundingClientRect();
      const offsetLeft = thRect.left - containerRect.left;

      containerRef.current.scrollTo({
        left: offsetLeft - containerRef.current.clientWidth / 2 + thRect.width / 2,
        behavior: 'smooth',
      });
    };

    const sameMonth =
      currentMonth.getMonth() === today.getMonth() &&
      currentMonth.getFullYear() === today.getFullYear();

    if (!sameMonth) {
      const nextMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      setCurrentMonth(nextMonth);

      // aspetta che React renderizzi la nuova tabella
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          doScrollForMonth(nextMonth);
        });
      });
    } else {
      requestAnimationFrame(() => doScrollForMonth(currentMonth));
    }
  };

  // ------------------------------------------------------------------
  // ✅ Cambio reparto con "TUTTI"
  // ------------------------------------------------------------------
  const handleRepartoChange = (id) => {
    setRepartoSelezionato(id);

    if (id === 0) {
      // ✅ TUTTI: apri tutte le sezioni
      const allOpen = {};
      Object.keys(visibleSections).forEach((k) => (allOpen[k] = true));
      setVisibleSections(allOpen);
      return;
    }

    // singolo reparto: attiva solo quello scelto
    setVisibleSections({
      ...Object.keys(visibleSections).reduce((acc, key) => {
        acc[key] = false;
        return acc;
      }, {}),
      [id]: true,
    });
  };

  // ------------------------------------------------------------------
  // Attività per risorsa e giorno (usa filteredActivities)
  // ------------------------------------------------------------------
  const getActivitiesForResourceAndDay = (resourceId, day) => {
    const isoDay = formatDateOnly(normalizeDate(day));
    return filteredActivities.filter((activity) => {
      if (Number(activity.risorsa_id) !== Number(resourceId)) return false;
      const dates = getActivityDates(activity).map((d) => formatDateOnly(d));
      return dates.includes(isoDay);
    });
  };

  const resourceHasActivitiesInMonth = (resourceId) => {
    return filteredActivities.some((activity) => {
      if (Number(activity.risorsa_id) !== Number(resourceId)) return false;

      const dates = getActivityDates(activity);
      return dates.some(
        (d) =>
          d.getMonth() === currentMonth.getMonth() && d.getFullYear() === currentMonth.getFullYear()
      );
    });
  };

  // ------------------------------------------------------------------
  // Cell
  // ------------------------------------------------------------------
  function ResourceCell({ activities }) {
    return (
      <td>
        {activities.map((activity) => {
          const activityClass =
            activity.stato === 0
              ? 'activity not-started'
              : activity.stato === 1
                ? 'activity started'
                : 'activity completed';

          const isTrasferta = activity.nome_attivita?.toLowerCase().includes('trasferta');

          return (
            <div
              key={activity.id}
              className={`activity ${activityClass}`}
              style={{ minWidth: '150px', minHeight: '70px', fontSize: '14px' }}
            >
              <strong>Commessa:</strong> {activity.numero_commessa}
              <br />
              <strong>Attività:</strong> {activity.nome_attivita}
              {isTrasferta && (
                <span className="trasferta-icon" title="Trasferta">
                  🚗
                </span>
              )}
              <br />
              <strong>Stato:</strong>{' '}
              {activity.stato === 0
                ? 'Non iniziata'
                : activity.stato === 1
                  ? 'Iniziata'
                  : 'Completata'}
            </div>
          );
        })}
      </td>
    );
  }

  // ------------------------------------------------------------------
  // Render
  // ------------------------------------------------------------------
  return (
    <div className="page-wrapper">
      <div className="header">
        <h1>CALENDARIO ATTIVITÀ</h1>

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

        <ToastContainer position="top-left" autoClose={2000} hideProgressBar />

        {loading && (
          <div className="loading-overlay">
            <img src={logo} alt="Logo" className="logo-spinner" />
          </div>
        )}

        {/* Bottone per aprire/chiudere il menu */}
        <div className="burger-header">
          <button onClick={toggleBurgerMenu} className="btn w-200 btn--shiny btn--pill">
            Filtri ed Opzioni
          </button>
        </div>
      </div>

      {/* BURGER MENU (Filtri e Opzioni) */}
      {isBurgerMenuOpen && (
        <div className="burger-menu">
          <div className="burger-menu-header">
            <button onClick={toggleBurgerMenu} className="btn w-50 btn--ghost">
              <FontAwesomeIcon icon={faEyeSlash} className="burger-menu-close" />
            </button>
          </div>
          <div className="burger-menu-content">
            {/* Opzioni di visualizzazione */}
            <h3>Filtri </h3>

            <div
              style={{
                marginLeft: '10px',
                display: 'flex',
                gap: '10px',
                flexWrap: 'wrap',
                alignItems: 'flex-start',
              }}
            >
              {/* Reparto */}
              <select
                id="reparto-select"
                value={repartoSelezionato}
                onChange={(e) => handleRepartoChange(Number(e.target.value))}
                className="w-200"
              >
                {repartiDisponibili.map((rep) => (
                  <option key={rep.id} value={rep.id}>
                    {rep.nome}
                  </option>
                ))}
              </select>

              {/* ✅ Filtri autocomplete */}
              <div className="suggestion-wrapper w-200 ">
                <div className="input-wrapper">
                  <input
                    type="text"
                    placeholder="Filtra per commessa"
                    value={filters.commessa}
                    onChange={(e) => setFilters({ ...filters, commessa: e.target.value })}
                    onFocus={() => {
                      setShowCommessaSuggestions(true);
                    }}
                    className="w-200"
                  />

                  {suggestionsCommessa.includes(filters.commessa) && (
                    <span className="input-check">✔</span>
                  )}
                </div>
                {showCommessaSuggestions && suggestionsCommessa.length > 0 && (
                  <ul className="suggestions-list w-200">
                    {suggestionsCommessa
                      .filter((value) =>
                        value.toString().toLowerCase().includes(filters.commessa.toLowerCase())
                      )
                      .map((value, index) => (
                        <li
                          key={index}
                          onClick={() => {
                            setFilters({ ...filters, commessa: value });
                            setShowCommessaSuggestions(false);
                          }}
                        >
                          {value}
                        </li>
                      ))}
                  </ul>
                )}
              </div>

              <div className="suggestion-wrapper w-200">
                <input
                  type="text"
                  placeholder="Filtra per risorsa"
                  value={filters.risorsa}
                  onChange={(e) => setFilters({ ...filters, risorsa: e.target.value })}
                  onFocus={() => setShowRisorsaSuggestions(true)}
                  className="w-200"
                />
                {showRisorsaSuggestions && suggestionsRisorsa.length > 0 && (
                  <ul className="suggestions-list w-200">
                    {suggestionsRisorsa
                      .filter((value) =>
                        value.toLowerCase().includes(filters.risorsa.toLowerCase())
                      )
                      .map((value, index) => (
                        <li
                          key={index}
                          onClick={() => {
                            setFilters({ ...filters, risorsa: value });
                            setShowRisorsaSuggestions(false);
                          }}
                        >
                          {value}
                        </li>
                      ))}
                  </ul>
                )}
              </div>

              <div className="suggestion-wrapper w-200">
                <input
                  type="text"
                  placeholder="Filtra per attività"
                  value={filters.attivita}
                  onChange={(e) => setFilters({ ...filters, attivita: e.target.value })}
                  onFocus={() => setShowAttivitaSuggestions(true)}
                  className="w-200"
                />
                {showAttivitaSuggestions && suggestionsAttivita.length > 0 && (
                  <ul className="suggestions-list w-200">
                    {suggestionsAttivita
                      .filter((value) =>
                        value.toLowerCase().includes(filters.attivita.toLowerCase())
                      )
                      .map((value, index) => (
                        <li
                          key={index}
                          onClick={() => {
                            setFilters({ ...filters, attivita: value });
                            setShowAttivitaSuggestions(false);
                          }}
                        >
                          {value}
                        </li>
                      ))}
                  </ul>
                )}
              </div>

              {/* ✅ Reset filtri (comodo) */}
              <button
                className="btn btn--pill w-200 btn--blue"
                onClick={() => setFilters({ commessa: '', risorsa: '', attivita: '' })}
              >
                Reset filtri
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONTENITORE PRINCIPALE */}
      <div className={`container ${isBurgerMenuOpen ? 'shifted' : ''}`}>
        <div
          className="Reparto-table-container mh-72"
          ref={containerRef}
          style={{ overflowX: 'auto', whiteSpace: 'nowrap' }}
        >
          <table>
            <thead>
              <tr>
                <th>Reparto / Risorsa</th>
                {daysInMonth.map((day, index) => {
                  const isWeekend = day.getDay() === 0 || day.getDay() === 6;
                  const isToday = day.toDateString() === new Date().toDateString();
                  const weekNumber = getWeekNumber(day);
                  const showWeekNumber =
                    index === 0 || getWeekNumber(daysInMonth[index - 1]) !== weekNumber;

                  return (
                    <th
                      key={day.toISOString()}
                      className={`${isToday ? 'today' : ''} ${isWeekend ? 'weekend' : ''}`}
                    >
                      <div>{day.toLocaleDateString()}</div>
                      {showWeekNumber && <div className="week-number">Settimana {weekNumber}</div>}
                    </th>
                  );
                })}
              </tr>
            </thead>

            <tbody>
              {repartoOrder
                .filter((rid) =>
                  groupedByReparto[rid]?.some((r) => resourceHasActivitiesInMonth(r.id))
                )
                .map((rid) => (
                  <React.Fragment key={rid}>
                    <tr className="reparto-row">
                      <td colSpan={daysInMonth.length + 1} className="reparto-cell">
                        <strong>{repartiMap[rid] || `Reparto ${rid}`}</strong>
                      </td>
                    </tr>

                    {groupedByReparto[rid]
                      .filter((resource) => resourceHasActivitiesInMonth(resource.id))
                      .map((resource) => (
                        <tr key={resource.id}>
                          <td className="resource-name">{resource.nome}</td>

                          {daysInMonth.map((day, index) => (
                            <ResourceCell
                              key={`${resource.id}-${index}`}
                              activities={getActivitiesForResourceAndDay(resource.id, day)}
                            />
                          ))}
                        </tr>
                      ))}
                  </React.Fragment>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default CalendarioAttivita;
