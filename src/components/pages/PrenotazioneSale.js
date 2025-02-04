import React, { useState, useEffect } from 'react';
import { fetchRisorse } from '../services/API/risorse-api';
import { fetchPrenotazioniSale, PrenotaSale, deletePrenotazioneSale, updatePrenotazioneSale } from '../services/API/sale-api';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import "../style.css";
import logo from "../img/Animation - 1738249246846.gif";

function PrenotazioneSale() {
  const [prenotazioni, setPrenotazioni] = useState([]);
  const [utenti, setUtenti] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [highlightedId, setHighlightedId] = useState(null);
  const [deleteLoadingId, setDeleteLoadingId] = useState(null);

  const [newPrenotazione, setNewPrenotazione] = useState({
    salaId: '1',
    dataOra: '',
    durata: '',
    descrizione: '',
    utente: '',
  });

  useEffect(() => {
    loadPrenotazioni();
  }, []);

  const loadPrenotazioni = async () => {
    setLoading(true);
    try {
      const [prenotazioniResponse, utentiResponse] = await Promise.all([
        fetchPrenotazioniSale(),
        fetchRisorse(),
      ]);
      setPrenotazioni(prenotazioniResponse);
      setUtenti(utentiResponse);
    } catch (error) {
      toast.error('Errore durante il caricamento dei dati.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setNewPrenotazione((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isEditing) {
        await handleUpdatePrenotazione(editingId, newPrenotazione);
      } else {
        await handleCreatePrenotazione(newPrenotazione);
      }
      resetForm();
    } catch {
      toast.error('Errore durante la gestione della prenotazione.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePrenotazione = async (formData) => {
    try {
      const nuovaPrenotazione = await PrenotaSale(formData);
      setPrenotazioni((prev) => [...prev, nuovaPrenotazione]);
      setHighlightedId(nuovaPrenotazione.id);
      toast.success('Prenotazione creata con successo.');
    } catch {
      toast.error('Errore durante la creazione della prenotazione.');
    }
  };

  const handleUpdatePrenotazione = async (id, formData) => {
    try {
      const prenotazioneAggiornata = await updatePrenotazioneSale(id, formData);
      setPrenotazioni((prev) =>
        prev.map((prenotazione) => (prenotazione.id === id ? prenotazioneAggiornata : prenotazione))
      );
      setHighlightedId(id);
      toast.success('Prenotazione aggiornata con successo.');
    } catch {
      toast.error('Errore durante l\'aggiornamento della prenotazione.');
    }
  };

  const handleDeletePrenotazione = async (id) => {
    if (window.confirm('Sei sicuro di voler eliminare questa prenotazione?')) {
      setDeleteLoadingId(id);
      try {
        await deletePrenotazioneSale(id);
        setPrenotazioni((prev) => prev.filter((prenotazione) => prenotazione.id !== id));
        toast.success('Prenotazione eliminata con successo.');
      } catch {
        toast.error('Errore durante l\'eliminazione della prenotazione.');
      } finally {
        setDeleteLoadingId(null);
      }
    }
  };

  const handleEdit = (prenotazione) => {
    setIsEditing(true);
    setEditingId(prenotazione.id);
    setNewPrenotazione({ ...prenotazione });
  };

  const resetForm = () => {
    setNewPrenotazione({
      salaId: '1',
      dataOra: '',
      durata: '',
      descrizione: '',
      utente: '',
    });
    setIsEditing(false);
    setEditingId(null);
  };

  return (
    <div className="container">
      {loading && (
        <div className="loading-overlay">
          <img src={logo} alt="Caricamento" className="logo-spinner" />
        </div>
      )}

      <h1>Prenotazione Sale Riunioni</h1>
      <ToastContainer position="top-left" autoClose={3000} hideProgressBar />

      <form onSubmit={handleSubmit}>
        <div className="form-group-100">
          <label>ID Sala:</label>
          <select
            name="salaId"
            value={newPrenotazione.salaId}
            onChange={handleChange}
            required
          >
            <option value="1">1 - Grande</option>
            <option value="2">2 - Piccola</option>
          </select>
        </div>
        <div className="form-group-100">
          <label>Data e Ora:</label>
          <input
            type="datetime-local"
            name="dataOra"
            value={newPrenotazione.dataOra}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-group-100">
          <label>Durata (in minuti):</label>
          <input
            type="number"
            name="durata"
            value={newPrenotazione.durata}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-group-100">
          <label>Descrizione:</label>
          <input
            type="text"
            name="descrizione"
            value={newPrenotazione.descrizione}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-group-100">
          <label>Utente:</label>
          <input
            type="text"
            name="utente"
            value={newPrenotazione.utente}
            onChange={handleChange}
            list="suggested-users"
            required
          />
          <datalist id="suggested-users">
            {utenti.map((utente) => (
              <option key={utente.id} value={utente.username} />
            ))}
          </datalist>
        </div>
        <button type="submit" className="btn-100" disabled={loading}>
          {loading ? 'Salvataggio...' : isEditing ? 'Aggiorna Prenotazione' : 'Aggiungi Prenotazione'}
        </button>
        {isEditing && (
          <button type="button" className="btn-100" onClick={resetForm}>
            Annulla
          </button>
        )}
      </form>

      <table className="table">
        <thead>
          <tr>
            <th>ID Sala</th>
            <th>Data e Ora</th>
            <th>Durata</th>
            <th>Descrizione</th>
            <th>Utente</th>
            <th>Azioni</th>
          </tr>
        </thead>
        <tbody>
          {prenotazioni.map((prenotazione) => (
            <tr
              key={prenotazione.id}
              className={highlightedId === prenotazione.id ? 'highlighted-row' : ''}
              onAnimationEnd={() => setHighlightedId(null)}
            >
              <td>{prenotazione.salaId === '1' ? 'Grande' : 'Piccola'}</td>
              <td>{prenotazione.dataOra}</td>
              <td>{prenotazione.durata} min</td>
              <td>{prenotazione.descrizione}</td>
              <td>{prenotazione.utente}</td>
              <td>
                <button className="btn btn-warning" onClick={() => handleEdit(prenotazione)}>
                  Modifica
                </button>
                <button
                  className="btn btn-danger"
                  onClick={() => handleDeletePrenotazione(prenotazione.id)}
                  disabled={deleteLoadingId === prenotazione.id}
                >
                  {deleteLoadingId === prenotazione.id ? 'Eliminazione...' : 'Elimina'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default PrenotazioneSale;
