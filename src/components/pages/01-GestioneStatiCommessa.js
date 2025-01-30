import React, { useState, useEffect } from "react";
import "../style.css";
import logo from "../assets/Animation - 1738249246846.gif";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
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
  const [highlightedId, setHighlightedId] = useState(null);

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
    if (!formData.nome_stato) {
      alert("Il nome dello stato è obbligatorio.");
      return;
    }
    setLoading(true);
    try {
      if (isEditing) {
        await updateStatoCommessa(editId, formData);
        setHighlightedId(editId); 
         toast.success("Stato modificato con successo!");
      } else {
        const newStato = await createStatoCommessa(formData);
        await createStatoCommessa(formData);
        setHighlightedId(newStato.id);
         toast.success("Stato creato con successo!");
      }
      setFormData({ nome_stato: "" });
      setIsEditing(false);
      setEditId(null);
      loadStatiCommessa();
    } catch (error) {
      console.error("Errore durante la gestione dello stato della commessa:", error);
      toast.error("Errore durante la gestione dello stato della commessa.");
    }finally {
      setLoading(false);
    }
  };

  const handleEdit = (stato) => {
    setFormData({ nome_stato: stato.nome_stato });
    setIsEditing(true);
    setEditId(stato.id);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Sei sicuro di voler eliminare questo stato della commessa?")) {
      setLoading(true);
    try {
      await deleteStatoCommessa(id);
      loadStatiCommessa();
       toast.success("Stato eliminato con successo!");
    } catch (error) {
      console.error("Errore durante l'eliminazione dello stato della commessa:", error);
      toast.error("Errore durante l'eliminazione dello stato della commessa.");
    } finally {
      setLoading(false);
    }
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
       <ToastContainer position="top-right" autoClose={3000} hideProgressBar />
      <form onSubmit={handleSubmit}>
        <div className="form-group-100">
          <label>Nome Stato Comessa:</label>
          <input
            type="text"
            name="nome_stato"
            value={formData.nome_stato}
            onChange={handleChange}
          />
        </div>
        <button type="submit" className="btn-100" disabled={loading}>
          {loading ? "Salvataggio..." : isEditing ? "Aggiorna stato" : "Aggiungi stato"}
        </button>
        {isEditing && (
          <button
            type="button"
            className="btn-100"
            onClick={() => {
              setFormData({ nome_stato: "" });
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
            <th>Nome Stato</th>
            <th>Azioni</th>
          </tr>
        </thead>
        <tbody>
          {statiCommessa.map((stato) => (
            <tr
            key={stato.id}
            className={highlightedId === stato.id ? "highlighted-row" : ""}
            onAnimationEnd={() => setHighlightedId(null)}
          >
          
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
