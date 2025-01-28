import React, { useState, useEffect } from "react";
import "../style.css";
import logo from "../assets/unitech-packaging.png";
import {
  fetchUsers,
  fetchRoles,
  fetchRisorse,
  updateUserRole,
  assignResourceToUser,
  deleteUser,
} from "../services/api";

function GestioneUtenti() {
  const [utenti, setUtenti] = useState([]);
  const [ruoli, setRuoli] = useState([]);
  const [risorse, setRisorse] = useState([]);
  const [editedUsernames, setEditedUsernames] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [utentiResponse, ruoliResponse, risorseResponse] = await Promise.all([
          fetchUsers(),
          fetchRoles(),
          fetchRisorse(),
        ]);
        setUtenti(utentiResponse);
        setRuoli(ruoliResponse);
        setRisorse(risorseResponse);
      } catch (error) {
        console.error("Errore nel caricamento dati:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleRoleChange = async (userId, newRoleId) => {
    try {
      const currentUser = utenti.find((utente) => utente.id === userId);
  
      if (!currentUser) {
        console.error("Utente non trovato.");
        return;
      }
  
      console.log("Dati inviati:", {
        userId,
        newRoleId,
        username: currentUser.username,
        email: currentUser.email,
        risorsa_id: currentUser.risorsa_id,
      });
  
      await updateUserRole(
        userId,
        newRoleId,
        currentUser.username,
        currentUser.email,
        currentUser.risorsa_id
      );
  
      console.log("Ruolo aggiornato con successo!");
    } catch (error) {
      console.error("Errore durante l'aggiornamento del ruolo:", error);
    }
  };
  

  
  

  const handleAssignResource = async (userId, risorsaId) => {
    try {
      await assignResourceToUser(userId, risorsaId);
      setUtenti((prev) =>
        prev.map((utente) =>
          utente.id === userId ? { ...utente, risorsa_id: risorsaId } : utente
        )
      );
    } catch (error) {
      console.error("Errore durante l'assegnazione della risorsa:", error);
    }
  };

  const handleDeleteUser = async (userId) => {
    try {
      await deleteUser(userId);
      setUtenti((prev) => prev.filter((utente) => utente.id !== userId));
    } catch (error) {
      console.error("Errore durante l'eliminazione dell'utente:", error);
    }
  };

  return (
    <div className="container">
      {loading && (
        <div className="loading-overlay">
          <img src={logo} alt="Logo" className="logo-spinner" />
        </div>
      )}
      <h1>Gestione Utenti</h1>
      <table className="table table-striped table-hover">
        <thead className="table-dark">
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
