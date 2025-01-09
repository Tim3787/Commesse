import React, { useState, useEffect } from "react";
import axios from "axios";
import "./style.css";

function VisualizzazioneCommesse() {
  const [commesse, setCommesse] = useState([]);
  const [clienteFilter, setClienteFilter] = useState("");
  const [tipoMacchinaFilter, setTipoMacchinaFilter] = useState("");
  const [commessaFilter, setCommessaFilter] = useState(""); // Nuovo stato per il filtro Commessa
  const [suggestionsCliente, setSuggestionsCliente] = useState([]);
  const [suggestionsTipoMacchina, setSuggestionsTipoMacchina] = useState([]);
  const [suggestionsCommessa, setSuggestionsCommessa] = useState([]); // Suggerimenti per Commessa
  const [filteredCommesse, setFilteredCommesse] = useState([]);
  const [showClienteSuggestions, setShowClienteSuggestions] = useState(false);
  const [showTipoMacchinaSuggestions, setShowTipoMacchinaSuggestions] = useState(false);
  const [showCommessaSuggestions, setShowCommessaSuggestions] = useState(false); // Mostra tendina Commessa
  const [sortOrder, setSortOrder] = useState("numero_commessa"); // Stato per tipo di ordinamento
  const [sortDirection, setSortDirection] = useState("asc"); // Stato per direzione (ascendente o discendente)
  const [dateSortDirection, setDateSortDirection] = useState("crescente"); // Ordinamento per data di consegna

  useEffect(() => {
    const fetchCommesse = async () => {
      try {
        const response = await axios.get("http://localhost:5000/api/commesse");
        setCommesse(response.data);
        setFilteredCommesse(response.data); // inizializza con tutte le commesse
      } catch (error) {
        console.error("Errore durante il recupero delle commesse:", error);
      }
    };

    fetchCommesse();
  }, []);

  // Funzione per filtrare in base ai vari campi
  useEffect(() => {
    let filtered = commesse.filter((commessa) => {
      return (
        commessa.numero_commessa.toString().includes(commessaFilter) &&
        commessa.cliente.toLowerCase().includes(clienteFilter.toLowerCase()) &&
        commessa.tipo_macchina.toLowerCase().includes(tipoMacchinaFilter.toLowerCase())
      );
    });

    // Ordinamento in base al tipo di ordinamento selezionato
    filtered = filtered.sort((a, b) => {
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
    setSuggestionsCommessa(commessaSuggestions); // Aggiungi i suggerimenti per Commessa
  }, [commessaFilter, clienteFilter, tipoMacchinaFilter, commesse, sortOrder, sortDirection, dateSortDirection]);

  // Funzione per gestire il cambiamento nel campo di ricerca commessa
  const handleCommessaChange = (event) => {
    setCommessaFilter(event.target.value);
    setShowCommessaSuggestions(true); // Mostra la tendina quando si digita
  };

  // Funzione per gestire il filtro del cliente
  const handleClienteChange = (event) => {
    setClienteFilter(event.target.value);
    setShowClienteSuggestions(true); // Mostra la tendina quando si digita
  };

  // Funzione per gestire il filtro del tipo macchina
  const handleTipoMacchinaChange = (event) => {
    setTipoMacchinaFilter(event.target.value);
    setShowTipoMacchinaSuggestions(true); // Mostra la tendina quando si digita
  };

  // Funzione per selezionare un suggerimento commessa
  const handleSelectCommessa = (commessa) => {
    setCommessaFilter(commessa);
    setShowCommessaSuggestions(false); // Nascondi la tendina dopo la selezione
  };

  // Funzione per selezionare un suggerimento cliente
  const handleSelectCliente = (cliente) => {
    setClienteFilter(cliente);
    setShowClienteSuggestions(false); // Nascondi la tendina dopo la selezione
  };

  // Funzione per selezionare un suggerimento tipo macchina
  const handleSelectTipoMacchina = (tipoMacchina) => {
    setTipoMacchinaFilter(tipoMacchina);
    setShowTipoMacchinaSuggestions(false); // Nascondi la tendina dopo la selezione
  };

  // Funzione per chiudere la tendina quando si clicca fuori
  const closeSuggestions = () => {
    setShowClienteSuggestions(false);
    setShowTipoMacchinaSuggestions(false);
    setShowCommessaSuggestions(false); // Chiudi la tendina Commessa
  };

  // Funzione per gestire il cambio del criterio di ordinamento
  const handleSortChange = (e) => {
    const { value } = e.target;
    if (value === sortOrder) {
      // Inverti la direzione se il criterio selezionato è già quello attivo
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortOrder(value); // Cambia il criterio di ordinamento
      setSortDirection("asc"); // Imposta la direzione predefinita come ascendente
    }
  };

  // Funzione per gestire l'ordinamento per data
  const handleDateSortChange = (e) => {
    setDateSortDirection(e.target.value); // Imposta la direzione dell'ordinamento per data
  };

  return (
    <div className="container" onClick={closeSuggestions}>
      <h1>Visualizza le commesse</h1>

      {/* Filtri */}
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

      {/* Ordinamento per Numero Commessa */}
      <div>
        <label>Ordina per Numero Commessa:</label>
        <select onChange={handleSortChange} value={sortOrder}>
          <option value="crescente">Crescente</option>
          <option value="decrescente">Decrescente</option>
        </select>
      </div>

      {/* Ordinamento per Data Consegna */}
      <div>
        <label>Ordinamento Data di Consegna:</label>
        <select onChange={handleDateSortChange} value={dateSortDirection}>
          <option value="crescente">Crescente</option>
          <option value="decrescente">Decrescente</option>
        </select>
      </div>

      <table>
        <thead>
          <tr>
            <th>Numero Commessa</th>
            <th>Cliente</th>
            <th>Tipo Macchina</th>
            <th>Data Consegna</th>
            <th>Stati Attivi</th>
          </tr>
        </thead>
        <tbody>
          {filteredCommesse.map((commessa) => (
            <tr key={commessa.id}>
              <td>{commessa.numero_commessa}</td>
              <td>{commessa.cliente}</td>
              <td>{commessa.tipo_macchina}</td>
              <td>
                {commessa.data_consegna
                  ? new Date(commessa.data_consegna).toLocaleDateString()
                  : "N/A"}
              </td>
              <td>
                {commessa.stati_avanzamento && commessa.stati_avanzamento.length > 0 ? (
                  commessa.stati_avanzamento.map((reparto, index) => (
                    <div key={index}>
                      <strong>{reparto.reparto_nome}:</strong>
                      {reparto.stati_disponibili
                        .filter((stato) => stato.isActive) // Filtra solo gli stati attivi
                        .map((stato, statoIndex) => (
                          <div key={statoIndex}>
                            - {stato.nome_stato}
                            {stato.data_inizio && (
                              <span>
                                {" "}
                                (Inizio:{" "}
                                {new Date(stato.data_inizio).toLocaleDateString()}
                                )
                              </span>
                            )}
                            {stato.data_fine && (
                              <span>
                                {" "}
                                (Fine:{" "}
                                {new Date(stato.data_fine).toLocaleDateString()}
                                )
                              </span>
                            )}
                          </div>
                        ))}
                    </div>
                  ))
                ) : (
                  "Nessuno stato assegnato"
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default VisualizzazioneCommesse;
