import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import "../style.css";
import logo from"../assets/unitech-packaging.png";

function StatoAvanzamentoSoftware() {
  const [commesse, setCommesse] = useState([]);
  const [filteredCommesse, setFilteredCommesse] = useState([]);
  const [clienteFilter, setClienteFilter] = useState("");
  const [tipoMacchinaFilter, setTipoMacchinaFilter] = useState("");
  const [commessaFilter, setCommessaFilter] = useState("");
  const [loading, setLoading] = useState(false);
  const [statiSoftware, setStatiSoftware] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [sortOrder, setSortOrder] = useState("numero_commessa");
  const [sortDirection, setSortDirection] = useState("asc");
  const [showClienteSuggestions, setShowClienteSuggestions] = useState(false);
  const [showTipoMacchinaSuggestions, setShowTipoMacchinaSuggestions] = useState(false);
  const [showCommessaSuggestions, setShowCommessaSuggestions] = useState(false);
  const [statoFilter, setStatoFilter] = useState(""); 
  const [suggestionsCliente, setSuggestionsCliente] = useState([]);
  const [suggestionsTipoMacchina, setSuggestionsTipoMacchina] = useState([]);
  const [suggestionsCommessa, setSuggestionsCommessa] = useState([]);
  const [showOrder, setShowOrder] = useState(false);
  const [dateSortDirection, setDateSortDirection] = useState("crescente"); 
  const dropdownRef = useRef(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [filters, setFilters] = useState({
    commessa_id: "",
    risorsa_id: "",
    reparto_id: "",
    attivita_id: "",
    settimana: "",
    stati: [], // Assicurati che sia inizializzato come array vuoto
  });

  filters.stati
  .filter((stato) => stato !== undefined && stato !== null) // Filtra elementi non validi
  .map((stato) => stato.toString());

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Recupera le commesse
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/commesse`);
        const parsedCommesse = response.data.map((commessa) => ({
          ...commessa,
          stati_avanzamento: typeof commessa.stati_avanzamento === "string"
            ? JSON.parse(commessa.stati_avanzamento)
            : commessa.stati_avanzamento,
        }));
        setCommesse(parsedCommesse);

        // Recupera gli stati software
        const statiResponse = await axios.get(`${process.env.REACT_APP_API_URL}/api/stati-avanzamento`);
        setStatiSoftware(statiResponse.data.filter((stato) => stato.reparto_id === 1)); // Filtra solo stati software
      } catch (error) {
        console.error("Errore durante il recupero dei dati:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);


  
  useEffect(() => {
    // Applica i filtri, inclusi gli stati multipli
    let filtered = commesse.filter((commessa) => {
      // Filtra per stati selezionati
      if (filters.stati.length > 0) {
        return commessa.stati_avanzamento.some((reparto) =>
          reparto.stati_disponibili.some(
            (stato) => filters.stati.includes(stato.stato_id.toString()) && stato.isActive
          )
        );
      }
      return true;
    });

    // Filtra per altri criteri
    filtered = filtered.filter((commessa) => {
      return (
        commessa.numero_commessa.toString().includes(commessaFilter) &&
        commessa.cliente.toLowerCase().includes(clienteFilter.toLowerCase()) &&
        commessa.tipo_macchina.toLowerCase().includes(tipoMacchinaFilter.toLowerCase())
      );
    });

    setFilteredCommesse(filtered);
  }, [filters, commessaFilter, clienteFilter, tipoMacchinaFilter, commesse]);
  

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
  

  const handleFilterChange = (e) => {
  const { name, value, type, checked } = e.target;

  if (type === "checkbox" && name === "stati") {
    setFilters((prev) => {
      const newStati = checked
        ? [...prev.stati, value] // Aggiungi lo stato selezionato
        : prev.stati.filter((stato) => stato !== value); // Rimuovi lo stato deselezionato
      return {
        ...prev,
        stati: newStati,
      };
    });
  } else {
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  }
};

  const handleCommessaChange = (e) => setCommessaFilter(e.target.value);
  const handleClienteChange = (e) => setClienteFilter(e.target.value);
  const handleTipoMacchinaChange = (e) => setTipoMacchinaFilter(e.target.value);

  const handleStatoChange = async (commessaId, repartoId, newStatoId) => {
    try {
      // Aggiorna lo stato nel backend
      await axios.put(`${process.env.REACT_APP_API_URL}/api/commesse/${commessaId}/reparti/${repartoId}/stato`, {
        stato_id: newStatoId,
        is_active: true,
      });
  
      // Aggiorna lo stato locale senza eliminare le commesse
      const updatedCommesse = commesse.map((commessa) => {
        if (commessa.commessa_id === commessaId) {
          return {
            ...commessa,
            stati_avanzamento: commessa.stati_avanzamento.map((reparto) => {
              if (reparto.reparto_id === repartoId) {
                return {
                  ...reparto,
                  stati_disponibili: reparto.stati_disponibili.map((stato) => ({
                    ...stato,
                    isActive: stato.stato_id === newStatoId,
                  })),
                };
              }
              return reparto;
            }),
          };
        }
        return commessa;
      });
  
      setCommesse(updatedCommesse);
    } catch (error) {
      console.error("Errore durante l'aggiornamento dello stato:", error);
      alert("Errore durante l'aggiornamento dello stato.");
    }
  };
  
  const toggleFilters = () => setShowFilters((prev) => !prev);
  const handleSortChange = (e) => {
    const { value } = e.target;
    if (value === sortOrder) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortOrder(value);
      setSortDirection("asc");
    }
  };
  const toggleOrder = () => {
    setShowOrder((prev) => !prev);
  };

  const toggleDropdown = () => setShowDropdown((prev) => !prev);

  const closeSuggestions = (e) => {
    if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
      setShowDropdown(false);
    }
  };
  const handleSelectCliente = (cliente) => {
    setClienteFilter(cliente);
    setShowClienteSuggestions(false);
  };
  const handleDateSortChange = (e) => {
    setDateSortDirection(e.target.value);
  };
  useEffect(() => {
    console.log("Stati selezionati:", filters.stati);
  }, [filters.stati]);

  return (
    <div className="container" onClick={closeSuggestions}>
    {loading && (
      <div className="loading-overlay">
          <img src={logo} alt="Logo"  className="logo-spinner"/>
      </div>
    )}
    <div className="header">
    <h1>Stati avanzamento software</h1>
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
        <div className="filter-group" ref={dropdownRef}>
            <label onClick={toggleDropdown} className="dropdown-label">
              Filtra per Stati
            </label>
            {showDropdown && (
              <div className="dropdown-menu">
                {statiSoftware?.map((stato) => (
  <label key={stato?.stato_id}>
    <input
      type="checkbox"
      name="stati"
      value={stato?.stato_id?.toString()} // Usa sempre stato_id come stringa
      checked={filters.stati.includes(stato?.stato_id?.toString())} // Controlla inclusione corretta
      onChange={handleFilterChange} // Gestione del cambiamento
    />
    {stato?.nome_stato || "Sconosciuto"}
  </label>
))}
              </div>
            )}
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
            <th>Stato Software</th>
          </tr>
        </thead>
        <tbody>
          {filteredCommesse.map((commessa) => {
            const softwareReparto = commessa.stati_avanzamento.find(
              (reparto) => reparto.reparto_id === 1 // ID del reparto software
            );
            const activeStato = softwareReparto?.stati_disponibili.find((stato) => stato.isActive);
            return (
              <tr key={commessa.commessa_id}>
                <td>{commessa.numero_commessa}</td>
                <td>{commessa.cliente}</td>
                <td>{commessa.tipo_macchina}</td>
                <td>
                  {commessa.data_consegna
                    ? new Date(commessa.data_consegna).toLocaleDateString()
                    : "N/A"}
                </td>
                <td>
                  <select
                    value={activeStato?.stato_id || ""}
                    onChange={(e) =>
                      handleStatoChange(commessa.commessa_id, 1, parseInt(e.target.value, 10))
                    }
                  >
                    <option value="">Seleziona uno stato</option>
                    {statiSoftware.map((stato) => (
                      <option key={stato.id} value={stato.id}>
                        {stato.nome_stato}
                      </option>
                    ))}
                  </select>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default StatoAvanzamentoSoftware;
