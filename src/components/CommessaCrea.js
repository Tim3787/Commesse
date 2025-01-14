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
}) {
  const [formData, setFormData] = useState({
    numero_commessa: "",
    tipo_macchina: "",
    descrizione: "",
    data_consegna: "",
    altri_particolari: "",
    cliente: "",
  });

  // Funzione per formattare la data in formato 'yyyy-MM-dd'
const formatDate = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  return date.toISOString().split('T')[0];  // Converte la data in formato 'YYYY-MM-DD'
};

  useEffect(() => {
    console.log("useEffect CommessaCrea:", { commessa, isEditing, selezioniAttivita });
  
    if (isEditing && commessa) {
      setFormData({
        numero_commessa: commessa.numero_commessa,
        tipo_macchina: commessa.tipo_macchina,
        descrizione: commessa.descrizione,
        data_consegna: formatDate(commessa.data_consegna),
        altri_particolari: commessa.altri_particolari,
        cliente: commessa.cliente,
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
        setSelezioniAttivita(attivitaSelezionate); // Imposta le selezioni esistenti
        console.log("Attività selezionate:", attivitaSelezionate);
      } else {
        console.log("Nessuna attività trovata per la commessa.");
      }
    } else {
      setFormData({
        numero_commessa: "",
        tipo_macchina: "",
        descrizione: "",
        data_consegna: "",
        altri_particolari: "",
        cliente: "",
      });
  
      setSelezioniAttivita({}); // Resetta le selezioni
    }
  }, [isEditing, commessa, setSelezioniAttivita]);
  

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("handleSubmit: invio dati della commessa", formData);
    try {
      let commessaId;

      if (isEditing) {
        const response = await axios.put(
          `${process.env.REACT_APP_API_URL}/api/commesse/${editId}`,
          formData
        );
        commessaId = editId;
        alert("Commessa aggiornata con successo!");
      } else {
        const response = await axios.post(
          `${process.env.REACT_APP_API_URL}/api/commesse`,
          formData
        );
        commessaId = response.data.commessaId;
        alert("Commessa aggiunta con successo!");
      }

      const attivitaDaAggiungere = [];
      Object.keys(selezioniAttivita).forEach((repartoId) => {
        const attivitaIds = selezioniAttivita[repartoId];
        console.log("attivitaIds per reparto", repartoId, attivitaIds);

        if (attivitaIds) {
          attivitaIds.forEach((attivitaId) => {
            attivitaDaAggiungere.push({
              commessa_id: commessaId,
              reparto_id: parseInt(repartoId, 10),
              attivita_id: attivitaId,
            });
          });
        } else {
          console.log(`Nessuna attività selezionata per reparto con ID: ${repartoId}`);
        }
      });

      console.log("Dati attività da inviare:", attivitaDaAggiungere);

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
        altri_particolari: "",
        cliente: "",
      });
      setSelezioniAttivita({});
      fetchCommesse(); // Ricarica la lista delle commesse
      onClose(); // Chiudi il pop-up
    } catch (error) {
      console.error("Errore durante l'operazione:", error);
      alert("Errore durante l'operazione.");
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
            />
            <label>Tipo Macchina:</label>
            <input
              type="text"
              name="tipo_macchina"
              value={formData.tipo_macchina}
              onChange={handleChange}
              required
            />
            <label>Cliente:</label>
            <input
              type="text"
              name="cliente"
              value={formData.cliente}
              onChange={handleChange}
              required
            />
            <label>Descrizione:</label>
            <textarea
              name="descrizione"
              value={formData.descrizione}
              onChange={handleChange}
            />
            <label>Data Consegna:</label>
            <input
              type="date"
              name="data_consegna"
              value={formData.data_consegna}
              onChange={handleChange}
              required
            />
            <label>Altri Particolari:</label>
            <textarea
              name="altri_particolari"
              value={formData.altri_particolari}
              onChange={handleChange}
            />
          </div>

          <h2>Aggiungi attività default</h2>
          {!isEditing && Array.isArray(reparti) && reparti.length > 0 && Array.isArray(attivita) && attivita.length > 0 ? (
  reparti.map((reparto) => (
    <div key={reparto.id} className="reparto-container">
      <div className="reparto-title">{reparto.nome}</div>
      <div className="attivita-list">
        {attivita
          .filter((attivita) => attivita.reparto_id === reparto.id) // Filtro in base al reparto
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

          <button type="submit">{isEditing ? "Aggiorna" : "Crea"}</button>
        </form>
        <button onClick={onClose}>Chiudi</button>
      </div>
    </div>
  );
}

export default CommessaCrea;
