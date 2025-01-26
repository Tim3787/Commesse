import React, { useState, useEffect } from "react";
import "../style.css";
import logo from "../assets/unitech-packaging.png";
import { fetchAttivita, fetchReparti, deleteAttivita, createAttivita, updateAttivita  } from "../services/api";

function GestioneAttivita() {
  const [attivita, setAttivita] = useState([]);
  const [reparti, setReparti] = useState([]);
  const [formData, setFormData] = useState({ nome_attivita: "", reparto_id: "" });
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);
  const [selectedReparto, setSelectedReparto] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [attivitaData, repartiData] = await Promise.all([fetchAttivita(), fetchReparti()]);
      setAttivita(attivitaData);
      setReparti(repartiData);
    } catch (error) {
      console.error("Errore durante il caricamento dei dati:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
  
    if (!formData.nome_attivita || !formData.reparto_id) {
      alert("Tutti i campi sono obbligatori.");
      return;
    }
  
    try {
      if (isEditing) {
        // Modifica un'attività esistente
        await updateAttivita(editId, formData);
      } else {
        // Crea una nuova attività
        await createAttivita(formData);
      }
  
      // Resetta il modulo e aggiorna i dati
      setFormData({ nome_attivita: "", reparto_id: "" });
      setIsEditing(false);
      setEditId(null);
      loadData();
    } catch (error) {
      console.error("Errore durante l'aggiunta o la modifica dell'attività:", error);
    }
  };

  const handleEdit = (attivita) => {
    setFormData({ nome_attivita: attivita.nome_attivita, reparto_id: attivita.reparto_id });
    setIsEditing(true);
    setEditId(attivita.id);
  };

  const handleDelete = async (id) => {
    try {
      await deleteAttivita(id);
      loadData();
    } catch (error) {
      console.error("Errore durante l'eliminazione dell'attività:", error);
    }
  };

  const filteredAttivita = selectedReparto
    ? attivita.filter((attivita) => attivita.reparto_id === parseInt(selectedReparto))
    : attivita;

  return (
    <div className="container">
      {loading && (
        <div className="loading-overlay">
          <img src={logo} alt="Logo" className="logo-spinner" />
        </div>
      )}
      <h1>Crea o modifica le attività</h1>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Nome Attività:</label>
          <input
            type="text"
            name="nome_attivita"
            value={formData.nome_attivita}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-group">
          <label>Reparto:</label>
          <select
            name="reparto_id"
            value={formData.reparto_id}
            onChange={handleChange}
            required
          >
            <option value="">Seleziona un reparto</option>
            {reparti.map((reparto) => (
              <option key={reparto.id} value={reparto.id}>
                {reparto.nome}
              </option>
            ))}
          </select>
        </div>
        <button type="submit" className="btn">
          {isEditing ? "Aggiorna Attività" : "Aggiungi Attività"}
        </button>
        {isEditing && (
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => {
              setFormData({ nome_attivita: "", reparto_id: "" });
              setIsEditing(false);
              setEditId(null);
            }}
          >
            Annulla
          </button>
        )}
      </form>

      <h2>Elenco Attività</h2>
      <div className="form-group">
        <label>Filtra per Reparto:</label>
        <select
          value={selectedReparto}
          onChange={(e) => setSelectedReparto(e.target.value)}
        >
          <option value="">Tutti</option>
          {reparti.map((reparto) => (
            <option key={reparto.id} value={reparto.id}>
              {reparto.nome}
            </option>
          ))}
        </select>
      </div>

      {filteredAttivita.length === 0 ? (
        <p style={{ color: "red" }}>Nessuna attività trovata.</p>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Nome Attività</th>
              <th>Reparto</th>
              <th>Azioni</th>
            </tr>
          </thead>
          <tbody>
            {filteredAttivita.map((attivita) => (
              <tr key={attivita.id}>
                <td>{attivita.id}</td>
                <td>{attivita.nome_attivita}</td>
                <td>
                  {reparti.find((reparto) => reparto.id === attivita.reparto_id)?.nome || "N/A"}
                </td>
                <td>
                  <button className="btn btn-warning" onClick={() => handleEdit(attivita)}>
                    Modifica
                  </button>
                  <button className="btn btn-danger" onClick={() => handleDelete(attivita.id)}>
                    Elimina
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default GestioneAttivita;
