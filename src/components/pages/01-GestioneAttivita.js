import React, { useState, useEffect } from "react";
import "../style.css";
import logo from "../assets/Animation - 1738249246846.gif";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { fetchAttivita, fetchReparti, deleteAttivita, createAttivita, updateAttivita } from "../services/api";

function GestioneAttivita() {
  const [attivita, setAttivita] = useState([]);
  const [reparti, setReparti] = useState([]);
  const [formData, setFormData] = useState({ nome_attivita: "", reparto_id: "" });
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);
  const [selectedReparto, setSelectedReparto] = useState("");
  const [loading, setLoading] = useState(false);
  const [highlightedId, setHighlightedId] = useState(null);

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
      toast.error("Errore nel caricamento dei dati.");
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
      toast.error("Tutti i campi sono obbligatori.");
      return;
    }
    setLoading(true);
    try {
      if (isEditing) {
        await updateAttivita(editId, formData);
        toast.success("Attività modificata con successo!");
        setAttivita((prev) =>
          prev.map((att) => (att.id === editId ? { ...att, ...formData } : att))
        );
      } else {
        const newActivity = await createAttivita(formData);
        toast.success("Attività creata con successo!");
        setAttivita((prev) => [...prev, newActivity]);
        setHighlightedId(newActivity.id); 
      }
      setFormData({ nome_attivita: "", reparto_id: "" });
      setIsEditing(false);
      setEditId(null);
    } catch (error) {
      console.error("Errore durante l'aggiunta o la modifica dell'attività:", error);
      toast.error("Errore durante l'aggiunta o la modifica dell'attività.");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (attivita) => {
    setFormData({ nome_attivita: attivita.nome_attivita, reparto_id: attivita.reparto_id });
    setIsEditing(true);
    setEditId(attivita.id);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Sei sicuro di voler eliminare questa attività?")) {
      setLoading(true);
      try {
        await deleteAttivita(id);
        setAttivita((prev) => prev.filter((att) => att.id !== id));
        toast.success("Attività eliminata con successo!");
      } catch (error) {
        console.error("Errore durante l'eliminazione dell'attività:", error);
        toast.error("Errore durante l'eliminazione dell'attività.");
      } finally {
        setLoading(false);
      }
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
      <ToastContainer position="top-left" autoClose={3000} hideProgressBar />
      <form onSubmit={handleSubmit}>
        <div className="form-group-100">
          <label>Nome Attività:</label>
          <input
            type="text"
            name="nome_attivita"
            value={formData.nome_attivita}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-group-100">
          <label>Reparto:</label>
          <select name="reparto_id" value={formData.reparto_id} onChange={handleChange} required>
            <option value="">Seleziona un reparto</option>
            {reparti.map((reparto) => (
              <option key={reparto.id} value={reparto.id}>
                {reparto.nome}
              </option>
            ))}
          </select>
        </div>
        <button type="submit" className="btn-100" disabled={loading}>
          {loading ? "Salvataggio..." : isEditing ? "Aggiorna Attività" : "Aggiungi Attività"}
        </button>
        {isEditing && (
          <button
            type="button"
            className="btn-100"
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

      <div className="filter-group">
        <h2>Elenco Attività</h2>
        <div className="filter-group-row">
          <label>Filtra per Reparto:</label>
          <select value={selectedReparto} onChange={(e) => setSelectedReparto(e.target.value)}>
            <option value="">Tutti</option>
            {reparti.map((reparto) => (
              <option key={reparto.id} value={reparto.id}>
                {reparto.nome}
              </option>
            ))}
          </select>
        </div>
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
              <tr
                key={attivita.id}
                className={highlightedId === attivita.id ? "highlighted-row" : ""}
                onAnimationEnd={() => setHighlightedId(null)}
              >
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
