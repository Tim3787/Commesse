import React, { useState, useEffect } from "react";
import "../style.css";
import CommessaCrea from "../CommessaCrea"; 
import logo from"../assets/unitech-packaging.png";
import {
  fetchCommesse,
  fetchReparti,
  fetchAttivita,
  fetchStatiCommessa,
  deleteCommessa,
} from "../services/api";

function GestioneCommesse() {
  const [commesse, setCommesse] = useState([]);
  const [reparti, setReparti] = useState([]);
  const [attivita, setAttivita] = useState([]);
  const [selectedCommessa, setSelectedCommessa] = useState(null); 
  const [isEditing, setIsEditing] = useState(false); 
  const [showPopup, setShowPopup] = useState(false); 
  const [selezioniAttivita, setSelezioniAttivita] = useState({});
  const [editId, setEditId] = useState(null);
   const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [clienteFilter, setClienteFilter] = useState("");
  const [tipoMacchinaFilter, setTipoMacchinaFilter] = useState("");
  const [commessaFilter, setCommessaFilter] = useState("");
  const [showClienteSuggestions, setShowClienteSuggestions] = useState(false);
  const [showTipoMacchinaSuggestions, setShowTipoMacchinaSuggestions] = useState(false);
  const [showCommessaSuggestions, setShowCommessaSuggestions] = useState(false);
  const [statiCommessa, setStatiCommessa] = useState([]); 

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [commesseData, repartiData, attivitaData, statiData] = await Promise.all([
        fetchCommesse(),
        fetchReparti(),
        fetchAttivita(),
        fetchStatiCommessa(),
      ]);
      setCommesse(commesseData);
      setReparti(repartiData);
      setAttivita(attivitaData);
      setStatiCommessa(statiData);
    } catch (error) {
      console.error("Errore durante il caricamento dei dati:", error);
    } finally {
      setLoading(false);
    }
  };

  // Funzione per aprire il pop-up in modalità creazione
  const handleCreateNewCommessa = () => {
    setIsEditing(false); 
    setSelectedCommessa(null); 
    setShowPopup(true); 
  };

  // Funzione per aprire il pop-up in modalità modifica
  const handleEditCommessa = (commessa) => {
    setIsEditing(true); 
    setSelectedCommessa(commessa); 
    setEditId(commessa.commessa_id); 
    setShowPopup(true); 
  };

  // Funzione per chiudere il pop-up
  const handleClosePopup = () => {
   setShowPopup(false); 
    setSelectedCommessa(null); 
  };

  // Funzione per eliminare una commessa
  const handleDelete = async (commessaId) => {
    try {
      await deleteCommessa(commessaId);
      await loadData(); // Ricarica i dati dopo l'eliminazione
    } catch (error) {
      console.error("Errore durante l'eliminazione della commessa:", error);
    }
  };


  // Funzione per applicare i filtri
  const applyFilters = () => {
    return commesse.filter((commessa) => {
      return (
        commessa.numero_commessa.toString().includes(commessaFilter) &&
        commessa.cliente.toLowerCase().includes(clienteFilter.toLowerCase()) &&
        commessa.tipo_macchina.toLowerCase().includes(tipoMacchinaFilter.toLowerCase())
      );
    });
  };

  // Funzioni per gestire i cambiamenti dei filtri
  const handleCommessaChange = (e) => {
    setCommessaFilter(e.target.value);
    setShowCommessaSuggestions(true);
  };

  const handleClienteChange = (e) => {
    setClienteFilter(e.target.value);
    setShowClienteSuggestions(true);
  };

  const handleTipoMacchinaChange = (e) => {
    setTipoMacchinaFilter(e.target.value);
    setShowTipoMacchinaSuggestions(true);
  };

  const closeSuggestions = () => {
    setShowClienteSuggestions(false);
    setShowTipoMacchinaSuggestions(false);
    setShowCommessaSuggestions(false);
  };

  const toggleFilters = () => {
    setShowFilters((prev) => !prev);
  };

  const getStatoNome = (id) => {
    const stato = statiCommessa.find(stato => stato.id === id);
    return stato ? stato.nome_stato : "Non assegnato"; 
  };

  
  return (
    <div className="container" onClick={closeSuggestions}>
      {loading && (
        <div className="loading-overlay">
            <img src={logo} alt="Logo"  className="logo-spinner"/>
        </div>
      )}

      <div className="header">
      <h1>Commesse</h1>
      </div>
      <button onClick={handleCreateNewCommessa} className="btn btn-primary create-activity-btn">
        Crea Nuova Commessa
      </button>
        <button onClick={toggleFilters} className="btn btn-filter">
          {showFilters ? "Nascondi Filtri" : "Mostra Filtri"}
        </button>     
        {showFilters && (
      <div className="filters">
        <div className="filter-group">
        <input
          type="text"
          placeholder="Filtra per Numero Commessa"
          value={commessaFilter}
          onChange={handleCommessaChange}
           className="input-field"
        />
        {showCommessaSuggestions && (
          <ul className="suggestions-list">
            {commesse
              .filter((commessa) => commessa.numero_commessa.includes(commessaFilter))
              .map((commessa, index) => (
                <li key={index} onClick={() => setCommessaFilter(commessa.numero_commessa)}>
                  {commessa.numero_commessa}
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
          className="input-field"
        />
        {showClienteSuggestions && (
          <ul className="suggestions-list">
            {commesse
              .map((commessa) => commessa.cliente)
              .filter((cliente, index, self) => self.indexOf(cliente) === index)
              .map((cliente, index) => (
                <li key={index} onClick={() => setClienteFilter(cliente)}>
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
          className="input-field"
        />
        {showTipoMacchinaSuggestions && (
          <ul className="suggestions-list">
            {commesse
              .map((commessa) => commessa.tipo_macchina)
              .filter((tipo, index, self) => self.indexOf(tipo) === index)
              .map((tipo, index) => (
                <li key={index} onClick={() => setTipoMacchinaFilter(tipo)}>
                  {tipo}
                </li>
              ))}
          </ul>
        )}
      </div>
      </div>
          )}
      <table>
        <thead>
          <tr>
            <th>Numero Commessa</th>
            <th>Tipo Macchina</th>
            <th>Cliente</th>
            <th>Data Consegna</th>
            <th>Data FAT</th>
            <th>Stato</th>
            <th>Azioni</th>
          </tr>
        </thead>
        <tbody>
        {applyFilters().map((commessa) => (
            <tr key={commessa.id}>
              <td>{commessa.numero_commessa}</td>
              <td>{commessa.tipo_macchina}</td>
              <td>{commessa.cliente}</td>
              <td>{new Date(commessa.data_consegna).toLocaleDateString()}</td>
              <td> {commessa.data_FAT? new Date(commessa.data_FAT).toLocaleDateString(): "Non specificata"}</td>
              <td>{getStatoNome(commessa.stato)}</td> 
              <td>
                <button
                  className="btn btn-warning"
                  onClick={() => handleEditCommessa(commessa)}
                >
                  Modifica
                </button>
                <button
                  className="btn btn-danger"
                  onClick={() => handleDelete(commessa.commessa_id)}
                >
                  Elimina
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Mostra il pop-up se c'è una commessa selezionata o se non siamo in modalità di creazione */}
      {showPopup && (
        <CommessaCrea
        commessa={selectedCommessa}
        onClose={handleClosePopup}
        isEditing={isEditing}
        reparti={reparti}
        attivita={attivita}
        selezioniAttivita={selezioniAttivita}
        setSelezioniAttivita={setSelezioniAttivita}
        fetchCommesse={fetchCommesse}
        editId={editId}
        stato={statiCommessa}
        />
      )}
    </div>
  );
}

export default GestioneCommesse;
