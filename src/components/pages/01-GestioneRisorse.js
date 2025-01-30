import React, { useState, useEffect } from "react";
import "../style.css";
import logo from "../assets/Animation - 1738249246846.gif";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { fetchRisorse, fetchReparti, createRisorsa, updateRisorsa, deleteRisorsa } from "../services/api";

function GestioneRisorse() {
  const [risorse, setRisorse] = useState([]);
  const [formData, setFormData] = useState({ nome: "", reparto_id: "" });
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);
  const [reparti, setReparti] = useState([]);
  const [selectedReparto, setSelectedReparto] = useState("");
  const [loading, setLoading] = useState(false);
  const [highlightedId, setHighlightedId] = useState(null);

  useEffect(() => {
    loadRisorse();
    loadReparti();
  }, []);

  const loadRisorse = async () => {
    setLoading(true);
    try {
      const data = await fetchRisorse();
      setRisorse(data);
    } catch (error) {
      console.error("Errore durante il recupero delle risorse:", error);
      toast.error("Errore durante il recupero delle risorse.");
    } finally {
      setLoading(false);
    }
  };

  const loadReparti = async () => {
    setLoading(true);
    try {
      const data = await fetchReparti();
      setReparti(data);
    } catch (error) {
      console.error("Errore durante il recupero dei reparti:", error);
      toast.error("Errore durante il recupero delle reparti.");
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
    if (!formData.nome || !formData.reparto_id) {
      toast.error("Tutti i campi sono obbligatori.");
      return;
    }
    setLoading(true);
    try {
      let createdOrUpdatedId;
      if (isEditing) {
        await updateRisorsa(editId, formData);
        createdOrUpdatedId = editId;
        toast.success("Risorsa modificata con successo!");
      } else {
        const newRisorsa = await createRisorsa(formData);
        createdOrUpdatedId = newRisorsa.id;  // Ottieni l'ID della nuova risorsa
        toast.success("Risorsa creata con successo!");
      }
      setHighlightedId(createdOrUpdatedId);  // Evidenzia la riga aggiornata o creata
      setFormData({ nome: "", reparto_id: "" });
      setIsEditing(false);
      setEditId(null);
      await loadRisorse();
    } catch (error) {
      console.error("Errore durante l'aggiunta o modifica della risorsa:", error);
      toast.error("Errore durante l'aggiunta o la modifica della risorsa.");
    } finally {
      setLoading(false);
    }
  };
  

  const handleEdit = (risorsa) => {
    setFormData({ nome: risorsa.nome, reparto_id: risorsa.reparto_id });
    setIsEditing(true);
    setEditId(risorsa.id);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Sei sicuro di voler eliminare questa risorsa?")) {
      setLoading(true);
      try {
        await deleteRisorsa(id);
        await loadRisorse();
        toast.success("Risorsa eliminata con successo!");
      } catch (error) {
        console.error("Errore durante l'eliminazione della risorsa:", error);
        toast.error("Impossibile eliminare la risorsa. Verifica se è in uso.");
      } finally {
        setLoading(false);
      }
    }
  };
  

  const filteredRisorse = selectedReparto
    ? risorse.filter((risorsa) => risorsa.reparto_id === parseInt(selectedReparto))
    : risorse;

  return (
    <div className="container">
      {loading && (
        <div className="loading-overlay">
          <img src={logo} alt="Logo" className="logo-spinner" />
        </div>
      )}
      <h1>Crea o Modifica le Risorse</h1>
       <ToastContainer position="top-right" autoClose={3000} hideProgressBar />
      <form onSubmit={handleSubmit}>
        <h2>{isEditing ? "Modifica Risorsa" : "Aggiungi Risorsa"}</h2>
        <div className="form-group-100">
          <label>Nome:</label>
          <input
            type="text"
            name="nome"
            value={formData.nome}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-group-100">
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
        <button type="submit" className="btn-100" disabled={loading}>
        {loading ? "Salvataggio..." : isEditing ? "Aggiorna risorsa" : "Aggiungi risorsa"}
        </button>
        {isEditing && (
          <button
            type="button"
            className="btn-100"
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

      <div className="filter-group">
      <h2>Elenco Risorse</h2>
      <div className="filter-group-row">
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
    <tr
      key={risorsa.id}
      className={highlightedId === risorsa.id ? "highlighted-row" : ""}
      onAnimationEnd={() => setHighlightedId(null)}
    >
      <td>{risorsa.id}</td>
      <td>{risorsa.nome}</td>
      <td>
        {reparti.find((reparto) => reparto.id === risorsa.reparto_id)?.nome || "N/A"}
      </td>
      <td>
        <button className="btn btn-warning" onClick={() => handleEdit(risorsa)}>
          Modifica
        </button>
        <button className="btn btn-danger" onClick={() => handleDelete(risorsa.id)}>
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
