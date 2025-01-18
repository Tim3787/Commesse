import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import "./Navbar.css";
import axios from "axios";

function Navbar({ isAuthenticated, userRole, handleLogout }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const token = sessionStorage.getItem("token");

  useEffect(() => {
    if (isAuthenticated) {
      fetchUnreadNotifications();
    }
  }, [isAuthenticated]);

  const fetchUnreadNotifications = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/notifications/unread`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications(response.data);
      setUnreadCount(response.data.length);
    } catch (error) {
      console.error("Errore durante il recupero delle notifiche:", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const promises = notifications.map((notification) =>
        axios.put(`${process.env.REACT_APP_API_URL}/api/notifications/${notification.id}/read`, null, {
          headers: { Authorization: `Bearer ${token}` },
        })
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
      { to: "/Dashboard", label: "Bacheca" },
      { to: "/visualizzazione-commesse", label: "Visualizza le commesse" },
      { to: "/visualizzazione-attivita", label: "Visualizza le attività" },
      { to: "/calendario-attivita", label: "Calendario delle attività" },
    ],
    manager: [
      { to: "/gestione-commesse", label: "Crea o modifica commessa" },
      { to: "/assegna-attivita", label: "Assegna un'attività" },
      { to: "/gestione-stati-avanzamento", label: "Aggiorna stati avanzamento" },
      { to: "/CalendarioCommesse", label: "Calendario stati commesse" },
    ],
    admin: [
      { to: "/utenti", label: "Gestione utenti" },
      { to: "/reparti", label: "Gestione reparti" },
      { to: "/risorse", label: "Gestione risorse" },
      { to: "/statiCommessa", label: "Gestione stati commessa" },
      { to: "/stati", label: "Gestione stati avanzamento" },
      { to: "/attivita", label: "Gestione attività" },
    ],
  };

  const renderLinks = (links) =>
    links.map((link, index) => (
      <li key={index}>
        <Link to={link.to}>{link.label}</Link>
      </li>
    ));

  return (
    <nav className="navbar">
      <div className="navbar-header">
        <button className="menu-toggle" onClick={() => setIsMenuOpen(!isMenuOpen)}>
          ☰ Menu
        </button>
        <div className="notification-icon" onClick={() => setIsNotificationOpen(!isNotificationOpen)}>
          🔔
          {unreadCount > 0 && <span className="notification-badge">{unreadCount}</span>}
        </div>
        <button className="logout-button" onClick={handleLogout}>
          Logout
        </button>
      </div>
      <div className={`menu ${isMenuOpen ? "open" : ""}`}>
        <ul className="menu-list">
          {renderLinks(navLinks.user)}
          {userRole <= 2 && renderLinks(navLinks.manager)}
          {userRole === 1 && renderLinks(navLinks.admin)}
        </ul>
      </div>
      {isNotificationOpen && (
        <div className="notification-dropdown">
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
    </nav>
  );
}

export default Navbar;
