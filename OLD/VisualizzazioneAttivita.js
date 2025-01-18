import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import "../style.css";
import logo from"../assets/unitech-packaging.png";

function VisualizzazioneAttivita() {
  const [attivitaList, setAttivitaList] = useState([]);
  const [filteredAttivita, setFilteredAttivita] = useState([]);
  const [commesse, setCommesse] = useState([]);
  const [risorse, setRisorse] = useState([]);
  const [reparti, setReparti] = useState([]);
  const [attivitaDefinite, setAttivitaDefinite] = useState([]);
  const [filteredRisorse, setFilteredRisorse] = useState([]);
  const [filteredActivities, setFilteredActivities] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false); // MULTISEL
  const [filters, setFilters] = useState({
    commessa_id: "",
    risorsa_id: "",
    reparto_id: "",
    attivita_id: [], // MULTISEL
    settimana: "",
    stati: [], // MULTISEL
  });
  const [commessaSuggestions, setCommessaSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);
  
  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [filters, attivitaList]);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [commesseResponse, risorseResponse, repartiResponse, attivitaResponse] = await Promise.all([
        axios.get(`${process.env.REACT_APP_API_URL}/api/commesse`),
        axios.get(`${process.env.REACT_APP_API_URL}/api/risorse`),
        axios.get(`${process.env.REACT_APP_API_URL}/api/reparti`),
        axios.get(`${process.env.REACT_APP_API_URL}/api/attivita_commessa`),
      ]);

      setCommesse(commesseResponse.data);
      setRisorse(risorseResponse.data);
      setReparti(repartiResponse.data);
      setAttivitaList(attivitaResponse.data);
      setFilteredAttivita(attivitaResponse.data);
      setFilteredRisorse(risorseResponse.data);

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

  const applyFilters = () => {
    let filtered = attivitaList;

    if (filters.reparto_id) {
      const repartoId = parseInt(filters.reparto_id, 10);
      const repartoNome = reparti.find((rep) => rep.id === repartoId)?.nome;
      if (repartoNome) {
        filtered = filtered.filter((att) => att.reparto === repartoNome);
        const relatedActivities = attivitaDefinite.filter(
          (act) => filtered.some((att) => att.nome_attivita === act.nome)
        );
        setFilteredActivities(relatedActivities);
      }
    }

    if (filters.risorsa_id) {
      filtered = filtered.filter((att) => att.risorsa_id === parseInt(filters.risorsa_id, 10));
    }

    if (filters.commessa_id) {
      filtered = filtered.filter((att) => att.numero_commessa.includes(filters.commessa_id));
    }

    if (filters.settimana) {
      const [year, week] = filters.settimana.split("-W");
      filtered = filtered.filter((att) => {
        const startDate = new Date(att.data_inizio);
        const startWeek = getWeekNumber(startDate);
        return startDate.getFullYear() === parseInt(year, 10) && startWeek === parseInt(week, 10);
      });
    }

    if (filters.attivita_id.length > 0) {
      filtered = filtered.filter((att) => filters.attivita_id.includes(att.nome_attivita));
    }

    if (filters.stati.length > 0) {
      filtered = filtered.filter((att) => filters.stati.includes(att.stato.toString()));
    }  

filtered.sort((a, b) => new Date(a.data_inizio) - new Date(b.data_inizio));

    setFilteredAttivita(filtered);
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

  const getWeekNumber = (date) => {
    const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
  };

  const toggleFilters = () => {
    setShowFilters((prev) => !prev);
  };
  const handleOutsideClick = (e) => {
    if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
      setShowDropdown(false);
    }
  };
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
  
    document.addEventListener("click", handleClickOutside);
  
    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, []);
  


  return (
    <div className="container">
  
      {loading && (
        <div className="loading-overlay">
            <img src={logo} alt="Logo"  className="logo-spinner"/>
        </div>
      )}
      <div className="header">
      <h1>Attività</h1>
      </div>
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
            placeholder="Cerca per Numero Commessa"
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
           <select name="reparto_id" value={filters.reparto_id} onChange={handleFilterChange}>
             <option value="">Seleziona reparto</option>
             {reparti.map((reparto) => (
               <option key={reparto.id} value={reparto.id}>
                 {reparto.nome}
               </option>
             ))}
           </select>
          </div>
          <div className="filter-group">
           <select name="risorsa_id" value={filters.risorsa_id} onChange={handleFilterChange}>
             <option value="">Seleziona risorsa</option>
             {filteredRisorse.map((risorsa) => (
               <option key={risorsa.id} value={risorsa.id}>
                 {risorsa.nome}
               </option>
             ))}
           </select>
          </div>
          <div className="filter-group" ref={dropdownRef}>
  <label onClick={toggleDropdown} className="dropdown-label">
    Seleziona attività
  </label>
  {showDropdown && (
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
             <div className="filter-group" ref={dropdownRef}>
            <label className="dropdown-label" onClick={() => setShowDropdown((prev) => !prev)}>
              Seleziona stato
            </label>
            {showDropdown && (
              <div className="dropdown-menu">
                <label>
                  <input
                    type="checkbox"
                    name="stati"
                    value="0"
                    checked={filters.stati.includes("0")}
                    onChange={handleFilterChange}
                  />
                  Non iniziata
                </label>
                <label>
                  <input
                    type="checkbox"
                    name="stati"
                    value="1"
                    checked={filters.stati.includes("1")}
                    onChange={handleFilterChange}
                  />
                  Iniziata
                </label>
                <label>
                  <input
                    type="checkbox"
                    name="stati"
                    value="2"
                    checked={filters.stati.includes("2")}
                    onChange={handleFilterChange}
                  />
                  Completata
                </label>
              </div>
            )}
          </div>

          <div className="filter-group">
          <input
            type="week"
            name="settimana"
            value={filters.settimana}
            onChange={handleFilterChange}
             className="input-field"
          />
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
            </tr>
          </thead>
          <tbody>
            {filteredAttivita.length > 0 ? (
              filteredAttivita.map((attivita) => (
                <tr key={attivita.id}>
                  <td>{attivita.numero_commessa}</td>
                  <td>{attivita.risorsa}</td>
                  <td>{attivita.reparto}</td>
                  <td>{attivita.nome_attivita}</td>
                  <td>{new Date(attivita.data_inizio).toLocaleDateString()}</td>
                  <td>{attivita.durata} giorni</td>
                  <td>
                    {attivita.stato === 0 && "Non iniziata"}
                    {attivita.stato === 1 && "Iniziata"}
                    {attivita.stato === 2 && "Completata"}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7">Nessuna attività trovata.</td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default VisualizzazioneAttivita;
