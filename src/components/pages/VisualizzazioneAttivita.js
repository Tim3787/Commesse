import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import "../style.css";

const removeDuplicates = (array, key) => {
  return array.filter((item, index, self) => 
    index === self.findIndex((t) => t[key] === item[key])
  );
};

function VisualizzazioneAttivita() {
  const [attivitaList, setAttivitaList] = useState([]);
  const [commesse, setCommesse] = useState([]);
  const [risorse, setRisorse] = useState([]);
  const [reparti, setReparti] = useState([]);
  const [filters, setFilters] = useState({
    commessa_id: "",
    risorsa_id: "",
    reparto_id: "", // Aggiunto filtro per reparto
    settimana: "",
  });

  // Funzione per recuperare le attività assegnate
  const fetchAttivita = useCallback(async () => {
    try {
      const params = {};
  
      // Aggiungi solo i filtri non vuoti
      if (filters.commessa_id) params.commessa_id = filters.commessa_id;
      if (filters.risorsa_id) params.risorsa_id = filters.risorsa_id;
      if (filters.reparto_id) params.reparto_id = filters.reparto_id;
      if (filters.settimana) params.settimana = filters.settimana;
  
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/attivita_commessa`, { params });
      const filteredData = response.data.filter((attivita) => attivita.risorsa_id !== null);
      console.log("Dati ricevuti e filtrati:", filteredData);
      setAttivitaList(filteredData);
    } catch (error) {
      console.error("Errore durante il recupero delle attività assegnate:", error);
    }
  }, [filters]);


  // Recupera i dati iniziali
  useEffect(() => {
  const fetchInitialData = async () => {
    try {
      const [commesseResponse, risorseResponse, repartiResponse] = await Promise.all([
        axios.get(`${process.env.REACT_APP_API_URL}/api/commesse`),
        axios.get(`${process.env.REACT_APP_API_URL}/api/risorse`),
        axios.get(`${process.env.REACT_APP_API_URL}/api/reparti`),
      ]);

      setCommesse(removeDuplicates(commesseResponse.data, 'id'));
      setRisorse(removeDuplicates(risorseResponse.data, 'id'));
      setReparti(removeDuplicates(repartiResponse.data, 'id'));

      fetchAttivita(); // Recupera le attività con i dati aggiornati
    } catch (error) {
      console.error("Errore durante il recupero dei dati iniziali:", error);
    }
  };

  fetchInitialData();
}, [fetchAttivita]);

  // Gestione del cambio nei filtri
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prevFilters) => ({ ...prevFilters, [name]: value }));
  };

  // Applicazione dei filtri
  const handleApplyFilters = (e) => {
    e.preventDefault();
    fetchAttivita();
  };

  // Filtraggio dinamico delle risorse in base al reparto selezionato
  const getFilteredRisorse = () => {
    if (filters.reparto_id) {
      return risorse.filter((risorsa) => risorsa.reparto_id === parseInt(filters.reparto_id));
    }
    return risorse;
  };

  return (
    <div className="container">
      <h1>Visualizza le attività assegnate</h1>
      <form onSubmit={handleApplyFilters}>
        <div>
          <select name="commessa_id" value={filters.commessa_id} onChange={handleFilterChange}>
            <option value="">Filtra commesse</option>
            {commesse.map((commessa) => (
              <option key={commessa.id} value={commessa.id}>
                {commessa.numero_commessa}
              </option>
            ))}
          </select>
        </div>

        {/* Selezione del Reparto (prima di Risorsa) */}
        <div>
          <select name="reparto_id" value={filters.reparto_id} onChange={handleFilterChange}>
            <option value="">Filtra reparto</option>
            {reparti.map((reparto) => (
              <option key={reparto.id} value={reparto.id}>
                {reparto.nome}
              </option>
            ))}
          </select>
        </div>

        {/* Selezione della Risorsa in base al reparto */}
        <div>
        <select name="risorsa_id" value={filters.risorsa_id} onChange={handleFilterChange}>
  <option value="">Filtra risorse</option>
  {getFilteredRisorse().map((risorsa) => (
    <option key={risorsa.id} value={risorsa.id}>
      {risorsa.nome}
    </option>
  ))}
</select>
        </div>

        <div>
  <label>Settimana:</label>
  <input
    type="week"
    name="settimana"
    value={filters.settimana}
    onChange={handleFilterChange}
  />
</div>
        <button type="submit">Applica Filtri</button>
      </form>

      <h2>Elenco Attività Assegnate</h2>
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
          {attivitaList.length > 0 ? (
            attivitaList.map((attivita, index) => (
              <tr key={`${attivita.id}-${index}`}>
                <td>{attivita.numero_commessa}</td>
                <td>{attivita.risorsa}</td>
                <td>{attivita.reparto}</td>
                <td>{attivita.nome_attivita}</td>
                <td>{new Date(attivita.data_inizio).toLocaleDateString()}</td>
                <td>{attivita.durata} giorni</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="6" style={{ textAlign: "center" }}>
                Nessuna attività assegnata trovata.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export default VisualizzazioneAttivita;
