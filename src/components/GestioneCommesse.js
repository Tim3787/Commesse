import React, { useState, useEffect } from "react";
import axios from "axios";
import "./style.css";

function GestioneCommesse() {
  const [commesse, setCommesse] = useState([]);
  const [reparti, setReparti] = useState([]);
  const [attivita, setAttivita] = useState([]);
  const [selezioniAttivita, setSelezioniAttivita] = useState({});
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);
  const [commessaFilter, setCommessaFilter] = useState(""); // Filtro per Commessa
  const [clienteFilter, setClienteFilter] = useState(""); // Filtro per Cliente
  const [tipoMacchinaFilter, setTipoMacchinaFilter] = useState(""); // Filtro per Tipo Macchina

  const [suggestionsCliente, setSuggestionsCliente] = useState([]);
  const [suggestionsTipoMacchina, setSuggestionsTipoMacchina] = useState([]);
  const [suggestionsCommessa, setSuggestionsCommessa] = useState([]);

  const [filteredCommesse, setFilteredCommesse] = useState([]);
  const [showClienteSuggestions, setShowClienteSuggestions] = useState(false);
  const [showTipoMacchinaSuggestions, setShowTipoMacchinaSuggestions] = useState(false);
  const [showCommessaSuggestions, setShowCommessaSuggestions] = useState(false);

  const [formData, setFormData] = useState({
    numero_commessa: "",
    tipo_macchina: "",
    descrizione: "",
    data_consegna: "",
    altri_particolari: "",
    cliente: "",
  });

  // Recupera commesse, reparti e attività
  useEffect(() => {
    fetchCommesse();
    fetchReparti();
    fetchAttivita();
    console.log("Commesse ricevute:", commesse);
  }, []);


  const fetchCommesse = async () => {
    try {
      const response = await axios.get("http://server-commesseun.onrender.com/api/commesse");
      setCommesse(response.data);
    } catch (error) {
      console.error("Errore durante il recupero delle commesse:", error);
    }
  };

  const fetchReparti = async () => {
    try {
      const response = await axios.get("http://server-commesseun.onrender.com/api/reparti");
      setReparti(response.data);
      const inizializzaSelezioni = {};
      response.data.forEach((reparto) => {
        inizializzaSelezioni[reparto.id] = [];
      });
      setSelezioniAttivita(inizializzaSelezioni);
    } catch (error) {
      console.error("Errore durante il recupero dei reparti:", error);
    }
  };

  const fetchAttivita = async () => {
    try {
      const response = await axios.get("http://server-commesseun.onrender.com/api/attivita");
      setAttivita(response.data);
    } catch (error) {
      console.error("Errore durante il recupero delle attività:", error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleCheckboxChange = (repartoId, attivitaId) => {
    setSelezioniAttivita((prev) => {
      const selezioniReparto = prev[repartoId] || [];
      if (selezioniReparto.includes(attivitaId)) {
        return {
          ...prev,
          [repartoId]: selezioniReparto.filter((id) => id !== attivitaId),
        };
      } else {
        return {
          ...prev,
          [repartoId]: [...selezioniReparto, attivitaId],
        };
      }
    });

  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      let commessaId;
  
      if (isEditing) {
        // Aggiorna la commessa
        const response = await axios.put(`http://server-commesseun.onrender.com/api/commesse/${editId}`, formData);
        console.log("Risposta backend per aggiornamento commessa:", response.data);
        commessaId = editId;
        alert("Commessa aggiornata con successo!");
      } else {
        // Crea una nuova commessa
        const response = await axios.post("http://server-commesseun.onrender.com/api/commesse", formData);
        console.log("Risposta backend per nuova commessa:", response.data);
  
        // Assicurati che il backend restituisca l'ID della nuova commessa
        if (!response.data.commessaId) {
          throw new Error("ID della commessa non ricevuto dal backend.");
        }
        commessaId = response.data.commessaId;
        alert("Commessa aggiunta con successo!");
      }
  
      // Prepara i dati per le attività
      const attivitaDaAggiungere = [];
      Object.keys(selezioniAttivita).forEach((repartoId) => {
        selezioniAttivita[repartoId].forEach((attivitaId) => {
          attivitaDaAggiungere.push({
            commessa_id: commessaId,
            reparto_id: parseInt(repartoId, 10),
            attivita_id: attivitaId,
          });
        });
      });
  
      console.log("Dati attività da inviare:", attivitaDaAggiungere);
  
      // Invia le attività selezionate al backend
      if (attivitaDaAggiungere.length > 0) {
        await axios.post("http://server-commesseun.onrender.com/api/commesse/assegna-attivita-predefinite", attivitaDaAggiungere, {
          headers: { "Content-Type": "application/json" }
        });
      }
  
      // Resetta i dati del form
      setFormData({
        numero_commessa: "",
        tipo_macchina: "",
        descrizione: "",
        data_consegna: "",
        altri_particolari: "",
        cliente: "",
      });
      setSelezioniAttivita({});
      setIsEditing(false);
      setEditId(null);
      fetchCommesse();
    } catch (error) {
      console.error("Errore durante l'operazione:", error);
      alert("Errore durante l'operazione.");
    }
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
    await axios.delete(`http://server-commesseun.onrender.com/api/commesse/${commessaId}`);
    alert("Commessa eliminata con successo!");
     // Ricarica l'elenco delle commesse dal backend
     fetchCommesse(); // Chiamata per ricaricare la lista delle commesse
  } catch (error) {
    console.error("Errore durante l'eliminazione della commessa:", error);
    alert("Errore durante l'eliminazione della commessa.");
  }
};


const handleEdit = (commessa) => {
  if (!commessa || !commessa.commessa_id) {
    alert("Commessa non trovata");
    return; // Esci dalla funzione se la commessa non è valida
  }

  setFormData({
    numero_commessa: commessa.numero_commessa,
    tipo_macchina: commessa.tipo_macchina,
    descrizione: commessa.descrizione,
    data_consegna: formatDate(commessa.data_consegna),
    altri_particolari: commessa.altri_particolari,
    cliente:  commessa.cliente,
  });
  setIsEditing(true);
  setEditId(commessa.commessa_id);  // Usa commessa.commessa_id se disponibile
};


  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  };

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
    setShowCommessaSuggestions(true); // Mostra la tendina quando si digita
  };

  const handleClienteChange = (event) => {
    setClienteFilter(event.target.value);
    setShowClienteSuggestions(true); // Mostra la tendina quando si digita
  };

  const handleTipoMacchinaChange = (event) => {
    setTipoMacchinaFilter(event.target.value);
    setShowTipoMacchinaSuggestions(true); // Mostra la tendina quando si digita
  };

  const handleSelectCommessa = (commessa) => {
    setCommessaFilter(commessa);
    setShowCommessaSuggestions(false); // Nascondi la tendina dopo la selezione
  };

  const handleSelectCliente = (cliente) => {
    setClienteFilter(cliente);
    setShowClienteSuggestions(false); // Nascondi la tendina dopo la selezione
  };

  const handleSelectTipoMacchina = (tipoMacchina) => {
    setTipoMacchinaFilter(tipoMacchina);
    setShowTipoMacchinaSuggestions(false); // Nascondi la tendina dopo la selezione
  };

  const closeSuggestions = () => {
    setShowClienteSuggestions(false);
    setShowTipoMacchinaSuggestions(false);
    setShowCommessaSuggestions(false); // Chiudi la tendina Commessa
  };


  return (
    <div className="container" onClick={closeSuggestions}>
      <h1>Crea o modifica commessa</h1>
      <form onSubmit={handleSubmit}>
        

        <div>
          <label>Numero Commessa:</label>
          <input
            type="text"
            name="numero_commessa"
            value={formData.numero_commessa}
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <label>Tipo Macchina:</label>
          <input
            type="text"
            name="tipo_macchina"
            value={formData.tipo_macchina}
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <label>Cliente:</label>
          <input
            type="text"
            name="cliente"
            value={formData.cliente}
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <label>Descrizione:</label>
          <textarea
            name="descrizione"
            value={formData.descrizione}
            onChange={handleChange}
          ></textarea>
        </div>
        <div>
          <label>Data Consegna:</label>
          <input
            type="date"
            name="data_consegna"
            value={formData.data_consegna}
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <label>Altri Particolari:</label>
          <textarea
            name="altri_particolari"
            value={formData.altri_particolari}
            onChange={handleChange}
          ></textarea>
        </div>

        <h2>Aggiungi attività default</h2>
        {reparti.map((reparto) => (
  <div key={reparto.id} className="reparto-container">
    <div className="reparto-title">{reparto.nome}</div>
    <div className="attivita-list">
      {attivita
        .filter((attivita) => attivita.reparto_id === reparto.id)
        .map((attivita) => (
          <label key={attivita.id} className="attivita-item">
            <input
              type="checkbox"
              checked={selezioniAttivita[reparto.id]?.includes(attivita.id) || false}
              onChange={() => handleCheckboxChange(reparto.id, attivita.id)}
            />
            {attivita.nome_attivita}
          </label>
        ))}
    </div>
  </div>
))}

        <button type="submit" className="btn btn-primary">
          {isEditing ? "Aggiorna Commessa" : "Aggiungi Commessa"}
        </button>
      </form>

      <h2>Elenco Commesse</h2>
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
          {filteredCommesse.map((commessa) => (
            <tr key={commessa.id}>
              <td>{commessa.numero_commessa}</td>
              <td>{commessa.tipo_macchina}</td>
              <td>{commessa.cliente}</td>
              <td>{new Date(commessa.data_consegna).toLocaleDateString()}</td>
              <td>
                <button
                  className="btn btn-warning"
                  onClick={() => handleEdit(commessa)}
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
    </div>
  );
}

export default GestioneCommesse;