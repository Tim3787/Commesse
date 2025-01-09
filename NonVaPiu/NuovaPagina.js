import React, { useState, useEffect } from "react";
import axios from "axios";
import GestioneStatiAvanzamento from "./GestioneStatiAvanzamento";
import "./style.css";

function NuovaPagina() {
  const [commesse, setCommesse] = useState([]);
  const [filteredCommesse, setFilteredCommesse] = useState([]);
  const [currentCommessaIndex, setCurrentCommessaIndex] = useState(0);
  const [filters, setFilters] = useState({ search: "", tipoMacchina: "" });
  const [currentCommessaId, setCurrentCommessaId] = useState(null);

  const currentCommessa = filteredCommesse.find(commessa => commessa.id === currentCommessaId) || {};

  const handleNavigation = (direction) => {
    const currentIndex = filteredCommesse.findIndex(commessa => commessa.id === currentCommessaId);
    
    console.log("Current Commessa ID:", currentCommessaId); // Check if currentCommessaId is valid
  
    if (filteredCommesse.length === 0 || currentIndex === -1) {
      return;
    }
    
    if (direction === "next" && currentIndex < filteredCommesse.length - 1) {
      setCurrentCommessaId(filteredCommesse[currentIndex + 1].id);
    } else if (direction === "prev" && currentIndex > 0) {
      setCurrentCommessaId(filteredCommesse[currentIndex - 1].id);
    }
  };
  
  
  
  useEffect(() => {
  const fetchData = async () => {
    try {
      const response = await axios.get("http://localhost:5000/api/commesse");
      console.log(response.data);  // Aggiungi log per controllare i dati ricevuti
      setCommesse(response.data);
      setFilteredCommesse(response.data);

      // Se ci sono commesse, imposta l'ID della prima commessa
      if (response.data.length > 0) {
        setCurrentCommessaId(response.data[0].id);
      }
    } catch (error) {
      console.error("Errore durante il recupero delle commesse:", error);
    }
  };
  fetchData();
}, []);
  
useEffect(() => {
  const applyFilters = () => {
    const filtered = commesse.filter((commessa) => {
      const matchesSearch =
        !filters.search || commessa.numero_commessa.includes(filters.search);
      const matchesTipo =
        !filters.tipoMacchina || commessa.tipo_macchina === filters.tipoMacchina;
      return matchesSearch && matchesTipo;
    });

    setFilteredCommesse(filtered);

    // Se l'ID corrente non è valido, resetta a null o alla prima commessa
    if (!filtered.some(commessa => commessa.id === currentCommessaId)) {
      setCurrentCommessaId(filtered.length > 0 ? filtered[0].id : null);
    }
  };

  applyFilters();
}, [filters, commesse]);

useEffect(() => {
  const currentIndex = filteredCommesse.findIndex(commessa => commessa.id === currentCommessaId);
  
  if (currentIndex === -1) {
    setCurrentCommessaId(filteredCommesse.length > 0 ? filteredCommesse[0].id : null);
  }
}, [filteredCommesse]);



  const formatDate = (date) => {
    if (!date) return "";
    const parsedDate = new Date(date);
    return parsedDate.toISOString().split("T")[0];
  };

  const handleStatoAttualeChange = async (commessaId, repartoId, newStatoId) => {
    console.log("Commessa ID:", commessaId, "Reparto ID:", repartoId, "Nuovo Stato ID:", newStatoId);
    if (!commessaId || !repartoId || !newStatoId) {
      console.error("Mancano uno o più ID!");
      return; // Esci dalla funzione se uno dei parametri è mancante
    }
  
    try {
      // Mantieni l'indice corrente
      const previousIndex = currentCommessaIndex;
  
      // Aggiorna lo stato nel backend
      await axios.put(`http://localhost:5000/api/commesse/${commessaId}/reparti/${repartoId}/stato`, {
        reparto_id: repartoId,
        stato_id: newStatoId,
      });
  
      // Aggiorna lo stato locale senza resettare l'indice
      setCommesse((prevCommesse) =>
        prevCommesse.map((commessa) =>
          commessa.id === commessaId
            ? {
                ...commessa,
                stati_avanzamento: commessa.stati_avanzamento.map((reparto) =>
                  reparto.reparto_id === repartoId
                    ? { ...reparto, stato_attuale: { stato_id: newStatoId } }
                    : reparto
                ),
              }
            : commessa
        )
      );
  
      // Ripristina l'indice corrente
      setFilteredCommesse(filteredCommesse); // Questo mantiene i filtri applicati
      setCurrentCommessaIndex(previousIndex);
  
      alert("Stato attuale aggiornato!");
    } catch (error) {
      console.error("Errore durante l'aggiornamento dello stato attuale:", error);
      alert("Errore durante l'aggiornamento dello stato.");
    }
  };
  


  

  const handleRemoveDate = async (commessaId, repartoId, statoId, field) => {
    try {
      // Invia la richiesta al backend per rimuovere la data
      await axios.put(`http://localhost:5000/api/commesse/${commessaId}/reparti/${repartoId}/stato`, {
        stato_id: statoId,
        [field]: null, // Rimuove la data
      });
  
      // Aggiorna lo stato locale
      setCommesse((prevCommesse) =>
        prevCommesse.map((commessa) =>
          commessa.id === commessaId
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
  

  const handleUpdateDate = async (commessaId, repartoId, statoId, field, newValue) => {
    try {
      const formattedDate = new Date(newValue).toISOString();
      await axios.put(`http://localhost:5000/api/commesse/${commessaId}/reparti/${repartoId}/stato`, {
        stato_id: statoId,
        [field]: formattedDate,
      });
  
      // Aggiorna lo stato locale
      setCommesse((prevCommesse) =>
        prevCommesse.map((commessa) =>
          commessa.id === commessaId
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
  
  const handleUpdateOrder = (commessaId, repartoId, newOrder) => {
    setCommesse((prevCommesse) =>
      prevCommesse.map((commessa) =>
        commessa.id === commessaId
          ? {
              ...commessa,
              stati_avanzamento: commessa.stati_avanzamento.map((reparto) =>
                reparto.reparto_id === repartoId
                  ? { ...reparto, stati_disponibili: newOrder }
                  : reparto
              ),
            }
          : commessa
      )
    );
  
    // Invia l'aggiornamento al backend
    const payload = newOrder.map((stato, index) => ({
      stato_id: stato.stato_id,
      ordine: index,
    }));
  
    fetch(`http://localhost:5000/api/commesse/${commessaId}/reparti/${repartoId}/stati-ordine`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Errore durante l'aggiornamento dell'ordine degli stati.");
        }
        alert("Ordine aggiornato con successo!");
      })
      .catch((error) => {
        console.error("Errore durante l'aggiornamento dell'ordine:", error);
        alert("Errore durante l'aggiornamento dell'ordine.");
      });
  };

  


  return (
    <div className="container">
      <h1>Aggiorna stati avanzamento</h1>
      {/* Barra di ricerca e filtri */}
      <div className="filters">
        <input
          type="text"
          placeholder="Cerca numero commessa"
          value={filters.search}
          onChange={(e) => setFilters({ ...filters, search: e.target.value })}
        />
 
<select
  className="form-select"
  value={filters.tipoMacchina}
  onChange={(e) => setFilters({ ...filters, tipoMacchina: e.target.value })}
>
  <option value="">Tutti i tipi macchina</option>
  {[...new Set(commesse.map((c) => c.tipo_macchina))].map((tipo, index) => (
    <option key={index} value={tipo}> {/* Usa index o un valore unico come key */}
      {tipo}
    </option>
  ))}
</select>
      </div>

      {/* Navigazione */}
      <div className="navigation">
  <button 
    onClick={() => handleNavigation("prev")} 
    disabled={currentCommessaId === filteredCommesse[0]?.id}  // Disabilita se è la prima commessa
  >
    &lt; Precedente
  </button>
  <button
    onClick={() => handleNavigation("next")}
    disabled={currentCommessaId === filteredCommesse[filteredCommesse.length - 1]?.id}  // Disabilita se è l'ultima commessa
  >
    Successiva &gt;
  </button>
</div>

      {/* Dettagli Commessa */}
      {currentCommessa ? (
        <GestioneStatiAvanzamento
          commessa={currentCommessa}
          handleStatoAttualeChange={handleStatoAttualeChange}
          handleUpdateDate={handleUpdateDate}
          handleRemoveDate={handleRemoveDate}
          formatDate={formatDate}
        />
      ) : (
        <p>Nessuna commessa disponibile.</p>
      )}
    </div>
  );
}

export default NuovaPagina;
