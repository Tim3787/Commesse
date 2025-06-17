import React, { useState, useEffect } from "react";
import axios from "axios";
import GestioneStatiAvanzamento from "../assets/GestioneStatiAvanzamento";
import logo from "../img/Animation - 1738249246846.gif";
import "react-toastify/dist/ReactToastify.css";
import { ToastContainer, toast } from "react-toastify";
// Import icone FontAwesome
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEyeSlash } from "@fortawesome/free-solid-svg-icons";

function StatiAvanzamento() {
  const [commesse, setCommesse] = useState([]);
  const [currentCommessaId, setCurrentCommessaId] = useState(null);
  const [commessaFilter, setCommessaFilter] = useState(""); 
  const [clienteFilter, setClienteFilter] = useState(""); 
  const [tipoMacchinaFilter, setTipoMacchinaFilter] = useState(""); 
  const [suggestionsCliente, setSuggestionsCliente] = useState([]);
  const [suggestionsTipoMacchina, setSuggestionsTipoMacchina] = useState([]);
  const [suggestionsCommessa, setSuggestionsCommessa] = useState([]);
  const [showClienteSuggestions, setShowClienteSuggestions] = useState(false);
  const [showTipoMacchinaSuggestions, setShowTipoMacchinaSuggestions] = useState(false);
  const [showCommessaSuggestions, setShowCommessaSuggestions] = useState(false);
  const [statiCommessa, setStatiCommessa] = useState([]);
  const [loading, setLoading] = useState(false);

  // Stato per la visualizzazione del menu a burger (filtri e opzioni)
  const [isBurgerMenuOpen, setIsBurgerMenuOpen] = useState(false);

  
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await axios.get (`${process.env.REACT_APP_API_URL}/api/commesse`);
        setCommesse(response.data);
        if (response.data.length > 0) {
          setCurrentCommessaId(response.data[0].commessa_id); 
        }
      } catch (error) {
        console.error("Errore durante il recupero delle commesse:", error);
           toast.error("Errore durante il recupero delle commesse:", error);
      }
    };
    fetchData();
    const fetchStatiCommessa = async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/stato-commessa`);
        setStatiCommessa(response.data);
      } catch (error) {
        console.error("Errore durante il recupero degli stati della commessa:", error);
        toast.error("Errore durante il recupero degli stati della commessa:", error);
      }finally {
        setLoading(false);
      }
    };

    fetchStatiCommessa();
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
if (filtered.length > 0 && !filtered.some(commessa => commessa.commessa_id === currentCommessaId)) {
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
    const currentIndex = commesse.findIndex((commessa) => commessa.commessa_id === currentCommessaId);
  
    if (commesse.length === 0 || currentIndex === -1) {
      return;
    }
  
    if (direction === "next" && currentIndex < commesse.length - 1) {
      const nextCommessaId = commesse[currentIndex + 1].commessa_id;
      setCurrentCommessaId(nextCommessaId);
    } else if (direction === "prev" && currentIndex > 0) {
      const prevCommessaId = commesse[currentIndex - 1].commessa_id;
      setCurrentCommessaId(prevCommessaId);
    }
  };
  

  const formatDate = (date) => {
    if (!date) return "";
    const parsedDate = new Date(date);
    return parsedDate.toISOString().split("T")[0];
  };


  const handleStatoAttualeChange = async (commessaId, repartoId, newStatoId) => {
    try {
      const updatedCommesse = commesse.map((commessa) =>
        commessa.commessa_id === commessaId
          ? {
              ...commessa,
              stati_avanzamento: commessa.stati_avanzamento.map((reparto) =>
                reparto.reparto_id === repartoId
                  ? {
                      ...reparto,
                      stati_disponibili: reparto.stati_disponibili.map((stato) =>
                        stato.stato_id === newStatoId
                          ? { ...stato, isActive: true } 
                          : { ...stato, isActive: false } 
                      ),
                    }
                  : reparto
              ),
            }
          : commessa
      );
  
      // Aggiorna lo stato locale
      setCommesse(updatedCommesse);
  
      // Trova la commessa aggiornata
      const commessa = updatedCommesse.find(c => c.commessa_id === commessaId);
  
      // Trova lo stato selezionato per determinare se isActive deve essere true o false
      const statoSelezionato = commessa?.stati_avanzamento
        .find(reparto => reparto.reparto_id === repartoId)
        ?.stati_disponibili
        .find(stato => stato.stato_id === newStatoId);
  
      // Calcola is_active in base allo stato selezionato
      const isActive = statoSelezionato?.isActive === undefined ? false : statoSelezionato.isActive;
  
      // Chiamata PUT per aggiornare il backend
      await axios.put (`${process.env.REACT_APP_API_URL}/api/commesse/${commessaId}/reparti/${repartoId}/stato`, {
        stato_id: newStatoId,
        is_active: isActive, 
      });
  
      //alert("Stato attuale aggiornato!");
    } catch (error) {
      console.error("Errore durante l'aggiornamento dello stato attuale:", error);
      alert("Errore durante l'aggiornamento dello stato.");
    }
  };
  
 

  
  const testNavigation = () => {
    setCurrentCommessaId(commesse[1].commessa_id); 
    handleNavigation("next"); 
  };
  
  <button onClick={testNavigation}>Test Navigazione</button>

  
  // Funzione per rimuovere una data
  const handleRemoveDate = async (commessaId, repartoId, statoId, field) => {
    if (!commessaId) {
      console.error("Errore: commessaId non definito.");
      return; // Esci se l'ID della commessa è undefined
    }

    try {
      await axios.put (`${process.env.REACT_APP_API_URL}/api/commesse/${commessaId}/reparti/${repartoId}/stato`, {
        stato_id: statoId,
        [field]: null, 
      });

      setCommesse((prevCommesse) =>
        prevCommesse.map((commessa) =>
          commessa.commessa_id === commessaId
            ? {
                ...commessa,
                stati_avanzamento: commessa.stati_avanzamento.map((reparto) =>
                  reparto.reparto_id === repartoId
                    ? {
                        ...reparto,
                        stati_disponibili: reparto.stati_disponibili.map((stato) =>
                          stato.stato_id === statoId
                            ? { ...stato, [field]: null } 
                            : stato
                        ),
                      }
                    : reparto
                ),
              }
            : commessa
        )
      );

      //alert("Data rimossa con successo!");
    } catch (error) {
      console.error("Errore durante la rimozione della data:", error);
      alert("Errore durante la rimozione della data.");
    }
  };

  // Funzione per aggiornare una data
  const handleUpdateDate = async (commessaId, repartoId, statoId, field, newValue) => {
    if (!commessaId) {
      console.error("Errore: commessaId non definito.");
      return; 
    }

    try {
      const formattedDate = new Date(newValue).toISOString();
      await axios.put (`${process.env.REACT_APP_API_URL}/api/commesse/${commessaId}/reparti/${repartoId}/stato`, {
        stato_id: statoId,
        [field]: formattedDate,
      });

      setCommesse((prevCommesse) =>
        prevCommesse.map((commessa) =>
          commessa.commessa_id === commessaId
            ? {
                ...commessa,
                stati_avanzamento: commessa.stati_avanzamento.map((reparto) =>
                  reparto.reparto_id === repartoId
                    ? {
                        ...reparto,
                        stati_disponibili: reparto.stati_disponibili.map((stato) =>
                          stato.stato_id === statoId
                            ? { ...stato, [field]: formattedDate }
                            : stato
                        ),
                      }
                    : reparto
                ),
              }
            : commessa
        )
      );

      //alert("Data aggiornata con successo!");
    } catch (error) {
      console.error("Errore durante l'aggiornamento della data:", error);
      alert("Errore durante l'aggiornamento della data.");
    }
  };



  const handleStatoChange = async (commessaId, newStato) => {
    try {
      // Invio dell'ID dello stato al backend
      await axios.put(`${process.env.REACT_APP_API_URL}/api/commesse/${commessaId}/stato`, {
        stato_commessa: newStato,  
      });
  
      // Aggiornamento dello stato locale
      setCommesse((prevCommesse) =>
        prevCommesse.map((commessa) =>
          commessa.commessa_id === commessaId
            ? { ...commessa, stato_commessa: newStato }  
            : commessa
        )
      );
      
      //alert("Stato aggiornato con successo!");
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
    if (!e.target.closest(".suggestions-list") && !e.target.closest("select")) {
      setShowClienteSuggestions(false);
      setShowTipoMacchinaSuggestions(false);
      setShowCommessaSuggestions(false);
    }
  };


  return (
    <div className="page-wrapper">
      {/* HEADER */}
      <div className="flex-center header-row">
             <h1>STATI AVANZAMENTO</h1>
        <ToastContainer position="top-left" autoClose={2000} hideProgressBar />
        {loading && (
          <div className="loading-overlay">
            <img src={logo} alt="Logo" className="logo-spinner" />
          </div>
        )}
              {/* Navigazione */}
      <div className="navigation">
        <button onClick={() => handleNavigation("prev")} className="btn w-50 btn--shiny btn--pill">
          &lt; Precedente
        </button>
        <button onClick={() => handleNavigation("next")}  className="btn w-50 btn--shiny btn--pill">
          Successiva &gt;
        </button>
      </div>
      </div>
                   {/* Bottone per aprire/chiudere il menu */}
            <div className="burger-header" >
        <button onClick={toggleBurgerMenu} className="btn w-200 btn--shiny btn--pill">
          Filtri ed Opzioni
        </button>
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
              .filter((cliente) => cliente.toLowerCase().includes(clienteFilter.toLowerCase()))
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
              .filter((tipo) => tipo.toLowerCase().includes(tipoMacchinaFilter.toLowerCase()))
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
      <div className={`container ${isBurgerMenuOpen ? "shifted" : ""}`} onClick={closeSuggestions}>

       <div>
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
