import React, { useState, useEffect } from "react";
import axios from "axios";
import GestioneStatiAvanzamento from "./GestioneStatiAvanzamento";
import "./style.css";

function NuovaPagina() {
  const [commesse, setCommesse] = useState([]);
  const [filteredCommesse, setFilteredCommesse] = useState([]);
  const [currentCommessaIndex, setCurrentCommessaIndex] = useState(0);
  const [filters, setFilters] = useState({ search: "", tipoMacchina: "" });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get("http://localhost:5000/api/commesse");
        setCommesse(response.data);
        setFilteredCommesse(response.data); // Inizializza con tutte le commesse
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
      setCurrentCommessaIndex(0); // Reset index quando si applicano i filtri
    };

    applyFilters();
  }, [filters, commesse]);

  const currentCommessa = filteredCommesse[currentCommessaIndex];

  const handleNavigation = (direction) => {
    if (direction === "next" && currentCommessaIndex < filteredCommesse.length - 1) {
      setCurrentCommessaIndex(currentCommessaIndex + 1);
    } else if (direction === "prev" && currentCommessaIndex > 0) {
      setCurrentCommessaIndex(currentCommessaIndex - 1);
    }
  };

  const formatDate = (date) => {
    if (!date) return "";
    const parsedDate = new Date(date);
    return parsedDate.toISOString().split("T")[0];
  };

  const handleStatoAttualeChange = async (commessaId, repartoId, newStatoId) => {
    try {
      await axios.put(`http://localhost:5000/api/commesse/${commessaId}/reparti/${repartoId}/stato`, {
        reparto_id: repartoId,
        stato_id: newStatoId,
      });

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
    value={filters.commessa}
    onChange={(e) => setFilters({ ...filters, commessa: e.target.value })}
  >
    <option value="">Tutte le commesse</option>
    {commesse.map((commessa) => (
      <option key={commessa.id} value={commessa.numero_commessa}>
        {commessa.numero_commessa}
      </option>
    ))}
  </select>
        <select
          className="form-select"
          value={filters.tipoMacchina}
          onChange={(e) => setFilters({ ...filters, tipoMacchina: e.target.value })}
        >
          <option value="">Tutti i tipi macchina</option>
          {[...new Set(commesse.map((c) => c.tipo_macchina))].map((tipo) => (
            <option key={tipo} value={tipo}>
              {tipo}
            </option>
          ))}
        </select>
      </div>

      {/* Navigazione */}
      <div className="navigation">
        <button onClick={() => handleNavigation("prev")} disabled={currentCommessaIndex === 0}>
          &lt; Precedente
        </button>
        <button
          onClick={() => handleNavigation("next")}
          disabled={currentCommessaIndex >= filteredCommesse.length - 1}
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
