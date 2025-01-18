import React, { useEffect, useState } from "react";
import axios from "axios";

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadNotifications, setUnreadNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const token = sessionStorage.getItem("token");

  // Funzione per recuperare tutte le notifiche
  const fetchNotifications = async () => {
  try {
    const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/notifiche`, {
      headers: { Authorization: `Bearer ${sessionStorage.getItem("token")}` },
    });
    setNotifications(response.data); // Aggiorna lo stato con le notifiche ricevute
  } catch (error) {
    console.error("Errore nel recupero delle notifiche:", error);
  }
};

useEffect(() => {
  const interval = setInterval(() => {
    fetchNotifications();
  }, 10000); // Ogni 10 secondi

  return () => clearInterval(interval);
}, []);

  // Funzione per recuperare solo notifiche non lette
  const fetchUnreadNotifications = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/notifiche/unread`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUnreadNotifications(response.data);
    } catch (error) {
      console.error("Errore nel recupero delle notifiche non lette:", error);
    }
  };

  // Funzione per contrassegnare una notifica come letta
  const markAsRead = async (id) => {
    try {
      await axios.put(`${process.env.REACT_APP_API_URL}/api/notifiche/${id}/read`, null, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchNotifications(); // Aggiorna l'elenco delle notifiche
      fetchUnreadNotifications(); // Aggiorna le notifiche non lette
    } catch (error) {
      console.error("Errore durante il contrassegno come letto:", error);
    }
  };

  // Funzione per eliminare una notifica
  const deleteNotification = async (id) => {
    try {
      await axios.delete(`${process.env.REACT_APP_API_URL}/api/notifiche/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchNotifications(); // Aggiorna l'elenco delle notifiche
    } catch (error) {
      console.error("Errore durante l'eliminazione della notifica:", error);
    }
  };

  useEffect(() => {
    fetchNotifications();
    fetchUnreadNotifications();
  }, []);

  return (
    <div className="notifications-container">
      <h2>Notifiche</h2>
      {loading ? (
        <p>Caricamento in corso...</p>
      ) : (
        <ul>
          {notifications.map((notification) => (
            <li
              key={notification.id}
              className={`notification-item ${notification.is_read ? "read" : "unread"}`}
            >
              <p>{notification.message}</p>
              <small>Creato il: {new Date(notification.created_at).toLocaleDateString()}</small>
              <div className="notification-actions">
                {!notification.is_read && (
                  <button onClick={() => markAsRead(notification.id)}>Segna come letto</button>
                )}
                <button onClick={() => deleteNotification(notification.id)}>Elimina</button>
              </div>
            </li>
          ))}
        </ul>
      )}
      <h3>Non lette: {unreadNotifications.length}</h3>
    </div>
  );
};

export default Notifications;
