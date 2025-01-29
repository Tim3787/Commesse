import React, { useState, useEffect } from "react";
import logo from "../assets/unitech-packaging.png";
import {
  fetchStatiAvanzamento,
  fetchReparti,
  createStatoAvanzamento,
  updateStatoAvanzamento,
  deleteStatoAvanzamento,
} from "../services/api";

function GestioneStati() {
  const [statiAvanzamento, setStatiAvanzamento] = useState([]);
  const [reparti, setReparti] = useState([]);
  const [formData, setFormData] = useState({
    nome_stato: "",
    reparto_id: "",
  });
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);
  const [selectedReparto, setSelectedReparto] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadStatiAvanzamento();
    loadReparti();
  }, []);

  const loadStatiAvanzamento = async () => {
    setLoading(true);
    try {
      const data = await fetchStatiAvanzamento();
      setStatiAvanzamento(data);
    } catch (error) {
      console.error("Errore durante il recupero degli stati di avanzamento:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadReparti = async () => {
    try {
      const data = await fetchReparti();
      setReparti(data);
    } catch (error) {
      console.error("Errore durante il recupero dei reparti:", error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.nome_stato || !formData.reparto_id) {
      alert("Tutti i campi sono obbligatori.");
      return;
    }
    try {
      if (isEditing) {
        await updateStatoAvanzamento(editId, formData);
      } else {
        await createStatoAvanzamento(formData);
      }
      setFormData({ nome_stato: "", reparto_id: "" });
      setIsEditing(false);
      setEditId(null);
      loadStatiAvanzamento();
    } catch (error) {
      console.error("Errore durante l'aggiunta o modifica dello stato di avanzamento:", error);
    }
  };

  const handleEdit = (stato) => {
    setFormData({
      nome_stato: stato.nome_stato,
      reparto_id: stato.reparto_id,
    });
    setIsEditing(true);
    setEditId(stato.id);
  };

  const handleDelete = async (id) => {
    try {
      await deleteStatoAvanzamento(id);
      loadStatiAvanzamento();
    } catch (error) {
      console.error("Errore durante l'eliminazione dello stato di avanzamento:", error);
    }
  };

  const filteredStatiAvanzamento = selectedReparto
    ? statiAvanzamento.filter((stato) => stato.reparto_id === parseInt(selectedReparto))
    : statiAvanzamento;

  return (
    <div className="container">
      {loading && (
        <div className="loading-overlay">
          <img src={logo} alt="Logo" className="logo-spinner" />
        </div>
      )}
      <h1>Crea o modifica gli stati avanzamento</h1>
      <form onSubmit={handleSubmit}>
        <h2>{isEditing ? "Modifica Stato di Avanzamento" : "Aggiungi Stato di Avanzamento"}</h2>
        <div className="form-group">
          <label>Nome Stato:</label>
          <input
            type="text"
             className="input-field"
            name="nome_stato"
            value={formData.nome_stato}
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
        <button type="submit" className="btn btn-primary">
          {isEditing ? "Aggiorna Stato" : "Aggiungi Stato"}
        </button>
        {isEditing && (
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => {
              setIsEditing(false);
              setFormData({ nome_stato: "", reparto_id: "" });
              setEditId(null);
            }}
          >
            Annulla
          </button>
        )}
      </form>

      <h2>Elenco Stati di Avanzamento</h2>
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
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Nome Stato</th>
            <th>Reparto</th>
            <th>Azioni</th>
          </tr>
        </thead>
        <tbody>
          {filteredStatiAvanzamento.map((stato) => (
            <tr key={stato.id}>
              <td>{stato.id}</td>
              <td>{stato.nome_stato}</td>
              <td>
                {reparti.find((reparto) => reparto.id === stato.reparto_id)?.nome ||
                  "Non assegnato"}
              </td>
              <td>
                <button
                  className="btn btn-warning"
                  onClick={() => handleEdit(stato)}
                >
                  Modifica
                </button>
                <button
                  className="btn btn-danger"
                  onClick={() => handleDelete(stato.id)}
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

export default GestioneStati;
