import React, { useState, useEffect } from "react";
import axios from "axios";
import "../style.css";
import CommessaCrea from "../CommessaCrea"; // Importa il pop-up

function GestioneCommesse() {
  const [commesse, setCommesse] = useState([]);
  const [reparti, setReparti] = useState([]);
  const [attivita, setAttivita] = useState([]);
  const [selectedCommessa, setSelectedCommessa] = useState(null); // Stato per commessa selezionata
  const [isEditing, setIsEditing] = useState(false); // Stato per determinare se siamo in modalità editing
  const [showPopup, setShowPopup] = useState(false); // Stato per gestire la visibilità del pop-up
  const [selezioniAttivita, setSelezioniAttivita] = useState({});
  const [editId, setEditId] = useState(null);
  
  // Stati per i filtri
  const [clienteFilter, setClienteFilter] = useState("");
  const [tipoMacchinaFilter, setTipoMacchinaFilter] = useState("");
  const [commessaFilter, setCommessaFilter] = useState("");
  const [showClienteSuggestions, setShowClienteSuggestions] = useState(false);
  const [showTipoMacchinaSuggestions, setShowTipoMacchinaSuggestions] = useState(false);
  const [showCommessaSuggestions, setShowCommessaSuggestions] = useState(false);


  useEffect(() => {
    fetchCommesse();
    fetchReparti();
    fetchAttivita();
  }, []);

  const fetchCommesse = async () => {
    console.log("fetchCommesse: recupero commesse...");
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/commesse`);
      console.log("Commesse recuperate:", response.data);
      setCommesse(response.data);
    } catch (error) {
      console.error("Errore durante il recupero delle commesse:", error);
    }
  };

  const fetchReparti = async () => {
    console.log("fetchReparti: recupero reparti...");
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/reparti`);
      console.log("Reparti recuperati:", response.data);
      setReparti(response.data);
    } catch (error) {
      console.error("Errore durante il recupero dei reparti:", error);
    }
  };

  const fetchAttivita = async () => {
    console.log("fetchAttivita: recupero attività...");
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/attivita`);
      console.log("Attività recuperate:", response.data);
      setAttivita(response.data);
    } catch (error) {
      console.error("Errore durante il recupero delle attività:", error);
    }
  };

  // Funzione per aprire il pop-up in modalità creazione
  const handleCreateNewCommessa = () => {
    setIsEditing(false); // Modalità creazione
    console.log("handleCreateNewCommessa: apertura pop-up per creare nuova commessa");
    console.log("Dati ricevuti per reparti:", reparti);
    console.log("Dati ricevuti per attività:", attivita);
    setSelectedCommessa(null); // Nessuna commessa selezionata
    setShowPopup(true); // Mostra il pop-up
  };

  // Funzione per aprire il pop-up in modalità modifica
  const handleEditCommessa = (commessa) => {
    setIsEditing(true); // Modalità modifica
    setSelectedCommessa(commessa); // Seleziona la commessa da modificare
    setEditId(commessa.commessa_id); // Imposta l'ID della commessa da modificare
    setShowPopup(true); // Mostra il pop-up
  };

  // Funzione per chiudere il pop-up
  const handleClosePopup = () => {
    setShowPopup(false); // Nascondi il pop-up
    setSelectedCommessa(null); // Resetta la commessa selezionata
  };

  // Funzione per eliminare una commessa
const handleDelete = async (commessaId) => {
  console.log("Comessa ID da eliminare:", commessaId);  // Verifica che l'ID sia corretto
  try {
    // Aggiungi un controllo per vedere se l'ID è valido
    if (!commessaId) {
      alert("ID della commessa non valido.");
      return;
    }
    
    // Modifica la query di eliminazione per usare il nome corretto della colonna (id)
    await axios.delete (`${process.env.REACT_APP_API_URL}/api/commesse/${commessaId}`);
    alert("Commessa eliminata con successo!");
     // Ricarica l'elenco delle commesse dal backend
     fetchCommesse(); // Chiamata per ricaricare la lista delle commesse
  } catch (error) {
    console.error("Errore durante l'eliminazione della commessa:", error);
    alert("Errore durante l'eliminazione della commessa.");
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


  return (
    <div className="container" onClick={closeSuggestions}>
      
      <h1>Gestione Commesse</h1>
            {/* Pulsante per creare nuova commessa */}
            <button onClick={handleCreateNewCommessa} className="btn-new-comm">
        Crea Nuova Commessa
      </button>

      <div>
        <input
          type="text"
          placeholder="Filtra per Numero Commessa"
          value={commessaFilter}
          onChange={handleCommessaChange}
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

      <div>
        <input
          type="text"
          placeholder="Filtra per Cliente"
          value={clienteFilter}
          onChange={handleClienteChange}
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

      <div>
        <input
          type="text"
          placeholder="Filtra per Tipo Macchina"
          value={tipoMacchinaFilter}
          onChange={handleTipoMacchinaChange}
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
      {/* Lista delle commesse con opzioni di modifica */}
      <table>
        <thead>
          <tr>
            <th>Numero Commessa</th>
            <th>Tipo Macchina</th>
            <th>Cliente</th>
            <th>Data Consegna</th>
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
        />
      )}
    </div>
  );
}

export default GestioneCommesse;
