import React, { useState, useEffect } from "react";
import axios from "axios";
import "./style.css";

function GestioneUtenti() {
  const [utenti, setUtenti] = useState([]);
  const [ruoli, setRuoli] = useState([]);
  const [risorse, setRisorse] = useState([]);
  const [editedUsernames, setEditedUsernames] = useState({});

  // Carica utenti, ruoli e risorse al caricamento del componente
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [utentiResponse, ruoliResponse, risorseResponse] = await Promise.all([
          axios.get("http://localhost:5000/api/users"),
          axios.get("http://localhost:5000/api/users/roles"),
          axios.get("http://localhost:5000/api/risorse"),
        ]);

        setUtenti(utentiResponse.data);
        setRuoli(ruoliResponse.data);
        setRisorse(risorseResponse.data);
      } catch (error) {
        console.error("Errore nel caricamento dati:", error);
      }
    };

    fetchData();
  }, []);

  // Aggiorna il ruolo dell'utente
  const handleRoleChange = async (userId, newRoleId) => {
    try {
      const currentUser = utenti.find((utente) => utente.id === userId);
      if (!currentUser) return;
  
      const payload = {
        username: currentUser.username,
        email: currentUser.email,
        role_id: newRoleId,
        risorsa_id: currentUser.risorsa_id, // Mantieni la risorsa attuale
      };
  
      await axios.put(`http://localhost:5000/api/users/${userId}`, payload);
      alert("Ruolo aggiornato con successo!");
  
      setUtenti((prevUtenti) =>
        prevUtenti.map((utente) =>
          utente.id === userId ? { ...utente, role_id: newRoleId } : utente
        )
      );
    } catch (error) {
      console.error("Errore durante l'aggiornamento del ruolo:", error);
    }
  };

  // Aggiorna il nome utente
  const handleUsernameChange = async (userId) => {
    try {
      const newUsername = editedUsernames[userId];
      const currentUser = utenti.find((utente) => utente.id === userId);
      if (!newUsername || !currentUser) return;
  
      const payload = {
        username: newUsername,
        email: currentUser.email,
        role_id: currentUser.role_id,
        risorsa_id: currentUser.risorsa_id, // Mantieni la risorsa attuale
      };
  
      await axios.put(`http://localhost:5000/api/users/${userId}`, payload);
      alert("Nome utente aggiornato con successo!");
  
      setUtenti((prevUtenti) =>
        prevUtenti.map((utente) =>
          utente.id === userId ? { ...utente, username: newUsername } : utente
        )
      );
      setEditedUsernames((prev) => ({ ...prev, [userId]: undefined }));
    } catch (error) {
      console.error("Errore durante l'aggiornamento del nome utente:", error);
    }
  };

  // Assegna una risorsa a un utente
  const handleAssignResource = async (userId, risorsaId) => {
    try {
      await axios.put(`http://localhost:5000/api/users/${userId}/assign-resource`, { risorsa_id: risorsaId });
      alert("Risorsa assegnata con successo!");

      setUtenti((prevUtenti) =>
        prevUtenti.map((utente) =>
          utente.id === userId ? { ...utente, risorsa_id: risorsaId } : utente
        )
      );
    } catch (error) {
      console.error("Errore durante l'assegnazione della risorsa:", error);
    }
  };

    // Elimina utente
    const handleDeleteUser = async (userId) => {
      try {
        await axios.delete(`http://localhost:5000/api/users/${userId}`);
        alert("Utente eliminato con successo!");
        setUtenti((prevUtenti) => prevUtenti.filter((utente) => utente.id !== userId));
      } catch (error) {
        if (error.response?.status === 404) {
          alert("Utente non trovato.");
        } else {
          console.error("Errore durante l'eliminazione dell'utente:", error);
          alert("Errore durante l'eliminazione dell'utente.");
        }
      }
    };

    
    return (
      <div className="container">
        <h1>Crea o modifica gli tuenti</h1>
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
                      className="form-control"
                      value={editedUsernames[utente.id] ?? utente.username}
                      onChange={(e) =>
                        setEditedUsernames({
                          ...editedUsernames,
                          [utente.id]: e.target.value,
                        })
                      }
                    />
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={() => handleUsernameChange(utente.id)}
                    >
                      Salva
                    </button>
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

