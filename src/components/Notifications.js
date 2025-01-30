import React, { useEffect, useState } from "react";
import axios from "axios";


const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadNotifications, setUnreadNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const token = sessionStorage.getItem("token");


  const fetchNotifications = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/notifiche`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications(response.data);
      setUnreadNotifications(response.data.filter((n) => !n.is_read));
    } catch (error) {
      console.error("Errore nel recupero delle notifiche:", error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id) => {
    try {
      await axios.put(`${process.env.REACT_APP_API_URL}/api/notifiche/${id}/read`, null, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
      setUnreadNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch (error) {
      console.error("Errore durante il contrassegno come letto:", error);
    }
  };

  const deleteNotification = async (id) => {
    try {
      await axios.delete(`${process.env.REACT_APP_API_URL}/api/notifiche/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      setUnreadNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch (error) {
      console.error("Errore durante l'eliminazione della notifica:", error);
    }
  };

  useEffect(() => {
    fetchNotifications();

    const interval = setInterval(fetchNotifications, 30000); // Ogni 30 secondi
    return () => clearInterval(interval);
  }, [token]);

  return (
    <div className="notifications-container">
      <h2>Notifiche</h2>
      {loading && <p>Caricamento in corso...</p>}
      {error && <p className="error">{error}</p>}
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
      <h3>Non lette: {unreadNotifications.length}</h3>
    </div>
  );
};

export default Notifications;
