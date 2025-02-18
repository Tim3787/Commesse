import React, { useState, useEffect } from "react";
import axios from "axios";
import "../style.css";

// Import per Toastify (per mostrare notifiche)
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Componente per la creazione/modifica di una commessa
function CommessaCrea({
  commessa,             // Oggetto commessa (usato in modalità modifica)
  onClose,              // Funzione per chiudere il popup
  isEditing,            // Booleano: true se si sta modificando, false se si sta creando
  reparti,              // Array dei reparti
  attivita,             // Array delle attività disponibili
  selezioniAttivita,    // Stato per le attività predefinite selezionate
  setSelezioniAttivita, // Funzione per aggiornare le attività predefinite selezionate
  fetchCommesse,        // Funzione per aggiornare l'elenco delle commesse
  editId,               // ID della commessa in modifica
  stato_commessa,       // Array degli stati disponibili
}) {
  // Stato del form: inizialmente impostato a valori vuoti (modalità creazione)
  const [formData, setFormData] = useState({
    numero_commessa: "",
    tipo_macchina: "",
    descrizione: "",
    data_consegna: "",
    data_FAT: "",
    altri_particolari: "",
    cliente: "",
    stato_commessa: 1, // Stato default (numero 1)
  });

  // Stato per la gestione del caricamento (spinner)
  const [loading, setLoading] = useState(false);

  // Funzione per formattare una data in formato "YYYY-MM-DD"
  const formatDate = (dateString) => {
    if (!dateString || isNaN(new Date(dateString).getTime())) {
      return null;
    }
    const date = new Date(dateString);
    return date.toISOString().split("T")[0];
  };

  // useEffect per inizializzare il form:
  // - Se in modalità modifica, precompila i campi con i dati della commessa esistente.
  // - Altrimenti, imposta i valori di default.
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
        // Utilizza il campo "stato" dell'oggetto commessa per precompilare il select
        stato_commessa: parseInt(commessa.stato, 10) || 1,
      });

      // Inizializza le attività già assegnate alla commessa, se presenti
      if (commessa.attivita && Array.isArray(commessa.attivita)) {
        const attivitaSelezionate = {};
        commessa.attivita.forEach((attivita) => {
          if (!attivitaSelezionate[attivita.reparto_id]) {
            attivitaSelezionate[attivita.reparto_id] = [];
          }
          attivitaSelezionate[attivita.reparto_id].push(attivita.id);
        });
        setSelezioniAttivita(attivitaSelezionate);
      }
    } else {
      // Modalità creazione: imposta campi a valori di default
      setFormData({
        numero_commessa: "",
        tipo_macchina: "",
        descrizione: "",
        data_consegna: "",
        data_FAT: "",
        altri_particolari: "",
        cliente: "",
        stato_commessa: 1,
      });
      setSelezioniAttivita({});
    }
  }, [isEditing, commessa, setSelezioniAttivita]);

  // Gestione dell'invio del form
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validazione: la data FAT deve essere antecedente alla data di consegna
    if (
      formData.data_FAT &&
      new Date(formData.data_FAT) > new Date(formData.data_consegna)
    ) {
      toast.error("La data FAT deve essere antecedente alla data di consegna.");
      return;
    }
    // Validazione: il campo stato deve avere un valore valido
    if (!formData.stato_commessa) {
      toast.error("Seleziona uno stato valido.");
      return;
    }

    
    setLoading(true);
    try {
      let commessaId;
      // Costruisco il payload in base alla modalità (modifica o creazione)
      const payload =
        isEditing
          ? {
              // Per l'aggiornamento, l'API si aspetta il campo "stato"
              numero_commessa: formData.numero_commessa,
              tipo_macchina: formData.tipo_macchina,
              descrizione: formData.descrizione,
              data_consegna: formatDate(formData.data_consegna),
              data_FAT: formatDate(formData.data_FAT),
              altri_particolari: formData.altri_particolari,
              cliente: formData.cliente,
              stato: parseInt(formData.stato_commessa, 10) || 1,
            }
          : {
              // Per la creazione, l'API si aspetta il campo "stato_commessa"
              numero_commessa: formData.numero_commessa,
              tipo_macchina: formData.tipo_macchina,
              descrizione: formData.descrizione,
              data_consegna: formatDate(formData.data_consegna),
              data_FAT: formatDate(formData.data_FAT),
              altri_particolari: formData.altri_particolari,
              cliente: formData.cliente,
              stato_commessa: parseInt(formData.stato_commessa, 10) || 1,
            };

      console.log("Payload inviato:", payload);
      if (isEditing) {
        // Chiamata API per aggiornare la commessa esistente
        await axios.put(
          `${process.env.REACT_APP_API_URL}/api/commesse/${editId}`,
          payload
        );
        commessaId = editId;
      } else {
        // Chiamata API per creare una nuova commessa
        const { data } = await axios.post(
          `${process.env.REACT_APP_API_URL}/api/commesse`,
          payload
        );
        commessaId = data.commessaId;
      }

      // Gestione delle attività predefinite associate alla commessa
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
          { headers: { "Content-Type": "application/json" } }
        );
      }

      // Resetta il form e chiude il popup
      setFormData({
        numero_commessa: "",
        tipo_macchina: "",
        descrizione: "",
        data_consegna: "",
        data_FAT: "",
        altri_particolari: "",
        cliente: "",
        stato_commessa: 1,
      });
      setSelezioniAttivita({});
      toast.success("Commessa creata con successo!");
      fetchCommesse();
    } catch (error) {
      console.error("Errore durante l'operazione:", error);
      toast.error("Errore durante l'operazione.");
    } finally {
      setLoading(false);
    }
  };

  // Gestione dei cambiamenti nei campi del form
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      // Se il campo è "stato_commessa", converte il valore in numero
      [name]: name === "stato_commessa" ? Number(value) : value,
    });
    console.log("formData handle change:", formData);
  };

  // Gestione della selezione/deselezione delle attività (checkbox)
  const handleCheckboxChange = (repartoId, attivitaId) => {
    setSelezioniAttivita((prev) => {
      const selezioniReparto = prev[repartoId] || [];
      if (selezioniReparto.includes(attivitaId)) {
        // Se già selezionata, rimuove l'attività dalla selezione
        return {
          ...prev,
          [repartoId]: selezioniReparto.filter((id) => id !== attivitaId),
        };
      } else {
        // Altrimenti, aggiunge l'attività alla selezione
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
        {/* Componente per le notifiche Toast */}
        <ToastContainer position="top-left" autoClose={1000} hideProgressBar />
        <h2>{isEditing ? "Modifica Commessa" : "Crea Commessa"}</h2>
        <form onSubmit={handleSubmit}>
          {/* Sezione dati della commessa */}
          <div className="form-group">
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
            <label>Stato:</label>
            <select
              name="stato_commessa"
              value={formData.stato_commessa}
              onChange={handleChange}
              required
              className="input-field-100"
            >
              {/* Prima opzione per selezionare uno stato */}
              <option value={0}>Seleziona uno stato</option>
              {stato_commessa.map((st) => (
                <option key={st.id} value={st.id}>
                  {st.nome_stato}
                </option>
              ))}
            </select>
          </div>

          {/* Sezione per aggiungere attività predefinite (solo in modalità creazione) */}
          <h2>Aggiungi attività default</h2>
          {!isEditing &&
          Array.isArray(reparti) &&
          reparti.length > 0 &&
          Array.isArray(attivita) &&
          attivita.length > 0 ? (
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
                          checked={
                            selezioniAttivita[reparto.id]?.includes(attivita.id) || false
                          }
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

          {/* Bottone per inviare il form */}
          <button type="submit" className="btn-100" disabled={loading}>
            {loading ? "Salvataggio..." : isEditing ? "Aggiorna" : "Crea"}
          </button>
        </form>

        {/* Bottone per chiudere il popup */}
        <button onClick={onClose} className="btn-100">
          Chiudi
        </button>
      </div>
    </div>
  );
}

export default CommessaCrea;
