import React, { useState, useEffect } from "react";
import axios from "axios";


// Import per Toastify (per mostrare notifiche)
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Componente per la creazione/modifica di una commessa
function CommessaCrea({
  commessa,             // Oggetto commessa (usato in modalità modifica)
  onClose,              // Funzione per chiudere il popup
  isEditing,            // Booleano: true se si sta modificando, false se si sta creando
  matchTrello,
  reparti,              // Array dei reparti
  attivita,             // Array delle attività disponibili
  selezioniAttivita,    // Stato per le attività predefinite selezionate
  setSelezioniAttivita, // Funzione per aggiornare le attività predefinite selezionate
  fetchCommesse,        // Funzione per aggiornare l'elenco delle commesse
  editId,               // ID della commessa in modifica
  stato_commessa,       // Array degli stati disponibili
  stati_avanzamento,
  
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


// State per le attività predefinite e per la durata (già presente)
const [defaultActivitiesVisible, setDefaultActivitiesVisible] = useState(false);
const [defaultDurations, setDefaultDurations] = useState({});
const [loading, setLoading] = useState(false);

// Nuovo state per le selezioni degli stati iniziali per ciascun reparto
const [defaultStateSelections, setDefaultStateSelections] = useState({});
const [defaultStatesVisible, setDefaultStatesVisible] = useState(false);

  // Funzione per formattare una data in formato "YYYY-MM-DD"
  const formatDate = (dateString) => {
    if (!dateString || isNaN(new Date(dateString).getTime())) {
      return null;
    }
    const date = new Date(dateString);
    return date.toISOString().split("T")[0];
  };



  // FStato per raparti se completata"
  const statiFissiPerReparto = {
  software: "Avviamento terminato",
  elettrico: "Completate",
  quadristi: "Consegnato",
 tecnicoelettrico: "Completate",
};

const aggiornaStatiInizialiSeConsegnata = (statoId) => {
  const statoSelezionato = stato_commessa.find(
    (st) => st.id === Number(statoId)
  );

  if (
    statoSelezionato &&
    statoSelezionato.nome_stato.toLowerCase().includes("consegnat")
  ) {
    const nuoviStati = {};
    reparti.forEach((rep) => {
      const statoFisico = statiFissiPerReparto[rep.nome.toLowerCase()];
      if (statoFisico) {
        nuoviStati[rep.id] = statoFisico;
      }
    });
    setDefaultStateSelections(nuoviStati);
    setDefaultStatesVisible(true);
  }
};


  // useEffect per inizializzare il form:
  // - Se in modalità modifica, precompila i campi con i dati della commessa esistente.
  // - Altrimenti, imposta i valori di default.
  useEffect(() => {
      if ((isEditing || matchTrello) && commessa) {
      setFormData({
        numero_commessa: commessa.numero_commessa,
        tipo_macchina: commessa.tipo_macchina,
        descrizione: commessa.descrizione,
        data_consegna: formatDate(commessa.data_consegna),
        data_FAT: formatDate(commessa.data_FAT),
        altri_particolari: commessa.altri_particolari,
        cliente: commessa.cliente,
        stato_commessa: parseInt(commessa.stato, 10) || 1,
      });
aggiornaStatiInizialiSeConsegnata(commessa.stato);

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
  }, [isEditing, matchTrello,commessa, setSelezioniAttivita]);

// Inizializza il dropdown per gli stati per ogni reparto (modalità creazione)
useEffect(() => {
  if (!isEditing && !matchTrello && Array.isArray(reparti) && reparti.length > 0) {
    const initialSelections = {};
    reparti.forEach((rep) => {
      initialSelections[rep.id] = "In Entrata";
    });
    setDefaultStateSelections(initialSelections);
  }
}, [isEditing, matchTrello, reparti]);

 // useEffect per commessa completata:
useEffect(() => {
  if (
    stato_commessa.length > 0 &&
    formData.stato_commessa
  ) {
    const statoSelezionato = stato_commessa.find(
      (st) => st.id === Number(formData.stato_commessa)
    );

    if (
      statoSelezionato &&
      statoSelezionato.nome_stato.toLowerCase().includes("consegnat")
    ) {
      const nuoviStati = {};
      reparti.forEach((rep) => {
        const statoFisico = statiFissiPerReparto[rep.nome.toLowerCase()];
        if (statoFisico) {
          nuoviStati[rep.id] = statoFisico;
        }
      });
      setDefaultStateSelections(nuoviStati);
      setDefaultStatesVisible(true);
    }
  }
}, [
  formData.stato_commessa,
  stato_commessa,
  reparti,
]);

useEffect(() => {
  if (stato_commessa.length > 0 && formData.stato_commessa) {
    aggiornaStatiInizialiSeConsegnata(formData.stato_commessa);
  }
}, [formData.stato_commessa, stato_commessa, reparti]);



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
              stato_iniziale: defaultStateSelections,
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
              stato_iniziale: defaultStateSelections,
            };

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


      // Costruisci gli stati avanzamento in base alla selezione per ogni reparto
         reparti.map((rep) => {
        // Filtra gli stati disponibili per il reparto corrente
        const statiPerRep = stati_avanzamento.filter(
          (st) => Number(st.reparto_id) === Number(rep.id)
        );
        // Trova lo stato selezionato per questo reparto; se non trovato, usa il primo disponibile
        const selectedStateName = defaultStateSelections[rep.id];
        const selectedState =
          statiPerRep.find((st) => st.nome_stato === selectedStateName) ||
          statiPerRep[0];
        return {
          reparto_id: rep.id,
          stato_id: selectedState ? selectedState.id : null,
          nome_stato: selectedState ? selectedState.nome_stato : null,
          ordine: selectedState ? selectedState.ordine : null,
          data_inizio: null,
          data_fine: null,
          isActive: true,
        };
      });

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
              durata: defaultDurations[attivitaId] || 1,
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
// Gestione del cambiamento della durata per un'attività predefinita
const handleDurationChange = (attivitaId, value) => {
  setDefaultDurations((prev) => ({
    ...prev,
    [attivitaId]: value,
  }));
};

// Nuova funzione: Gestione della selezione dello stato iniziale per ciascun reparto
const handleStateSelectionChange = (repartoId, value) => {
  setDefaultStateSelections((prev) => ({
    ...prev,
    [repartoId]: value,
  }));
};
return (
  <div className="popup">
    <div className="popup-background">
    <div className="popup-content">
      <ToastContainer position="top-left" autoClose={1000} hideProgressBar />
      <h2>{isEditing ? "Modifica Commessa" : "Crea Commessa"}</h2>
      <form onSubmit={handleSubmit}>
        <div className="flex-column-center">
          <label>Numero Commessa:</label>
          <input
            type="text"
            name="numero_commessa"
            value={formData.numero_commessa}
            onChange={handleChange}
            required
            className="w-400"
          />
          <label>Tipo Macchina:</label>
          <input
            type="text"
            name="tipo_macchina"
            value={formData.tipo_macchina}
            onChange={handleChange}
            required
            className="w-400"
          />
          <label>Cliente:</label>
          <input
            type="text"
            name="cliente"
            value={formData.cliente}
            onChange={handleChange}
            required
            className="w-400"
          />
          <label>Descrizione:</label>
          <textarea
            name="descrizione"
            value={formData.descrizione}
            onChange={handleChange}
            className="textarea w-400"
          />
          <label>Data Consegna:</label>
          <input
            type="date"
            name="data_consegna"
            value={formData.data_consegna}
            onChange={handleChange}
            required
            className="w-400"
          />
          <label>Data FAT:</label>
          <input
            type="date"
            name="data_FAT"
            value={formData.data_FAT}
            onChange={handleChange}
            className="w-400"
          />
          <label>Altri Particolari:</label>
          <textarea
            name="altri_particolari"
            value={formData.altri_particolari}
            onChange={handleChange}
            className="textarea w-400"
          />
          <label>Stato:</label>
          <select
            name="stato_commessa"
            value={formData.stato_commessa}
            onChange={handleChange}
            required
            className="w-400"
          >
            <option value={0}>Seleziona uno stato</option>
            {stato_commessa.map((st) => (
              <option key={st.id} value={st.id}>
                {st.nome_stato}
              </option>
            ))}
          </select>
        </div>

        {/* Nuova sezione: Stati Iniziali per Reparti (collapsible) */}
        {!isEditing && (
            <>
        
          <div className="flex-column-center">
            <h2>Stato Iniziale per Reparti</h2>
            <button
             type="button" 
              className="btn w-400 btn--blue btn--pill"
              onClick={() => setDefaultStatesVisible((prev) => !prev)}
            >
              {defaultStatesVisible ? "▼" : "▶"} Seleziona stato iniziale per ogni reparto
            </button>
            {defaultStatesVisible && (
              <div>
                {Array.isArray(reparti) && reparti.length > 0 ? (
                  reparti.map((rep) => {
                    // Usa il prop stati_avanzamento per filtrare gli stati del reparto
                    const statiPerRep = stati_avanzamento.filter(
                      (st) => String(st.reparto_id) === String(rep.id)
                    );
                    return (
                      <div key={rep.id} className="flex-column-left" >
                        <label>{rep.nome}:</label>
                        <select
                          value={defaultStateSelections[rep.id] || "In Entrata"}
                          onChange={(e) =>
                            handleStateSelectionChange(rep.id, e.target.value)
                          }
                          className="select w-200"
                        >
                          {statiPerRep.map((st) => (
                            <option key={st.id} value={st.nome_stato}>
                              {st.nome_stato}
                            </option>
                          ))}
                        </select>
                      </div>
                    );
                  })
                ) : (
                  <p>Nessun reparto disponibile.</p>
                )}
              </div>
            )}
          </div>
        
        {/* Sezione per aggiungere attività predefinite (collapsible) */}
        
        <div className="flex-column-center">
          <h2>Aggiungi attività default</h2>
          <button
           type="button" 
            className="btn w-400 btn--blue btn--pill"
            onClick={() => setDefaultActivitiesVisible((prev) => !prev)}
          >
            {defaultActivitiesVisible ? "▼" : "▶"} Aggiungi attività default
          </button>
          {defaultActivitiesVisible && (
            <>
              {!isEditing &&
              Array.isArray(reparti) &&
              reparti.length > 0 &&
              Array.isArray(attivita) &&
              attivita.length > 0 ? (
                reparti.map((rep) => (
                  <div key={rep.id} className="reparto-container">
                    <div className="reparto-title">{rep.nome}</div>
                    <div className="attivita-list">
                      {attivita
                        .filter((att) => att.reparto_id === rep.id)
                        .map((att) => (
                          <label key={att.id} className="attivita-item">
                            <input
                              type="checkbox"
                              checked={
                                selezioniAttivita[rep.id]?.includes(att.id) || false
                              }
                              onChange={() => handleCheckboxChange(rep.id, att.id)}
                            />
                            {att.nome_attivita}
                            {selezioniAttivita[rep.id]?.includes(att.id) && (
                              <input
                                type="number"
                                min="1"
                                placeholder="Durata (giorni)"
                                value={defaultDurations[att.id] || ""}
                                onChange={(e) =>
                                  handleDurationChange(att.id, e.target.value)
                                }
                                className="duration-input"
                              />
                            )}
                          </label>
                        ))}
                    </div>
                  </div>
                ))
              ) : (
                <span>
                  Nessuna attività disponibile o attività non associate ai reparti
                </span>
              )}
            </>
          )}
        </div>
        </>
          )}
<div className="flex-column-center">
        <button type="submit" className="btn w-400 btn--blue btn--pill" disabled={loading}>
          {loading ? "Salvataggio..." : isEditing ? "Aggiorna" : "Crea"}
        </button>
</div>
      </form>
<div className="flex-column-center">
      <button onClick={onClose} className="btn w-400 btn--danger btn--pill">
        Chiudi
      </button>
      </div>
    </div>
    </div>
  </div>
);
}

export default CommessaCrea;
