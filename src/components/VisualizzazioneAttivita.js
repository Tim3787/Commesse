import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import "./style.css";

const removeDuplicates = (array, key) => {
  return array.filter((item, index, self) => 
    index === self.findIndex((t) => t[key] === item[key])
  );
};


function VisualizzazioneAttivita() {
  const [attivitaList, setAttivitaList] = useState([]);
  const [commesse, setCommesse] = useState([]);
  const [risorse, setRisorse] = useState([]);
  const [filters, setFilters] = useState({
    commessa_id: "",
    risorsa_id: "",
    reparto: "",
    settimana: "",
  });


  // Funzione per recuperare le attività assegnate
  const fetchAttivita = useCallback(async () => {
    try {
      const response = await axios.get("http://localhost:5000/api/attivita_commessa", {
        params: filters,
      });
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
        const commesseResponse = await axios.get("http://localhost:5000/api/commesse");
        const uniqueCommesse = removeDuplicates(commesseResponse.data, 'id');
        console.log("Commesse uniche:", uniqueCommesse);
        setCommesse(uniqueCommesse);
    
        const risorseResponse = await axios.get("http://localhost:5000/api/risorse");
        const uniqueRisorse = removeDuplicates(risorseResponse.data, 'id');
        console.log("Risorse uniche:", uniqueRisorse);
        setRisorse(uniqueRisorse);
    
        fetchAttivita();
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

  return (
    <div className="container">
      <h1>Visualizza le attività assegnate</h1>
      <form onSubmit={handleApplyFilters}>
        <div>
          <label>Commessa:</label>
          <select name="commessa_id" value={filters.commessa_id} onChange={handleFilterChange}>
            <option value="">Tutte</option>
            {commesse.map((commessa) => (
              <option key={commessa.id} value={commessa.id}>
                {commessa.numero_commessa}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label>Risorsa:</label>
          <select name="risorsa_id" value={filters.risorsa_id} onChange={handleFilterChange}>
            <option value="">Tutte</option>
            {risorse.map((risorsa) => (
              <option key={risorsa.id} value={risorsa.id}>
                {risorsa.nome}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label>Reparto:</label>
          <select name="reparto" value={filters.reparto} onChange={handleFilterChange}>
            <option value="">Tutti</option>
            <option value="Software">Software</option>
            <option value="Elettrico">Elettrico</option>
          </select>
        </div>
        <div>
          <label>Settimana:</label>
          <input
            type="date"
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