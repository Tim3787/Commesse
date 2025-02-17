import React, { useState, useEffect, useRef } from "react";
import "../style.css";

// Import per Toastify (notifiche)
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

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
  const [loading, setLoading] = useState(false);

  // Imposta "stato" a 0 di default se non è presente
  useEffect(() => {
    if (
      formData.stato === undefined ||
      formData.stato === null ||
      formData.stato === ""
    ) {
      setFormData((prevState) => ({ ...prevState, stato: 0 }));
    }
  }, [formData.stato, setFormData]);
  

  
  // Debounce della ricerca delle commesse
  useEffect(() => {
    const timer = setTimeout(() => {
      if (commessaSearch.trim()) {
        const filteredCommesse = commesse.filter((commessa) =>
          String(commessa.numero_commessa || "").toLowerCase().includes(commessaSearch.toLowerCase())
        );
        setSuggestedCommesse(filteredCommesse);
      } else {
        setSuggestedCommesse([]);
      }
    }, 300); // Ritardo di 300ms
    return () => clearTimeout(timer);
  }, [commessaSearch, commesse]);

  // Chiude i suggerimenti quando si clicca fuori
  useEffect(() => {
    const closeSuggestions = (e) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(e.target)) {
        setSuggestedCommesse([]);
      }
    };
    document.addEventListener("click", closeSuggestions);
    return () => document.removeEventListener("click", closeSuggestions);
  }, []);

  useEffect(() => {
    if (isEditing && formData.commessa_id) {
      const commessa = commesse.find((c) => c.commessa_id === parseInt(formData.commessa_id, 10));
      if (commessa) {
        setCommessaSearch(commessa.numero_commessa);
      }
    }
  }, [isEditing, formData.commessa_id, commesse]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "stato") {
      // Se l'utente seleziona l'opzione vuota, imposta comunque 1 di default
      setFormData({ ...formData, stato: value === "" ? 0 : parseInt(value, 10) });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSelectCommessa = (commessa) => {
    setCommessaSearch(commessa.numero_commessa);
    setFormData((prevState) => ({ ...prevState, commessa_id: commessa.commessa_id || "" }));
    setSuggestedCommesse([]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { commessa_id, reparto_id, risorsa_id, attivita_id, data_inizio, durata } = formData;
  
    if (!commessa_id || !reparto_id || !attivita_id || !risorsa_id || !data_inizio || !durata) {
      toast.error("Tutti i campi sono obbligatori.");
      return;
    }
  
    try {
      setLoading(true);
      const endpoint = isEditing
        ? `${process.env.REACT_APP_API_URL}/api/attivita_commessa/${editId}`
        : `${process.env.REACT_APP_API_URL}/api/attivita_commessa`;
      const method = isEditing ? "PUT" : "POST";
  
      const response = await fetch(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${sessionStorage.getItem("token")}`
        },
        body: JSON.stringify(formData),
      });
  
      if (!response.ok) throw new Error("Errore nella richiesta");
  
      toast.success(
        isEditing
          ? "Attività aggiornata con successo!"
          : "Attività aggiunta con successo!"
      );
      reloadActivities();
      // setShowPopup(false);
    } catch (error) {
      console.error("Errore durante l'aggiunta o modifica dell'attività:", error);
      toast.error("Errore durante l'aggiunta o modifica dell'attività.");
    } finally {
      setLoading(false);
    }
  };
  
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
              onChange={(e) => setCommessaSearch(e.target.value)}
              placeholder="Cerca per numero commessa"
              className="input-field-100"
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
              className="input-field-100"
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
              className="input-field-100"
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
                  className="input-field-100"
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
                  className="input-field-100"
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
                  className="input-field-100"
            />
          </div>

          <div className="form-group">
            <label>Stato:</label>
            <select
              name="stato"
              value={formData.stato !== undefined && formData.stato !== null ? String(formData.stato) : "1"}
              onChange={handleChange}
              className="input-field-100"
            >
              {/* Rimuovo l'opzione vuota in modo che lo stato di default sia sempre 1 */}
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
                  className="input-field-100"
            />
          </div>

          <button type="submit" className="btn-100"disabled={loading}>
            {isEditing ? "Aggiorna" : "Aggiungi"}
          </button>
          <button type="button"className="btn-100" onClick={() => setShowPopup(false)}>
            Annulla
          </button>
        </form>
      </div>
    </div>
  );
}

export default AttivitaCrea;
