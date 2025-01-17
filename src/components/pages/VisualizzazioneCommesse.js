import React, { useState, useEffect } from "react";
import axios from "axios";
import "../style.css";
import CommessaDettagli from "../CommessaDettagli";  

function VisualizzazioneCommesse() {
  const [commesse, setCommesse] = useState([]); 
  const [filteredCommesse, setFilteredCommesse] = useState([]); 
  const [clienteFilter, setClienteFilter] = useState("");
  const [tipoMacchinaFilter, setTipoMacchinaFilter] = useState("");
  const [commessaFilter, setCommessaFilter] = useState(""); 
  const [sortOrder, setSortOrder] = useState("numero_commessa"); 
  const [sortDirection, setSortDirection] = useState("asc"); 
  const [dateSortDirection, setDateSortDirection] = useState("crescente"); 
  const [showClienteSuggestions, setShowClienteSuggestions] = useState(false);
  const [showTipoMacchinaSuggestions, setShowTipoMacchinaSuggestions] = useState(false);
  const [showCommessaSuggestions, setShowCommessaSuggestions] = useState(false);
  const [selectedCommessa, setSelectedCommessa] = useState(null);
  const [suggestionsCliente, setSuggestionsCliente] = useState([]);
  const [suggestionsTipoMacchina, setSuggestionsTipoMacchina] = useState([]);
  const [suggestionsCommessa, setSuggestionsCommessa] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showOrder, setShowOrder] = useState(false);
  const [statoFilter, setStatoFilter] = useState(""); 
  const [statiCommessa, setStatiCommessa] = useState([]); 
  
  useEffect(() => {
    const fetchCommesse = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/commesse`);
        setCommesse(response.data); 
        setFilteredCommesse(response.data); 
      } catch (error) {
        console.error("Errore durante il recupero delle commesse:", error);
      }finally {
        setLoading(false);
      }
    };
    fetchCommesse();

    const fetchStati = async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/stati-avanzamento`);
        setStatiAvanzamento(response.data); 
      } catch (error) {
        console.error("Errore durante il recupero degli stati avanzamento:", error);
      }
    };
    
    const fetchReparti = async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/reparti`);
        setReparti(response.data); 
      } catch (error) {
        console.error("Errore durante il recupero dei reparti:", error);
      }
    };

    const fetchStatiCommessa = async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/stato-commessa`);
        setStatiCommessa(response.data);
      } catch (error) {
        console.error("Errore durante il recupero degli stati della commessa:", error);
      }
    };

    fetchCommesse();
    fetchStati();
    fetchReparti();
  fetchStatiCommessa();
  }, []);

  useEffect(() => {
    updateFilteredCommesse();
  }, [statoFilter]);
  

  useEffect(() => {
    // Filtriamo le commesse in base ai filtri applicati
    const filtered = commesse.filter((commessa) => {
      return (
        commessa.numero_commessa.toString().includes(commessaFilter) &&
        commessa.cliente.toLowerCase().includes(clienteFilter.toLowerCase()) &&
        commessa.tipo_macchina.toLowerCase().includes(tipoMacchinaFilter.toLowerCase())
      );
    });
  
    // Suggerimenti per Cliente, Tipo Macchina e Commessa
    const clienteSuggestions = commesse
      .map((commessa) => commessa.cliente)
      .filter((value, index, self) => self.indexOf(value) === index); 
  
    const tipoMacchinaSuggestions = commesse
      .map((commessa) => commessa.tipo_macchina)
      .filter((value, index, self) => self.indexOf(value) === index); 
    const commessaSuggestions = commesse
      .map((commessa) => commessa.numero_commessa)
      .filter((value, index, self) => self.indexOf(value) === index); 
  
    // Imposta i suggerimenti per ogni filtro
    setSuggestionsCliente(clienteSuggestions);
    setSuggestionsTipoMacchina(tipoMacchinaSuggestions);
    setSuggestionsCommessa(commessaSuggestions);
  
    // Imposta le commesse filtrate
    setFilteredCommesse(filtered);
  
  }, [commessaFilter, clienteFilter, tipoMacchinaFilter, commesse]);
  

  // Funzione per applicare l'ordinamento
  const sortCommesse = (commesse) => {
    return commesse.sort((a, b) => {
      if (sortOrder === "numero_commessa") {
        return sortDirection === "asc"
          ? a.numero_commessa - b.numero_commessa
          : b.numero_commessa - a.numero_commessa;
      } else if (sortOrder === "desc") {
        if (dateSortDirection === "crescente") {
          return new Date(a.data_consegna) - new Date(b.data_consegna);
        } else {
          return new Date(b.data_consegna) - new Date(a.data_consegna);
        }
      }
      return 0;
    });
  };
  // Funzione per applicare i filtri
  const applyFilters = () => {
    return commesse.filter((commessa) => {
      const matchesCommessa = commessa.numero_commessa.toString().includes(commessaFilter);
      const matchesCliente = commessa.cliente.toLowerCase().includes(clienteFilter.toLowerCase());
      const matchesTipoMacchina = commessa.tipo_macchina.toLowerCase().includes(tipoMacchinaFilter.toLowerCase());
      const matchesStato = !statoFilter || commessa.stato === parseInt(statoFilter, 10); 
  
      return matchesCommessa && matchesCliente && matchesTipoMacchina && matchesStato;
    });
  };
  // Funzione per gestire l'aggiornamento dei dati filtrati e ordinati
  const updateFilteredCommesse = () => {
    let filtered = applyFilters(); 
    let sorted = sortCommesse(filtered);
    setFilteredCommesse(sorted);
  };
  useEffect(() => {
    updateFilteredCommesse();
  }, [commessaFilter, clienteFilter, tipoMacchinaFilter, statoFilter, commesse, sortOrder, sortDirection, dateSortDirection]);
  

  
  // Funzioni di selezione per i filtri
  const handleCommessaChange = (event) => {
    setCommessaFilter(event.target.value);
    setShowCommessaSuggestions(true);
  };

  const handleClienteChange = (event) => {
    setClienteFilter(event.target.value);
    setShowClienteSuggestions(true);
  };

  const handleTipoMacchinaChange = (event) => {
    setTipoMacchinaFilter(event.target.value);
    setShowTipoMacchinaSuggestions(true);
  };



  const handleSelectCommessa = (commessa) => {
    setCommessaFilter(commessa);
    setShowCommessaSuggestions(false);
  };

  const handleSelectCliente = (cliente) => {
    setClienteFilter(cliente);
    setShowClienteSuggestions(false);
  };

  const handleSelectTipoMacchina = (tipoMacchina) => {
    setTipoMacchinaFilter(tipoMacchina);
    setShowTipoMacchinaSuggestions(false);
  };

  const handleStatoChange = (event) => {
    setStatoFilter(event.target.value);
  };


  const closeSuggestions = (e) => {
    if (!e.target.closest(".suggestions-list") && !e.target.closest("select")) {
      setShowClienteSuggestions(false);
      setShowTipoMacchinaSuggestions(false);
      setShowCommessaSuggestions(false);
    }
  };

  const handleSortChange = (e) => {
    const { value } = e.target;
    if (value === sortOrder) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortOrder(value);
      setSortDirection("asc");
    }
  };

  const handleDateSortChange = (e) => {
    setDateSortDirection(e.target.value);
  };

  const handleCommessaClick = (commessa) => {
    setSelectedCommessa(commessa);
  };

  const handleClosePopup = () => {
    setSelectedCommessa(null);
  };



  const toggleFilters = () => {
    setShowFilters((prev) => !prev);
  };

  const toggleOrder = () => {
    setShowOrder((prev) => !prev);
  };


