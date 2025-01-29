import React, { useState, useEffect } from "react";
import axios from "axios";
import "./style.css";

function CommessaCrea({
  commessa,
  onClose,
  isEditing,
  reparti,
  attivita,
  selezioniAttivita,
  setSelezioniAttivita,
  fetchCommesse,
  editId,
  stato,
}) {
  const [formData, setFormData] = useState({
    numero_commessa: "",
    tipo_macchina: "",
    descrizione: "",
    data_consegna: "",
    data_FAT: "",
    altri_particolari: "",
    cliente: "",
    stato: "",
  });
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  // Funzione per formattare la data in formato 'yyyy-MM-dd'
  const formatDate = (dateString) => {
    if (!dateString || isNaN(new Date(dateString).getTime())) {
      return null; // Restituisci null se la data è vuota o non valida
    }
    const date = new Date(dateString);
    return date.toISOString().split("T")[0];
  };

  useEffect(() => {

    if (isEditing && commessa) {

      setFormData({
        numero_commessa: commessa.numero_commessa,
        tipo_macchina: commessa.tipo_macchina,
        descrizione: commessa.descrizione,
        data_consegna: formatDate(commessa.data_consegna),
        data_FAT: formatDate(commessa.data_FAT),
        altri_particolari: commessa.altri_particolari,
        cliente: commessa.cliente,
        stato: commessa.stato,
      });
      // Controlla che commessa.attivita sia definito
      if (commessa.attivita && Array.isArray(commessa.attivita)) {
        // Inizializza selezioniAttivita per le attività già assegnate alla commessa
        const attivitaSelezionate = {};
        commessa.attivita.forEach((attivita) => {
          if (!attivitaSelezionate[attivita.reparto_id]) {
            attivitaSelezionate[attivita.reparto_id] = [];
          }
          attivitaSelezionate[attivita.reparto_id].push(attivita.id);
        });
        setSelezioniAttivita(attivitaSelezionate); 
      } else {
      }
    } else {
      setFormData({
        numero_commessa: "",
        tipo_macchina: "",
        descrizione: "",
        data_consegna: "",
        data_FAT: "",
        altri_particolari: "",
        cliente: "",
        stato: "",
      });
  
      setSelezioniAttivita({}); 
    }
  }, [isEditing, commessa, setSelezioniAttivita]);
  

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.data_FAT && new Date(formData.data_FAT) > new Date(formData.data_consegna)) {
      alert("La data FAT deve essere antecedente alla data di consegna.");
      return;
    }
  
    try {
      let commessaId;

      const payload = {
        ...formData,
        data_FAT: formatDate(formData.data_FAT), // Usa la funzione formatDate
        data_consegna: formatDate(formData.data_consegna), // Usa la funzione formatDate
        stato: formData.stato || null, // Gestisci lo stato vuoto
      };

      if (isEditing) {
        await axios.put(
          `${process.env.REACT_APP_API_URL}/api/commesse/${editId}`,
          payload
        );

        commessaId = editId;
      } else {
        const { data } = await axios.post(
          `${process.env.REACT_APP_API_URL}/api/commesse`,
          payload
        );

        commessaId = data.commessaId;
      }
  
      const attivitaDaAggiungere = [];
      Object.keys(selezioniAttivita).forEach((repartoId) => {
        const attivitaIds = selezioniAttivita[repartoId];
  
        if (attivitaIds) {
          attivitaIds.forEach((attivitaId) => {
            attivitaDaAggiungere.push({
              commessa_id: commessaId,
              reparto_id: parseInt(repartoId, 10),
              attivita_id: attivitaId,
            });
          });
        }
      });
  
      if (attivitaDaAggiungere.length > 0) {
        await axios.post(
          `${process.env.REACT_APP_API_URL}/api/commesse/assegna-attivita-predefinite`,
          attivitaDaAggiungere,
          {
            headers: { "Content-Type": "application/json" },
          }
        );
      }
  
      setFormData({
        numero_commessa: "",
        tipo_macchina: "",
        descrizione: "",
        data_consegna: "",
        data_FAT: "",
        altri_particolari: "",
        cliente: "",
        stato: "",
      });
      setSelezioniAttivita({});
      setErrorMessage(""); // Rimuove eventuali errori precedenti
      setSuccessMessage(isEditing ? "Commessa creata con successo!" : "Commessa creata con successo!");
      setTimeout(() => {
         setSuccessMessage(""); // MESSAGGIO SUCCESSO
      }, 3000);
      fetchCommesse(); 
    } catch (error) {
      console.error("Errore durante l'operazione:", error);
      alert("Errore durante l'operazione.");
      setErrorMessage("Si è verificato un errore. Per favore, riprova.");
   
   setTimeout(() => {
      setErrorMessage(""); // Nasconde il messaggio di errore dopo 3 secondi
   }, 3000);
    }
  };
  

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleCheckboxChange = (repartoId, attivitaId) => {
    setSelezioniAttivita((prev) => {
      const selezioniReparto = prev[repartoId] || [];
      if (selezioniReparto.includes(attivitaId)) {
        return {
          ...prev,
          [repartoId]: selezioniReparto.filter((id) => id !== attivitaId),
        };
      } else {
        return {
          ...prev,
          [repartoId]: [...selezioniReparto, attivitaId],
        };
      }
    });
  };

  return (
    <div className="popup">
      <div className="popup-content">
        <h2>{isEditing ? "Modifica Commessa" : "Crea Commessa"}</h2>
        <form onSubmit={handleSubmit}>
          <div>
            <label>Numero Commessa:</label>
            <input
              type="text"
              name="numero_commessa"
              value={formData.numero_commessa}
              onChange={handleChange}
              required
              className="input-field-100"
            />
            <label>Tipo Macchina:</label>
            <input
              type="text"
              name="tipo_macchina"
              value={formData.tipo_macchina}
              onChange={handleChange}
              required
              className="input-field-100"
            />
            <label>Cliente:</label>
            <input
              type="text"
              name="cliente"
              value={formData.cliente}
              onChange={handleChange}
              required
              className="input-field-100"
            />
            <label>Descrizione:</label>
            <textarea
              name="descrizione"
              value={formData.descrizione}
              onChange={handleChange}
              className="input-field-100"
            />
            <label>Data Consegna:</label>
            <input
              type="date"
              name="data_consegna"
              value={formData.data_consegna}
              onChange={handleChange}
              required
              className="input-field-100"
            />
            <label>Data FAT:</label>
            <input
              type="date"
              name="data_FAT"
              value={formData.data_FAT}
              onChange={handleChange}
              className="input-field-100"
            />
            <label>Altri Particolari:</label>
            <textarea
              name="altri_particolari"
              value={formData.altri_particolari}
              onChange={handleChange}
              className="input-field-100"
            />
          </div>
          {/* stato */}
          <div className="form-group">
  <label>Stato:</label>
  <select
    name="stato"
    value={formData.stato}
    onChange={handleChange}
    required
  >
    <option value="">Seleziona uno stato</option>
    {stato.map((st) => (
      <option key={st.id} value={st.id}>
        {st.nome_stato} {/* Usa nome_stato invece di nome */}
      </option>
    ))}
  </select>
</div>
          <h2>Aggiungi attività default</h2>
          {!isEditing && Array.isArray(reparti) && reparti.length > 0 && Array.isArray(attivita) && attivita.length > 0 ? (
  reparti.map((reparto) => (
    <div key={reparto.id} className="reparto-container">
      <div className="reparto-title">{reparto.nome}</div>
      <div className="attivita-list">
        {attivita
          .filter((attivita) => attivita.reparto_id === reparto.id) 
          .map((attivita) => (
            <label key={attivita.id} className="attivita-item">
              <input
                type="checkbox"
                checked={selezioniAttivita[reparto.id]?.includes(attivita.id) || false}
                onChange={() => handleCheckboxChange(reparto.id, attivita.id)}
              />
              {attivita.nome_attivita}
            </label>
          ))}
      </div>
    </div>
  ))
) : (
  <span>Nessuna attività disponibile o attività non associate ai reparti</span>
)}

          <button type="submit"className="btn-100">{isEditing ? "Aggiorna" : "Crea"}</button>
          {successMessage && <div className="success-message">{successMessage}</div>}
          {errorMessage && <div className="error-message">{errorMessage}</div>}
        </form>
        <button onClick={onClose} className="btn-100">Chiudi</button>
      </div>
    </div>
  );
}

export default CommessaCrea;
