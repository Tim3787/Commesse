import React, { useState, useEffect } from "react";
import axios from "axios";
import "../style.css";
import logo from"../assets/unitech-packaging.png";

function GestioneStatiCommessa() {
  const [statiCommessa, setStatiCommessa] = useState([]);
  const [formData, setFormData] = useState({ nome_stato: "" });
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    fetchStatiCommessa();
  }, []);

  const fetchStatiCommessa = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/stato-commessa`);
      setStatiCommessa(response.data);
    } catch (error) {
      console.error("Errore durante il recupero degli stati della commessa:", error);
    }finally {
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
      const url = isEditing
        ? `${process.env.REACT_APP_API_URL}/api/stato-commessa/${editId}`
        : `${process.env.REACT_APP_API_URL}/api/stato-commessa`;
      const method = isEditing ? "put" : "post";
      await axios[method](url, { nome_stato: formData.nome_stato });
      //alert(isEditing ? "Stato commessa aggiornato con successo!" : "Stato commessa aggiunto con successo!");
      setFormData({ nome_stato: "" });
      setIsEditing(false);
      setEditId(null);
      fetchStatiCommessa();
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
      await axios.delete(`${process.env.REACT_APP_API_URL}/api/stato-commessa/${id}`);
      alert("Stato commessa eliminato con successo!");
      fetchStatiCommessa();
    } catch (error) {
      console.error("Errore durante l'eliminazione dello stato della commessa:", error);
    }
  };

  return (
    <div className="container">
      {loading && (
        <div className="loading-overlay">
            <img src={logo} alt="Logo"  className="logo-spinner"/>
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
