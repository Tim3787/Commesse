import { useState, useEffect } from 'react';
import logo from '../img/Animation - 1738249246846.gif';
import '../style/06-VisualizzaCommesse.css';
// Import popup
import CommessaDettagli from '../popup/CommessaDettagli';

// Import API
import { fetchStatiCommessa } from '../services/API/statoCommessa-api';
import { fetchCommesse } from '../services/API/commesse-api';

// Import Toastify per notifiche
import 'react-toastify/dist/ReactToastify.css';
import { ToastContainer, toast } from 'react-toastify';

// Import icone FontAwesome
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faEyeSlash,
  faExclamationTriangle,
  faCalendar,
  faCalendarWeek,
} from '@fortawesome/free-solid-svg-icons';

// Import Tooltip (assicurati di avere la libreria corretta installata, ad es. react-tooltip)
import { Tooltip } from 'react-tooltip';

function VisualizzazioneCommesse() {
  /* ===============================
     STATO DEL COMPONENTE
  =============================== */
  const [commesse, setCommesse] = useState([]); // Tutte le commesse
  const [filteredCommesse, setFilteredCommesse] = useState([]); // Commesse filtrate/ordinate
  const [statiCommessa, setStatiCommessa] = useState([]); // Stati disponibili per le commesse
  const [isVisible, setIsVisible] = useState(false);

  // Filtri di ricerca
  const [clienteFilter, setClienteFilter] = useState('');
  const [tipoMacchinaFilter, setTipoMacchinaFilter] = useState('');
  const [commessaFilter, setCommessaFilter] = useState('');
  const [statoFilter, setStatoFilter] = useState('2'); // Stato predefinito (puoi modificare in base alle tue esigenze)
  const [filtroStatiReparto, setFiltroStatiReparto] = useState([]);

  // Nuovi filtri: checkbox per M- e R-
  const [filterM, setFilterM] = useState(true);
  const [filterR, setFilterR] = useState(true);
  const [filterProduction, setFilterProduction] = useState(true);

  // Suggerimenti per filtri (autocomplete)
  const [suggestionsCliente, setSuggestionsCliente] = useState([]);
  const [suggestionsTipoMacchina, setSuggestionsTipoMacchina] = useState([]);
  const [suggestionsCommessa, setSuggestionsCommessa] = useState([]);
  const [showClienteSuggestions, setShowClienteSuggestions] = useState(false);
  const [showTipoMacchinaSuggestions, setShowTipoMacchinaSuggestions] = useState(false);
  const [showCommessaSuggestions, setShowCommessaSuggestions] = useState(false);

  // Ordinamento
  const [sortOrder] = useState('data'); // Ordinamento per campo ("numero_commessa" oppure "data")
  const [sortDirection] = useState('asc'); // Ordinamento ascendente/descendente (non usato attualmente per "numero_commessa")
  const [dateSortDirection, setDateSortDirection] = useState('crescente'); // Ordinamento per data di consegna

  // Stato di caricamento
  const [loading, setLoading] = useState(false);

  // Stato per la visualizzazione del popup dei dettagli della commessa
  const [selectedCommessa, setSelectedCommessa] = useState(null);

  // Stato per la visualizzazione del menu a burger (filtri e opzioni)
  const [isBurgerMenuOpen, setIsBurgerMenuOpen] = useState(false);

  // Opzioni per visualizzare icone di consegna
  const [ConsegnaMensile] = useState(true);
  const [ConsegnaSettimanale] = useState(true);

  // Stato avanzamento selezionato contenitore principale
  const [repartoSelezionato, setRepartoSelezionato] = useState('software'); // o "elettrico", ecc.
  const [repartiDisponibili, setRepartiDisponibili] = useState([]);

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
      console.error('Errore durante il caricamento dei dati:', error);
      toast.error('Errore durante il caricamento dei dati.');
    } finally {
      setLoading(false);
    }
  };

  // Carica i dati all'avvio del componente
  useEffect(() => {
    fetchData();
  }, []);

  // Carica i reparti
  useEffect(() => {
    const repartiUnici = new Set();

    commesse.forEach((commessa) => {
      commessa.stati_avanzamento?.forEach((reparto) => {
        if (reparto.reparto_nome) {
          repartiUnici.add(reparto.reparto_nome.toLowerCase());
        }
      });
    });

    setRepartiDisponibili([...repartiUnici]);
  }, [commesse]);

  /* ===============================
     FUNZIONI DI FILTRAGGIO E ORDINAMENTO
  =============================== */
  // Applica i filtri alle commesse
  const applyFilters = () => {
    return commesse.filter((commessa) => {
      const matchesCommessa = commessa.numero_commessa.toString().includes(commessaFilter);
      const matchesCliente = commessa.cliente.toLowerCase().includes(clienteFilter.toLowerCase());
      const matchesTipoMacchina = commessa.tipo_macchina
        .toLowerCase()
        .includes(tipoMacchinaFilter.toLowerCase());
      const matchesStato = !statoFilter || commessa.stato === parseInt(statoFilter, 10);

      // Se i filtri base non sono soddisfatti, esci subito
      if (!(matchesCommessa && matchesCliente && matchesTipoMacchina && matchesStato)) {
        return false;
      }

      // Se la commessa inizia con "M-" e l'opzione "Visualizza anche M-" è false, escludila
      if (commessa.numero_commessa.startsWith('M-') && !filterM) {
        return false;
      }

      // Se la commessa inizia con "R-" e l'opzione "Visualizza anche R-" è false, escludila
      if (commessa.numero_commessa.startsWith('R-') && !filterR) {
        return false;
      }

      // Se la commessa non inizia con "R-" e non inizia con "M-" l'opzione escludila
      if (
        !commessa.numero_commessa.startsWith('R-') &&
        !commessa.numero_commessa.startsWith('M-') &&
        !filterProduction
      ) {
        return false;
      }
      // 🎯 Filtra per stato avanzamento del reparto selezionato
      if (filtroStatiReparto.length > 0) {
        const statoReparto = commessa.stati_avanzamento?.find(
          (r) => r.reparto_nome?.toLowerCase() === repartoSelezionato.toLowerCase()
        );

        const statoAttivo = statoReparto?.stati_disponibili?.find((s) => s.isActive);

        if (!statoAttivo || !filtroStatiReparto.includes(statoAttivo.nome_stato)) {
          return false;
        }
      }

      return true;
    });
  };

  // Ordina le commesse in base all'ordinamento selezionato
  const sortCommesse = (commesseArray) => {
    return commesseArray.sort((a, b) => {
      if (sortOrder === 'numero_commessa') {
        return sortDirection === 'asc'
          ? a.numero_commessa - b.numero_commessa
          : b.numero_commessa - a.numero_commessa;
      } else if (sortOrder === 'data') {
        if (dateSortDirection === 'crescente') {
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
  }, [
    commessaFilter,
    clienteFilter,
    tipoMacchinaFilter,
    statoFilter,
    commesse,
    sortOrder,
    sortDirection,
    dateSortDirection,
    filterM,
    filterR,
    filterProduction,
    repartoSelezionato,
    filtroStatiReparto,
  ]);

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

  useEffect(() => {
    const handleClickOutside = (event) => {
      // Se il click NON avviene su un elemento con la classe "suggestions-list"
      // oppure sull'input (o eventuali elementi di filtro)
      if (!event.target.closest('.input') && !event.target.closest('.w-200')) {
        setShowClienteSuggestions(false);
        setShowTipoMacchinaSuggestions(false);
        setShowCommessaSuggestions(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);

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
    if (!e.target.closest('.suggestions-list') && !e.target.closest('select')) {
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
    return stato ? stato.nome_stato : 'Non assegnato';
  };

  const toggleSectionVisibility = () => {
    setIsVisible((prev) => !prev);
  };

  /* ===============================
     RENDER DEL COMPONENTE
  =============================== */
  return (
    <div className="page-wrapper">
      {/* HEADER */}
      <div className="flex-center header-row">
        <h1>TUTTE LE COMMESSE</h1>
        <ToastContainer position="top-left" autoClose={2000} hideProgressBar />
        {loading && (
          <div className="loading-overlay">
            <img src={logo} alt="Logo" className="logo-spinner" />
          </div>
        )}
      </div>

      <div className="burger-header" style={{ paddingTop: '5px', paddingBottom: '5px' }}>
        {/* Bottone per espandere/nascondere la tabella */}
        <button className="btn w-200 btn--shiny btn--pill" onClick={toggleSectionVisibility}>
          {isVisible ? '▼' : '▶'} {' Commesse completate in attesa di consegna'}
        </button>
      </div>
      {/* Mostra/Nasconde la tabella in base allo stato `isVisible` */}
      {isVisible && (
        <div className="Commesse-Commesse-container">
          <table className="Commesse-table">
            <thead>
              <tr>
                <th>Commessa</th>
                <th>Cliente</th>
                <th>Tipo Macchina</th>
                <th>Data Consegna</th>
              </tr>
            </thead>
            <tbody>
              {commesse
                .filter((commessa) => getStatoNome(commessa.stato) === 'Completata')
                .sort((a, b) => new Date(a.data_consegna) - new Date(b.data_consegna))
                .map((commessa) => (
                  <tr key={commessa.commessa_id} onClick={() => handleCommessaClick(commessa)}>
                    <td>{commessa.numero_commessa}</td>
                    <td>{commessa.cliente}</td>
                    <td>{commessa.tipo_macchina}</td>
                    <td>
                      <div className="delivery-alerts">
                        {commessa.data_consegna
                          ? new Date(commessa.data_consegna).toLocaleDateString()
                          : 'N/A'}

                        {commessa.data_consegna &&
                          new Date(commessa.data_consegna) < new Date() &&
                          getStatoNome(commessa.stato) !== 'Consegnata' && (
                            <>
                              <FontAwesomeIcon
                                icon={faExclamationTriangle}
                                style={{ color: 'red', marginLeft: '10px' }}
                                data-tooltip-id={`tooltip-expired-${commessa.commessa_id}`}
                              />
                              <Tooltip
                                id={`tooltip-expired-${commessa.commessa_id}`}
                                place="top"
                                effect="solid"
                                style={{ zIndex: 9999 }}
                              >
                                <span style={{ whiteSpace: 'pre-wrap' }}>Commessa scaduta</span>
                              </Tooltip>
                            </>
                          )}

                        {commessa.data_consegna &&
                          new Date(commessa.data_consegna) >= new Date() && (
                            <>
                              {ConsegnaSettimanale && isThisWeek(commessa.data_consegna) && (
                                <>
                                  <FontAwesomeIcon
                                    icon={faCalendarWeek}
                                    style={{ marginLeft: '10px', color: 'orange' }}
                                    data-tooltip-id={`tooltip-week-${commessa.commessa_id}`}
                                  />
                                  <Tooltip
                                    id={`tooltip-week-${commessa.commessa_id}`}
                                    place="top"
                                    effect="solid"
                                    style={{ zIndex: 9999 }}
                                  >
                                    <span style={{ whiteSpace: 'pre-wrap' }}>
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
                                      style={{ marginLeft: '10px', color: 'blue' }}
                                      data-tooltip-id={`tooltip-month-${commessa.commessa_id}`}
                                    />
                                    <Tooltip
                                      id={`tooltip-month-${commessa.commessa_id}`}
                                      place="top"
                                      effect="solid"
                                      style={{ zIndex: 9999 }}
                                    >
                                      <span style={{ whiteSpace: 'pre-wrap' }}>
                                        Commessa in scadenza questo mese
                                      </span>
                                    </Tooltip>
                                  </>
                                )}
                            </>
                          )}
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Bottone per aprire/chiudere il menu */}
      <div className="burger-header" style={{ paddingTop: '5px', paddingBottom: '5px' }}>
        <button onClick={toggleBurgerMenu} className="btn w-200 btn--shiny btn--pill">
          Filtri ed Opzioni
        </button>
      </div>
      <div className="container">
        {/* MENU A BURGER PER FILTRI E OPZIONI */}
        {isBurgerMenuOpen && (
          <div className="burger-menu">
            <div className="burger-menu-header">
              <button onClick={toggleBurgerMenu} className="btn w-50 btn--ghost">
                <FontAwesomeIcon icon={faEyeSlash} className="burger-menu-close" />
              </button>
            </div>
            <div className="burger-menu-content">
              {/* Sezione Filtri */}
              <div className="suggestion-wrapper w-200 ">
                <div className="input-wrapper">
                  <input
                    type="text"
                    placeholder="Cerca per Numero Commessa"
                    value={commessaFilter}
                    onChange={handleCommessaChange}
                    onClick={(e) => e.stopPropagation()}
                    className="w-200"
                  />
                  {suggestionsCommessa.includes(commessaFilter) && (
                    <span className="input-check">✔</span>
                  )}
                </div>
                {showCommessaSuggestions && (
                  <ul className="suggestions-list w-200">
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

              <div className="suggestion-wrapper w-200 ">
                <input
                  type="text"
                  placeholder="Filtra per Cliente"
                  value={clienteFilter}
                  onChange={handleClienteChange}
                  onClick={(e) => e.stopPropagation()}
                  className="w-200"
                />
                {showClienteSuggestions && (
                  <ul className="suggestions-list w-200">
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

              <div className="suggestion-wrapper w-200 ">
                <input
                  type="text"
                  placeholder="Filtra per Tipo Macchina"
                  value={tipoMacchinaFilter}
                  onChange={handleTipoMacchinaChange}
                  onClick={(e) => e.stopPropagation()}
                  className="w-200"
                />
                {showTipoMacchinaSuggestions && (
                  <ul className="suggestions-list w-200">
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

              <select onChange={handleStatoChange} value={statoFilter} className="w-200">
                <option value="">Filtra per Stato</option>
                {statiCommessa.map((stato) => (
                  <option key={stato.id} value={stato.id}>
                    {stato.nome_stato}
                  </option>
                ))}
              </select>
              <select onChange={handleDateSortChange} value={dateSortDirection} className="w-200">
                <option value="crescente">Data di consegna crescente</option>
                <option value="decrescente">Data di consegna decrescente</option>
              </select>
              <label>Stati avanzamento del reparto:</label>

              <div className="checklist">
                {commesse
                  .flatMap((c) =>
                    c.stati_avanzamento
                      ?.filter(
                        (s) => s.reparto_nome?.toLowerCase() === repartoSelezionato.toLowerCase()
                      )
                      ?.flatMap((r) => r.stati_disponibili || [])
                  )
                  .filter((v, i, a) => v && a.findIndex((x) => x.stato_id === v.stato_id) === i)
                  .sort((a, b) => a.ordine - b.ordine) // 👈 ORDINE CORRETTO
                  .map((stato) => (
                    <label key={stato.stato_id} style={{ display: 'block' }}>
                      <input
                        type="checkbox"
                        checked={filtroStatiReparto.includes(stato.nome_stato)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFiltroStatiReparto((prev) => [...prev, stato.nome_stato]);
                          } else {
                            setFiltroStatiReparto((prev) =>
                              prev.filter((nome) => nome !== stato.nome_stato)
                            );
                          }
                        }}
                      />
                      {stato.nome_stato}
                    </label>
                  ))}
              </div>

              <h3>Opzioni </h3>
              <label>
                <input
                  type="checkbox"
                  checked={filterM}
                  onChange={(e) => setFilterM(e.target.checked)}
                />
                Visualizza anche M-
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={filterR}
                  onChange={(e) => setFilterR(e.target.checked)}
                />
                Visualizza anche R-
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={filterProduction}
                  onChange={(e) => setFilterProduction(e.target.checked)}
                />
                Visualizza produzione
              </label>
            </div>
          </div>
        )}

        {/* CONTENITORE PRINCIPALE (si sposta a destra se il menu è aperto) */}
        <div
          className={`container ${isBurgerMenuOpen ? 'shifted' : ''}`}
          onClick={closeSuggestions}
        >
          <div className="Commesse-Commesse-container">
            {/* TABELLA DELLE COMMESSE */}
            <table className="Commesse-table">
              <thead>
                <tr>
                  <th>Commessa</th>
                  <th>Cliente</th>
                  <th>Tipo Macchina</th>
                  <th>Data FAT</th>
                  <th>Data Consegna</th>
                  <th>Stato</th>
                  <th>
                    Reparto{' '}
                    <select
                      value={repartoSelezionato}
                      onChange={(e) => setRepartoSelezionato(e.target.value)}
                    >
                      {repartiDisponibili.map((reparto) => (
                        <option key={reparto} value={reparto}>
                          {reparto.charAt(0).toUpperCase() + reparto.slice(1)}
                        </option>
                      ))}
                    </select>
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredCommesse.map((commessa) => (
                  <tr key={commessa.commessa_id} onClick={() => handleCommessaClick(commessa)}>
                    <td>{commessa.numero_commessa}</td>
                    <td>{commessa.cliente}</td>
                    <td>{commessa.tipo_macchina}</td>
                    <td>
                      {commessa.data_FAT ? new Date(commessa.data_FAT).toLocaleDateString() : '-'}
                    </td>
                    <td>
                      <div className="delivery-alerts">
                        {/* Visualizza la data di consegna oppure "N/A" */}
                        {commessa.data_consegna
                          ? new Date(commessa.data_consegna).toLocaleDateString()
                          : 'N/A'}

                        {/* 
                      Se esiste una data di consegna e questa è passata,
                      e lo stato della commessa NON è "Completata", mostra l'icona del triangolo (scaduta)
                    */}
                        {commessa.data_consegna &&
                          new Date(commessa.data_consegna) < new Date() &&
                          getStatoNome(commessa.stato) !== 'Consegnata' && (
                            <>
                              <FontAwesomeIcon
                                icon={faExclamationTriangle}
                                style={{ color: 'red', marginLeft: '10px' }}
                                data-tooltip-id={`tooltip-expired-${commessa.commessa_id}`}
                              />
                              <Tooltip
                                id={`tooltip-expired-${commessa.commessa_id}`}
                                place="top"
                                effect="solid"
                                style={{ zIndex: 9999 }}
                              >
                                <span style={{ whiteSpace: 'pre-wrap' }}>Commessa scaduta</span>
                              </Tooltip>
                            </>
                          )}

                        {/* Se la data di consegna è futura, mostra le icone per consegna settimanale/mensile */}
                        {commessa.data_consegna &&
                          new Date(commessa.data_consegna) >= new Date() && (
                            <>
                              {ConsegnaSettimanale && isThisWeek(commessa.data_consegna) && (
                                <>
                                  <FontAwesomeIcon
                                    icon={faCalendarWeek}
                                    style={{ marginLeft: '10px', color: 'orange' }}
                                    data-tooltip-id={`tooltip-week-${commessa.commessa_id}`}
                                  />
                                  <Tooltip
                                    id={`tooltip-week-${commessa.commessa_id}`}
                                    place="top"
                                    effect="solid"
                                    style={{ zIndex: 9999 }}
                                  >
                                    <span style={{ whiteSpace: 'pre-wrap' }}>
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
                                      style={{ marginLeft: '10px', color: 'blue' }}
                                      data-tooltip-id={`tooltip-month-${commessa.commessa_id}`}
                                    />
                                    <Tooltip
                                      id={`tooltip-month-${commessa.commessa_id}`}
                                      place="top"
                                      effect="solid"
                                      style={{ zIndex: 9999 }}
                                    >
                                      <span style={{ whiteSpace: 'pre-wrap' }}>
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
                    <td>
                      {commessa.stati_avanzamento
                        ?.find(
                          (reparto) =>
                            reparto.reparto_nome.toLowerCase() === repartoSelezionato.toLowerCase()
                        )
                        ?.stati_disponibili?.find((s) => s.isActive)?.nome_stato || '-'}
                    </td>
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
    </div>
  );
}

export default VisualizzazioneCommesse;
