import React, { useState, useEffect, useRef } from "react";
import { fetchAttivita } from "./services/api";
import "./style.css";

function AttivitaCrea({
  formData,
  setFormData,
  isEditing,
  editId,
  setShowPopup,
  commesse,
  reparti,
  risorse,
  attivitaConReparto,
  reloadActivities,
}) {
  const [commessaSearch, setCommessaSearch] = useState("");
  const [suggestedCommesse, setSuggestedCommesse] = useState([]);
  const suggestionsRef = useRef(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);

  // Gestione del cambiamento dei campi di input
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: name === "stato" ? parseInt(value, 10) : value });
  };

  // Gestione della ricerca della commessa
  const handleSearchCommessa = (e) => {
    const searchText = e.target.value.trim().toLowerCase();
    setCommessaSearch(searchText);

    if (!searchText) {
      setSuggestedCommesse([]);
      return;
    }

    const filteredCommesse = commesse.filter((commessa) =>
      String(commessa.numero_commessa || "").toLowerCase().includes(searchText)
    );

    setSuggestedCommesse(filteredCommesse);
  };

  // Gestione della selezione della commessa
  const handleSelectCommessa = (commessa) => {
    setCommessaSearch(commessa.numero_commessa);
    setFormData((prevState) => ({ ...prevState, commessa_id: commessa.commessa_id || "" }));
    setSuggestedCommesse([]);
  };

  // Funzione di invio del form
  const handleSubmit = async (e) => {
    e.preventDefault();

    const {
      commessa_id,
      reparto_id,
      risorsa_id,
      attivita_id,
      data_inizio,
      durata,
    } = formData;

    // Validazione lato client
    if (!commessa_id || !reparto_id || !attivita_id || !risorsa_id || !data_inizio || !durata ) {
      setErrorMessage("Tutti i campi sono obbligatori.");
      setTimeout(() => setErrorMessage(""), 3000);
      return;
    }

    try {
      setLoading(true);
      const endpoint = isEditing
        ? `${process.env.REACT_APP_API_URL}/api/attivita_commessa/${editId}`
        : `${process.env.REACT_APP_API_URL}/api/attivita_commessa`;
      const method = isEditing ? "put" : "post";

      await fetch(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      setSuccessMessage(isEditing ? "Attività aggiornata con successo!" : "Attività aggiunta con successo!");
      setTimeout(() => setSuccessMessage(""), 3000);

      await fetchAttivita(); // Aggiorna la lista delle attività
      //setShowPopup(false); // Chiudi il pop-up
      reloadActivities();
    } catch (error) {
      console.error("Errore durante l'aggiunta o modifica dell'attività:", error);
      setErrorMessage("Errore durante l'operazione. Riprova.");
      setTimeout(() => setErrorMessage(""), 3000);
    } finally {
      setLoading(false);
    }
  };

  // Funzione per chiudere i suggerimenti quando clicchi fuori
  const closeSuggestions = (e) => {
    if (suggestionsRef.current && !suggestionsRef.current.contains(e.target)) {
      setSuggestedCommesse([]);
    }
  };

  // Aggiungiamo un evento per rilevare i clic fuori dalla lista
  useEffect(() => {
    document.addEventListener("click", closeSuggestions);
    return () => {
      document.removeEventListener("click", closeSuggestions);
    };
  }, []);

  useEffect(() => {
    if (isEditing && formData.commessa_id) {
      const commessa = commesse.find((c) => c.commessa_id === parseInt(formData.commessa_id, 10));
      if (commessa) {
        setCommessaSearch(commessa.numero_commessa);
      }
    }
  }, [isEditing, formData.commessa_id, commesse]);

  return (
    <div className="popup">
      <div className="popup-content">
        <h2>{isEditing ? "Modifica Attività" : "Aggiungi Attività"}</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Commessa:</label>
            <input
              type="text"
              name="commessa_id"
              value={commessaSearch || ""}
              onChange={handleSearchCommessa}
              placeholder="Cerca per numero commessa"
              className="input-field"
            />
            {suggestedCommesse.length > 0 && (
              <ul className="suggestions-list" ref={suggestionsRef}>
                {suggestedCommesse.map((commessa) => (
                  <li key={commessa.id} onClick={() => handleSelectCommessa(commessa)}>
                    {commessa.numero_commessa}
                  </li>
                ))}
              </ul>
            )}
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

          <div className="form-group">
            <label>Risorsa:</label>
            <select
              name="risorsa_id"
              value={formData.risorsa_id}
              onChange={handleChange}
              required
            >
              <option value="">Seleziona una risorsa</option>
              {risorse
                .filter((risorsa) => risorsa.reparto_id === parseInt(formData.reparto_id))
                .map((risorsa) => (
                  <option key={risorsa.id} value={risorsa.id}>
                    {risorsa.nome}
                  </option>
                ))}
            </select>
          </div>

          <div className="form-group">
            <label>Attività:</label>
            <select
              name="attivita_id"
              value={formData.attivita_id}
              onChange={handleChange}
              required
            >
              <option value="">Seleziona un'attività</option>
              {attivitaConReparto
                .filter((attivita) => attivita.reparto_id === parseInt(formData.reparto_id, 10))
                .map((attivita) => (
                  <option key={attivita.id} value={attivita.id}>
                    {attivita.nome_attivita}
                  </option>
                ))}
            </select>
          </div>

          <div className="form-group">
            <label>Data Inizio:</label>
            <input
              type="date"
              name="data_inizio"
              value={formData.data_inizio}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Durata:</label>
            <input
              type="number"
              name="durata"
              value={formData.durata}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Stato:</label>
            <select
              name="stato"
              value={formData.stato !== undefined && formData.stato !== null ? String(formData.stato) : ""}
              onChange={handleChange}
              //required
            >
              <option value="">Seleziona uno stato</option>
              <option value="0">Non iniziata</option>
              <option value="1">Iniziata</option>
              <option value="2">Completata</option>
            </select>
          </div>

          <div className="form-group">
            <label>Descrizione:</label>
            <textarea
              name="descrizione"
              value={formData.descrizione || ""}
              onChange={handleChange}
              placeholder="Inserisci una descrizione (opzionale)"
              rows="4"
              className="textarea-field"
            />
          </div>

          <button type="submit" disabled={loading}>
            {isEditing ? "Aggiorna" : "Aggiungi"}
          </button>
          {successMessage && <div className="success-message">{successMessage}</div>}
          {errorMessage && <div className="error-message">{errorMessage}</div>}
          <button type="button" onClick={() => setShowPopup(false)}>
            Annulla
          </button>
        </form>
      </div>
    </div>
  );
}

export default AttivitaCrea;
