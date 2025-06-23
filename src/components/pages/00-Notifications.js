import React, { useEffect, useState } from "react";
import apiClient from "../config/axiosConfig";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "../style/00-Notifications.css";
import PreferenzeNotificheSection from "../common/PreferenzeNotificheSection";
import logo from "../img/Animation - 1738249246846.gif";
import {
  fetchCategorie
} from"../services/API/notifiche-api";

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadNotifications, setUnreadNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
const [categoriaFiltro, setCategoriaFiltro] = useState("tutte");
const [showPreferences, setShowPreferences] = useState(false);
const [categorieDisponibili, setCategorieDisponibili] = useState([]);

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
      const response = await apiClient.get("/api/notifiche");
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

  const caricaCategorieDisponibili = async () => {
  try {
    const data = await fetchCategorie();
    setCategorieDisponibili(data);
  } catch (err) {
    console.error("Errore nel caricamento categorie disponibili", err);
  }
};


  useEffect(() => {
    fetchNotifications();
      caricaCategorieDisponibili();
    const interval = setInterval(fetchNotifications, 30000); // Aggiorna ogni 30 secondi
    return () => clearInterval(interval);
  }, [token]);

  return (
    <div className="page-wrapper">
        <ToastContainer position="top-left" autoClose={200} hideProgressBar />
         {loading && (
          <div className="loading-overlay">
            <img src={logo} alt="Logo" className="logo-spinner" />
          </div>
        )}   
                <div className=" header">
          <div className="flex-center header-row"> 
      <h1>GESTIONE NOTIFICHE</h1>
      </div>  
      </div> 
    <div className="notifications-container mh-80">
      <button
  className="btn w-200 btn--secondary btn--pill mb-2"
  onClick={() => setShowPreferences((prev) => !prev)}
>
  {showPreferences ? "Nascondi preferenze notifiche" : "Mostra preferenze notifiche"}
</button>
  {/* Inserisci qui le preferenze */}
  {showPreferences && <PreferenzeNotificheSection token={token} />}

      <h2>Notifiche da leggere: {unreadNotifications.length}</h2>
<h2>Visualizza:
  <select
    className="w-200"
    style={{ marginLeft: "15px" }}
    value={categoriaFiltro}
    onChange={(e) => setCategoriaFiltro(e.target.value)}
  >
    <option value="tutte">Tutte</option>
    {categorieDisponibili.map((cat) => (
      <option key={cat} value={cat}>
        {cat}
      </option>
    ))}
  </select>
</h2>


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
              Ricevuta il: {new Date(notification.created_at).toLocaleDateString()}
            </small>
            <div className="row">
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
    </div>
  );
};

export default Notifications;
