import React, { useState, useEffect } from "react";
import axios from "axios";
import "../style.css";
import logo from"../assets/unitech-packaging.png";

function GestioneReparti() {
  const [reparti, setReparti] = useState([]);
  const [formData, setFormData] = useState({ nome: "" });
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    fetchReparti();
  }, []);

  const fetchReparti = async () => {
    setLoading(true);
    try {
      const response = await axios.get (`${process.env.REACT_APP_API_URL}/api/reparti`);
      setReparti(response.data);
    } catch (error) {
      console.error("Errore durante il recupero dei reparti:", error);
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
    try {
      const url = isEditing
        ? `${process.env.REACT_APP_API_URL}/api/reparti/${editId}`  
        : `${process.env.REACT_APP_API_URL}/api/reparti`;
      const method = isEditing ? "put" : "post";
      await axios[method](url, { nome: formData.nome });
      alert(isEditing ? "Reparto aggiornato con successo!" : "Reparto aggiunto con successo!");
      setFormData({ nome: "" });
      setIsEditing(false);
      setEditId(null);
      fetchReparti();
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
      await axios.delete (`${process.env.REACT_APP_API_URL}/api/reparti/${id}`);
      alert("Reparto eliminato con successo!");
      fetchReparti();
    } catch (error) {
      console.error("Errore durante l'eliminazione del reparto:", error);
    }
  };

  return (
    <div className="container">
      {loading && (
        <div className="loading-overlay">
            <img src={logo} alt="Logo"  className="logo-spinner"/>
        </div>
      )}
  <h1>Crea o modifica i reparti</h1>
  <form onSubmit={handleSubmit}>
    <div className="form-group">
      <label>Nome Reparto:</label>
      <input type="text" name="nome" value={formData.nome} onChange={handleChange} />
    </div>
    <button type="submit" className="btn">
      {isEditing ? "Aggiorna Reparto" : "Aggiungi Reparto"}
    </button>
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
