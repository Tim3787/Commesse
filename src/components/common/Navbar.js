import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import "./Navbar.css";
import axios from "axios";
import { jwtDecode } from "jwt-decode";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import "react-toastify/dist/ReactToastify.css";
import {  toast } from "react-toastify";
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
  faSearch, // aggiunto
} from "@fortawesome/free-solid-svg-icons";
import { fetchCommesse } from "../services/API/commesse-api"; // import per caricare le commesse
import CommessaDettagli from "../popup/CommessaDettagli"; // import per il popup dei dettagli

function Navbar({ isAuthenticated, userRole, handleLogout }) {
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const token = sessionStorage.getItem("token");
  const [activeMenu, setActiveMenu] = useState(null);

  // State per la ricerca nella navbar
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [commesseList, setCommesseList] = useState([]);
  const [selectedCommessa, setSelectedCommessa] = useState(null);

  // Decodifica il token e ottieni l'ID utente
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

  // Effetto per caricare la lista delle commesse per la ricerca
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

  const toggleMenu = (menu) => {
    setActiveMenu((prevMenu) => (prevMenu === menu ? null : menu));
  };

  // FUNZIONI PER IL DROPDOWN DI RICERCA NELLA NAVBAR

  // Apre o chiude il dropdown della ricerca
  const toggleSearchDropdown = () => {
    setIsSearchOpen((prev) => !prev);
  };

  // Cerca una commessa in base al numero (match esatto)
  const handleSearch = () => {
    const trimmed = searchValue.trim();
    if (!trimmed) {
      toast.error("Inserisci un numero commessa valido.");
      return;
    }
    const found = commesseList.find(
      (c) => c.numero_commessa.toString() === trimmed
    );
    if (found) {
      setSelectedCommessa(found);
      setIsSearchOpen(false);
      setSearchValue("");
    } else {
      toast.error("Commessa non trovata.");
    }
  };

  // **Definizione della funzione mancante** per chiudere il popup di ricerca
  const closeSearchPopup = () => {
    setSelectedCommessa(null);
  };

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
        <button
          className="menu-toggle"
          onClick={() => setIsNotificationOpen(!isNotificationOpen)}
        >
          <FontAwesomeIcon icon={faBell} className="settings-icon" />
          {unreadCount > 0 && <span className="notification-badge">{unreadCount}</span>}
        </button>
        {userRole === 1 && (
          <button
            className={`menu-toggle ${activeMenu === "admin" ? "active" : ""}`}
            onClick={() => toggleMenu("admin")}
          >
            <FontAwesomeIcon icon={faGear} className="settings-icon" />
          </button>
        )}
        <button className="menu-toggle" onClick={handleLogout}>
          <FontAwesomeIcon icon={faRightFromBracket} className="settings-icon-last" />
        </button>
        {/* Pulsante di ricerca con icona lente */}
        <button className="search-button" onClick={toggleSearchDropdown}>
          <FontAwesomeIcon icon={faSearch} />
        </button>
      </header>

      {/* Dropdown Menus */}
      <div className="dropdown-container-nav">
        {activeMenu === "user" && (
          <div className="dropdown-menu-nav">
            <ul>{renderLinks(navLinks.user)}</ul>
          </div>
        )}
        {activeMenu === "manager" && (
          <div className="dropdown-menu-nav">
            <ul>{renderLinks(navLinks.manager)}</ul>
          </div>
        )}
        {activeMenu === "admin" && (
          <div className="dropdown-menu-nav">
            <ul>{renderLinks(navLinks.admin)}</ul>
          </div>
        )}
        {isNotificationOpen && (
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
        )}
      </div>

      {/* Dropdown di ricerca nella Navbar */}
      {isSearchOpen && (
        <div className="search-dropdown">
          <input
            type="text"
            placeholder="Inserisci numero commessa"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className="input-field-100"
          />
          <button onClick={handleSearch} className="btn btn-primary">
            Cerca
          </button>
        </div>
      )}

      {/* Popup dei dettagli della commessa trovata */}
      {selectedCommessa && (
        <CommessaDettagli commessa={selectedCommessa} onClose={closeSearchPopup} />
      )}
    </>
  );
}

export default Navbar;