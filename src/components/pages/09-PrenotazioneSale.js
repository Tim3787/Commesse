import React, { useState, useEffect } from "react";

import logo from "../img/Animation - 1738249246846.gif";

// Import API per le varie entità
import { fetchRisorse } from "../services/API/risorse-api";
import {
  fetchPrenotazioniSale,
  PrenotaSale,
  deletePrenotazioneSale,
  updatePrenotazioneSale,
} from "../services/API/sale-api";

// Import per Toastify (notifiche)
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

/**
 * Componente PrenotazioneSale
 * Consente di visualizzare, creare, aggiornare ed eliminare prenotazioni per le sale riunioni.
 * Include anche una funzionalità di suggerimento per la ricerca degli utenti.
 */
function PrenotazioneSale() {
  // ------------------------------------------------------------------
  // Stati del componente
  // ------------------------------------------------------------------
  const [prenotazioni, setPrenotazioni] = useState([]); // Elenco delle prenotazioni
  const [utenti, setUtenti] = useState([]);             // Elenco degli utenti (risorse)
  const [isEditing, setIsEditing] = useState(false);      // Stato per abilitare la modalità di editing
  const [editingId, setEditingId] = useState(null);       // ID della prenotazione in modifica
  const [loading, setLoading] = useState(false);          // Stato di caricamento generale
  const [highlightedId, setHighlightedId] = useState(null); // ID della prenotazione evidenziata (ad es. dopo creazione/aggiornamento)
  const [deleteLoadingId, setDeleteLoadingId] = useState(null); // Stato di caricamento specifico per l'eliminazione
  const [showUtenteSuggestions, setShowUtenteSuggestions] = useState(false); // Controlla la visualizzazione dei suggerimenti per l'utente
  const [filteredUtenti, setFilteredUtenti] = useState([]);  // Utenti filtrati in base all'input
  const [newPrenotazione, setNewPrenotazione] = useState({
    salaId: "1",
    dataOra: "",
    durata: "60",
    descrizione: "Riunione interna",
    utente: "",
  });
  // Stato per gestire aggiornamenti temporanei delle note (se richiesto in futuro)
  // const [noteUpdates, setNoteUpdates] = useState({}); // Non presente in questo componente

  // ------------------------------------------------------------------
  // Effetto: Carica prenotazioni e utenti al montaggio del componente
  // ------------------------------------------------------------------
  useEffect(() => {
    loadPrenotazioni();
  }, []);

  /**
   * Carica le prenotazioni e gli utenti (risorse) eseguendo chiamate API in parallelo.
   */
  const loadPrenotazioni = async () => {
    setLoading(true);
    try {
      // Esegue in parallelo il fetch delle prenotazioni e delle risorse (utenti)
      const [prenotazioniResponse, utentiResponse] = await Promise.all([
        fetchPrenotazioniSale(),
        fetchRisorse(),
      ]);
      setPrenotazioni(prenotazioniResponse);
      setUtenti(utentiResponse);
    } catch (error) {
      toast.error("Errore durante il caricamento dei dati.");
    } finally {
      setLoading(false);
    }
  };

  // ------------------------------------------------------------------
  // Gestione del form per la prenotazione
  // ------------------------------------------------------------------
  /**
   * Aggiorna i campi del form in base all'input dell'utente.
   */
  const handleChange = (e) => {
    const { name, value } = e.target;
    setNewPrenotazione((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  /**
   * Filtra gli utenti in base all'input e mostra i suggerimenti.
   */
  const handleUtenteInput = (input) => {
    if (input.length > 0) {
      const filtered = utenti.filter((utente) =>
        utente.nome.toLowerCase().includes(input.toLowerCase())
      );
      setFilteredUtenti(filtered);
      setShowUtenteSuggestions(true);
    } else {
      setShowUtenteSuggestions(false);
    }
  };

  /**
   * Seleziona un utente dalla lista dei suggerimenti e lo imposta nel form.
   */
  const handleSelectUtente = (nome) => {
    setNewPrenotazione((prev) => ({
      ...prev,
      utente: nome,
    }));
    setShowUtenteSuggestions(false);
  };

  /**
   * Gestisce il submit del form per creare o aggiornare una prenotazione.
   */
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
      toast.error("Errore durante la gestione della prenotazione.");
    } finally {
      setLoading(false);
    }
  };

  // ------------------------------------------------------------------
  // Funzioni di gestione delle prenotazioni
  // ------------------------------------------------------------------
  /**
   * Crea una nuova prenotazione inviando i dati al backend.
   */
  const handleCreatePrenotazione = async (formData) => {
    try {
      const nuovaPrenotazione = await PrenotaSale(formData);
      setPrenotazioni((prev) => [...prev, nuovaPrenotazione]);
      setHighlightedId(nuovaPrenotazione.id);
      toast.success("Prenotazione creata con successo.");
    } catch {
      toast.error("Errore durante la creazione della prenotazione.");
    }
  };

  /**
   * Aggiorna una prenotazione esistente.
   */
  const handleUpdatePrenotazione = async (id, formData) => {
    try {
      const prenotazioneAggiornata = await updatePrenotazioneSale(id, formData);
      setPrenotazioni((prev) =>
        prev.map((prenotazione) =>
          prenotazione.id === id ? prenotazioneAggiornata : prenotazione
        )
      );
      setHighlightedId(id);
      toast.success("Prenotazione aggiornata con successo.");
    } catch {
      toast.error("Errore durante l'aggiornamento della prenotazione.");
    }
  };

  /**
   * Elimina una prenotazione dopo aver confermato con l'utente.
   */
  const handleDeletePrenotazione = async (id) => {
    if (window.confirm("Sei sicuro di voler eliminare questa prenotazione?")) {
      setDeleteLoadingId(id);
      try {
        await deletePrenotazioneSale(id);
        setPrenotazioni((prev) =>
          prev.filter((prenotazione) => prenotazione.id !== id)
        );
        toast.success("Prenotazione eliminata con successo.");
      } catch {
        toast.error("Errore durante l'eliminazione della prenotazione.");
      } finally {
        setDeleteLoadingId(null);
      }
    }
  };

  /**
   * Abilita la modalità di modifica, impostando i campi del form con i dati della prenotazione da modificare.
   */
  const handleEdit = (prenotazione) => {
    setIsEditing(true);
    setEditingId(prenotazione.id);
    setNewPrenotazione({ ...prenotazione });
  };

  /**
   * Ripristina il form ai valori iniziali e disabilita l'editing.
   */
  const resetForm = () => {
    setNewPrenotazione({
      salaId: "1",
      dataOra: "",
      durata: "",
      descrizione: "",
      utente: "",
    });
    setIsEditing(false);
    setEditingId(null);
  };

  // ------------------------------------------------------------------
  // Rendering del componente
  // ------------------------------------------------------------------
  return (
    <div className="page-wrapper">
    <div className="header">
      <div className="flex-center header-row">
      <h1>PRENOTAZIONE SALE RIUNIONI</h1>
      </div>
      </div>
      <div className="container">
      <ToastContainer position="top-left" autoClose={2000} hideProgressBar />
      {loading && (
        <div className="loading-overlay">
          <img src={logo} alt="Caricamento" className="logo-spinner" />
        </div>
      )}
      {/* Form per la prenotazione */}
      <form onSubmit={handleSubmit}>
        {/* Campo per selezionare l'ID della sala */}
        <div className="flex-column-center">
          <label>ID Sala:</label>
          <select
            name="salaId"
            value={newPrenotazione.salaId}
            onChange={handleChange}
            required
            className="w-400"
          >
            <option value="1">1 - Grande</option>
            <option value="2">2 - Piccola</option>
          </select>
        </div>

        {/* Campo per la data e ora */}
        <div className="flex-column-center">
          <label>Data e Ora:</label>
          <input
            type="datetime-local"
            name="dataOra"
            value={newPrenotazione.dataOra}
            onChange={handleChange}
            required
            className="w-400"
          />
        </div>

        {/* Campo per la durata */}
        <div className="flex-column-center">
          <label>Durata (in minuti):</label>
          <input
            type="number"
            name="durata"
            value={newPrenotazione.durata}
            onChange={handleChange}
            required
            className="w-400"
          />
        </div>

        {/* Campo per la descrizione */}
        <div className="flex-column-center">
          <label>Descrizione:</label>
          <input
            type="text"
            name="descrizione"
            value={newPrenotazione.descrizione}
            onChange={handleChange}
            required
            className="w-400"
          />
        </div>

        {/* Campo per l'utente con funzionalità di suggerimento */}
        <div className="flex-column-center">
          <label>Utente:</label>
          <input
            type="text"
            name="utente"
            value={newPrenotazione.utente}
            onChange={(e) => {
              handleChange(e);
              handleUtenteInput(e.target.value);
            }}
            placeholder="Cerca utente..."
            className="w-400"
          />
          {showUtenteSuggestions && (
            <ul className="suggestions-list w-200">
              {filteredUtenti.map((utente) => (
                <li
                  key={utente.id}
                  onClick={() => handleSelectUtente(utente.nome)}
                  className="suggestion-item"
                >
                  {utente.nome}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Pulsante per il submit */}
        <div className="flex-column-center">
        <button type="submit" className="btn w-400 btn--blue  btn--pill" disabled={loading}>
          {loading
            ? "Salvataggio..."
            : isEditing
            ? "Aggiorna Prenotazione"
            : "Aggiungi Prenotazione"}
        </button>

        {/* Pulsante per annullare l'editing */}
        {isEditing && (
          <button type="button" className="btn w-400 btn--danger btn--pill" onClick={resetForm}>
            Annulla
          </button>
        )}
        </div>
      </form>

      {/* Tabella delle prenotazioni */}
      <table>
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
              className={
                highlightedId === prenotazione.id ? "highlighted-row" : ""
              }
              onAnimationEnd={() => setHighlightedId(null)}
            >
              <td>
                {prenotazione.salaId === "1" ? "Grande" : "Piccola"}
              </td>
              <td>{prenotazione.dataOra}</td>
              <td>{prenotazione.durata} min</td>
              <td>{prenotazione.descrizione}</td>
              <td>{prenotazione.utente}</td>
              <td>
                <button
                  className="btn w-100 btn--warning btn--pill"
                  onClick={() => handleEdit(prenotazione)}
                >
                  Modifica
                </button>
                <button
                  className="btn w-100 btn--danger btn--pill"
                  onClick={() => handleDeletePrenotazione(prenotazione.id)}
                  disabled={deleteLoadingId === prenotazione.id}
                >
                  {deleteLoadingId === prenotazione.id
                    ? "Eliminazione..."
                    : "Elimina"}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
   </div>
  );
}

export default PrenotazioneSale;
