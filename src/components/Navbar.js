import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import "./Navbar.css";
import axios from "axios";
import { jwtDecode } from "jwt-decode";



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
      { to: "/Dashboard", label: "Bacheca personale" },
      { to: "/visualizzazione-commesse", label: "Visualizza dettagli commesse" },
      { to: "/calendario-attivita", label: "Calendario attività" },
      { to: "/CalendarioCommesse", label: "Calendario commesse" },
    ],
    manager: [
      {
        label: "Rep. Software",
        links: [
          { to: "/StatoAvanzamentoSoftware", label: "Stato avanzamento software" },
          { to: "/DashboardSoftware", label: "Attività software dept." },
          { to: "/TrelloBoardSoftware", label: "Bacheca software Trello" },
        ],
      },
      {
        label: "Rep. Elettrico",
        links: [
          { to: "/StatoAvanzamentoElettrico", label: "Stato avanzamento elettrico" },
          { to: "/DashboardElettrico", label: "Attività elettrico dept." },
          { to: "/TrelloBoardElettrico", label: "Bacheca elettrico Trello" },
        ],
      },
      {
        label: "Rep. QE",
        links: [
          { to: "/StatoAvanzamentoQuadri", label: "Stato avanzamento quadri" },
          { to: "/DashboardQuadri", label: "Attività quadri dept." },
        ],
      },
      { to: "/gestione-commesse", label: "Crea o modifica commessa" },
      { to: "/assegna-attivita", label: "Tutte le attività" },
      { to: "/StatiAvanzamento", label: "Tutte gli stati avanzamento" },
    ],
    admin: [
      { to: "/utenti", label: "Gestione utenti" },
      { to: "/reparti", label: "Gestione reparti" },
      { to: "/risorse", label: "Gestione risorse" },
      { to: "/statiCommessa", label: "Gestione stati commessa" },
      { to: "/stati", label: "Gestione stati avanzamento" },
      { to: "/attivita", label: "Gestione attività" },
      { to: "/MatchCommesse", label: "Commesse solo su trello" },
    ],
  };

  const renderLinks = (links) =>
    links.map((link, index) => {
      if (link.links) {
        // Rendi un sottogruppo
        return (
          <li key={index} className="dropdown-subgroup">
            <span className="subgroup-title">{link.label}</span>
            <ul>
              {link.links.map((subLink, subIndex) => (
                <li key={subIndex}>
                  <Link to={subLink.to} onClick={() => setActiveMenu(null)}>
                    {subLink.label}
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
            {link.label}
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

