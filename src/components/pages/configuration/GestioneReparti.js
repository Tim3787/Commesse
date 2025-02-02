import React, { useState, useEffect } from "react";
import "../../style.css";
import logo from "../../img/Animation - 1738249246846.gif";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { fetchReparti, createReparto, updateReparto, deleteReparto } from "../../services/api";

function GestioneReparti() {
  const [reparti, setReparti] = useState([]);
  const [formData, setFormData] = useState({ nome: "" });
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [highlightedId, setHighlightedId] = useState(null);
  const [deleteLoadingId, setDeleteLoadingId] = useState(null);

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
    setLoading(true);
    try {
      let updatedId;
      if (isEditing) {
        await updateReparto(editId, formData);
        toast.success("Reparto modificato con successo!");
        setReparti((prev) =>
          prev.map((reparto) => (reparto.id === editId ? { ...reparto, ...formData } : reparto))
        );
        updatedId = editId;  // Imposta l'ID per evidenziare la riga modificata
      } else {
        const newReparto = await createReparto(formData);
        toast.success("Reparto creato con successo!");
        setReparti((prev) => [...prev, newReparto]);
        updatedId = newReparto.id;  // Imposta l'ID per evidenziare la nuova riga
      }
  
      setHighlightedId(updatedId);  // Evidenzia la riga appena modificata o creata
      setFormData({ nome: "" });
      setIsEditing(false);
      setEditId(null);
    } catch (error) {
      console.error("Errore durante l'aggiunta o la modifica del reparto:", error);
      toast.error("Errore durante l'aggiunta o la modifica del reparto.");
    } finally {
      setLoading(false);
    }
  };
  

  const handleEdit = (reparto) => {
    setFormData({ nome: reparto.nome });
    setIsEditing(true);
    setEditId(reparto.id);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Sei sicuro di voler eliminare questo reparto?")) {
      setDeleteLoadingId(id);
      try {
        await deleteReparto(id);
        setReparti((prev) => prev.filter((reparto) => reparto.id !== id));
        toast.success("Reparto eliminato con successo!");
      } catch (error) {
        console.error("Errore durante l'eliminazione del reparto:", error);
        toast.error("Errore durante l'eliminazione del reparto.");
      } finally {
        setDeleteLoadingId(null);
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
      <h1>Crea o modifica i reparti</h1>
      <ToastContainer position="top-left" autoClose={3000} hideProgressBar />
      <form onSubmit={handleSubmit}>
        <div className="form-group-100">
          <label>Nome Reparto:</label>
          <input
            type="text"
            name="nome"
            value={formData.nome}
            onChange={handleChange}
            required
          />
        </div>
        <button type="submit" className="btn-100" disabled={loading}>
          {loading ? "Salvataggio..." : isEditing ? "Aggiorna reparto" : "Aggiungi reparto"}
        </button>
        {isEditing && (
          <button
            type="button"
            className="btn-100"
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
            <tr
              key={reparto.id}
              className={highlightedId === reparto.id ? "highlighted-row" : ""}
              onAnimationEnd={() => setHighlightedId(null)}
            >
              <td>{reparto.id}</td>
              <td>{reparto.nome}</td>
              <td>
                <button className="btn btn-warning" onClick={() => handleEdit(reparto)}>
                  Modifica
                </button>
                <button
  className="btn btn-danger"
  onClick={() => handleDelete(reparto.id)}
  disabled={deleteLoadingId === reparto.id}
>
  {deleteLoadingId === reparto.id ? "Eliminazione..." : "Elimina"}
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
