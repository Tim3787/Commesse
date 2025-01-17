import React, { useState, useEffect } from "react";
import axios from "axios";
import "../style.css";
import AttivitaCrea from "../AttivitaCrea";

function AssegnaAttivita() {
  const [attivitaProgrammate, setAttivitaProgrammate] = useState([]);
  const [attivitaDefinite, setAttivitaDefinite] = useState([]);
  const [commesse, setCommesse] = useState([]);
  const [risorse, setRisorse] = useState([]);
  const [reparti, setReparti] = useState([]);
  const [filteredRisorse, setFilteredRisorse] = useState([]);
  const [filteredActivities, setFilteredActivities] = useState([]);
  const [attivitaConReparto, setattivitaConReparto] = useState([]);
  const [attivitaFiltrate, setAttivitaFiltrate] = useState([]);
  const [filters, setFilters] = useState({
    reparto_id: "",
    commessa_id: "",
    risorsa_id: "",
    attivita_id: "",
  });
  const [commessaSuggestions, setCommessaSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [formData, setFormData] = useState({
    commessa_id: "",
    reparto_id: "",
    risorsa_id: "",
    attivita_id: "",
    data_inizio: "",
    durata: "",
  });
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);

  useEffect(() => {
    fetchOptions();
  }, []);

  useEffect(() => {
    if (isEditing && editId) {
    }
  }, [isEditing, editId]);

  
  useEffect(() => {
    applyFilters();
  }, [filters, attivitaProgrammate]);

  const fetchOptions = async () => {
    try {
      setLoading(true);
      const [commesseResponse, risorseResponse, repartiResponse, attivitaResponse, attivitaProgrammateResponse] =
        await Promise.all([
          axios.get(`${process.env.REACT_APP_API_URL}/api/commesse`),
          axios.get(`${process.env.REACT_APP_API_URL}/api/risorse`),
          axios.get(`${process.env.REACT_APP_API_URL}/api/reparti`),
          axios.get(`${process.env.REACT_APP_API_URL}/api/attivita`),
          axios.get(`${process.env.REACT_APP_API_URL}/api/attivita_commessa`),
        ]);
  
      setCommesse(commesseResponse.data);
      setRisorse(risorseResponse.data);
      setReparti(repartiResponse.data);
      setAttivitaDefinite(attivitaResponse.data);
      setAttivitaProgrammate(attivitaProgrammateResponse.data);
      setAttivitaFiltrate(attivitaProgrammateResponse.data);
      setFilteredRisorse(risorseResponse.data);
      // Imposta un ID di modifica iniziale se necessario
    if (attivitaProgrammateResponse.data.length > 0) {
      setEditId(attivitaProgrammateResponse.data[0].id); // Prendi il primo elemento
    }
  
    // Trasforma le attività per includere reparto_id
    const attivitaConReparto = attivitaResponse.data.map((attivita) => ({
      id: attivita.id,
      nome_attivita: attivita.nome || attivita.nome_attivita || "Nome non disponibile",
      reparto_id: attivita.reparto_id,
    }));
    
    setattivitaConReparto(attivitaConReparto);
    // Simuliamo attività definite
    const uniqueActivities = Array.from(
      new Set(attivitaResponse.data.map((att) => att.nome_attivita))
    ).map((nome) => ({ nome }));
    setAttivitaDefinite(uniqueActivities);
    setFilteredActivities(uniqueActivities);
  } catch (error) {
    console.error("Errore durante il caricamento dei dati iniziali:", error);
  } finally {
    setLoading(false);
  }
};
  

    // Funzione per aprire il pop-up in modalità modifica
    const handleEdit = (attivita) => {

  
      // Controlla se `data_inizio` è una data valida
      const dataInizio = attivita.data_inizio && attivita.data_inizio !== "Non specificata"
        ? new Date(attivita.data_inizio).toISOString().split("T")[0]
        : ""; // Usa una stringa vuota se non è valida
    
      setFormData({
        commessa_id: attivita.commessa_id || "",
        reparto_id: reparti.find((reparto) => reparto.nome === attivita.reparto)?.id || "",
        risorsa_id: risorse.find((risorsa) => risorsa.nome === attivita.risorsa)?.id || "",
        attivita_id: attivita.attivita_id || "",
        
        data_inizio: dataInizio,
        durata: attivita.durata && attivita.durata !== "Non definita" ? attivita.durata : "", // Usa stringa vuota se `durata` non è valida
      });
      setIsEditing(true);
      setEditId(attivita.id);
      setShowPopup(true);
    };
      
  const applyFilters = () => {
    let filtered = attivitaProgrammate;

    if (filters.reparto_id) {
      const repartoNome = reparti.find((reparto) => reparto.id === parseInt(filters.reparto_id))?.nome;
      if (repartoNome) {
        filtered = filtered.filter((att) => att.reparto === repartoNome);
        const relatedActivities = attivitaDefinite.filter((act) =>
          filtered.some((att) => att.nome_attivita === act.nome)
        );
        setFilteredActivities(relatedActivities);
      }
    }

    if (filters.commessa_id) {
      filtered = filtered.filter((att) => att.numero_commessa.includes(filters.commessa_id));
    }

    if (filters.risorsa_id) {
      filtered = filtered.filter((att) => att.risorsa_id === parseInt(filters.risorsa_id));
    }

    if (filters.attivita_id) {
      filtered = filtered.filter((att) => att.nome_attivita === filters.attivita_id);
    }

    setAttivitaFiltrate(filtered);
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  
    if (name === "reparto_id") {
      const repartoId = parseInt(value, 10);
  
      if (repartoId) {

        // Filtra risorse in base al reparto
        const filteredRisorse = risorse.filter((risorsa) => risorsa.reparto_id === repartoId);
        console.log("Risorse filtrate:", filteredRisorse);
        setFilteredRisorse(filteredRisorse);
  
        // Filtra attività in base al reparto
        const repartoNome = reparti.find((rep) => rep.id === repartoId)?.nome;
        if (repartoNome) {
          const filteredActivities = attivitaDefinite.filter(
            (attivita) => attivita.reparto_id === repartoId
          );
          setFilteredActivities(filteredActivities);
        }
      } else {
        // Se non c'è un reparto selezionato, mostra tutto
        setFilteredRisorse(risorse);
        setFilteredActivities(attivitaDefinite);
      }
  
      // Resetta risorsa e attività selezionate
      setFilters((prev) => ({ ...prev, risorsa_id: "", attivita_id: "" }));
    }
  };
  
  

  const handleCommessaInputChange = (e) => {
    const value = e.target.value;
    setFilters((prev) => ({ ...prev, commessa_id: value }));
    setCommessaSuggestions(
      commesse.filter((commessa) =>
        commessa.numero_commessa.toLowerCase().includes(value.toLowerCase())
      )
    );
  };

  const selectCommessaSuggestion = (numeroCommessa) => {
    setFilters((prev) => ({ ...prev, commessa_id: numeroCommessa }));
    setCommessaSuggestions([]);
  };

  const handleAddNew = () => {
    setFormData({
      commessa_id: "",
      reparto_id: "",
      risorsa_id: "",
      attivita_id: "",
      data_inizio: "",
      durata: "",
    });
    setIsEditing(false);
    setShowPopup(true);
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${process.env.REACT_APP_API_URL}/api/attivita_commessa/${id}`);
      alert("Attività eliminata con successo!");
      fetchOptions();
    } catch (error) {
      console.error("Errore durante l'eliminazione dell'attività:", error);
      alert("Errore durante l'eliminazione dell'attività.");
    }
  };

  const closeSuggestions = (e) => {
    if (!e.target.closest(".suggestions-list") && !e.target.closest("select")) {
      setCommessaSuggestions(false);
    }
  };

  return (
    <div className="container" onClick={closeSuggestions}>
      {loading && (
        <div className="loading-overlay">
          <div className="spinner"></div>
        </div>
      )}
      <button onClick={handleAddNew} className="btn btn-primary create-activity-btn">
          Aggiungi Attività
        </button>
      <div className="header">
      </div>
      <h2>Filtra attività</h2>
      <div className="filters">
        <div className="filter-group">
          <input
            type="text"
            value={filters.commessa_id}
            onChange={handleCommessaInputChange}
            placeholder="Cerca commessa..."
            className="input-field"
          />
          {commessaSuggestions.length > 0 && (
            <ul className="suggestions-list">
              {commessaSuggestions.map((commessa) => (
                <li
                  key={commessa.id}
                  onClick={() => selectCommessaSuggestion(commessa.numero_commessa)}
                >
                  {commessa.numero_commessa}
                </li>
              ))}
            </ul>
          )}
        </div>
  
        <div className="filter-group">
          <select name="reparto_id" value={filters.reparto_id} onChange={handleFilterChange} className="input-field">
            <option value="">Seleziona reparto</option>
            {reparti.map((reparto) => (
              <option key={reparto.id} value={reparto.id}>
                {reparto.nome}
              </option>
            ))}
          </select>
        </div>
  
        <div className="filter-group">
          <select name="risorsa_id" value={filters.risorsa_id} onChange={handleFilterChange} className="input-field">
            <option value="">Seleziona risorsa</option>
            {filteredRisorse.map((risorsa) => (
              <option key={risorsa.id} value={risorsa.id}>
                {risorsa.nome}
              </option>
            ))}
          </select>
        </div>
  
        <div className="filter-group">
          <select name="attivita_id" value={filters.attivita_id} onChange={handleFilterChange}>
            <option value="">Seleziona attivita</option>
            {filteredActivities.map((attivita) => (
              <option key={attivita.nome} value={attivita.nome}>
                {attivita.nome}
              </option>
            ))}
          </select>
        </div>
      </div>
  
      <h2>Elenco Attività Assegnate</h2>
      {loading ? (
        <p>Caricamento in corso...</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Commessa</th>
              <th>Risorsa</th>
              <th>Reparto</th>
              <th>Attività</th>
              <th>Data Inizio</th>
              <th>Durata</th>
              <th>Azioni</th>
            </tr>
          </thead>
          <tbody>
            {attivitaFiltrate.map((attivita) => (
              <tr key={attivita.id}>
                <td>{attivita.numero_commessa}</td>
                <td>{attivita.risorsa}</td>
                <td>{attivita.reparto}</td>
                <td>{attivita.nome_attivita}</td>
                <td>{new Date(attivita.data_inizio).toLocaleDateString()}</td>
                <td>{attivita.durata} giorni</td>
                <td>
                  <button className="btn btn-warning" onClick={() => handleEdit(attivita)}>
                    Modifica
                  </button>
                  <button className="btn btn-danger" onClick={() => handleDelete(attivita.id)}>
                    Elimina
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
  )}
    {/* Popup AttivitaCrea */}
    {showPopup && (
      <AttivitaCrea
        formData={formData}
        setFormData={setFormData}
        isEditing={isEditing}
        setIsEditing={setIsEditing}
        editId={editId}
        fetchAttivita={fetchOptions}
        setShowPopup={setShowPopup}
        commesse={commesse}
        reparti={reparti}
        risorse={risorse}
        attivitaDefinite={attivitaDefinite}
        attivitaConReparto={attivitaConReparto}
      />
    )}
  </div>
);
}
export default AssegnaAttivita;
