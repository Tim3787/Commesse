import React, { useState, useEffect } from "react";
import axios from "axios";
import GestioneStatiAvanzamento from "./GestioneStatiAvanzamento";
import "./style.css";

function NuovaPagina() {
  const [commesse, setCommesse] = useState([]);
  const [currentCommessaId, setCurrentCommessaId] = useState(null);
  const [commessaFilter, setCommessaFilter] = useState(""); // Filtro per Numero Commessa
  const [clienteFilter, setClienteFilter] = useState(""); // Filtro per Cliente
  const [tipoMacchinaFilter, setTipoMacchinaFilter] = useState(""); // Filtro per Tipo Macchina
  const [suggestionsCliente, setSuggestionsCliente] = useState([]);
  const [suggestionsTipoMacchina, setSuggestionsTipoMacchina] = useState([]);
  const [suggestionsCommessa, setSuggestionsCommessa] = useState([]);
  const [filteredCommesse, setFilteredCommesse] = useState([]);
  const [showClienteSuggestions, setShowClienteSuggestions] = useState(false);
  const [showTipoMacchinaSuggestions, setShowTipoMacchinaSuggestions] = useState(false);
  const [showCommessaSuggestions, setShowCommessaSuggestions] = useState(false);

  // Carica tutte le commesse
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get("http://localhost:5000/api/commesse");
        console.log("Commesse caricate:", response.data);
        setCommesse(response.data);
        // Imposta la prima commessa come selezionata
        if (response.data.length > 0) {
          setCurrentCommessaId(response.data[0].commessa_id); // Usa commessa_id
        }
      } catch (error) {
        console.error("Errore durante il recupero delle commesse:", error);
      }
    };
    fetchData();
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

    setFilteredCommesse(filtered);