const getStatoNome = (id) => {
  const stato = statiCommessa.find(stato => stato.id === id);
  return stato ? stato.nome_stato : "Non assegnato"; 
};


  return (
    <div className="container" onClick={closeSuggestions}>
      {loading && (
        <div className="loading-overlay">
          <div className="spinner"></div>
        </div>
      )}
      <div className="header">
      <h1>Commesse</h1>
      </div>
      <button onClick={toggleFilters} className="btn btn-filter">
          {showFilters ? "Nascondi Filtri" : "Mostra Filtri"}
        </button>

      {showFilters && (
      <div className="filters">
        <div className="filter-group">
        <input
          type="text"
          placeholder="Cerca per Numero Commessa"
          value={commessaFilter}
          onChange={handleCommessaChange}
          onClick={(e) => e.stopPropagation()}
          className="input-field"
        />
        {showCommessaSuggestions && (
          <ul className="suggestions-list">
            {suggestionsCommessa
              .filter((commessa) => commessa.toString().includes(commessaFilter))
              .map((commessa, index) => (
                <li key={index} onClick={() => handleSelectCommessa(commessa)}>
                  {commessa}
                </li>
              ))}
          </ul>
        )}
        </div>

        <div className="filter-group">
        <input
          type="text"
          placeholder="Filtra per Cliente"
          value={clienteFilter}
          onChange={handleClienteChange}
          onClick={(e) => e.stopPropagation()}
          className="input-field"
        />
        {showClienteSuggestions && (
          <ul className="suggestions-list">
            {suggestionsCliente
              .filter((cliente) => cliente.toLowerCase().includes(clienteFilter.toLowerCase()))
              .map((cliente, index) => (
                <li key={index} onClick={() => handleSelectCliente(cliente)}>
                  {cliente}
                </li>
              ))}
          </ul>
        )}
        </div>
        <div className="filter-group">
        <input
          type="text"
          placeholder="Filtra per Tipo Macchina"
          value={tipoMacchinaFilter}
          onChange={handleTipoMacchinaChange}
          onClick={(e) => e.stopPropagation()}
          className="input-field"
        />
        {showTipoMacchinaSuggestions && (
          <ul className="suggestions-list">
            {suggestionsTipoMacchina
              .filter((tipo) => tipo.toLowerCase().includes(tipoMacchinaFilter.toLowerCase()))
              .map((tipo, index) => (
                <li key={index} onClick={() => handleSelectTipoMacchina(tipo)}>
                  {tipo}
                </li>
              ))}
          </ul>
        )}
        </div>
        <div className="filter-group">
        <select onChange={handleStatoChange} value={statoFilter}>
          <option value="">Filtra per Stato</option>
          {statiCommessa.map((stato) => (
            <option key={stato.id} value={stato.id}>
              {stato.nome_stato}
            </option>
          ))}
        </select>
        </div>
  </div>
          )}
      <button onClick={toggleOrder} className="btn btn-filter">
          {showOrder ? "Nascondi Ordine" : "Mostra Ordine"}
        </button>
        {showOrder && (
      <div className="filters">
      <div className="filter-group">
        <select onChange={handleSortChange} value={sortOrder}>
          <option value="numero_commessa">Ordina per: Numero Commessa</option>
          <option value="desc">Ordina per: Data Consegna</option>
        </select>
      </div>
      <div className="filter-group">
        <select onChange={handleSortChange} value={sortDirection}>
          <option value="asc">Numero commessa crescente</option>
          <option value="desc">Numero commessa decrescente</option>
        </select>
      </div>
      <div className="filter-group">
        <select onChange={handleDateSortChange} value={dateSortDirection}>
          <option value="crescente">Data di consegna crescente</option>
          <option value="decrescente">Data di consegna decrescente</option>
        </select>
      </div>
      </div>
              )}
      <table>
        <thead>
          <tr>
            <th>Numero Commessa</th>
            <th>Cliente</th>
            <th>Tipo Macchina</th>
            <th>Data Consegna</th>
            <th>Stato</th>
          </tr>
        </thead>
        <tbody>
          {filteredCommesse.map((commessa) => (
            <tr key={commessa.commessa_id} onClick={() => handleCommessaClick(commessa)}>
              <td>{commessa.numero_commessa}</td>
              <td>{commessa.cliente}</td>
              <td>{commessa.tipo_macchina}</td>
              <td>{commessa.data_consegna ? new Date(commessa.data_consegna).toLocaleDateString() : "N/A"}</td>
              <td>{getStatoNome(commessa.stato)}</td> 
            </tr>
          ))}
        </tbody>
      </table>

      {selectedCommessa && <CommessaDettagli commessa={selectedCommessa} onClose={handleClosePopup} />}
    </div>
  );
}

export default VisualizzazioneCommesse;
