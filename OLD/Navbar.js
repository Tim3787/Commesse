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
    console.log("ID utente decodificato:", decodedToken.id); // Log dell'ID utente
  } else {
    console.error("Token non valido o scaduto.");
  }

  useEffect(() => {
    if (isAuthenticated) {
      fetchUnreadNotifications();
    }
  }, [isAuthenticated]);

  const fetchUnreadNotifications = async () => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/notifications/unread`,
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
          `${process.env.REACT_APP_API_URL}/api/notifications/${notification.id}/read`,
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
          {/* Pulsante per il menu utente */}
          <button
            className={`menu-toggle ${activeMenu === "user" ? "active" : ""}`}
            onClick={() => toggleMenu("user")}
          >
            ☰ 
          </button>
          {activeMenu === "user" && (
            <div className="dropdown-menu">
              <ul>{renderLinks(navLinks.user)}</ul>
            </div>
          )}
    
          {/* Pulsante per il menu manager */}
          {userRole <= 2 && (
            <>
              <button
                className={`menu-toggle ${activeMenu === "manager" ? "active" : ""}`}
                onClick={() => toggleMenu("manager")}
              >
                ☰ Manager
              </button>
              {activeMenu === "manager" && (
                <div className="dropdown-menu">
                  <ul>{renderLinks(navLinks.manager)}</ul>
                </div>
              )}
            </>
          )}
    
          {/* Pulsante per il menu admin */}
          {userRole === 1 && (
            <>
              <button
                className={`menu-toggle ${activeMenu === "admin" ? "active" : ""}`}
                onClick={() => toggleMenu("admin")}
              >
                ☰ Admin
              </button>
              {activeMenu === "admin" && (
                <div className="dropdown-menu">
                  <ul>{renderLinks(navLinks.admin)}</ul>
                </div>
              )}
            </>
          )}
    
          {/* Icona notifiche */}
          <div
            className="notification-icon"
            onClick={() => setIsNotificationOpen(!isNotificationOpen)}
          >
            🔔
            {unreadCount > 0 && <span className="notification-badge">{unreadCount}</span>}
          </div>
    
          {/* Logout */}
          <button className="logout-button" onClick={handleLogout}>
            Logout
          </button>
        </div>
    
        {/* Dropdown notifiche */}
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
