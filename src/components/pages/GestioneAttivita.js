import React, { useState, useEffect } from "react";
import axios from "axios";
import "../style.css";

function GestioneAttivita() {
  const [attivita, setAttivita] = useState([]);
  const [reparti, setReparti] = useState([]);
  const [formData, setFormData] = useState({ nome_attivita: "", reparto_id: "" });
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);
  const [selectedReparto, setSelectedReparto] = useState(""); // Stato per il filtro reparto

  useEffect(() => {
    fetchAttivita();
    fetchReparti();
  }, []);

  const fetchAttivita = async () => {
    try {
      const response = await axios.get (`${process.env.REACT_APP_API_URL}/api/attivita`);
      console.log("Dati attività ricevuti:", response.data);
      setAttivita(response.data);
    } catch (error) {
      console.error("Errore durante il recupero delle attività:", error);
    }
  };

  const fetchReparti = async () => {
    try {
      const response = await axios.get (`${process.env.REACT_APP_API_URL}/api/reparti`);
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
  
    if (!formData.nome_attivita || !formData.reparto_id) {
      alert("Tutti i campi sono obbligatori.");
      return;
    }
  
    try {
      console.log("Dati inviati al server:", formData);
      const endpoint = isEditing
         ? `${process.env.REACT_APP_API_URL}/api/attivita/${editId}`
          : `${process.env.REACT_APP_API_URL}/api/attivita`; 
  
      const method = isEditing ? "put" : "post";
  
      await axios[method](endpoint, {
        nome_attivita: formData.nome_attivita,
        reparto_id: formData.reparto_id,
      });
  
      alert(isEditing ? "Attività aggiornata con successo!" : "Attività aggiunta con successo!");
      setFormData({ nome: "", reparto_id: "" });
      setIsEditing(false);
      setEditId(null);
      fetchAttivita();
    } catch (error) {
      console.error("Errore durante l'aggiunta o la modifica dell'attività:", error.response?.data || error.message);
    }
  };
  

  const handleEdit = (attivita) => {
    setFormData({ nome_attivita: attivita.nome_attivita, reparto_id: attivita.reparto_id });
    setIsEditing(true);
    setEditId(attivita.id);
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete (`${process.env.REACT_APP_API_URL}/api/attivita/${id}`);
      alert("Attività eliminata con successo!");
      fetchAttivita();
    } catch (error) {
      console.error("Errore durante l'eliminazione dell'attività:", error);
    }
  };

  const filteredAttivita = selectedReparto
    ? attivita.filter((attivita) => attivita.reparto_id === parseInt(selectedReparto))
    : attivita;

  return (
    <div className="container">
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
              setFormData({ nome: "", reparto_id: "" });
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
                <td>{reparti.find((reparto) => reparto.id === attivita.reparto_id)?.nome || "N/A"}</td>
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
