import React, { useEffect, useState } from "react";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "../style/00-Notifications.css";

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadNotifications, setUnreadNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
const [categoriaFiltro, setCategoriaFiltro] = useState("tutte");

const notificheFiltrate = categoriaFiltro === "tutte"
  ? notifications
  : notifications.filter(n => n.category === categoriaFiltro);

  // Recupera il token dalla sessionStorage
  const token = sessionStorage.getItem("token");
  
  // Tentativo di decodificare il token per estrarre l'ID utente
  let userId = null;
  if (token) {
    try {
      // Decodifica il payload del token (senza usare librerie esterne)
      const decoded = JSON.parse(atob(token.split(".")[1]));
      userId = decoded.id;
    } catch (err) {
      console.error("Errore nella decodifica del token:", err);
      toast.error("Errore nella decodifica del token.");
    }
  } else {
    console.error("Token non presente in sessionStorage.");
    toast.error("Token non presente in sessionStorage.");
  }

  // Funzione per ottenere tutte le notifiche
  const fetchNotifications = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/notifiche`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setNotifications(response.data);
      setUnreadNotifications(response.data.filter((n) => !n.is_read));
    } catch (error) {
      console.error("Errore nel recupero delle notifiche:", error);
      setError("Errore nel recupero delle notifiche");
    } finally {
      setLoading(false);
    }
  };

  // Funzione per contrassegnare una notifica come letta
  const markAsRead = async (id) => {
    try {
      await axios.put(
        `${process.env.REACT_APP_API_URL}/api/notifiche/${id}/read`,
        null,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
      setUnreadNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch (error) {
      console.error("Errore durante il contrassegno come letto:", error);
    }
  };

  // Funzione per eliminare una singola notifica
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

  // Funzione per eliminare tutte le notifiche per la risorsa corrente
  const deleteAllNotifications = async () => {
    if (!userId) {
      console.error("User ID non trovato in sessionStorage.");
      toast.error("Impossibile eliminare le notifiche: ID utente mancante.");
      return;
    }
    try {
      const response = await axios.delete(
        `${process.env.REACT_APP_API_URL}/api/notifiche/utente/${userId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      console.log("Risultato DELETE:", response.data);
      setNotifications([]);
      setUnreadNotifications([]);
      toast.success("Tutte le notifiche eliminate con successo.");
    } catch (error) {
      console.error("Errore durante l'eliminazione di tutte le notifiche:", error);
      toast.error("Errore durante l'eliminazione di tutte le notifiche.");
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000); // Aggiorna ogni 30 secondi
    return () => clearInterval(interval);
  }, [token]);

  return (
    <div className="notifications-container">
      <h2>Non lette: {unreadNotifications.length}</h2>
      <h2>Storico notifiche:
      <select
  className="dropdown"
  value={categoriaFiltro}
  onChange={(e) => setCategoriaFiltro(e.target.value)}
>
  <option value="tutte">Tutte</option>
  <option value="attività">Attività</option>
  <option value="urgente">Urgente</option>
  <option value="generale">Generale</option>
</select></h2>

      {loading && <p>Caricamento in corso...</p>}
      {error && <p className="error">{error}</p>}
      
      {/* Pulsante per eliminare tutte le notifiche della risorsa (solo se userId è disponibile) */}
      {userId && (
        <button className="btn w-200 btn--danger btn--pill" onClick={deleteAllNotifications}>
          Elimina tutte le notifiche
        </button>
      )}

      <ul>
        {notificheFiltrate.map((notification) => (
          <li
            key={notification.id}
            className={`notification-item ${notification.is_read ? "read" : "unread"}`}
          >
            <span className={`badge badge--${notification.category}`}>
  Categoria: { notification.category}
</span>
            <p>{notification.message}</p>
            <small>
              Inviata il: {new Date(notification.created_at).toLocaleDateString()}
            </small>
            <div className="notification-actions">
              {!notification.is_read && (
                <button className="btn w-200 btn--warning btn--pill"  onClick={() => markAsRead(notification.id)}>
                  Segna come letto
                </button>
              )}
              <button className="btn w-200 btn--danger btn--pill"  onClick={() => deleteNotification(notification.id)}>
                Elimina
              </button>
            </div>
          </li>
        ))}
      </ul>
      <ToastContainer position="top-left" autoClose={2000} hideProgressBar />
    </div>
  );
};

export default Notifications;
