import React, { useState, useEffect } from "react";
import logo from "../../assets/Animation - 1738249246846.gif"
import "../../style.css";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  fetchStatiAvanzamento,
  fetchReparti,
  createStatoAvanzamento,
  updateStatoAvanzamento,
  deleteStatoAvanzamento,
} from "../../services/api";

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
  const [deleteLoadingId, setDeleteLoadingId] = useState(null);
  const [highlightedId, setHighlightedId] = useState(null);
  const [submitLoading, setSubmitLoading] = useState(false);

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
       toast.error("Errore nel caricamento degli stati di avanzamento.");
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
       toast.error("Errore nel caricamento dei reparti.");
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
    if (!formData.nome_stato || !formData.reparto_id) {
      toast.error("Tutti i campi sono obbligatori.");
      return;
    }
    setSubmitLoading(true);
    try {
      let updatedId;
      if (isEditing) {
        await updateStatoAvanzamento(editId, formData);
        toast.success("Stato aggiornato con successo!");
        updatedId = editId;
      } else {
        const newStato = await createStatoAvanzamento(formData);
        toast.success("Stato creato con successo!");
        updatedId = newStato.id;
      }
  
      setFormData({ nome_stato: "", reparto_id: "" });
      setIsEditing(false);
      setEditId(null);
      loadStatiAvanzamento();
      setHighlightedId(updatedId); // Evidenzia la riga aggiornata o aggiunta
    } catch (error) {
      console.error("Errore durante la gestione dello stato di avanzamento:", error);
      toast.error("Errore durante la gestione dello stato.");
    } finally {
      setSubmitLoading(false);
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
    if (window.confirm("Sei sicuro di voler eliminare questo stato di avanzamento?")) {
      setDeleteLoadingId(id);
      try {
        await deleteStatoAvanzamento(id);
        toast.success("Stato eliminato con successo!");
        loadStatiAvanzamento();
      } catch (error) {
        console.error("Errore durante l'eliminazione dello stato di avanzamento:", error);
        toast.error("Errore durante l'eliminazione dello stato.");
      } finally {
        setDeleteLoadingId(null);
      }
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
      <ToastContainer position="top-left" autoClose={3000} hideProgressBar />
      <form onSubmit={handleSubmit}>
        <h2>{isEditing ? "Modifica Stato di Avanzamento" : "Aggiungi Stato di Avanzamento"}</h2>
        <div className="form-group-100">
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
        <button type="submit" className="btn-100" disabled={submitLoading}>
          {loading ? "Salvataggio..." : isEditing ? "Aggiorna stato" : "Aggiungi stato"}
        </button>
        {isEditing && (
          <button
            type="button"
            className="btn-100"
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

      <div className="filter-group">
      <h2>Elenco Stati di Avanzamento</h2>
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
            <th>Nome Stato</th>
            <th>Reparto</th>
            <th>Azioni</th>
          </tr>
        </thead>
        <tbody>
          {filteredStatiAvanzamento.map((stato) => (
            <tr
            key={stato.id}
            className={highlightedId === stato.id ? "highlighted-row" : ""}
            onAnimationEnd={() => setHighlightedId(null)}  
          >
          
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
                  disabled={deleteLoadingId === stato.id}
                >
                  {deleteLoadingId === stato.id ? "Eliminazione..." : "Elimina"}
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
