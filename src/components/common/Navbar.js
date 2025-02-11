import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import "./Navbar.css";
import axios from "axios";
// Importa jwtDecode come default (assicurati che il pacchetto jwt-decode sia installato)
import { jwtDecode } from "jwt-decode";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import "react-toastify/dist/ReactToastify.css";
import ChatGPTChatbot from "../assets/ChatGPTChatbot";

// Importa le icone di FontAwesome
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
  faSearch, // icona della lente
} from "@fortawesome/free-solid-svg-icons";

// Importa CSSTransition per le animazioni di transizione
import { CSSTransition } from "react-transition-group";

// Importa la funzione per il caricamento delle commesse e il popup dei dettagli
import { fetchCommesse } from "../services/API/commesse-api";
import CommessaDettagli from "../popup/CommessaDettagli";

/**
 * Componente Navbar
 * Visualizza la barra di navigazione con i menu a tendina, le notifiche, il dropdown di ricerca e il chatbot.
 *
 * Props:
 *  - isAuthenticated: boolean che indica se l'utente è autenticato.
 *  - userRole: ruolo dell'utente (per determinare quali menu mostrare).
 *  - handleLogout: funzione per eseguire il logout.
 */
function Navbar({ isAuthenticated, userRole, handleLogout }) {
  // -------------------------------------------------------------------
  // Stati del componente
  // -------------------------------------------------------------------
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const token = sessionStorage.getItem("token");
  const [activeMenu, setActiveMenu] = useState(null); // Menu attivo (user, manager, admin)
  const [isChatOpen, setIsChatOpen] = useState(false); // Stato per il chatbot
  const [isSearchOpen, setIsSearchOpen] = useState(false); // Stato per il dropdown di ricerca
  const [searchValue, setSearchValue] = useState("");
  const [commesseList, setCommesseList] = useState([]); // Elenco delle commesse per il motore di ricerca
  const [searchSuggestions, setSearchSuggestions] = useState([]);
  const [selectedCommessa, setSelectedCommessa] = useState(null); // Commessa selezionata per visualizzare i dettagli

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
  // Effetto per il polling delle notifiche non lette (ogni 60 secondi)
  // -------------------------------------------------------------------
  useEffect(() => {
    let interval;
    if (isAuthenticated) {
      fetchUnreadNotifications();
      interval = setInterval(fetchUnreadNotifications, 60000);
    }
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  // Recupera le notifiche non lette dal backend
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

  // Contrassegna tutte le notifiche come lette
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

  // Se l'utente non è autenticato, non renderizza nulla
  if (!isAuthenticated) {
    return null;
  }

  // -------------------------------------------------------------------
  // Definizione dei link di navigazione in base al ruolo
  // -------------------------------------------------------------------
  const navLinks = {
    user: [
      { to: "/Dashboard", label: "Bacheca personale", icon: faUser },
      { to: "/visualizzazione-commesse", label: "Visualizza i dettagli delle commesse", icon: faClipboardList },
      { to: "/calendario-attivita", label: "Calendario delle attività", icon: faCalendarAlt },
      { to: "/CalendarioCommesse", label: "Calendario consegne e FAT commesse", icon: faCalendarAlt },
      { to: "/visualizzazione-attivita", label: "Visualizza tutte le attività di una commessa", icon: faTasks },
      { to: "/PrenotazioneSale", label: "Prenotazione sale riunioni", icon: faBusinessTime },
    ],
    manager: [
      {
        label: "Rep. Software",
        links: [
          { to: "/StatoAvanzamento/software", label: "Stato avanzamento", icon: faChartBar },
          { to: "/Dashboard/software", label: "Attività", icon: faTasks },
          { to: "/TrelloBoardSoftware", label: "Bacheca Trello", icon: faClipboardList },
        ],
      },
      {
        label: "Rep. Elettrico",
        links: [
          { to: "/StatoAvanzamento/elettrico", label: "Stato avanzamento", icon: faChartBar },
          { to: "/Dashboard/elettrico", label: "Attività", icon: faTasks },
          { to: "/TrelloBoardElettrico", label: "Bacheca Trello", icon: faClipboardList },
        ],
      },
      {
        label: "Rep. QE",
        links: [
          { to: "/StatoAvanzamento/quadristi", label: "Stato avanzamento", icon: faChartBar },
          { to: "/Dashboard/quadristi", label: "Attività", icon: faTasks },
        ],
      },
      {
        label: "Rep. Service",
        links: [
          { to: "/Dashboard/service", label: "Attività", icon: faTools },
        ],
      },
      { to: "/gestione-commesse", label: "Crea o modifica commessa", icon: faProjectDiagram },
      { to: "/assegna-attivita", label: "Tutte le attività", icon: faListCheck },
      { to: "/StatiAvanzamento", label: "Tutti gli stati avanzamento", icon: faChartBar },
    ],
    admin: [
      { to: "/utenti", label: "Gestione utenti", icon: faUsers },
      { to: "/GestioneTabelle", label: "Gestione tabelle", icon: faClipboardList },
      { to: "/MatchCommesse", label: "Commesse trello", icon: faClipboardList },
    ],
  };

  // -------------------------------------------------------------------
  // Funzione per renderizzare i link di navigazione
  // -------------------------------------------------------------------
  const renderLinks = (links) =>
    links.map((link, index) => {
      if (link.links) {
        return (
          <li key={index} className="dropdown-subgroup">
            <span className="subgroup-title">{link.label}</span>
            <ul>
              {link.links.map((subLink, subIndex) => (
                <li key={subIndex}>
                  <Link to={subLink.to} onClick={() => setActiveMenu(null)}>
                    <FontAwesomeIcon icon={subLink.icon} className="menu-icon" /> {subLink.label}
                  </Link>
                </li>
              ))}
            </ul>
          </li>
        );
      }
      return (
        <li key={index}>
          <Link to={link.to} onClick={() => setActiveMenu(null)}>
            <FontAwesomeIcon icon={link.icon} className="menu-icon" /> {link.label}
          </Link>
        </li>
      );
    });

  // -------------------------------------------------------------------
  // Gestione dei dropdown (menu, ricerca, notifiche, chatbot)
  // -------------------------------------------------------------------
  // Quando si apre un menu, chiudi gli altri dropdown
  const toggleMenu = (menu) => {
    setActiveMenu((prevMenu) => (prevMenu === menu ? null : menu));
    setIsSearchOpen(false);
    setIsNotificationOpen(false);
  };

  // Apertura/chiusura del dropdown di ricerca
  const toggleSearchDropdown = () => {
    setIsSearchOpen((prev) => !prev);
    setActiveMenu(null);
    setIsNotificationOpen(false);
  };

  // Apertura/chiusura del dropdown delle notifiche
  const toggleNotification = () => {
    setIsNotificationOpen((prev) => !prev);
    setActiveMenu(null);
    setIsSearchOpen(false);
  };

  // Aggiorna i suggerimenti di ricerca in base al testo digitato
  const handleSearchInputChange = (e) => {
    const value = e.target.value;
    setSearchValue(value);
    if (value.trim() !== "") {
      const suggestionsFiltered = commesseList.filter((c) =>
        c.numero_commessa.toString().includes(value.trim())
      );
      setSearchSuggestions(suggestionsFiltered);
    } else {
      setSearchSuggestions([]);
    }
  };

  // Chiude il popup dei dettagli della commessa selezionata
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
        {/* Bottone per il menu "user" */}
        <button
          className={`menu-toggle ${activeMenu === "user" ? "active" : ""}`}
          onClick={() => toggleMenu("user")}
        >
          <FontAwesomeIcon icon={faBars} className="settings-icon" />
        </button>

        {/* Se l'utente è manager o inferiore, mostra il menu manager */}
        {userRole <= 2 && (
          <button
            className={`menu-toggle ${activeMenu === "manager" ? "active" : ""}`}
            onClick={() => toggleMenu("manager")}
          >
            <FontAwesomeIcon icon={faScrewdriverWrench} className="settings-icon" />
          </button>
        )}

        {/* Bottone per le notifiche */}
        <button className="menu-toggle" onClick={toggleNotification}>
          <FontAwesomeIcon icon={faBell} className="settings-icon" />
          {unreadCount > 0 && <span className="notification-badge">{unreadCount}</span>}
        </button>

        {/* Se l'utente è admin (userRole === 1), mostra anche il menu admin e il bottone per il chatbot */}
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

        {/* Bottone per aprire il dropdown di ricerca */}
        <button className="menu-toggle" onClick={toggleSearchDropdown}>
          <FontAwesomeIcon icon={faSearch} />
        </button>

        {/* Bottone di logout */}
        <button className="menu-toggle" onClick={handleLogout}>
          <FontAwesomeIcon icon={faRightFromBracket} className="settings-icon-last" />
        </button>
      </header>

      {/* Dropdown Menus */}
      <div className="dropdown-container-nav">
        {/* Dropdown per il menu "user" */}
        <CSSTransition in={activeMenu === "user"} timeout={300} classNames="dropdown" unmountOnExit>
          <div className="dropdown-menu-nav">
            <ul>{renderLinks(navLinks.user)}</ul>
          </div>
        </CSSTransition>

        {/* Dropdown per il menu "manager" */}
        <CSSTransition in={activeMenu === "manager"} timeout={300} classNames="dropdown" unmountOnExit>
          <div className="dropdown-menu-nav">
            <ul>{renderLinks(navLinks.manager)}</ul>
          </div>
        </CSSTransition>

        {/* Dropdown per il menu "admin" */}
        <CSSTransition in={activeMenu === "admin"} timeout={300} classNames="dropdown" unmountOnExit>
          <div className="dropdown-menu-nav">
            <ul>{renderLinks(navLinks.admin)}</ul>
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
            placeholder="Inserisci numero commessa"
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
