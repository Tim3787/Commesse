import React, { useState, useEffect } from 'react';
import GestioneStatiAvanzamento from '../assets/GestioneStatiAvanzamento';
import logo from '../img/Animation - 1738249246846.gif';

// Import per notifiche e tooltip
import 'react-toastify/dist/ReactToastify.css';
import { ToastContainer, toast } from 'react-toastify';

// Import icone FontAwesome
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEyeSlash, faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';

// Context
import { useAppData } from '../context/AppDataContext';

// Import API
import {
  updateStatoAttualeReparto,
  updateStatoCommessa,
  updateStatoDate,
} from '../services/API/commesse-api';

function StatiAvanzamento() {
  const [currentCommessaId, setCurrentCommessaId] = useState(null);
  const [commessaFilter, setCommessaFilter] = useState('');
  const [clienteFilter, setClienteFilter] = useState('');
  const [tipoMacchinaFilter, setTipoMacchinaFilter] = useState('');
  const [suggestionsCliente, setSuggestionsCliente] = useState([]);
  const [suggestionsTipoMacchina, setSuggestionsTipoMacchina] = useState([]);
  const [suggestionsCommessa, setSuggestionsCommessa] = useState([]);
  const [showClienteSuggestions, setShowClienteSuggestions] = useState(false);
  const [showTipoMacchinaSuggestions, setShowTipoMacchinaSuggestions] = useState(false);
  const [showCommessaSuggestions, setShowCommessaSuggestions] = useState(false);

  // Stato per la visualizzazione del menu a burger (filtri e opzioni)
  const [isBurgerMenuOpen, setIsBurgerMenuOpen] = useState(false);

  /* ===============================
     APP DATA
  =============================== */
  const { commesse, statiCommessa, setCommesse, loading } = useAppData();

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        !e.target.closest('.suggestion-wrapper') && // wrapper di input + lista
        !e.target.closest('.suggestions-list') &&
        !e.target.closest('input')
      ) {
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

  // Funzione per filtrare in base ai vari campi
  useEffect(() => {
    const filtered = commesse.filter((commessa) => {
      return (
        commessa.numero_commessa.toString().includes(commessaFilter) &&
        commessa.cliente.toLowerCase().includes(clienteFilter.toLowerCase()) &&
        commessa.tipo_macchina.toLowerCase().includes(tipoMacchinaFilter.toLowerCase())
      );
    });

    // Imposta currentCommessaId su una commessa valida tra quelle filtrate
    if (
      filtered.length > 0 &&
      !filtered.some((commessa) => commessa.commessa_id === currentCommessaId)
    ) {
      setCurrentCommessaId(filtered[0].commessa_id);
    }

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
  }, [commessaFilter, clienteFilter, tipoMacchinaFilter, commesse]);

  // Funzione per gestire i cambiamenti nei campi di ricerca
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

  const currentCommessa = commesse.find((commessa) => commessa.commessa_id === currentCommessaId);

  const handleNavigation = (direction) => {
    const currentIndex = commesse.findIndex(
      (commessa) => commessa.commessa_id === currentCommessaId
    );

    if (commesse.length === 0 || currentIndex === -1) {
      return;
    }

    if (direction === 'next' && currentIndex < commesse.length - 1) {
      const nextCommessaId = commesse[currentIndex + 1].commessa_id;
      setCurrentCommessaId(nextCommessaId);
    } else if (direction === 'prev' && currentIndex > 0) {
      const prevCommessaId = commesse[currentIndex - 1].commessa_id;
      setCurrentCommessaId(prevCommessaId);
    }
  };

  const formatDate = (date) => {
    if (!date) return '';
    const parsedDate = new Date(date);
    return parsedDate.toISOString().split('T')[0];
  };

  const handleStatoAttualeChange = async (commessaId, repartoId, newStatoId) => {
    try {
      await updateStatoAttualeReparto(commessaId, repartoId, newStatoId);

      setCommesse((prev) =>
        prev.map((commessa) =>
          commessa.commessa_id === commessaId
            ? {
                ...commessa,
                stati_avanzamento: commessa.stati_avanzamento.map((reparto) =>
                  reparto.reparto_id === repartoId
                    ? {
                        ...reparto,
                        stati_disponibili: reparto.stati_disponibili.map((stato) => ({
                          ...stato,
                          isActive: stato.stato_id === newStatoId,
                        })),
                      }
                    : reparto
                ),
              }
            : commessa
        )
      );

      toast.success('Stato reparto aggiornato!');
    } catch (error) {
      console.error("Errore durante l'aggiornamento dello stato attuale:", error);
      alert("Errore durante l'aggiornamento dello stato.");
    }
  };

  // Funzione per rimuovere una data
  const handleRemoveDate = async (commessaId, repartoId, statoId, field) => {
    if (!commessaId) return;

    try {
      await updateStatoDate(commessaId, repartoId, statoId, field, null);

      setCommesse((prev) =>
        prev.map((commessa) =>
          commessa.commessa_id === commessaId
            ? {
                ...commessa,
                stati_avanzamento: commessa.stati_avanzamento.map((reparto) =>
                  reparto.reparto_id === repartoId
                    ? {
                        ...reparto,
                        stati_disponibili: reparto.stati_disponibili.map((stato) =>
                          stato.stato_id === statoId ? { ...stato, [field]: null } : stato
                        ),
                      }
                    : reparto
                ),
              }
            : commessa
        )
      );
    } catch (error) {
      console.error('Errore durante la rimozione della data:', error);
      alert('Errore durante la rimozione della data.');
    }
  };

  // Funzione per aggiornare una data
  const handleUpdateDate = async (commessaId, repartoId, statoId, field, newValue) => {
    if (!commessaId) return;

    try {
      const formattedDate = new Date(newValue).toISOString();
      await updateStatoDate(commessaId, repartoId, statoId, field, formattedDate);

      setCommesse((prev) =>
        prev.map((commessa) =>
          commessa.commessa_id === commessaId
            ? {
                ...commessa,
                stati_avanzamento: commessa.stati_avanzamento.map((reparto) =>
                  reparto.reparto_id === repartoId
                    ? {
                        ...reparto,
                        stati_disponibili: reparto.stati_disponibili.map((stato) =>
                          stato.stato_id === statoId ? { ...stato, [field]: formattedDate } : stato
                        ),
                      }
                    : reparto
                ),
              }
            : commessa
        )
      );
    } catch (error) {
      console.error("Errore durante l'aggiornamento della data:", error);
      alert("Errore durante l'aggiornamento della data.");
    }
  };

  const handleStatoChange = async (commessaId, newStato) => {
    try {
      await updateStatoCommessa(commessaId, newStato);

      setCommesse((prev) =>
        prev.map((c) =>
          c.commessa_id === commessaId
            ? { ...c, stato: newStato } // Aggiorna solo il campo stato della commessa
            : c
        )
      );

      // 🔄 Forza l'aggiornamento della currentCommessa
      if (currentCommessaId === commessaId) {
        const aggiornata = commesse.find((c) => c.commessa_id === commessaId);
        if (aggiornata) {
          setCurrentCommessaId(null); // reset temporaneo
          setTimeout(() => setCurrentCommessaId(aggiornata.commessa_id), 0); // forzatura
        }
      }

      toast.success('Stato attuale aggiornato!');
    } catch (error) {
      console.error("Errore durante l'aggiornamento dello stato della commessa:", error);
      alert("Errore durante l'aggiornamento dello stato.");
    }
  };

  // Toggle per il menu a burger
  const toggleBurgerMenu = () => {
    setIsBurgerMenuOpen((prev) => !prev);
  };

  const closeSuggestions = (e) => {
    if (!e.target.closest('.suggestions-list') && !e.target.closest('select')) {
      setShowClienteSuggestions(false);
      setShowTipoMacchinaSuggestions(false);
      setShowCommessaSuggestions(false);
    }
  };

  // ========================================================
  // RENDER DEL COMPONENTE
  // ========================================================
  return (
    <div className="page-wrapper">
      <ToastContainer position="top-left" autoClose={2000} hideProgressBar />
      {/* HEADER */}
      <div className=" header">
        <h1>STATI AVANZAMENTO</h1>
        <div className="flex-center header-row">
          <button
            onClick={() => handleNavigation('prev')}
            className="btn w-50 btn--shiny btn--pill"
          >
            <FontAwesomeIcon icon={faChevronLeft} />
          </button>
          {currentCommessa && (
            <div className="header-row-month">
              {currentCommessa.numero_commessa} - {currentCommessa.cliente}
            </div>
          )}
          <button
            onClick={() => handleNavigation('next')}
            className="btn w-50 btn--shiny btn--pill"
          >
            <FontAwesomeIcon icon={faChevronRight} />
          </button>
        </div>
        {loading && (
          <div className="loading-overlay">
            <img src={logo} alt="Logo" className="logo-spinner" />
          </div>
        )}
        {/* Bottone per aprire/chiudere il menu */}
        <div className="burger-header">
          <button onClick={toggleBurgerMenu} className="btn w-200 btn--shiny btn--pill">
            Filtri ed Opzioni
          </button>
        </div>
      </div>

      {/* MENU A BURGER PER FILTRI E OPZIONI */}
      {isBurgerMenuOpen && (
        <div className="burger-menu">
          <div className="burger-menu-header">
            <button onClick={toggleBurgerMenu} className="btn w-50 btn--ghost">
              <FontAwesomeIcon icon={faEyeSlash} className="burger-menu-close" />
            </button>
          </div>
          <div className="burger-menu-content">
            <div className="filters">
              <div className="suggestion-wrapper  w-200 ">
                <input
                  type="text"
                  placeholder="Cerca per Numero Commessa"
                  value={commessaFilter}
                  onChange={handleCommessaChange}
                  onClick={(e) => e.stopPropagation()}
                  className="w-200"
                />
                {showCommessaSuggestions && (
                  <ul className="suggestions-list   w-200 ">
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

              {/* Filtro Cliente */}
              <div className="suggestion-wrapper  w-200 ">
                <input
                  type="text"
                  placeholder="Filtra per Cliente"
                  value={clienteFilter}
                  onChange={handleClienteChange}
                  onClick={(e) => e.stopPropagation()}
                  className="w-200"
                />
                {showClienteSuggestions && (
                  <ul className="suggestions-list   w-200 ">
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

              <div className="suggestion-wrapper  w-200 ">
                <input
                  type="text"
                  placeholder="Filtra per Tipo Macchina"
                  value={tipoMacchinaFilter}
                  onChange={handleTipoMacchinaChange}
                  onClick={(e) => e.stopPropagation()}
                  className="w-200"
                />
                {showTipoMacchinaSuggestions && (
                  <ul className="suggestions-list   w-200 ">
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
            </div>
          </div>
        </div>
      )}

      {/* CONTENITORE PRINCIPALE (si sposta a destra se il menu è aperto) */}
      <div className={`container ${isBurgerMenuOpen ? 'shifted' : ''}`} onClick={closeSuggestions}>
        <div className="Reparto-table-container mh-80  ">
          {/* Dettagli Commessa Selezionata */}
          {currentCommessa ? (
            <GestioneStatiAvanzamento
              commessa={currentCommessa}
              handleStatoAttualeChange={handleStatoAttualeChange}
              handleUpdateDate={handleUpdateDate}
              handleRemoveDate={handleRemoveDate}
              formatDate={formatDate}
              handleStatoChange={handleStatoChange}
              statiCommessa={statiCommessa}
            />
          ) : (
            <p>Nessuna commessa selezionata.</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default StatiAvanzamento;
