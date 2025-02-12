import React, { useState, useEffect } from "react";
import "../style.css";
import CommessaDettagli from "../popup/CommessaDettagli";
import logo from "../img/Animation - 1738249246846.gif";

// Import API
import { fetchStatiCommessa } from "../services/API/statoCommessa-api";
import { fetchCommesse } from "../services/API/commesse-api";

// Import Toastify per notifiche
import "react-toastify/dist/ReactToastify.css";
import { ToastContainer, toast } from "react-toastify";

// Import icone FontAwesome
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEyeSlash, faExclamationTriangle, faCalendar, faCalendarWeek } from "@fortawesome/free-solid-svg-icons";

// Import Tooltip (assicurati di avere la libreria corretta installata, ad es. react-tooltip)
import { Tooltip } from "react-tooltip";

function VisualizzazioneCommesse() {
  /* ===============================
     STATO DEL COMPONENTE
  =============================== */
  const [commesse, setCommesse] = useState([]);              // Tutte le commesse
  const [filteredCommesse, setFilteredCommesse] = useState([]);  // Commesse filtrate/ordinate
  const [statiCommessa, setStatiCommessa] = useState([]);       // Stati disponibili per le commesse

  // Filtri di ricerca
  const [clienteFilter, setClienteFilter] = useState("");
  const [tipoMacchinaFilter, setTipoMacchinaFilter] = useState("");
  const [commessaFilter, setCommessaFilter] = useState("");
  const [statoFilter, setStatoFilter] = useState("2"); // Stato predefinito (puoi modificare in base alle tue esigenze)

  // Suggerimenti per filtri (autocomplete)
  const [suggestionsCliente, setSuggestionsCliente] = useState([]);
  const [suggestionsTipoMacchina, setSuggestionsTipoMacchina] = useState([]);
  const [suggestionsCommessa, setSuggestionsCommessa] = useState([]);
  const [showClienteSuggestions, setShowClienteSuggestions] = useState(false);
  const [showTipoMacchinaSuggestions, setShowTipoMacchinaSuggestions] = useState(false);
  const [showCommessaSuggestions, setShowCommessaSuggestions] = useState(false);

  // Ordinamento
  const [sortOrder] = useState("data");       // Ordinamento per campo ("numero_commessa" oppure "data")
  const [sortDirection] = useState("asc");      // Ordinamento ascendente/descendente (non usato attualmente per "numero_commessa")
  const [dateSortDirection, setDateSortDirection] = useState("crescente"); // Ordinamento per data di consegna

  // Stato di caricamento
  const [loading, setLoading] = useState(false);

  // Stato per la visualizzazione del popup dei dettagli della commessa
  const [selectedCommessa, setSelectedCommessa] = useState(null);

  // Stato per la visualizzazione del menu a burger (filtri e opzioni)
  const [isBurgerMenuOpen, setIsBurgerMenuOpen] = useState(false);

  // Opzioni per visualizzare icone di consegna
  const [ConsegnaMensile] = useState(true);
  const [ConsegnaSettimanale] = useState(true);

  /* ===============================
     FUNZIONI PER IL FETCH DEI DATI
  =============================== */
  const fetchData = async () => {
    try {
      setLoading(true);
      // Esecuzione parallela delle chiamate API
      const [commesseData, statiCommessaData] = await Promise.all([
        fetchCommesse(),
        fetchStatiCommessa(),
      ]);
      setCommesse(commesseData);
      setFilteredCommesse(commesseData);
      setStatiCommessa(statiCommessaData);
    } catch (error) {
      console.error("Errore durante il caricamento dei dati:", error);
      toast.error("Errore durante il caricamento dei dati.");
    } finally {
      setLoading(false);
    }
  };

  // Carica i dati all'avvio del componente
  useEffect(() => {
    fetchData();
  }, []);

  /* ===============================
     FUNZIONI DI FILTRAGGIO E ORDINAMENTO
  =============================== */
  // Applica i filtri alle commesse
  const applyFilters = () => {
    return commesse.filter((commessa) => {
      const matchesCommessa = commessa.numero_commessa.toString().includes(commessaFilter);
      const matchesCliente = commessa.cliente.toLowerCase().includes(clienteFilter.toLowerCase());
      const matchesTipoMacchina = commessa.tipo_macchina.toLowerCase().includes(tipoMacchinaFilter.toLowerCase());
      // Filtra per stato se presente
      const matchesStato = !statoFilter || commessa.stato === parseInt(statoFilter, 10);
      return matchesCommessa && matchesCliente && matchesTipoMacchina && matchesStato;
    });
  };

  // Ordina le commesse in base all'ordinamento selezionato
  const sortCommesse = (commesseArray) => {
    return commesseArray.sort((a, b) => {
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

  // Aggiorna le commesse filtrate e ordinate
  const updateFilteredCommesse = () => {
    const filtered = applyFilters();
    const sorted = sortCommesse(filtered);
    setFilteredCommesse(sorted);
  };

  // Effettua l'update ogni volta che cambia un filtro o i dati
  useEffect(() => {
    updateFilteredCommesse();
  }, [commessaFilter, clienteFilter, tipoMacchinaFilter, statoFilter, commesse, sortOrder, sortDirection, dateSortDirection]);

  // Aggiorna i suggerimenti (autocomplete) per i filtri in base alle commesse
  useEffect(() => {
    // Suggerimenti per Cliente
    const clienteSuggestions = commesse
      .map((commessa) => commessa.cliente)
      .filter((value, index, self) => self.indexOf(value) === index);
    // Suggerimenti per Tipo Macchina
    const tipoMacchinaSuggestions = commesse
      .map((commessa) => commessa.tipo_macchina)
      .filter((value, index, self) => self.indexOf(value) === index);
    // Suggerimenti per Numero Commessa
    const commessaSuggestions = commesse
      .map((commessa) => commessa.numero_commessa)
      .filter((value, index, self) => self.indexOf(value) === index);

    setSuggestionsCliente(clienteSuggestions);
    setSuggestionsTipoMacchina(tipoMacchinaSuggestions);
    setSuggestionsCommessa(commessaSuggestions);
  }, [commessaFilter, clienteFilter, tipoMacchinaFilter, commesse]);

  /* ===============================
     FUNZIONI HELPER PER LE DATE
  =============================== */
  // Controlla se una data cade nella settimana corrente
  const isThisWeek = (dateString) => {
    if (!dateString) return false;
    const date = new Date(dateString);
    const now = new Date();
    const firstDayOfWeek = new Date(now);
    firstDayOfWeek.setDate(now.getDate() - now.getDay());
    firstDayOfWeek.setHours(0, 0, 0, 0);
    const lastDayOfWeek = new Date(firstDayOfWeek);
    lastDayOfWeek.setDate(firstDayOfWeek.getDate() + 6);
    lastDayOfWeek.setHours(23, 59, 59, 999);
    return date >= firstDayOfWeek && date <= lastDayOfWeek;
  };

  // Controlla se una data cade nel mese corrente
  const isThisMonth = (dateString) => {
    if (!dateString) return false;
    const date = new Date(dateString);
    const now = new Date();
    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
  };

  /* ===============================
     FUNZIONI DI GESTIONE DEI FILTRI E DELLA UI
  =============================== */
  // Gestione dei cambiamenti negli input dei filtri
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

  // Selezione dei suggerimenti
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

  // Gestione del filtro per stato
  const handleStatoChange = (event) => {
    setStatoFilter(event.target.value);
  };

  // Chiusura dei suggerimenti se si clicca all'esterno
  const closeSuggestions = (e) => {
    if (!e.target.closest(".suggestions-list") && !e.target.closest("select")) {
      setShowClienteSuggestions(false);
      setShowTipoMacchinaSuggestions(false);
      setShowCommessaSuggestions(false);
    }
  };

  // Gestione dell'ordinamento per data
  const handleDateSortChange = (e) => {
    setDateSortDirection(e.target.value);
  };

  // Gestione del click su una riga della commessa per aprire il popup dei dettagli
  const handleCommessaClick = (commessa) => {
    setSelectedCommessa(commessa);
  };

  // Chiusura del popup dei dettagli
  const handleClosePopup = () => {
    setSelectedCommessa(null);
  };

  // Toggle per il menu a burger
  const toggleBurgerMenu = () => {
    setIsBurgerMenuOpen((prev) => !prev);
  };

  // Funzione helper per ottenere il nome dello stato in base al suo ID
  const getStatoNome = (id) => {
    const stato = statiCommessa.find((stato) => stato.id === id);
    return stato ? stato.nome_stato : "Non assegnato";
  };

  /* ===============================
     RENDER DEL COMPONENTE
  =============================== */
  return (
    <div className="page-wrapper">
      {/* HEADER */}
      <div className="header">
        <h1>Commesse</h1>
        <ToastContainer position="top-left" autoClose={3000} hideProgressBar />
        {loading && (
          <div className="loading-overlay">
            <img src={logo} alt="Logo" className="logo-spinner" />
          </div>
        )}
      </div>

      {/* MENU A BURGER PER FILTRI E OPZIONI */}
      {isBurgerMenuOpen && (
        <div className="burger-menu">
          <div className="burger-menu-header">
            <button onClick={toggleBurgerMenu} className="close-burger">
              <FontAwesomeIcon icon={faEyeSlash} className="settings-icon" />
            </button>
          </div>
          <div className="burger-menu-content">
            {/* Sezione Filtri */}
            <div className="filters">
              {/* Filtro per Numero Commessa */}
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
                      .filter((commessa) =>
                        commessa.toString().includes(commessaFilter)
                      )
                      .map((commessa, index) => (
                        <li key={index} onClick={() => handleSelectCommessa(commessa)}>
                          {commessa}
                        </li>
                      ))}
                  </ul>
                )}
              </div>

              {/* Filtro per Cliente */}
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
                      .filter((cliente) =>
                        cliente.toLowerCase().includes(clienteFilter.toLowerCase())
                      )
                      .map((cliente, index) => (
                        <li key={index} onClick={() => handleSelectCliente(cliente)}>
                          {cliente}
                        </li>
                      ))}
                  </ul>
                )}
              </div>

              {/* Filtro per Tipo Macchina */}
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
                      .filter((tipo) =>
                        tipo.toLowerCase().includes(tipoMacchinaFilter.toLowerCase())
                      )
                      .map((tipo, index) => (
                        <li key={index} onClick={() => handleSelectTipoMacchina(tipo)}>
                          {tipo}
                        </li>
                      ))}
                  </ul>
                )}
              </div>

              {/* Filtro per Stato */}
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

            {/* Sezione Opzioni di Ordinamento */}
            <div className="filters">
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

      {/* CONTENITORE PRINCIPALE (si sposta a destra se il menu è aperto) */}
      <div className={`main-container ${isBurgerMenuOpen ? "shifted" : ""}`} onClick={closeSuggestions}>
        {/* Bottone per aprire/chiudere il menu */}
        <button onClick={toggleBurgerMenu} className="burger-icon">
          Filtri ed Opzioni
        </button>

         <div className="Gen-table-container" >
        {/* TABELLA DELLE COMMESSE */}
        <table className="software-schedule">
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
                <td>
                  {commessa.data_FAT
                    ? new Date(commessa.data_FAT).toLocaleDateString()
                    : "Non specificata"}
                </td>
                <td>
                  <div className="delivery-alerts">
                    {/* Visualizza la data di consegna oppure "N/A" */}
                    {commessa.data_consegna
                      ? new Date(commessa.data_consegna).toLocaleDateString()
                      : "N/A"}

                    {/* 
                      Se esiste una data di consegna e questa è passata,
                      e lo stato della commessa NON è "Completata", mostra l'icona del triangolo (scaduta)
                    */}
                    {commessa.data_consegna &&
                      new Date(commessa.data_consegna) < new Date() &&
                      getStatoNome(commessa.stato) !== "Completata" && (
                        <>
                          <FontAwesomeIcon
                            icon={faExclamationTriangle}
                            style={{ color: "red", marginLeft: "10px" }}
                            data-tooltip-id={`tooltip-expired-${commessa.commessa_id}`}
                          />
                          <Tooltip id={`tooltip-expired-${commessa.commessa_id}`} place="top" effect="solid">
                            <span style={{ whiteSpace: "pre-wrap" }}>Commessa scaduta</span>
                          </Tooltip>
                        </>
                      )}

                    {/* Se la data di consegna è futura, mostra le icone per consegna settimanale/mensile */}
                    {commessa.data_consegna && new Date(commessa.data_consegna) >= new Date() && (
                      <>
                        {ConsegnaSettimanale && isThisWeek(commessa.data_consegna) && (
                          <>
                            <FontAwesomeIcon
                              icon={faCalendarWeek}
                              style={{ marginLeft: "10px", color: "red" }}
                              data-tooltip-id={`tooltip-week-${commessa.commessa_id}`}
                            />
                            <Tooltip id={`tooltip-week-${commessa.commessa_id}`} place="top" effect="solid">
                              <span style={{ whiteSpace: "pre-wrap" }}>
                                Commessa in scadenza questa settimana
                              </span>
                            </Tooltip>
                          </>
                        )}

                        {!isThisWeek(commessa.data_consegna) &&
                          ConsegnaMensile &&
                          isThisMonth(commessa.data_consegna) && (
                            <>
                              <FontAwesomeIcon
                                icon={faCalendar}
                                style={{ marginLeft: "10px", color: "blue" }}
                                data-tooltip-id={`tooltip-month-${commessa.commessa_id}`}
                              />
                              <Tooltip id={`tooltip-month-${commessa.commessa_id}`} place="top" effect="solid">
                                <span style={{ whiteSpace: "pre-wrap" }}>
                                  Commessa in scadenza questo mese
                                </span>
                              </Tooltip>
                            </>
                          )}
                      </>
                    )}
                  </div>
                </td>
                <td>{getStatoNome(commessa.stato)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Popup per i dettagli della commessa */}
        {selectedCommessa && (
          <CommessaDettagli
            commessa={selectedCommessa}
            onClose={handleClosePopup}
            onStatusUpdated={fetchData}
          />
        )}
      </div>
    </div>
  </div>

  );
}

export default VisualizzazioneCommesse;
