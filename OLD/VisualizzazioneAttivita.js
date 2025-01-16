import React, { useState, useEffect } from "react";
import axios from "axios";
import "../style.css";

function VisualizzazioneAttivita() {
  const [attivitaList, setAttivitaList] = useState([]);
  const [filteredAttivita, setFilteredAttivita] = useState([]);
  const [commesse, setCommesse] = useState([]);
  const [risorse, setRisorse] = useState([]);
  const [reparti, setReparti] = useState([]);
  const [filteredRisorse, setFilteredRisorse] = useState([]);
  const [filters, setFilters] = useState({
    commessa_id: "",
    risorsa_id: "",
    reparto_id: "",
    settimana: "",
  });
  const [commessaSuggestions, setCommessaSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);

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
    } catch (error) {
      console.error("Errore durante il caricamento dei dati iniziali:", error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = attivitaList;
  
    if (filters.reparto_id) {
      const repartoNome = reparti.find((rep) => rep.id === parseInt(filters.reparto_id, 10))?.nome;
      if (repartoNome) {
        filtered = filtered.filter((att) => att.reparto === repartoNome);
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
  
    setFilteredAttivita(filtered);
  };
  

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  
    if (name === "reparto_id") {
      const repartoId = parseInt(value, 10);
  
      if (repartoId) {
        // Filtra le risorse basandosi sull'ID del reparto
        const filtered = risorse.filter((risorsa) => risorsa.reparto_id === repartoId);
  
        setFilteredRisorse(filtered);
  
        // Filtra le attività basandosi sull'ID del reparto
        const filteredActivities = attivitaList.filter((att) => att.reparto_id === repartoId);

  
        setFilteredAttivita(filteredActivities);
      } else {
        // Mostra tutte le risorse e attività se il reparto non è selezionato
        setFilteredRisorse(risorse);
        setFilteredAttivita(attivitaList);
      }
  
      // Resetta la risorsa selezionata
      setFilters((prev) => ({ ...prev, risorsa_id: "" }));
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

  const closeSuggestions = (e) => {
    if (!e.target.closest(".suggestions-list") && !e.target.closest("select")) {
      setCommessaSuggestions(false);
    }
  };


  return (
    <div className="container" onClick={closeSuggestions}>
      <h1>Visualizza le attività assegnate</h1>
      <div>
        <label>
          Commessa:
          <input
            type="text"
            value={filters.commessa_id}
            onChange={handleCommessaInputChange}
            placeholder="Cerca commessa..."
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
        </label>

        <label>
          Reparto:
          <select name="reparto_id" value={filters.reparto_id} onChange={handleFilterChange}>
            <option value="">Tutti</option>
            {reparti.map((reparto) => (
              <option key={reparto.id} value={reparto.id}>
                {reparto.nome}
              </option>
            ))}
          </select>
        </label>

        <label>
          Risorsa:
          <select name="risorsa_id" value={filters.risorsa_id} onChange={handleFilterChange}>
            <option value="">Tutte</option>
            {filteredRisorse.map((risorsa) => (
              <option key={risorsa.id} value={risorsa.id}>
                {risorsa.nome}
              </option>
            ))}
          </select>
        </label>

        <label>
          Settimana:
          <input
            type="week"
            name="settimana"
            value={filters.settimana}
            onChange={handleFilterChange}
          />
        </label>
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
            </tr>
          </thead>
          <tbody>
  {filteredAttivita.length > 0 ? (
    filteredAttivita.map((attivita) => (
      <tr key={attivita.id}>
        <td>{attivita.numero_commessa}</td>
        <td>{attivita.risorsa}</td>
        <td>{attivita.reparto}</td> {/* Usa il nome del reparto */}
        <td>{attivita.nome_attivita}</td>
        <td>{new Date(attivita.data_inizio).toLocaleDateString()}</td>
        <td>{attivita.durata} giorni</td>
      </tr>
    ))
  ) : (
    <tr>
      <td colSpan="6">Nessuna attività trovata.</td>
    </tr>
  )}
</tbody>
        </table>
      )}
    </div>
  );
}

export default VisualizzazioneAttivita;