// Imposta currentCommessaId su una commessa valida tra quelle filtrate
if (filtered.length > 0 && !filtered.some(commessa => commessa.commessa_id === currentCommessaId)) {
    setCurrentCommessaId(filtered[0].commessa_id); // Se la commessa selezionata non esiste, seleziona la prima commessa
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

  const closeSuggestions = () => {
    setShowClienteSuggestions(false);
    setShowTipoMacchinaSuggestions(false);
    setShowCommessaSuggestions(false);
  };

  // Trova la commessa attualmente selezionata
  const currentCommessa = commesse.find((commessa) => commessa.commessa_id === currentCommessaId);
  console.log("Current Commessa:", currentCommessa); // Verifica se viene trovata la commessa

  // Funzione di navigazione
  const handleNavigation = (direction) => {
    console.log("Navigazione attivata:", direction);
    const currentIndex = commesse.findIndex((commessa) => commessa.commessa_id === currentCommessaId);
    console.log("currentIndex:", currentIndex);
  
    if (commesse.length === 0 || currentIndex === -1) {
      return;
    }
  
    if (direction === "next" && currentIndex < commesse.length - 1) {
      const nextCommessaId = commesse[currentIndex + 1].commessa_id;
      console.log("Next commessa ID:", nextCommessaId);  // Log per verificare
      setCurrentCommessaId(nextCommessaId);
    } else if (direction === "prev" && currentIndex > 0) {
      const prevCommessaId = commesse[currentIndex - 1].commessa_id;
      console.log("Previous commessa ID:", prevCommessaId);  // Log per verificare
      setCurrentCommessaId(prevCommessaId);
    }
  };
  

  const formatDate = (date) => {
    if (!date) return "";
    const parsedDate = new Date(date);
    return parsedDate.toISOString().split("T")[0];
  };

  // Funzione per aggiornare lo stato attuale di una commessa
  const handleStatoAttualeChange = async (commessaId, repartoId, newStatoId) => {
    try {
      // Trova la commessa selezionata
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
                          ? { ...stato, isActive: true } // Imposta come attivo lo stato selezionato
                          : { ...stato, isActive: false } // Disabilita gli altri stati
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
      await axios.put(`http://localhost:5000/api/commesse/${commessaId}/reparti/${repartoId}/stato`, {
        stato_id: newStatoId,
        is_active: isActive, // Imposta isActive in base allo stato selezionato
      });
  
      alert("Stato attuale aggiornato!");
    } catch (error) {
      console.error("Errore durante l'aggiornamento dello stato attuale:", error);
      alert("Errore durante l'aggiornamento dello stato.");
    }
  };
  
  
  
  
  
  
  //Testare la navigazione separatamente
  const testNavigation = () => {
    setCurrentCommessaId(commesse[1].commessa_id);  // Imposta direttamente il secondo ID per testare la navigazione
    handleNavigation("next");  // Usa "next" per verificare il passaggio tra le commesse
  };
  
  <button onClick={testNavigation}>Test Navigazione</button>

  
  // Funzione per rimuovere una data
  const handleRemoveDate = async (commessaId, repartoId, statoId, field) => {
    if (!commessaId) {
      console.error("Errore: commessaId non definito.");
      return; // Esci se l'ID della commessa è undefined
    }

    try {
      await axios.put(`http://localhost:5000/api/commesse/${commessaId}/reparti/${repartoId}/stato`, {
        stato_id: statoId,
        [field]: null, // Rimuove la data
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
                            ? { ...stato, [field]: null } // Aggiorna il campo rimosso
                            : stato
                        ),
                      }
                    : reparto
                ),
              }
            : commessa
        )
      );

      alert("Data rimossa con successo!");
    } catch (error) {
      console.error("Errore durante la rimozione della data:", error);
      alert("Errore durante la rimozione della data.");
    }
  };

  // Funzione per aggiornare una data
  const handleUpdateDate = async (commessaId, repartoId, statoId, field, newValue) => {
    if (!commessaId) {
      console.error("Errore: commessaId non definito.");
      return; // Esci se l'ID della commessa è undefined
    }

    try {
      const formattedDate = new Date(newValue).toISOString();
      await axios.put(`http://localhost:5000/api/commesse/${commessaId}/reparti/${repartoId}/stato`, {
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

      alert("Data aggiornata con successo!");
    } catch (error) {
      console.error("Errore durante l'aggiornamento della data:", error);
      alert("Errore durante l'aggiornamento della data.");
    }
  };

  return (
    <div className="container">
      <h1>Aggiorna stati avanzamento</h1>
{/* Filtro Commessa */}
<div>
        <input
          type="text"
          placeholder="Cerca per Numero Commessa"
          value={commessaFilter}
          onChange={handleCommessaChange}
          onClick={(e) => e.stopPropagation()} // Evita che il click chiuda la tendina
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

      {/* Filtro Cliente */}
      <div>
        <input
          type="text"
          placeholder="Filtra per Cliente"
          value={clienteFilter}
          onChange={handleClienteChange}
          onClick={(e) => e.stopPropagation()} // Evita che il click chiuda la tendina
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

      {/* Filtro Tipo Macchina */}
      <div>
        <input
          type="text"
          placeholder="Filtra per Tipo Macchina"
          value={tipoMacchinaFilter}
          onChange={handleTipoMacchinaChange}
          onClick={(e) => e.stopPropagation()} // Evita che il click chiuda la tendina
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
      {/* Visualizza tutte le commesse */}
      <div className="commesse-list">
        {commesse.length === 0 ? (
          <p>Nessuna commessa disponibile.</p>
        ) : (
          <div>
            <h2>Commessa Selezionata: {currentCommessa?.numero_commessa}</h2>
            <p>Tipo Macchina: {currentCommessa?.tipo_macchina}</p>
          </div>
        )}
      </div>

      {/* Navigazione */}
      <div className="navigation">
        <button onClick={() => handleNavigation("prev")}>
          &lt; Precedente
        </button>
        <button onClick={() => handleNavigation("next")}>
          Successiva &gt;
        </button>
      </div>

      {/* Dettagli Commessa Selezionata */}
      {currentCommessa ? (
        <GestioneStatiAvanzamento
          commessa={currentCommessa}
          handleStatoAttualeChange={handleStatoAttualeChange}
          handleUpdateDate={handleUpdateDate}
          handleRemoveDate={handleRemoveDate}
          formatDate={formatDate}
        />
      ) : (
        <p>Nessuna commessa selezionata.</p>
      )}
    </div>
  );
}

export default NuovaPagina;
