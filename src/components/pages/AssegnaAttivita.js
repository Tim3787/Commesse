import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import "../style.css";
import AttivitaCrea from "../AttivitaCrea";
import logo from"../assets/unitech-packaging.png";
import { usePersistedFilters } from "./usePersistedFilters";

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
  const [showFilters, setShowFilters] = useState(false);
   const [showStateDropdown, setShowStateDropdown] = useState(false); // MULTISEL
   const [showActivityDropdown, setShowActivityDropdown] = useState(false);
   const activityDropdownRef = useRef(null);
const stateDropdownRef = useRef(null);
  const [filters, setFilters]  = usePersistedFilters("savedFilters_AssegnaAttivita", {
    reparto_id: "",
    commessa_id: "",
    risorsa_id: "",
    attivita_id: [], // MULTISEL
    stati: [], // MULTISEL
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
    stato: "",
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
      console.log("Attività selezionata per modifica:", attivita);
  
      // Controlla se `data_inizio` è una data valida
      const dataInizio = attivita.data_inizio && attivita.data_inizio !== "Non specificata"
        ? new Date(attivita.data_inizio).toISOString().split("T")[0]
        : ""; // Usa una stringa vuota se non è valida
    
      setFormData({
        commessa_id: attivita.commessa_id || "",
        reparto_id: reparti.find((reparto) => reparto.nome === attivita.reparto)?.id || "",
        risorsa_id: risorse.find((risorsa) => risorsa.nome === attivita.risorsa)?.id || "",
        attivita_id: attivita.attivita_id || "",
        stato: attivita.stato|| "",
        data_inizio: dataInizio,
        durata: attivita.durata && attivita.durata !== "Non definita" ? attivita.durata : "", // Usa stringa vuota se `durata` non è valida
        descrizione: attivita.descrizione_attivita || "", // Popola il campo descrizione
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

    if (filters.attivita_id.length > 0) {
      filtered = filtered.filter((att) => filters.attivita_id.includes(att.nome_attivita));
    }
    if (filters.stati.length > 0) {
      filtered = filtered.filter((att) => filters.stati.includes(att.stato.toString()));
    }  // MULTISEL
    setAttivitaFiltrate(filtered);
  };

  const handleFilterChange = (e) => {
    const { name, value, type, checked } = e.target;
  
    if (type === "checkbox" && name === "attivita_id") {
      setFilters((prev) => ({
        ...prev,
        attivita_id: checked
          ? [...prev.attivita_id, value] // Aggiungi l'attività selezionata
          : prev.attivita_id.filter((id) => id !== value), // Rimuovi l'attività deselezionata
      }));
    } else if (type === "checkbox" && name === "stati") {
      setFilters((prev) => ({
        ...prev,
        stati: checked
          ? [...prev.stati, value] // Aggiungi lo stato selezionato
          : prev.stati.filter((stato) => stato !== value), // Rimuovi lo stato deselezionato
      }));
    } else if (name === "reparto_id") {
      const repartoId = parseInt(value, 10);
  
      if (repartoId) {
        const filteredRisorse = risorse.filter((risorsa) => risorsa.reparto_id === repartoId);
        setFilteredRisorse(filteredRisorse);
  
        const filteredActivities = attivitaDefinite.filter(
          (attivita) => attivita.reparto_id === repartoId
        );
        setFilteredActivities(filteredActivities);
      } else {
        setFilteredRisorse(risorse);
        setFilteredActivities(attivitaDefinite);
      }
  
      setFilters((prev) => ({
        ...prev,
        reparto_id: value,
        risorsa_id: "",
        attivita_id: [],
      }));
    } else {
      setFilters((prev) => ({
        ...prev,
        [name]: value,
      }));
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
      stato: "",
    });
    setIsEditing(false);
    setShowPopup(true);
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${process.env.REACT_APP_API_URL}/api/attivita_commessa/${id}`);
      //alert("Attività eliminata con successo!");
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


  const toggleFilters = () => {
    setShowFilters((prev) => !prev);
  };

  const toggleStateDropdown = () => {
    setShowStateDropdown((prev) => !prev);
  };// MULTISEL

  const toggleActivityDropdown = () => {
    setShowActivityDropdown((prev) => !prev);
  };



  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        activityDropdownRef.current &&
        !activityDropdownRef.current.contains(e.target)
      ) {
        setShowActivityDropdown(false); // Chiude il dropdown attività
      }
      if (
        stateDropdownRef.current &&
        !stateDropdownRef.current.contains(e.target)
      ) {
        setShowStateDropdown(false); // Chiude il dropdown stati
      }
    };
  
    document.addEventListener("click", handleClickOutside);
  
    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, []);
  

  return (
    <div className="container" onClick={closeSuggestions}>
      {loading && (
        <div className="loading-overlay">
            <img src={logo} alt="Logo"  className="logo-spinner"/>
        </div>
      )}

      <div className="header">
      <h1>Attività</h1>
      </div>
      <button onClick={handleAddNew} className="btn btn-primary create-activity-btn">
          Aggiungi Attività
        </button>
      <button onClick={toggleFilters} className="btn btn-filter">
          {showFilters ? "Nascondi Filtri" : "Mostra Filtri"}
        </button>
        {showFilters && (
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
  
        <div className="filter-group" ref={activityDropdownRef}>
  <label onClick={toggleActivityDropdown} className="dropdown-label">
    Seleziona attività
  </label>
  {showActivityDropdown && (
    <div className="dropdown-menu">
      {filteredActivities.map((attivita) => (
        <label key={attivita.nome}>
          <input
            type="checkbox"
            name="attivita_id"
            value={attivita.nome}
            checked={filters.attivita_id.includes(attivita.nome)}
            onChange={handleFilterChange}
          />
          {attivita.nome}
        </label>
      ))}
    </div>
  )}
</div>

        <div className="filter-group" ref={stateDropdownRef}>
  <label onClick={toggleStateDropdown} className="dropdown-label">
    Seleziona stato
  </label>
  {showStateDropdown && (
    <div className="dropdown-menu">
      {["0", "1", "2"].map((value) => (
        <label key={value}>
          <input
            type="checkbox"
            name="stati"
            value={value}
            checked={filters.stati.includes(value)}
            onChange={handleFilterChange}
          />
          {value === "0" && "Non iniziata"}
          {value === "1" && "Iniziata"}
          {value === "2" && "Completata"}
        </label>
      ))}
    </div>
  )}
</div>

      </div>
    )}
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
              <th>Stato</th>
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
                <td>{attivita.data_inizio ? new Date(attivita.data_inizio).toLocaleDateString() : "Non definita"}</td>
                <td>{attivita.durata} giorni</td>
                <td>
                    {attivita.stato === 0 && "Non iniziata"}
                    {attivita.stato === 1 && "Iniziata"}
                    {attivita.stato === 2 && "Completata"}
                  </td>
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
