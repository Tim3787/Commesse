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
  const [reparti, setReparti] = useState([])
  const [statiAvanzamento, setStatiAvanzamento] = useState([]);
  const [statoFilter, setStatoFilter] = useState(""); // NUOVO FILTRO STATO
  const [statiCommessa, setStatiCommessa] = useState([]);  // NUOVO STATO
  
  useEffect(() => {
    const fetchCommesse = async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/commesse`);
        setCommesse(response.data); 
        setFilteredCommesse(response.data); 
      } catch (error) {
        console.error("Errore durante il recupero delle commesse:", error);
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
        console.log("Stati commessa ricevuti:", response.data); // Aggiungi questo log
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
  

  const applyFilters = (commesse) => {
    console.log("Filtro stato:", statoFilter);  // Verifica che statoFilter venga aggiornato
    return commesse.filter((commessa) => {
      const statoCommessa = commessa.stato;
      console.log("Stato commessa:", statoCommessa); // Verifica il valore di statoCommessa
      return (
        commessa.numero_commessa.toString().includes(commessaFilter) &&
        commessa.cliente.toLowerCase().includes(clienteFilter.toLowerCase()) &&
        commessa.tipo_macchina.toLowerCase().includes(tipoMacchinaFilter.toLowerCase()) &&
        (statoFilter === "" || statoCommessa === parseInt(statoFilter)) // Condizione per filtro stato
      );
    });
  };
  

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

  // Funzione per gestire l'aggiornamento dei dati filtrati e ordinati
  const updateFilteredCommesse = () => {
    let filtered = applyFilters(commesse);
    let sorted = sortCommesse(filtered);
    setFilteredCommesse(sorted);
  };

  useEffect(() => {
    updateFilteredCommesse();
  }, [commessaFilter, clienteFilter, tipoMacchinaFilter, commesse, sortOrder, sortDirection, dateSortDirection]);

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

  const handleStatoChange = (event) => {
    setStatoFilter(event.target.value); // Aggiorna il filtro stato
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

  
  // Funzione per ottenere il nome del reparto per reparto_id
  const getRepartoNome = (repartoId) => {
    const reparto = reparti.find(r => r.id === repartoId);
    return reparto ? reparto.nome : "Sconosciuto"; 
  };

// Funzione per ottenere gli stati raggruppati per reparto
const getStatiPerReparto = () => {
  const gruppiPerReparto = statiAvanzamento.reduce((acc, stato) => {
    const nomeReparto = getRepartoNome(stato.reparto_id); 
    if (!acc[nomeReparto]) {
      acc[nomeReparto] = { reparto: nomeReparto, stati: [] };
    }
    acc[nomeReparto].stati.push(stato); 
    return acc;
    
  }, {});

  // Ordiniamo i gruppi per reparto
  const repartiOrdinati = Object.keys(gruppiPerReparto).sort();

  return repartiOrdinati.map((nomeReparto) => ({
    reparto: nomeReparto,
    stati: gruppiPerReparto[nomeReparto].stati,
  }));
};

// Funzione per ottenere gli stati attivi per ogni reparto di una commessa
const getStatiAttiviPerCommessa = (commessa) => {
  return commessa.stati_avanzamento.map((reparto) => {
    // Filtriamo per trovare lo stato attivo per ogni reparto
    const statoAttivo = reparto.stati_disponibili.find((stato) => stato.isActive);
    // Se c'è uno stato attivo, ritorna il reparto con lo stato attivo
    return {
      reparto_nome: reparto.reparto_nome,
      stato: statoAttivo || "Nessun stato attivo" 
    };
  });
};

// Funzione per ottenere il nome dello stato della commessa
const getStatoNome = (id) => {
  const stato = statiCommessa.find(stato => stato.id === id);
  return stato ? stato.nome_stato : "Non assegnato"; 
};


  return (
    <div className="container" onClick={closeSuggestions}>
      <h1>Visualizza le commesse</h1>

      <div>
        <input
          type="text"
          placeholder="Cerca per Numero Commessa"
          value={commessaFilter}
          onChange={handleCommessaChange}
          onClick={(e) => e.stopPropagation()}
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

      <div>
        <input
          type="text"
          placeholder="Filtra per Cliente"
          value={clienteFilter}
          onChange={handleClienteChange}
          onClick={(e) => e.stopPropagation()}
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

      <div>
        <input
          type="text"
          placeholder="Filtra per Tipo Macchina"
          value={tipoMacchinaFilter}
          onChange={handleTipoMacchinaChange}
          onClick={(e) => e.stopPropagation()}
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
      {/* Filtro per stato */}
      <div>
        <select onChange={handleStatoChange} value={statoFilter}>
          <option value="">Filtra per Stato</option>
          {statiCommessa.map((stato) => (
            <option key={stato.id} value={stato.id}>
              {stato.nome_stato}
            </option>
          ))}
        </select>
      </div>
      <div>
        <select onChange={handleSortChange} value={sortOrder}>
          <option value="numero_commessa">Ordina per: Numero Commessa</option>
          <option value="desc">Ordina per: Data Consegna</option>
        </select>
      </div>
      <div>

        <select onChange={handleSortChange} value={sortDirection}>
          <option value="asc">Numero commessa crescente</option>
          <option value="desc">Numero commessa decrescente</option>
        </select>
      </div>
      <div>
        <select onChange={handleDateSortChange} value={dateSortDirection}>
          <option value="crescente">Data di consegna crescente</option>
          <option value="decrescente">Data di consegna decrescente</option>
        </select>
      </div>

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
