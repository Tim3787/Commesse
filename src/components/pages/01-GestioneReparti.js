import React, { useState, useEffect } from "react";
import "../style.css";
import logo from "../assets/unitech-packaging.png";
import { fetchReparti, createReparto, updateReparto, deleteReparto } from "../services/api";

function GestioneReparti() {
  const [reparti, setReparti] = useState([]);
  const [formData, setFormData] = useState({ nome: "" });
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadReparti();
  }, []);

  const loadReparti = async () => {
    setLoading(true);
    try {
      const data = await fetchReparti();
      setReparti(data);
    } catch (error) {
      console.error("Errore durante il recupero dei reparti:", error);
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
    try {
      if (isEditing) {
        await updateReparto(editId, formData);
      } else {
        await createReparto(formData);
      }
      setFormData({ nome: "" });
      setIsEditing(false);
      setEditId(null);
      loadReparti();
    } catch (error) {
      console.error("Errore durante la gestione del reparto:", error);
    }
  };

  const handleEdit = (reparto) => {
    setFormData({ nome: reparto.nome });
    setIsEditing(true);
    setEditId(reparto.id);
  };

  const handleDelete = async (id) => {
    try {
      await deleteReparto(id);
      loadReparti();
    } catch (error) {
      console.error("Errore durante l'eliminazione del reparto:", error);
    }
  };

  return (
    <div className="container">
      {loading && (
        <div className="loading-overlay">
          <img src={logo} alt="Logo" className="logo-spinner" />
        </div>
      )}
      <h1>Crea o modifica i reparti</h1>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Nome Reparto:</label>
          <input type="text" name="nome" value={formData.nome} onChange={handleChange} required />
        </div>
        <button type="submit" className="btn-primary">
          {isEditing ? "Aggiorna Reparto" : "Aggiungi Reparto"}
        </button>
        {isEditing && (
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => {
              setFormData({ nome: "" });
              setIsEditing(false);
              setEditId(null);
            }}
          >
            Annulla
          </button>
        )}
      </form>
      <table className="table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Nome</th>
            <th>Azioni</th>
          </tr>
        </thead>
        <tbody>
          {reparti.map((reparto) => (
            <tr key={reparto.id}>
              <td>{reparto.id}</td>
              <td>{reparto.nome}</td>
              <td>
                <button className="btn btn-warning" onClick={() => handleEdit(reparto)}>
                  Modifica
                </button>
                <button className="btn btn-danger" onClick={() => handleDelete(reparto.id)}>
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

export default GestioneReparti;
