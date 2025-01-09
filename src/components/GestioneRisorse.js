import React, { useState, useEffect } from "react";
import axios from "axios";
import "./style.css";

function GestioneRisorse() {
  const [risorse, setRisorse] = useState([]);
  const [formData, setFormData] = useState({
    nome: "",
    reparto_id: "",
  });
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);
  const [reparti, setReparti] = useState([]);
  const [selectedReparto, setSelectedReparto] = useState(""); // Per il filtro reparto

  useEffect(() => {
    fetchRisorse();
    fetchReparti();
  }, []);

  const fetchRisorse = async () => {
    try {
      const response = await axios.get("http://localhost:5000/api/risorse");
      setRisorse(response.data);
    } catch (error) {
      console.error("Errore durante il recupero delle risorse:", error);
    }
  };

  const fetchReparti = async () => {
    try {
      const response = await axios.get("http://localhost:5000/api/reparti");
      setReparti(response.data);
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
    if (!formData.nome || !formData.reparto_id) {
      alert("Tutti i campi sono obbligatori.");
      return;
    }
    try {
      const endpoint = isEditing
        ? `http://localhost:5000/api/risorse/${editId}`
        : "http://localhost:5000/api/risorse";

      const method = isEditing ? "put" : "post";

      await axios[method](endpoint, formData);

      alert(
        isEditing
          ? "Risorsa aggiornata con successo!"
          : "Risorsa aggiunta con successo!"
      );
      setFormData({ nome: "", reparto_id: "" });
      setIsEditing(false);
      setEditId(null);
      fetchRisorse();
    } catch (error) {
      console.error("Errore durante l'aggiunta o modifica della risorsa:", error);
    }
  };

  const handleEdit = (risorsa) => {
    setFormData({ nome: risorsa.nome, reparto_id: risorsa.reparto_id });
    setIsEditing(true);
    setEditId(risorsa.id);
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`http://localhost:5000/api/risorse/${id}`);
      alert("Risorsa eliminata con successo!");
      fetchRisorse();
    } catch (error) {
      console.error("Errore durante l'eliminazione della risorsa:", error);
    }
  };

  const filteredRisorse = selectedReparto
    ? risorse.filter((risorsa) => risorsa.reparto_id === parseInt(selectedReparto))
    : risorse;

  return (
    <div className="container">
      <h1>Crea o Modifica le Risorse</h1>
      <form onSubmit={handleSubmit}>
        <h2>{isEditing ? "Modifica Risorsa" : "Aggiungi Risorsa"}</h2>
        <div className="form-group">
          <label>Nome:</label>
          <input
            type="text"
            name="nome"
            value={formData.nome}
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
          {isEditing ? "Aggiorna" : "Aggiungi"}
        </button>
        {isEditing && (
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => {
              setIsEditing(false);
              setFormData({ nome: "", reparto_id: "" });
              setEditId(null);
            }}
          >
            Annulla
          </button>
        )}
      </form>

      <h2>Elenco Risorse</h2>
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
            <th>Nome</th>
            <th>Reparto</th>
            <th>Azioni</th>
          </tr>
        </thead>
        <tbody>
          {filteredRisorse.map((risorsa) => (
            <tr key={risorsa.id}>
              <td>{risorsa.id}</td>
              <td>{risorsa.nome}</td>
              <td>
                {reparti.find((reparto) => reparto.id === risorsa.reparto_id)?.nome ||
                  "N/A"}
              </td>
              <td>
                <button
                  className="btn btn-warning"
                  onClick={() => handleEdit(risorsa)}
                >
                  Modifica
                </button>
                <button
                  className="btn btn-danger"
                  onClick={() => handleDelete(risorsa.id)}
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

export default GestioneRisorse;
