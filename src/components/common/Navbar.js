import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import '../style/Navbar.css';
import apiClient from '../config/axiosConfig';
import { CSSTransition } from 'react-transition-group';
import CommessaDettagli from '../popup/CommessaDettagli';
import AfterSalesQuickPopup from '../popup/AfterSalesQuickPopup';

import { autocompleteTags, fetchCommesseByTag } from '../services/API/tag-api';

// import ChatGPTChatbot from "../assets/ChatGPTChatbot";

// Import per Toastify (notifiche)
import 'react-toastify/dist/ReactToastify.css';

// Import icone FontAwesome
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faUser,
  faTasks,
  faClipboardList,
  faUsers,
  faProjectDiagram,
  faTools,
  faCalendarAlt,
  faListCheck,
  faChartBar,
  faBusinessTime,
  faGear,
  faBars,
  faScrewdriverWrench,
  faRightFromBracket,
  faBell,
  faSearch,
  faChevronLeft,
  faChevronRight,
} from '@fortawesome/free-solid-svg-icons';

// Import API per le varie entità
import { fetchCommesse } from '../services/API/commesse-api';
import { useAppData } from '../context/AppDataContext';
function Navbar({ isAuthenticated, userRole, handleLogout }) {
  // -------------------------------------------------------------------
  // Stati del componente
  // -------------------------------------------------------------------
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const { missingTrelloCount } = useAppData();
  // Stato per gestire quale menu dropdown è attivo ("user", "manager", "admin")
  const [activeMenu, setActiveMenu] = useState(null);
  // Stato per il sottomenu nella sezione user (null = menu principale, altrimenti array dei link)
  const [activeUserSubmenu, setActiveUserSubmenu] = useState(null);
  // Stato per il sottomenu nella sezione manager
  const [activeManagerSubmenu, setActiveManagerSubmenu] = useState(null);
  const [showAfterSales, setShowAfterSales] = useState(false);
  //const [isChatOpen, setIsChatOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [commesseList, setCommesseList] = useState([]);
  const [selectedCommessa, setSelectedCommessa] = useState(null);

  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedTag, setSelectedTag] = useState(null);

  const wrapperRef = useRef(null);
  const debounceRef = useRef(null);

  const isTagMode = searchValue.trim().startsWith('#');
  const closeSearchPopup = () => {
    setSelectedCommessa(null);
  };

  // -------------------------------------------------------------------
  // Polling delle notifiche non lette (ogni 60 secondi)
  // -------------------------------------------------------------------
  useEffect(() => {
    let interval;
    if (isAuthenticated) {
      fetchUnreadNotifications();
      interval = setInterval(fetchUnreadNotifications, 60000);
    }
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  const fetchUnreadNotifications = async () => {
    try {
      const response = await apiClient.get('/api/notifiche/unread');
      setNotifications(response.data);
      setUnreadCount(response.data.length);
    } catch (error) {
      console.error('Errore durante il recupero delle notifiche:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await apiClient.put('/api/notifiche/read/all');
      setUnreadCount(0);
      fetchUnreadNotifications();
    } catch (error) {
      console.error('Errore durante il contrassegno delle notifiche come lette:', error);
    }
  };

  // -------------------------------------------------------------------
  // Caricamento delle commesse per il dropdown di ricerca
  // -------------------------------------------------------------------
  useEffect(() => {
    const fetchCommesseList = async () => {
      try {
        const data = await fetchCommesse();
        setCommesseList(data);
      } catch (error) {
        console.error('Errore durante il caricamento delle commesse per ricerca:', error);
      }
    };
    if (isAuthenticated) {
      fetchCommesseList();
    }
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return null;
  }

  // -------------------------------------------------------------------
  // Definizione dei link di navigazione in base al ruolo
  // In questa struttura il menu user include un sottomenu per "Calendari"
  // e il menu manager prevede un sottomenu per ogni reparto
  // -------------------------------------------------------------------
  // Definizione dei link di navigazione in base al ruolo
  const navLinks = {
    user: [
      {
        label: 'COMMESSE',
        icon: faClipboardList,
        submenu: [
          {
            to: '/visualizzazione-commesse-Produzione',
            label: 'PRODUZIONE',
            icon: faClipboardList,
          },
          { to: '/visualizzazione-commesse-R', label: 'R-', icon: faClipboardList },
          { to: '/visualizzazione-commesse-M', label: 'M-', icon: faClipboardList },
          { to: '/visualizzazione-Tutte-commesse', label: 'TUTTE', icon: faClipboardList },
        ],
      },
      {
        label: 'CALENDARI',
        icon: faCalendarAlt,
        submenu: [
          { to: '/calendario-attivita', label: "CALENDARIO ATTIVITA'", icon: faCalendarAlt },
          { to: '/CalendarioCommesse', label: 'CALENDARIO CONSEGNE E FAT', icon: faCalendarAlt },
        ],
      },
      { to: '/visualizzazione-attivita', label: "ATTIVITA'", icon: faTasks },
      { to: '/Notifications', label: 'NOTIFICHE', icon: faBell },
      { action: 'afterSales', label: 'RICHIESTA SUPPORT', icon: faTools },
      { to: '/Dashboard', label: 'BACHECA', icon: faUser },
      { to: '/PrenotazioneSale', label: 'PRENOTAZIONE SALE RIUNIONI', icon: faBusinessTime },
    ],
    manager: [
      {
        label: 'REP.SOFTWARE',
        icon: faScrewdriverWrench,
        links: [
          { to: '/StatoAvanzamento/software', label: 'STATO AVANZAMENTO', icon: faChartBar },
          { to: '/Dashboard/software', label: "ATTIVITA'", icon: faTasks },
          { to: '/TrelloBoardSoftware', label: 'TRELLO', icon: faClipboardList },
        ],
      },
      {
        label: 'REP.ELETTRICO',
        icon: faScrewdriverWrench,
        links: [
          { to: '/StatoAvanzamento/elettrico', label: 'STATO AVANZAMENTO', icon: faChartBar },
          { to: '/Dashboard/elettrico', label: "ATTIVITA'", icon: faTasks },
          { to: '/TrelloBoardElettrico', label: 'TRELLO', icon: faClipboardList },
        ],
      },
      {
        label: 'REP.MECCANICO',
        icon: faScrewdriverWrench,
        links: [
          { to: '/StatoAvanzamento/meccanico', label: 'STATO AVANZAMENTO', icon: faChartBar },
          { to: '/Dashboard/meccanico', label: "ATTIVITA'", icon: faTasks },
          { to: '/TrelloBoardMeccanico', label: 'TRELLO', icon: faClipboardList },
        ],
      },
      {
        label: 'REP.TECNICO ELETTRICO',
        icon: faScrewdriverWrench,
        links: [
          {
            to: '/StatoAvanzamento/tecnicoelettrico',
            label: 'STATO AVANZAMENTO',
            icon: faChartBar,
          },
          { to: '/Dashboard/tecnicoelettrico', label: "ATTIVITA'", icon: faTasks },
        ],
      },
      {
        label: 'REP.QE',
        icon: faScrewdriverWrench,
        links: [
          { to: '/StatoAvanzamento/quadristi', label: 'STATO AVANZAMENTO', icon: faChartBar },
          { to: '/Dashboard/quadristi', label: "ATTIVITA'", icon: faTasks },
        ],
      },
      {
        label: 'REP.SERVICE',
        icon: faScrewdriverWrench,
        links: [
          { to: '/StatoAvanzamento/service', label: 'STATO AVANZAMENTO', icon: faChartBar },
          { to: '/Dashboard/service', label: "ATTIVITA'", icon: faTools },
          { to: '/DashboardService', label: 'SERVICE ONLINE', icon: faTools },
        ],
      },
      {
        label: 'GESTIONE COMMESSE',
        icon: faCalendarAlt,
        links: [
          { to: '/gestione-commesse', label: 'CREA O MODIFICA COMMESSE', icon: faProjectDiagram },
          { to: '/commesse-dettagli', label: 'GESTISCI COMPONENTI', icon: faProjectDiagram },
          {
            to: '/Assegna-Machina-Componenti',
            label: 'ASSEGNAZIONE MACCHINE E COMPONENTI',
            icon: faProjectDiagram,
          },
        ],
      },
      { to: '/SchedeTecnicheTable', label: 'SCHEDE', icon: faBusinessTime },
      { to: '/ClientiSpecifiche', label: 'SPECIFICHE CLIENTI', icon: faBusinessTime },
      { to: '/GestioneTag', label: 'GESTIONE TAG', icon: faBusinessTime },
      { to: '/VisualizzaTutteLeAttivita', label: "TUTTE LE ATTIVITA'", icon: faListCheck },
      { to: '/StatiAvanzamento', label: 'TUTTI GLI STATI AVANZAMENTO', icon: faChartBar },
    ],
    admin: [
      { to: '/utenti', label: 'GESTIONE UTENTI', icon: faUsers },
      { to: '/GestioneTabelle', label: 'GESTIONE TABELLE', icon: faClipboardList },
      {
        to: '/MatchCommesse',
        label: 'COMMESSE TRELLO',
        icon: faClipboardList,
        badge: missingTrelloCount > 0 ? missingTrelloCount : null,
      },
    ],
  };

  // -------------------------------------------------------------------
  // Funzioni per gestire il dropdown e i sottomenu
  // -------------------------------------------------------------------
  // Sezione User: se il link ha "submenu", al click si passa al sottomenu.
  // Alla fine della sezione user aggiungiamo il logout.
  const renderUserLinks = () => {
    return (
      <ul>
        {activeUserSubmenu ? (
          <>
            <li className="dropdown-menu-item">
              <a
                href="#"
                className="nav-list"
                onClick={(e) => {
                  e.preventDefault();
                  setActiveUserSubmenu(null);
                }}
              >
                <FontAwesomeIcon icon={faChevronLeft} className="menu-icon" /> Indietro
              </a>
            </li>
            {activeUserSubmenu.map((item, index) => (
              <li key={index} className="dropdown-menu-item">
                <Link to={item.to} className="nav-list" onClick={() => setActiveMenu(null)}>
                  <FontAwesomeIcon icon={item.icon} className="menu-icon" /> {item.label}
                </Link>
              </li>
            ))}
          </>
        ) : (
          <>
            {navLinks.user.map((link, index) => {
              // se ha submenu → comportamento già esistente
              if (link.submenu) {
                return (
                  <li key={index} className="dropdown-menu-item">
                    <a
                      href="#"
                      className="nav-list"
                      onClick={(e) => {
                        e.preventDefault();
                        setActiveUserSubmenu(link.submenu);
                      }}
                    >
                      <FontAwesomeIcon icon={link.icon} className="menu-icon" /> {link.label}
                      <FontAwesomeIcon icon={faChevronRight} className="submenu-icon" />
                    </a>
                  </li>
                );
              }

              // ✅ SE È AFTER SALES → APRI POPUP
              if (link.action === 'afterSales') {
                return (
                  <li key={index} className="dropdown-menu-item">
                    <a
                      href="#"
                      className="nav-list"
                      onClick={(e) => {
                        e.preventDefault();
                        setActiveMenu(null);
                        setActiveUserSubmenu(null);
                        setShowAfterSales(true); // ⭐ apre popup
                      }}
                    >
                      <FontAwesomeIcon icon={link.icon} className="menu-icon" /> {link.label}
                    </a>
                  </li>
                );
              }

              // comportamento normale link router
              return (
                <li key={index} className="dropdown-menu-item">
                  <Link to={link.to} className="nav-list" onClick={() => setActiveMenu(null)}>
                    <FontAwesomeIcon icon={link.icon} className="menu-icon" /> {link.label}
                  </Link>
                </li>
              );
            })}

            <li className="dropdown-menu-item">
              <a
                href="#"
                className="nav-list"
                onClick={(e) => {
                  e.preventDefault();
                  setActiveMenu(null);
                  handleLogout();
                }}
              >
                <FontAwesomeIcon icon={faRightFromBracket} className="menu-icon" /> LOGOUT
              </a>
            </li>
          </>
        )}
      </ul>
    );
  };

  // Sezione Manager: utilizziamo uno stato per il sottomenu manager
  const renderManagerSection = () => {
    return (
      <ul>
        {activeManagerSubmenu ? (
          <>
            <li className="dropdown-menu-item">
              <a
                href="#"
                className="nav-list"
                onClick={(e) => {
                  e.preventDefault();
                  setActiveManagerSubmenu(null);
                }}
              >
                <FontAwesomeIcon icon={faChevronLeft} className="menu-icon" /> Indietro
              </a>
            </li>
            {activeManagerSubmenu.map((item, index) => (
              <li key={index} className="dropdown-menu-item">
                <Link to={item.to} className="nav-list" onClick={() => setActiveMenu(null)}>
                  <FontAwesomeIcon icon={item.icon} className="menu-icon" /> {item.label}
                </Link>
              </li>
            ))}
          </>
        ) : (
          navLinks.manager.map((link, index) => {
            if (link.links) {
              return (
                <li key={index} className="dropdown-menu-item">
                  <a
                    href="#"
                    className="nav-list"
                    onClick={(e) => {
                      e.preventDefault();
                      setActiveManagerSubmenu(link.links);
                    }}
                  >
                    <FontAwesomeIcon icon={link.icon} className="menu-icon" /> {link.label}{' '}
                    <FontAwesomeIcon icon={faChevronRight} className="submenu-icon" />
                  </a>
                </li>
              );
            }
            return (
              <li key={index} className="dropdown-menu-item">
                <Link to={link.to} className="nav-list" onClick={() => setActiveMenu(null)}>
                  <FontAwesomeIcon icon={link.icon} className="menu-icon" /> {link.label}
                </Link>
              </li>
            );
          })
        )}
      </ul>
    );
  };

  // Sezione Admin (rimane invariata)
  const renderAdminSection = () => {
    return (
      <ul>
        {navLinks.admin.map((link, index) => (
          <li key={index} className="dropdown-menu-item">
            <Link to={link.to} className="nav-list" onClick={() => setActiveMenu(null)}>
              <FontAwesomeIcon icon={link.icon} className="menu-icon" /> {link.label}
              {/* 🔔 Badge Trello */}
              {link.badge && (
                <span className="notification-badge" style={{ marginLeft: '10px' }}>
                  {link.badge}
                </span>
              )}
            </Link>
          </li>
        ))}
      </ul>
    );
  };

  // Funzioni per gestire l'apertura/chiusura dei dropdown
  const toggleMenu = (menu) => {
    setActiveMenu((prevMenu) => (prevMenu === menu ? null : menu));
    setIsSearchOpen(false);
    setIsNotificationOpen(false);
    if (menu !== 'user') {
      setActiveUserSubmenu(null);
    }
    if (menu !== 'manager') {
      setActiveManagerSubmenu(null);
    }
  };

  const toggleSearchDropdown = () => {
    setIsSearchOpen((prev) => {
      const next = !prev;

      if (!next) {
        setSearchValue('');
        setSuggestions([]);
        setSelectedTag(null);
        setLoading(false);
      }

      return next;
    });

    setActiveMenu(null);
    setIsNotificationOpen(false);
  };

  const toggleNotification = () => {
    setIsNotificationOpen((prev) => !prev);
    setActiveMenu(null);
    setIsSearchOpen(false);
  };

  const handleSearchInputChange = (e) => {
    const value = e.target.value;
    setSearchValue(value);
  };
  useEffect(() => {
    clearTimeout(debounceRef.current);

    if (!isSearchOpen) return;

    const value = searchValue.trim();

    if (!value) {
      setSuggestions([]);
      setSelectedTag(null);
      setLoading(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      try {
        setLoading(true);

        // =========================
        // MODALITÀ TAG
        // =========================
        if (value.startsWith('#')) {
          const cleanTagQuery = value.replace(/^#/, '').trim();

          // se è già selezionato un tag esatto, non rifare autocomplete
          if (selectedTag && value.toLowerCase() === `#${selectedTag.nome}`.toLowerCase()) {
            setLoading(false);
            return;
          }

          const tagResults = await autocompleteTags({
            q: cleanTagQuery,
            includeGlobal: 1,
            limit: 10,
          });

          setSuggestions(
            (tagResults || []).map((tag) => ({
              type: 'tag',
              id: tag.id,
              nome: tag.nome,
              label: tag.label || `#${tag.nome}`,
              prefisso: tag.prefisso,
              reparto: tag.reparto,
              colore: tag.colore,
              schedeCount: tag.schedeCount || 0,
              commesseCount: tag.commesseCount || 0,
            }))
          );

          setSelectedTag(null);
          setLoading(false);
          return;
        }

        // =========================
        // MODALITÀ NORMALE
        // =========================
        setSelectedTag(null);

        const lowerValue = value.toLowerCase();

        const suggestionsFiltered = commesseList
          .filter((c) => {
            const numero = c.numero_commessa?.toString().toLowerCase() || '';
            const cliente = c.cliente?.toLowerCase() || '';
            const numeri = numero.match(/\d+/)?.[0] || '';

            return numeri.startsWith(lowerValue) || cliente.includes(lowerValue);
          })
          .map((c) => ({
            type: 'commessa',
            id: c.id,
            numero_commessa: c.numero_commessa,
            cliente: c.cliente,
            raw: c,
          }));

        setSuggestions(suggestionsFiltered);
        setLoading(false);
      } catch (error) {
        console.error('Errore nella ricerca navbar:', error);
        setSuggestions([]);
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(debounceRef.current);
  }, [searchValue, commesseList, isSearchOpen, selectedTag]);

  const handleSelectTag = async (tagItem) => {
    try {
      setLoading(true);
      setSearchValue(`#${tagItem.nome}`);
      setSelectedTag(tagItem);

      const commesse = await fetchCommesseByTag({ tagId: tagItem.id });
      console.log('TAG CLICCATO:', tagItem);
      console.log('COMMESSE TROVATE:', commesse);
      setSuggestions(
        (commesse || []).map((item) => ({
          type: 'commessaByTag',
          commessa_id: item.commessa_id,
          numero_commessa: item.numero_commessa,
          cliente: item.cliente,
          schedeCount: item.schedeCount || 0,
          ultimaModifica: item.ultimaModifica,
          tag: item.tag,
          raw: item,
        }))
      );

      setLoading(false);
    } catch (error) {
      console.error('Errore selezione tag:', error);
      setSuggestions([]);
      setLoading(false);
    }
  };

  const handleSuggestionClick = async (item) => {
    if (item.type === 'tag') {
      await handleSelectTag(item);
      return;
    }

    if (item.type === 'commessa') {
      setSelectedCommessa(item.raw || item);
      setIsSearchOpen(false);
      setSearchValue('');
      setSuggestions([]);
      setSelectedTag(null);
      return;
    }

    if (item.type === 'commessaByTag') {
      const commessaCompleta =
        commesseList.find((c) => c.id === item.commessa_id) ||
        commesseList.find(
          (c) => String(c.numero_commessa).trim() === String(item.numero_commessa).trim()
        );

      if (!commessaCompleta) {
        console.error('Commessa completa non trovata in commesseList:', item);
        return;
      }

      setSelectedCommessa(commessaCompleta);
      setIsSearchOpen(false);
      setSearchValue('');
      setSuggestions([]);
      setSelectedTag(null);
    }
  };
  // -------------------------------------------------------------------
  // Rendering del componente
  // -------------------------------------------------------------------
  return (
    <>
      {/* Navbar Header */}
      <header className="navbar-header">
        <button
          className={`btn w-50 btn navbar ${activeMenu === 'user' ? 'active' : ''}`}
          onClick={() => toggleMenu('user')}
        >
          <FontAwesomeIcon icon={faBars} className="settings-icon" />
        </button>

        {userRole <= 2 && (
          <button
            className={`btn w-50 btn navbar ${activeMenu === 'manager' ? 'active' : ''}`}
            onClick={() => toggleMenu('manager')}
          >
            <FontAwesomeIcon icon={faScrewdriverWrench} className="settings-icon" />
          </button>
        )}

        <button className="btn w-50 btn navbar" onClick={toggleNotification}>
          <FontAwesomeIcon icon={faBell} className="settings-icon" />
          {unreadCount > 0 && <span className="notification-badge">{unreadCount}</span>}
        </button>

        {userRole === 1 && (
          <>
            <button
              className={`btn w-50 btn navbar ${activeMenu === 'admin' ? 'active' : ''}`}
              onClick={() => toggleMenu('admin')}
            >
              <FontAwesomeIcon icon={faGear} className="settings-icon" />
              {missingTrelloCount > 0 && (
                <span className="notification-badge">{missingTrelloCount}</span>
              )}
            </button>

            {/*  <button
              className={`btn w-50 btn navbar ${activeMenu === "admin" ? "active" : ""}`}
              onClick={() => setIsChatOpen((prev) => !prev)}
            >
              💬
            </button>*/}
          </>
        )}

        <button className="btn w-50 btn navbar" onClick={toggleSearchDropdown}>
          <FontAwesomeIcon icon={faSearch} />
        </button>
      </header>

      {/* Dropdown Menus */}
      <div className="dropdown-container-nav">
        {/* Dropdown per il menu "user" */}
        <CSSTransition in={activeMenu === 'user'} timeout={300} classNames="dropdown" unmountOnExit>
          <div className="dropdown-menu-nav">
            <ul>{renderUserLinks()}</ul>
          </div>
        </CSSTransition>

        {/* Dropdown per il menu "manager" */}
        <CSSTransition
          in={activeMenu === 'manager'}
          timeout={300}
          classNames="dropdown"
          unmountOnExit
        >
          <div className="dropdown-menu-nav">
            <ul>{renderManagerSection()}</ul>
          </div>
        </CSSTransition>

        {/* Dropdown per il menu "admin" */}
        <CSSTransition
          in={activeMenu === 'admin'}
          timeout={300}
          classNames="dropdown"
          unmountOnExit
        >
          <div className="dropdown-menu-nav">
            <ul>{renderAdminSection()}</ul>
          </div>
        </CSSTransition>

        {/* Dropdown per le notifiche */}
        <CSSTransition in={isNotificationOpen} timeout={300} classNames="dropdown" unmountOnExit>
          <div className="dropdown-menu-nav">
            <ul>
              <h4>Notifiche</h4>
              {notifications.length > 0 && (
                <button
                  className="btn btn--blue w-200 btn--pill"
                  style={{ marginBottom: '10px', marginLeft: '10px' }}
                  onClick={markAllAsRead}
                >
                  Segna tutte come lette
                </button>
              )}
              {notifications.length > 0 ? (
                notifications.map((notification) => (
                  <li key={notification.id}>
                    {notification.message}
                    -- Notifica ricevuta il {new Date(notification.created_at).toLocaleDateString()}
                  </li>
                ))
              ) : (
                <p>Nessuna notifica</p>
              )}
            </ul>
          </div>
        </CSSTransition>

        {/* Dropdown per il chatbot 
       <CSSTransition in={isChatOpen} timeout={300} classNames="dropdown" unmountOnExit>
          <div className="chatbot-container">
            <ChatGPTChatbot />
          </div>
        </CSSTransition>*/}
      </div>

      {/* Dropdown di ricerca */}
      <CSSTransition in={isSearchOpen} timeout={300} classNames="dropdown" unmountOnExit>
        <div className="search-dropdown" ref={wrapperRef}>
          <input
            type="text"
            placeholder="Inserisci commessa, cliente o #tag"
            value={searchValue}
            onChange={handleSearchInputChange}
            className="w-400"
          />

          {loading ? (
            <div className="search-loading">Caricamento...</div>
          ) : suggestions.length > 0 ? (
            <ul className="search-suggestions">
              {selectedTag ? (
                <li className="search-suggestions-title">Commesse con #{selectedTag.nome}</li>
              ) : isTagMode ? (
                <li className="search-suggestions-title">Tag:</li>
              ) : (
                <li className="search-suggestions-title">Commesse:</li>
              )}

              {[...suggestions]
                .sort((a, b) => {
                  if (a.type === 'tag' || b.type === 'tag') return 0;

                  const getNum = (val) =>
                    parseInt(String(val || '').replace(/[^0-9]/g, ''), 10) || 0;

                  return getNum(b.numero_commessa) - getNum(a.numero_commessa);
                })
                .map((sugg, index) => {
                  if (sugg.type === 'tag') {
                    return (
                      <li
                        key={`tag-${sugg.id}-${index}`}
                        className="search-suggestion-item"
                        onClick={() => handleSuggestionClick(sugg)}
                      >
                        <div className="search-main-row">
                          <span
                            className="tag-color-dot"
                            style={{ backgroundColor: sugg.colore || '#999' }}
                          />
                          <span className="tag-prefisso-badge">{sugg.prefisso}</span>
                          <span>{sugg.label}</span>
                        </div>
                        <div className="search-sub-row">
                          {sugg.reparto || 'globale'} · {sugg.commesseCount} commesse ·{' '}
                          {sugg.schedeCount} schede
                        </div>
                      </li>
                    );
                  }

                  if (sugg.type === 'commessaByTag') {
                    return (
                      <li
                        key={`commessa-by-tag-${sugg.commessa_id}-${index}`}
                        className="search-suggestion-item"
                        onClick={() => handleSuggestionClick(sugg)}
                      >
                        <div className="search-main-row">
                          {sugg.numero_commessa} - {sugg.cliente}
                        </div>
                        <div className="search-sub-row">
                          {sugg.schedeCount} schede con {sugg.tag?.label || `#${selectedTag?.nome}`}
                        </div>
                      </li>
                    );
                  }

                  return (
                    <li
                      key={`commessa-${sugg.id}-${index}`}
                      className="search-suggestion-item"
                      onClick={() => handleSuggestionClick(sugg)}
                    >
                      {sugg.numero_commessa} - {sugg.cliente}
                    </li>
                  );
                })}
            </ul>
          ) : searchValue.trim() ? (
            <div className="search-empty">
              {selectedTag
                ? `Nessuna commessa trovata per #${selectedTag.nome}`
                : isTagMode
                  ? 'Nessun tag trovato'
                  : 'Nessuna commessa trovata'}
            </div>
          ) : null}
        </div>
      </CSSTransition>

      {/* Popup dei dettagli della commessa (se selezionata) */}
      {selectedCommessa && (
        <CommessaDettagli commessa={selectedCommessa} onClose={closeSearchPopup} />
      )}
      {showAfterSales && <AfterSalesQuickPopup onClose={() => setShowAfterSales(false)} />}
    </>
  );
}

export default Navbar;
