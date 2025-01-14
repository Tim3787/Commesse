import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import "./style.css";

function AttivitaCrea({
  formData,
  setFormData,
  isEditing,
  editId,
  fetchAttivita,
  setShowPopup,
  commesse, // Tutte le commesse ricevute come props
  reparti,
  risorse,
  attivitaDefinite,
}) {
  const [commessaSearch, setCommessaSearch] = useState(""); // Stato per la ricerca della commessa
  const [suggestedCommesse, setSuggestedCommesse] = useState([]); // Stato per i suggerimenti delle commesse
  const suggestionsRef = useRef(null); // Riferimento per il contenitore dei suggerimenti
  // Gestione del cambiamento dei campi di input
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // Funzione di ricerca delle commesse
  const handleSearchCommessa = (e) => {
    const searchText = e.target.value;
    setCommessaSearch(searchText);
    // Filtriamo le commesse in base al testo inserito
    const filteredCommesse = commesse.filter((commessa) =>
      commessa.numero_commessa.toLowerCase().includes(searchText.toLowerCase()) // Cerca per numero commessa
    );
    setSuggestedCommesse(filteredCommesse);
  };

  // Gestione della selezione della commessa
  const handleSelectCommessa = (commessa) => {
    setCommessaSearch(commessa.numero_commessa); // Aggiorniamo il testo nel campo di input
    console.log("Commessa selezionata:", commessa); // Aggiungi un log per verificare la commessa
    setFormData((prevState) => {
      console.log("Form Data prima dell'aggiornamento:", prevState); // Log prima di aggiornare
      console.log("Commessa ID:", commessa.commessa_id); // Log della commessa_id corretta
      console.log("Risorse:", risorse); // Log della commessa_id corretta
      console.log("Reparti:", reparti); // Log della commessa_id corretta
      const updatedFormData = {
        ...prevState,
        commessa_id: commessa.commessa_id || "", // Usa commessa.commessa_id
      };
      console.log("Form Data dopo l'aggiornamento:", updatedFormData); // Log dopo aggiornamento
      return updatedFormData;
    });
    setSuggestedCommesse([]); // Nascondiamo i suggerimenti
  };
  
  
  // Funzione di invio del form
  const handleSubmit = async (e) => {
    e.preventDefault();

    const { commessa_id, reparto_id, risorsa_id, attivita_id, data_inizio, durata } = formData;
    console.log("Commessa:", { commessa_id, reparto_id, risorsa_id});
    if (!commessa_id || !reparto_id || !risorsa_id || !attivita_id || !data_inizio || !durata) {
      alert("Tutti i campi sono obbligatori.");
      return;
    }

    try {
      const endpoint = isEditing
        ? `${process.env.REACT_APP_API_URL}/api/attivita_commessa/${editId}`
        : `${process.env.REACT_APP_API_URL}/api/attivita_commessa`;

      const method = isEditing ? "put" : "post";

      await axios[method](endpoint, formData);
      alert(isEditing ? "Attività aggiornata con successo!" : "Attività aggiunta con successo!");

      fetchAttivita(); // Ricarica le attività
      setShowPopup(false); // Chiudi il pop-up
    } catch (error) {
      console.error("Errore durante l'aggiunta o modifica dell'attività:", error);
    }
  };

  // Funzione per chiudere i suggerimenti quando clicchi fuori
  const closeSuggestions = (e) => {
    if (suggestionsRef.current && !suggestionsRef.current.contains(e.target)) {
      setSuggestedCommesse([]); // Nasconde la lista dei suggerimenti
    }
  };

  // Aggiungiamo un evento per rilevare i clic fuori dalla lista
  useEffect(() => {
    document.addEventListener("click", closeSuggestions);
    return () => {
      document.removeEventListener("click", closeSuggestions); // Pulizia dell'evento quando il componente viene smontato
    };
  }, []);

  return (
    <div className="popup">
      <div className="popup-content">
        <h2>{isEditing ? "Modifica Attività" : "Aggiungi Attività"}</h2>
        <form onSubmit={handleSubmit}>
          {/* Input per cercare la commessa */}
          <div className="form-group">
            <label>Commessa:</label>
            <input
  type="text"
  name="commessa_id"
  value={commessaSearch || ""}  // Visualizza il numero della commessa, non l'id
  onChange={handleSearchCommessa}
  placeholder="Cerca per numero commessa"
  className="form-control"
/>
            {/* Mostriamo i suggerimenti delle commesse */}
            {suggestedCommesse.length > 0 && (
              <ul className="suggestions-list" ref={suggestionsRef}>
                {suggestedCommesse.map((commessa) => (
                  <li
                    key={commessa.id}
                    onClick={() => handleSelectCommessa(commessa)}
                  >
                    {commessa.numero_commessa}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Reparto */}
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

          {/* Risorsa */}
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

          {/* Attività */}
          <div className="form-group">
            <label>Attività:</label>
            <select
              name="attivita_id"
              value={formData.attivita_id}
              onChange={handleChange}
              required
            >
              <option value="">Seleziona un'attività</option>
              {attivitaDefinite
                .filter((attivita) => attivita.reparto_id === parseInt(formData.reparto_id))
                .map((attivita) => (
                  <option key={attivita.id} value={attivita.id}>
                    {attivita.nome_attivita}
                  </option>
                ))}
            </select>
          </div>

          {/* Data Inizio */}
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

          {/* Durata */}
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

          <button type="submit">{isEditing ? "Aggiorna" : "Aggiungi"}</button>
          <button type="button" onClick={() => setShowPopup(false)}>
            Annulla
          </button>
        </form>
      </div>
    </div>
  );
}

export default AttivitaCrea;