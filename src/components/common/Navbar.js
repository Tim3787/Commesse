import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import "./Navbar.css";
import axios from "axios";
import { jwtDecode } from "jwt-decode";
import { CSSTransition } from "react-transition-group";
import CommessaDettagli from "../popup/CommessaDettagli";
import ChatGPTChatbot from "../assets/ChatGPTChatbot";

// Import per Toastify (notifiche)
import "react-toastify/dist/ReactToastify.css";

// Import icone FontAwesome
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
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
} from "@fortawesome/free-solid-svg-icons";



// Import API per le varie entità
import { fetchCommesse } from "../services/API/commesse-api";

function Navbar({ isAuthenticated, userRole, handleLogout }) {
  // -------------------------------------------------------------------
  // Stati del componente
  // -------------------------------------------------------------------
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const token = sessionStorage.getItem("token");

  // Stato per gestire quale menu dropdown è attivo ("user", "manager", "admin")
  const [activeMenu, setActiveMenu] = useState(null);
  // Stato per il sottomenu nella sezione user (null = menu principale, altrimenti array dei link)
  const [activeUserSubmenu, setActiveUserSubmenu] = useState(null);
  // Stato per il sottomenu nella sezione manager
  const [activeManagerSubmenu, setActiveManagerSubmenu] = useState(null);

  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [commesseList, setCommesseList] = useState([]);
  const [searchSuggestions, setSearchSuggestions] = useState([]);
  const [selectedCommessa, setSelectedCommessa] = useState(null);

  // -------------------------------------------------------------------
  // Decodifica e validazione del token
  // -------------------------------------------------------------------
  const decodeToken = (token) => {
    try {
      const decoded = jwtDecode(token);
      const currentTime = Date.now() / 1000;
      return decoded.exp > currentTime ? decoded : null;
    } catch (error) {
      console.error("Errore nella decodifica del token:", error);
      return null;
    }
  };

  const decodedToken = decodeToken(token);
  if (!decodedToken) {
    console.error("Token non valido o scaduto.");
  }

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
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/notifiche/unread`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setNotifications(response.data);
      setUnreadCount(response.data.length);
    } catch (error) {
      console.error("Errore durante il recupero delle notifiche:", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const promises = notifications.map((notification) =>
        axios.put(
          `${process.env.REACT_APP_API_URL}/api/notifiche/${notification.id}/read`,
          null,
          { headers: { Authorization: `Bearer ${token}` } }
        )
      );
      await Promise.all(promises);
      setUnreadCount(0);
      fetchUnreadNotifications();
    } catch (error) {
      console.error("Errore durante il contrassegno delle notifiche come lette:", error);
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
        console.error("Errore durante il caricamento delle commesse per ricerca:", error);
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
      label: "Commesse",
      icon: faClipboardList,
      submenu: [
        { to: "/visualizzazione-Tutte-commesse", label: "Visualizza tutte le commesse", icon: faClipboardList },
        { to: "/visualizzazione-commesse-Produzione", label: "Visualizza commesse produzione", icon: faClipboardList },
        { to: "/visualizzazione-commesse-R", label: "Visualizza commesse R-", icon: faClipboardList },
        { to: "/visualizzazione-commesse-M", label: "Visualizza commesse M-", icon: faClipboardList },
        { to: "/visualizzazione-attivita", label: "Visualizza attivita", icon: faTasks },
      ],
    },
    {
      label: "Calendari",
      icon: faCalendarAlt,
      submenu: [
        { to: "/calendario-attivita", label: "Calendario delle attività", icon: faCalendarAlt },
        { to: "/CalendarioCommesse", label: "Calendario consegne e FAT commesse", icon: faCalendarAlt },
      ],
    },
    { to: "/Notifications", label: "Storico notifiche", icon: faBell },
    { to: "/Dashboard", label: "Bacheca personale", icon: faUser },
    { to: "/PrenotazioneSale", label: "Prenotazione sale riunioni", icon: faBusinessTime },
  ],
  manager: [
    {
      label: "Rep. Software",
      icon: faScrewdriverWrench,
      links: [
        { to: "/StatoAvanzamento/software", label: "Stato avanzamento", icon: faChartBar },
        { to: "/Dashboard/software", label: "Attività", icon: faTasks },
        { to: "/TrelloBoardSoftware", label: "Bacheca Trello", icon: faClipboardList },
      ],
    },
    {
      label: "Rep. Elettrico",
      icon: faScrewdriverWrench,
      links: [
        { to: "/StatoAvanzamento/elettrico", label: "Stato avanzamento", icon: faChartBar },
        { to: "/Dashboard/elettrico", label: "Attività", icon: faTasks },
        { to: "/TrelloBoardElettrico", label: "Bacheca Trello", icon: faClipboardList },
      ],
    },
    {
      label: "Rep. QE",
      icon: faScrewdriverWrench,
      links: [
        { to: "/StatoAvanzamento/quadristi", label: "Stato avanzamento", icon: faChartBar },
        { to: "/Dashboard/quadristi", label: "Attività", icon: faTasks },
      ],
    },
    {
      label: "Rep. Service",
      icon: faScrewdriverWrench,
      links: [{ to: "/Dashboard/service", label: "Attività", icon: faTools }],
    },
    {
      label: "Gestione commesse",
      icon: faCalendarAlt,
      links: [
        { to: "/gestione-commesse", label: "Crea o modifica commessa", icon: faProjectDiagram },
        { to: "/commesse-dettagli", label: "Gestisci componenti", icon: faProjectDiagram },
        { to: "/Assegna-Machina-Componenti", label: "Assegnazione macchine e componenti", icon: faProjectDiagram },
    
      ],
    },
    { to: "/VisualizzaTutteLeAttivita", label: "Tutte le attività", icon: faListCheck },
    { to: "/StatiAvanzamento", label: "Tutti gli stati avanzamento", icon: faChartBar },
  ],
  admin: [
    { to: "/utenti", label: "Gestione utenti", icon: faUsers },
    { to: "/GestioneTabelle", label: "Gestione tabelle", icon: faClipboardList },
    { to: "/MatchCommesse", label: "Commesse trello", icon: faClipboardList },
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
                className="menu-item-button"
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
                <Link
                  to={item.to}
                  className="menu-item-button"
                  onClick={() => setActiveMenu(null)}
                >
                  <FontAwesomeIcon icon={item.icon} className="menu-icon" /> {item.label}
                </Link>
              </li>
            ))}
          </>
        ) : (
          <>
            {navLinks.user.map((link, index) => {
              if (link.submenu) {
                return (
                  <li key={index} className="dropdown-menu-item">
                    <a
                      href="#"
                      className="menu-item-button"
                      onClick={(e) => {
                        e.preventDefault();
                        setActiveUserSubmenu(link.submenu);
                      }}
                    >
                      <FontAwesomeIcon icon={link.icon} className="menu-icon" /> {link.label}{" "}
                      <FontAwesomeIcon icon={faChevronRight} className="submenu-icon" />
                    </a>
                  </li>
                );
              }
              return (
                <li key={index} className="dropdown-menu-item">
                  <Link
                    to={link.to}
                    className="menu-item-button"
                    onClick={() => setActiveMenu(null)}
                  >
                    <FontAwesomeIcon icon={link.icon} className="menu-icon" /> {link.label}
                  </Link>
                </li>
              );
            })}
            <li className="dropdown-menu-item">
              <a
                href="#"
                className="menu-item-button"
                onClick={(e) => {
                  e.preventDefault();
                  setActiveMenu(null);
                  handleLogout();
                }}
              >
                <FontAwesomeIcon icon={faRightFromBracket} className="menu-icon" /> Logout
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
                className="menu-item-button"
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
                <Link
                  to={item.to}
                  className="menu-item-button"
                  onClick={() => setActiveMenu(null)}
                >
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
                    className="menu-item-button"
                    onClick={(e) => {
                      e.preventDefault();
                      setActiveManagerSubmenu(link.links);
                    }}
                  >
                    <FontAwesomeIcon icon={link.icon} className="menu-icon" /> {link.label}{" "}
                    <FontAwesomeIcon icon={faChevronRight} className="submenu-icon" />
                  </a>
                </li>
              );
            }
            return (
              <li key={index} className="dropdown-menu-item">
                <Link
                  to={link.to}
                  className="menu-item-button"
                  onClick={() => setActiveMenu(null)}
                >
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
            <Link to={link.to} className="menu-item-button" onClick={() => setActiveMenu(null)}>
              <FontAwesomeIcon icon={link.icon} className="menu-icon" /> {link.label}
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
    if (menu !== "user") {
      setActiveUserSubmenu(null);
    }
    if (menu !== "manager") {
      setActiveManagerSubmenu(null);
    }
  };

  const toggleSearchDropdown = () => {
    setIsSearchOpen((prev) => !prev);
    setActiveMenu(null);
    setIsNotificationOpen(false);
  };

  const toggleNotification = () => {
    setIsNotificationOpen((prev) => !prev);
    setActiveMenu(null);
    setIsSearchOpen(false);
  };

  const handleSearchInputChange = (e) => {
    const value = e.target.value.toLowerCase().trim();
    setSearchValue(value);
  
    if (value !== "") {
      const suggestionsFiltered = commesseList.filter((c) =>
        c.numero_commessa.toString().includes(value) || // Cerca per numero commessa
        c.cliente.toLowerCase().includes(value) // Cerca per nome cliente
      );
      setSearchSuggestions(suggestionsFiltered);
    } else {
      setSearchSuggestions([]);
    }
  };
  

  const closeSearchPopup = () => {
    setSelectedCommessa(null);
  };

  // -------------------------------------------------------------------
  // Rendering del componente
  // -------------------------------------------------------------------
  return (
    <>
      {/* Navbar Header */}
      <header className="navbar-header">
        <button
          className={`menu-toggle ${activeMenu === "user" ? "active" : ""}`}
          onClick={() => toggleMenu("user")}
        >
          <FontAwesomeIcon icon={faBars} className="settings-icon" />
        </button>

        {userRole <= 2 && (
          <button
            className={`menu-toggle ${activeMenu === "manager" ? "active" : ""}`}
            onClick={() => toggleMenu("manager")}
          >
            <FontAwesomeIcon icon={faScrewdriverWrench} className="settings-icon" />
          </button>
        )}

        <button className="menu-toggle" onClick={toggleNotification}>
          <FontAwesomeIcon icon={faBell} className="settings-icon" />
          {unreadCount > 0 && <span className="notification-badge">{unreadCount}</span>}
        </button>

        {userRole === 1 && (
          <>
            <button
              className={`menu-toggle ${activeMenu === "admin" ? "active" : ""}`}
              onClick={() => toggleMenu("admin")}
            >
              <FontAwesomeIcon icon={faGear} className="settings-icon" />
            </button>
            <button
              className={`menu-toggle ${activeMenu === "admin" ? "active" : ""}`}
              onClick={() => setIsChatOpen((prev) => !prev)}
            >
              💬
            </button>
          </>
        )}

        <button className="menu-toggle" onClick={toggleSearchDropdown}>
          <FontAwesomeIcon icon={faSearch} />
        </button>
      </header>

      {/* Dropdown Menus */}
      <div className="dropdown-container-nav">
        {/* Dropdown per il menu "user" */}
        <CSSTransition in={activeMenu === "user"} timeout={300} classNames="dropdown" unmountOnExit>
          <div className="dropdown-menu-nav">
            <ul>{renderUserLinks()}</ul>
          </div>
        </CSSTransition>

        {/* Dropdown per il menu "manager" */}
        <CSSTransition in={activeMenu === "manager"} timeout={300} classNames="dropdown" unmountOnExit>
          <div className="dropdown-menu-nav">
            <ul>{renderManagerSection()}</ul>
          </div>
        </CSSTransition>

        {/* Dropdown per il menu "admin" */}
        <CSSTransition in={activeMenu === "admin"} timeout={300} classNames="dropdown" unmountOnExit>
          <div className="dropdown-menu-nav">
            <ul>{renderAdminSection()}</ul>
          </div>
        </CSSTransition>

        {/* Dropdown per le notifiche */}
        <CSSTransition in={isNotificationOpen} timeout={300} classNames="dropdown" unmountOnExit>
          <div className="dropdown-menu-nav">
            <h4>Notifiche</h4>
            <ul>
              {notifications.length > 0 ? (
                notifications.map((notification) => (
                  <li key={notification.id}>
                    {notification.message}
                    <small>{new Date(notification.created_at).toLocaleDateString()}</small>
                  </li>
                ))
              ) : (
                <p>Nessuna notifica</p>
              )}
            </ul>
            {notifications.length > 0 && (
              <button onClick={markAllAsRead}>Segna tutte come lette</button>
            )}
          </div>
        </CSSTransition>

        {/* Dropdown per il chatbot */}
        <CSSTransition in={isChatOpen} timeout={300} classNames="dropdown" unmountOnExit>
          <div className="chatbot-container">
            <ChatGPTChatbot />
          </div>
        </CSSTransition>
      </div>

      {/* Dropdown di ricerca */}
      <CSSTransition in={isSearchOpen} timeout={300} classNames="dropdown" unmountOnExit>
        <div className="search-dropdown">
          <input
            type="text"
            placeholder="Inserisci commessa o cliente"
            value={searchValue}
            onChange={handleSearchInputChange}
            className="input-field-100"
          />
          {searchSuggestions.length > 0 && (
            <ul className="search-suggestions">
              {searchSuggestions.map((sugg) => (
                <li
                  key={sugg.commessa_id}
                  onClick={() => {
                    setSelectedCommessa(sugg);
                    setIsSearchOpen(false);
                    setSearchValue("");
                    setSearchSuggestions([]);
                  }}
                >
                  {sugg.numero_commessa} - {sugg.cliente}
                </li>
              ))}
            </ul>
          )}
        </div>
      </CSSTransition>

      {/* Popup dei dettagli della commessa (se selezionata) */}
      {selectedCommessa && (
        <CommessaDettagli commessa={selectedCommessa} onClose={closeSearchPopup} />
      )}
    </>
  );
}

export default Navbar;
