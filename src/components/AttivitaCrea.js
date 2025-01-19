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
  commesse, 
  reparti,
  risorse,
  attivitaConReparto,
}) {

  const [commessaSearch, setCommessaSearch] = useState(""); 
  const [suggestedCommesse, setSuggestedCommesse] = useState([]); 
  const suggestionsRef = useRef(null); 


  // Gestione del cambiamento dei campi di input
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
   
  };


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
    setFormData((prevState) => {
      const updatedFormData = {
        ...prevState,
        commessa_id: commessa.commessa_id || "", 
      };
      return updatedFormData;

    });

    setSuggestedCommesse([]); 
  };
  
  
  // Funzione di invio del form
  const handleSubmit = async (e) => {
    e.preventDefault();

    const { commessa_id, reparto_id, risorsa_id, attivita_id, data_inizio, durata } = formData;
    console.log("Risorsa_ID:", risorsa_id);  
     console.log("Attivita_ID", attivita_id);
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
      //alert(isEditing ? "Attività aggiornata con successo!" : "Attività aggiunta con successo!");
    
      fetchAttivita(); 
      setShowPopup(false); 
    } catch (error) {
      console.error("Errore durante l'aggiunta o modifica dell'attività:", error);
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
      const commessa = commesse.find(
        (c) => c.commessa_id === parseInt(formData.commessa_id, 10)
      );
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
    {suggestedCommesse.map((commessa) => {
      return (
        <li key={commessa.id} onClick={() => handleSelectCommessa(commessa)}>
          {commessa.numero_commessa}
        </li>
      );
    })}
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
    {attivitaConReparto
      .filter((attivita) => attivita.reparto_id === parseInt(formData.reparto_id, 10))
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