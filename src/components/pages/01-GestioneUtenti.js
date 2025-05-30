import React, { useState, useEffect } from "react";
import "../style.css";
import logo from "../img/Animation - 1738249246846.gif";

// Import per Toastify (notifiche)
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Import delle API per la gestione degli utenti e delle risorse
import {
  deleteUser,
  assignResourceToUser,
  updateUserRole,
  fetchRoles,
  fetchUsers,
} from "../services/API/utenti-api";
import { fetchRisorse } from "../services/API/risorse-api";

/**
 * Componente GestioneUtenti
 * Permette di visualizzare, modificare e cancellare gli utenti,
 * nonché di assegnare loro ruoli e risorse.
 */
function GestioneUtenti() {
  // ------------------------------------------------------------------
  // Stati del componente
  // ------------------------------------------------------------------
  const [utenti, setUtenti] = useState([]);             // Elenco degli utenti
  const [ruoli, setRuoli] = useState([]);               // Elenco dei ruoli disponibili
  const [risorse, setRisorse] = useState([]);           // Elenco delle risorse disponibili
  const [editedUsernames, setEditedUsernames] = useState({}); // Stato per gestire eventuali modifiche al campo "username"
  const [loading, setLoading] = useState(false);        // Stato di caricamento generale

  // ------------------------------------------------------------------
  // Effetto: Fetch iniziale dei dati (utenti, ruoli e risorse)
  // ------------------------------------------------------------------
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Eseguiamo le chiamate in parallelo per migliorare le performance
        const [utentiResponse, ruoliResponse, risorseResponse] = await Promise.all([
          fetchUsers(),
          fetchRoles(),
          fetchRisorse(),
        ]);

        setUtenti(utentiResponse);
        setRuoli(ruoliResponse);
        setRisorse(risorseResponse);
      } catch (error) {
        console.error("Errore nel caricamento dei dati:", error);
        toast.error("Errore nel caricamento dei dati.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // ------------------------------------------------------------------
  // Funzione: Gestione della modifica del ruolo di un utente
  // ------------------------------------------------------------------
  const handleRoleChange = async (userId, newRoleId) => {
    try {
      // Trova l'utente corrente dall'elenco
      const currentUser = utenti.find((utente) => utente.id === userId);
      if (!currentUser) {
        console.error("Utente non trovato.");
        toast.error("Utente non trovato.");
        return;
      }

      // Richiama l'API per aggiornare il ruolo
      await updateUserRole(
        userId,
        newRoleId,
        currentUser.username,
        currentUser.email,
        currentUser.risorsa_id
      );

      toast.success("Ruolo aggiornato con successo!");

      // Aggiorna localmente lo stato degli utenti
      setUtenti((prev) =>
        prev.map((utente) =>
          utente.id === userId ? { ...utente, role_id: newRoleId } : utente
        )
      );
    } catch (error) {
      console.error("Errore durante l'aggiornamento del ruolo:", error);
      toast.error("Errore durante l'aggiornamento del ruolo.");
    }
  };

  // ------------------------------------------------------------------
  // Funzione: Assegna una risorsa ad un utente
  // ------------------------------------------------------------------
  const handleAssignResource = async (userId, risorsaId) => {
    try {
      // Richiama l'API per assegnare la risorsa
      await assignResourceToUser(userId, risorsaId);

      // Aggiorna lo stato locale per riflettere l'assegnazione
      setUtenti((prev) =>
        prev.map((utente) =>
          utente.id === userId ? { ...utente, risorsa_id: risorsaId } : utente
        )
      );
      toast.success("Risorsa assegnata con successo!");
    } catch (error) {
      console.error("Errore durante l'assegnazione della risorsa:", error);
      toast.error("Errore durante l'assegnazione della risorsa.");
    }
  };

  // ------------------------------------------------------------------
  // Funzione: Elimina un utente
  // ------------------------------------------------------------------
  const handleDeleteUser = async (userId) => {
    if (window.confirm("Sei sicuro di voler eliminare questo utente?")) {
      try {
        // Richiama l'API per eliminare l'utente
        await deleteUser(userId);

        // Aggiorna lo stato locale filtrando l'utente eliminato
        setUtenti((prev) => prev.filter((utente) => utente.id !== userId));
        toast.success("Utente eliminato con successo!");
      } catch (error) {
        console.error("Errore durante l'eliminazione dell'utente:", error);
        toast.error("Errore durante l'eliminazione dell'utente.");
      }
    }
  };

  // ------------------------------------------------------------------
  // Rendering del componente GestioneUtenti
  // ------------------------------------------------------------------
  return (
    <div className="container">
      {/* Overlay di caricamento */}
      {loading && (
        <div className="loading-overlay">
          <img src={logo} alt="Logo" className="logo-spinner" />
        </div>
      )}

      <h1>Gestione Utenti</h1>
      <ToastContainer position="top-left" autoClose={3000} hideProgressBar />

      {/* Tabella degli utenti */}
      <table className="Commesse-table-container">
        <thead >
          <tr>
            <th>ID</th>
            <th>Username</th>
            <th>Email</th>
            <th>Ruolo</th>
            <th>Risorsa</th>
            <th>Azioni</th>
          </tr>
        </thead>
        <tbody>
          {utenti.map((utente) => (
            <tr key={utente.id}>
              <td>{utente.id}</td>

              {/* Campo per l'username modificabile */}
              <td>
                <div className="input-group">
                  <input
                    type="text"
                    className="input-field"
                    value={editedUsernames[utente.id] ?? utente.username}
                    onChange={(e) =>
                      setEditedUsernames({
                        ...editedUsernames,
                        [utente.id]: e.target.value,
                      })
                    }
                  />
                </div>
              </td>

              <td>{utente.email}</td>

              {/* Selezione del ruolo */}
              <td>
                <select
                  className="form-select"
                  value={utente.role_id || ""}
                  onChange={(e) => handleRoleChange(utente.id, e.target.value)}
                >
                  <option value="">Seleziona un ruolo</option>
                  {ruoli.map((ruolo) => (
                    <option key={ruolo.id} value={ruolo.id}>
                      {ruolo.role_name}
                    </option>
                  ))}
                </select>
              </td>

              {/* Selezione della risorsa */}
              <td>
                <select
                  className="form-select"
                  value={utente.risorsa_id || ""}
                  onChange={(e) => handleAssignResource(utente.id, e.target.value)}
                >
                  <option value="">Seleziona una risorsa</option>
                  {risorse.map((risorsa) => (
                    <option key={risorsa.id} value={risorsa.id}>
                      {risorsa.nome}
                    </option>
                  ))}
                </select>
              </td>

              {/* Azioni: pulsante per eliminare l'utente */}
              <td>
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={() => handleDeleteUser(utente.id)}
                >
                  Elimina
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default GestioneUtenti;
