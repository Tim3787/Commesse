import React, { useState, useEffect } from "react";
import "../style.css";
import logo from "../assets/unitech-packaging.png";
import {
  fetchStatiCommessa,
  createStatoCommessa,
  updateStatoCommessa,
  deleteStatoCommessa,
} from "../services/api";

function GestioneStatiCommessa() {
  const [statiCommessa, setStatiCommessa] = useState([]);
  const [formData, setFormData] = useState({ nome_stato: "" });
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadStatiCommessa();
  }, []);

  const loadStatiCommessa = async () => {
    setLoading(true);
    try {
      const data = await fetchStatiCommessa();
      setStatiCommessa(data);
    } catch (error) {
      console.error("Errore durante il recupero degli stati della commessa:", error);
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
    if (!formData.nome_stato) {
      alert("Il nome dello stato è obbligatorio.");
      return;
    }
    try {
      if (isEditing) {
        await updateStatoCommessa(editId, formData);
      } else {
        await createStatoCommessa(formData);
      }
      setFormData({ nome_stato: "" });
      setIsEditing(false);
      setEditId(null);
      loadStatiCommessa();
    } catch (error) {
      console.error("Errore durante la gestione dello stato della commessa:", error);
    }
  };

  const handleEdit = (stato) => {
    setFormData({ nome_stato: stato.nome_stato });
    setIsEditing(true);
    setEditId(stato.id);
  };

  const handleDelete = async (id) => {
    try {
      await deleteStatoCommessa(id);
      loadStatiCommessa();
    } catch (error) {
      console.error("Errore durante l'eliminazione dello stato della commessa:", error);
    }
  };

  return (
    <div className="container">
      {loading && (
        <div className="loading-overlay">
          <img src={logo} alt="Logo" className="logo-spinner" />
        </div>
      )}
      <h1>Crea o modifica stato della commessa</h1>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Nome Stato Comessa:</label>
          <input
            type="text"
            name="nome_stato"
            value={formData.nome_stato}
            onChange={handleChange}
          />
        </div>
        <button type="submit" className="btn">
          {isEditing ? "Aggiorna Stato" : "Aggiungi Stato"}
        </button>
      </form>
      <table className="table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Nome Stato</th>
            <th>Azioni</th>
          </tr>
        </thead>
        <tbody>
          {statiCommessa.map((stato) => (
            <tr key={stato.id}>
              <td>{stato.id}</td>
              <td>{stato.nome_stato}</td>
              <td>
                <button className="btn btn-warning" onClick={() => handleEdit(stato)}>
                  Modifica
                </button>
                <button className="btn btn-danger" onClick={() => handleDelete(stato.id)}>
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

export default GestioneStatiCommessa;
