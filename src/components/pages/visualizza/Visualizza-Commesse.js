import React, { useState, useEffect } from "react";
import "../../style.css";
import CommessaDettagli from "../../popup/CommessaDettagli";  
import logo from "../../img/Animation - 1738249246846.gif";
import { fetchStatiCommessa } from "../../services/API/statoCommessa-api";
import { fetchCommesse } from "../../services/API/commesse-api";
import "react-toastify/dist/ReactToastify.css";
import { ToastContainer, toast } from "react-toastify";

function VisualizzazioneCommesse() {
  const [commesse, setCommesse] = useState([]); 
  const [filteredCommesse, setFilteredCommesse] = useState([]); 
  const [clienteFilter, setClienteFilter] = useState("");
  const [tipoMacchinaFilter, setTipoMacchinaFilter] = useState("");
  const [commessaFilter, setCommessaFilter] = useState(""); 
  const [sortOrder, setSortOrder] = useState("data"); 
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
  const [statoFilter, setStatoFilter] = useState(""); 
  const [statiCommessa, setStatiCommessa] = useState([]); 

  // Stato per il menu a burger
  const [isBurgerMenuOpen, setIsBurgerMenuOpen] = useState(false);

  // Funzione per caricare i dati
  const fetchData = async () => {
    try {
      setLoading(true);
      const [commesseData, statiCommessaData] = await Promise.all([
        fetchCommesse(),
        fetchStatiCommessa(),
      ]);
      setCommesse(commesseData);
      setFilteredCommesse(commesseData);
      setStatiCommessa(statiCommessaData);
    } catch (error) {
      console.error("Errore durante il caricamento dei dati:", error);
      toast.error("Errore durante il caricamento dei dati:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
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
  
    setSuggestionsCliente(clienteSuggestions);
    setSuggestionsTipoMacchina(tipoMacchinaSuggestions);
    setSuggestionsCommessa(commessaSuggestions);
  
    setFilteredCommesse(filtered);
  
  }, [commessaFilter, clienteFilter, tipoMacchinaFilter, commesse]);
  
  // Funzione per applicare l'ordinamento
  const sortCommesse = (commesse) => {
    return commesse.sort((a, b) => {
      if (sortOrder === "numero_commessa") {
        return sortDirection === "asc"
          ? a.numero_commessa - b.numero_commessa
          : b.numero_commessa - a.numero_commessa;
      } else if (sortOrder === "data") {
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

  // Aggiorna commesse filtrate e ordinate
  const updateFilteredCommesse = () => {
    let filtered = applyFilters(); 
    let sorted = sortCommesse(filtered);
    setFilteredCommesse(sorted);
  };

  useEffect(() => {
    updateFilteredCommesse();
  }, [commessaFilter, clienteFilter, tipoMacchinaFilter, statoFilter, commesse, sortOrder, sortDirection, dateSortDirection]);
  
  // Gestione dei filtri
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

  // Chiude i suggerimenti se si clicca all'esterno
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

  // Funzione per aprire/chiudere il menu a burger
  const toggleBurgerMenu = () => {
    setIsBurgerMenuOpen((prev) => !prev);
  };

  const getStatoNome = (id) => {
    const stato = statiCommessa.find(stato => stato.id === id);
    return stato ? stato.nome_stato : "Non assegnato"; 
  };

  return (
    <div className="page-wrapper">
       <div className="header">
          <h1>Commesse</h1>
          <ToastContainer position="top-left" autoClose={3000} hideProgressBar />
          {loading && (
          <div className="loading-overlay">
            <img src={logo} alt="Logo" className="logo-spinner" />
          </div>
        )}
        </div>
      {/* Burger Menu: viene reso fisso a sinistra */}
      {isBurgerMenuOpen && (
        <div className="burger-menu">
          <div className="burger-menu-header">
            <h2>Filtri e Opzioni</h2>
            <button onClick={toggleBurgerMenu} className="close-burger">
              X
            </button>
          </div>
          <div className="burger-menu-content">
            {/* Sezione filtri */}
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
            {/* Sezione Opzioni di ordinamento */}
            <div className="filters">
              <div className="filter-group">
                <select onChange={handleSortChange} value={sortOrder}>
                  <option value="numero_commessa">Ordina per: Numero Commessa</option>
                  <option value="data">Ordina per: Data Consegna</option>
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
          </div>
        </div>
      )}

      {/* Contenitore principale che si sposta a destra quando il menu è aperto */}
      <div className={`main-container ${isBurgerMenuOpen ? "shifted" : ""}`} onClick={closeSuggestions}>
        
       
        {/* Pulsante per aprire/chiudere il menu */}
        <button onClick={toggleBurgerMenu} className="burger-icon">
          Filtri ed Opzioni
        </button>
        {/* Tabella con le commesse */}
        <table>
          <thead>
            <tr>
              <th>Numero Commessa</th>
              <th>Cliente</th>
              <th>Tipo Macchina</th>
              <th>Data FAT</th>
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
                <td>{commessa.data_FAT ? new Date(commessa.data_FAT).toLocaleDateString() : "Non specificata"}</td>
                <td>{commessa.data_consegna ? new Date(commessa.data_consegna).toLocaleDateString() : "N/A"}</td>
                <td>{getStatoNome(commessa.stato)}</td> 
              </tr>
            ))}
          </tbody>
        </table>
        {selectedCommessa && <CommessaDettagli commessa={selectedCommessa} onClose={handleClosePopup} />}
      </div>
    </div>
  );
}

export default VisualizzazioneCommesse;
