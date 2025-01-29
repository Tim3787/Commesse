import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import "./Navbar.css";
import axios from "axios";
import { jwtDecode } from "jwt-decode";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUser,
  faTasks,
  faClipboardList,
  faUsers,
  faProjectDiagram,
  faTools,
  faUserCog,
  faCalendarAlt,
  faListCheck,
  faChartBar,
  faBuilding,
} from "@fortawesome/free-solid-svg-icons";



function Navbar({ isAuthenticated, userRole, handleLogout }) {
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const token = sessionStorage.getItem("token");
  const [activeMenu, setActiveMenu] = useState(null);

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

  if (decodedToken) {

  } else {
    console.error("Token non valido o scaduto.");
  }

  useEffect(() => {
    let interval;
    if (isAuthenticated) {
        fetchUnreadNotifications();
        // Controlla nuove notifiche ogni 60 secondi
        interval = setInterval(fetchUnreadNotifications, 60000);
    }

    // Pulisce l'intervallo quando l'utente si disconnette o il componente viene smontato
    return () => clearInterval(interval);
}, [isAuthenticated]);

  const fetchUnreadNotifications = async () => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/notifiche/unread`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
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
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        )
      );
      await Promise.all(promises);
      setUnreadCount(0);
      fetchUnreadNotifications(); // Aggiorna le notifiche
    } catch (error) {
      console.error("Errore durante il contrassegno delle notifiche come lette:", error);
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  const navLinks = {
    user: [
      { to: "/Dashboard", label: "Bacheca personale", icon: faUser },
      { to: "/visualizzazione-commesse", label: "Visualizza dettagli commesse", icon: faClipboardList },
      { to: "/calendario-attivita", label: "Calendario attività", icon: faCalendarAlt },
      { to: "/CalendarioCommesse", label: "Calendario commesse", icon: faCalendarAlt },
      { to: "/visualizzazione-attivita", label: "Attività commessa", icon: faTasks },
    ],
    manager: [
      {
        label: "Rep. Software",
        links: [
          { to: "/StatoAvanzamentoSoftware", label: "Stato avanzamento", icon: faChartBar },
          { to: "/DashboardSoftware", label: "Attività software", icon: faTasks },
          { to: "/TrelloBoardSoftware", label: "Bacheca Trello", icon: faClipboardList },
        ],
      },
      {
        label: "Rep. Elettrico",
        links: [
          { to: "/StatoAvanzamentoElettrico", label: "Stato avanzamento", icon: faChartBar },
          { to: "/DashboardElettrico", label: "Attività elettrico", icon: faTasks },
          { to: "/TrelloBoardElettrico", label: "Bacheca Trello", icon: faClipboardList },
        ],
      },
      {
        label: "Rep. QE",
        links: [
          { to: "/StatoAvanzamentoQuadri", label: "Stato avanzamento quadri", icon: faChartBar },
          { to: "/DashboardQuadri", label: "Attività quadri", icon: faTasks },
        ],
      },
      {
        label: "Rep. Service",
        links: [
          { to: "/DashboardService", label: "Attività service", icon: faTools },
        ],
      },
      { to: "/gestione-commesse", label: "Crea o modifica commessa", icon: faProjectDiagram },
      { to: "/assegna-attivita", label: "Tutte le attività", icon: faListCheck },
      { to: "/StatiAvanzamento", label: "Tutti gli stati avanzamento", icon: faChartBar },
    ],
    admin: [
      { to: "/utenti", label: "Gestione utenti", icon: faUsers },
      { to: "/reparti", label: "Gestione reparti", icon: faBuilding },
      { to: "/risorse", label: "Gestione risorse", icon: faUserCog },
      { to: "/statiCommessa", label: "Stati commessa", icon: faClipboardList },
      { to: "/stati", label: "Stati avanzamento", icon: faListCheck },
      { to: "/attivita", label: "Gestione attività", icon: faTasks },
      { to: "/MatchCommesse", label: "Commesse Trello", icon: faClipboardList },
    ],
  };
  
  const renderLinks = (links) =>
    links.map((link, index) => {
      if (link.links) {
        // Sottogruppi (dropdown con più link)
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

  if (!isAuthenticated) {
    return null;
  }
  return (
    <>
      {/* Navbar Header */}
      <header className="navbar-header">
        <button
          className={`menu-toggle ${activeMenu === "user" ? "active" : ""}`}
          onClick={() => toggleMenu("user")}
        >
          ☰ Menu

        </button>
        {userRole <= 2 && (
          <button
            className={`menu-toggle ${activeMenu === "manager" ? "active" : ""}`}
            onClick={() => toggleMenu("manager")}
          >
            ☰ Manager
          </button>
        )}
        {userRole === 1 && (
          <button
            className={`menu-toggle ${activeMenu === "admin" ? "active" : ""}`}
            onClick={() => toggleMenu("admin")}
          >
            ☰ Admin
          </button>
        )}
                  {/* Icona notifiche */}
                  <div
            className="notification-icon"
            onClick={() => setIsNotificationOpen(!isNotificationOpen)}
          >
            🔔
            {unreadCount > 0 && <span className="notification-badge">{unreadCount}</span>}
          </div>
        <button className="logout-button" onClick={handleLogout}>
          Logout
        </button>
      </header>

      {/* Dropdown Menus */}
      <div className="dropdown-container-nav ">
        {activeMenu === "user" && (
          <div className="dropdown-menu-nav ">
            <ul>{renderLinks(navLinks.user)}</ul>
          </div>
        )}
        {activeMenu === "manager" && (
          <div className="dropdown-menu-nav ">
            <ul>{renderLinks(navLinks.manager)}</ul>
          </div>
        )}
        {activeMenu === "admin" && (
          <div className="dropdown-menu-nav ">
            <ul>{renderLinks(navLinks.admin)}</ul>
          </div>
        )}
        {/* Dropdown notifiche */}
        {isNotificationOpen && (
          <div className="dropdown-menu-nav ">
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
    </>
  );
}

export default Navbar;

