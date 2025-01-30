import React, { useState, useEffect } from "react";
import "../style.css";
import logo from "../assets/Animation - 1738249246846.gif";
import { ToastContainer, toast } from "react-toastify";  // Importa toast
import "react-toastify/dist/ReactToastify.css";  // Stile per il toast
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
        toast.error("Errore nel caricamento dei dati.");
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
        toast.error("Utente non trovato.");
        return;
      }
  
      await updateUserRole(
        userId,
        newRoleId,
        currentUser.username,
        currentUser.email,
        currentUser.risorsa_id
      );
  
      toast.success("Ruolo aggiornato con successo!");

 // Aggiorna lo stato locale
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
  

  
  

  const handleAssignResource = async (userId, risorsaId) => {
    try {
      await assignResourceToUser(userId, risorsaId);

       // Aggiorna lo stato locale
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

  const handleDeleteUser = async (userId) => {
    if (window.confirm("Sei sicuro di voler eliminare questo utente?")) {
    try {
      await deleteUser(userId);

       // Aggiorna lo stato locale
      setUtenti((prev) => prev.filter((utente) => utente.id !== userId));
      toast.success("Utente eliminato con successo!");
    } catch (error) {
      console.error("Errore durante l'eliminazione dell'utente:", error);
      toast.error("Errore durante l'eliminazione dell'utente.");
    }
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
      <ToastContainer position="top-left" autoClose={3000} hideProgressBar />  
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
