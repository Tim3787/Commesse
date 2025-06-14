import React, { useState, useEffect } from "react";
import logo from "../img/Animation - 1738249246846.gif";

// Import del popup per la creazione/modifica della commessa
import SchedaTecnica from "../popup/SchedaTecnicaEdit";

// Import Toastify per le notifiche
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Import API
import { fetchCommesse} from "../services/API/commesse-api";
import { fetchReparti } from "../services/API/reparti-api";
import { fetchSchedeTecniche,
deleteSchedaTecnica
 } from "../services/API/schedeTecniche-api";


// Import icone per il menu a burger
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEyeSlash } from "@fortawesome/free-solid-svg-icons";


function SchedeTecnicheTable() {
  /* ===============================
     STATO DEL COMPONENTE
  =============================== */
  const [commesse, setCommesse] = useState([]);
  const [reparti, setReparti] = useState([]);
  const [schede, setSchede] = useState([]);
const [selectedCommessaId, setSelectedCommessaId] = useState(null);
const [schedaInModifica, setSchedaInModifica] = useState(null);


  // Stati per la gestione della commessa selezionata (per modifica/creazione)
  const [selectedCommessa, setSelectedCommessa] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showPopup, setShowPopup] = useState(false);


  // Stati per il caricamento e per il pulsante di eliminazione
  const [loading, setLoading] = useState(false);
  const [deleteLoadingId, setDeleteLoadingId] = useState(null);

  // Suggerimenti per filtri (autocomplete)
const [suggestionsCommessa, setSuggestionsCommessa] = useState([]);
const [tipiSchedeDisponibili, setTipiSchedeDisponibili] = useState([]);

// Per filtrare la tabella
const [commessaFilter, setCommessaFilter] = useState("");
const [showFiltroSuggestions, setShowFiltroSuggestions] = useState(false);


// Per la selezione della commessa per creare una nuova scheda
const [commessaCreazione, setCommessaCreazione] = useState("");
const [showCommessaCreazioneSuggestions, setShowCommessaCreazioneSuggestions] = useState(false);

  const [tipoFilter, setTipoFilter] = useState("");

  // Stato per il menu a burger (per mostrare/nascondere i filtri)
  const [isBurgerMenuOpen, setIsBurgerMenuOpen] = useState(false);

  /* ===============================
     FETCH DEI DATI
  =============================== */
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Esecuzione parallela delle chiamate API
      const [commesseData, repartiData, SchedeTecnicheData ] = await Promise.all([
        fetchCommesse(),
        fetchReparti(),
        fetchSchedeTecniche(),
      ]);
      const commesseMinime = commesseData.map(({ commessa_id, numero_commessa }) => ({
  commessa_id,
  numero_commessa,
}));
setCommesse(commesseMinime);
setSuggestionsCommessa(commesseMinime.map((c) => c.numero_commessa));
      setReparti(repartiData);
      setSchede(SchedeTecnicheData);
      setSuggestionsCommessa(commesseData.map((c) => c.numero_commessa));
setSchede(SchedeTecnicheData);
const tipiUnici = [...new Set(SchedeTecnicheData.map(s => s.tipo).filter(Boolean))];
setTipiSchedeDisponibili(tipiUnici);

    } catch (error) {
      console.error("Errore durante il caricamento dei dati:", error);
      toast.error("Errore durante il caricamento dei dati.");
    } finally {
      setLoading(false);
    }
  };
  
useEffect(() => {
  const handleClickOutside = (event) => {
    const clickedOutsideFiltro =
      !event.target.closest(".suggestions-list") &&
      !event.target.closest(".w-200");

    if (clickedOutsideFiltro) {
      setShowFiltroSuggestions(false);
      setShowCommessaCreazioneSuggestions(false); // AGGIUNTA QUI
    }
  };

  document.addEventListener("click", handleClickOutside);
  return () => document.removeEventListener("click", handleClickOutside);
}, []);

  /* ===============================
     GESTIONE DELLA CREAZIONE/MODIFICA
  =============================== */
  // Apre il popup per creare una nuova commessa
const handleCreateNewScheda = () => {
  if (!selectedCommessa) {
    toast.error("Seleziona prima una commessa.");
    return;
  }
  setIsEditing(false);
  setShowPopup(true);
};
const handleEditScheda = (scheda) => {

  setIsEditing(true);
  setSchedaInModifica(scheda);
  setShowPopup(true);
};
const formatDateTime = (isoString) => {
  const date = new Date(isoString);
  return date.toLocaleString("it-IT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }); // "07/06/2025 07:37"
};

  // Chiude il popup e resetta gli stati di modifica/creazione
const handleClosePopup = async () => {
  setShowPopup(false);
  setSelectedCommessa(null);
  setSchedaInModifica(null);
  await loadData(); // 🔄 Ricarica le schede (e tutto il resto)
};

  const handleDelete = async (schedaId) => {
    if (window.confirm("Sei sicuro di voler eliminare questa scheda?")) {
      setDeleteLoadingId(schedaId);
      try {
        await deleteSchedaTecnica(schedaId);
        toast.success("Scheda eliminata con successo!");
        await loadData();
      } catch (error) {
        console.error("Errore durante l'eliminazione della scheda:", error);
        toast.error("Errore durante l'eliminazione della scheda.");
      } finally {
        setDeleteLoadingId(null);
      }
    }
  };




  /* ===============================
     FILTRAGGIO DEI DATI
  =============================== */
  
const applyFilters = () => {
  return schede.filter((scheda) => {
    return (
      scheda.numero_commessa.toLowerCase().includes(commessaFilter.toLowerCase()) &&
      scheda.tipo.toLowerCase().includes(tipoFilter.toLowerCase())
    );
  });
};



  /* ===============================
     GESTIONE DEL MENU A BURGER
  =============================== */
  // Toggle per aprire/chiudere il menu a burger dei filtri
  const toggleBurgerMenu = () => {
    setIsBurgerMenuOpen((prev) => !prev);
  };

  /* ===============================
     RENDER DEL COMPONENTE
  =============================== */
  return (
    <div className="page-wrapper">
      {/* ToastContainer per le notifiche */}
      <ToastContainer position="top-left" autoClose={2000} hideProgressBar />
      {loading && (
        <div className="loading-overlay">
          <img src={logo} alt="Logo" className="logo-spinner" />
        </div>
      )}

      {/* HEADER */}
      <div className="flex-center header-row">
        <h1>GESTIONE SCHEDE</h1>
        
      </div>
                   {/* Bottone per aprire/chiudere il menu */}
            <div className="burger-header" >
        <button onClick={toggleBurgerMenu} className="btn w-200 btn--shiny btn--pill">
          Filtri ed Opzioni
        </button>
        </div>
      {/* MENU A BURGER: pannello dei filtri (visibile solo se aperto) */}
      {isBurgerMenuOpen && (
        <div className="burger-menu">
          <div className="burger-menu-header">
            {/* Bottone per chiudere il burger menu */}
            <button onClick={toggleBurgerMenu} className="btn w-50 btn--ghost">
              <FontAwesomeIcon icon={faEyeSlash} className="burger-menu-close" />
            </button>
          </div>
          <div className="burger-menu-content">
          <div className="filters-burger">
          <h3>Azioni</h3>
<div className="suggestion-wrapper w-200">
  <input
    type="text"
    placeholder="Seleziona Commessa"
    value={commessaCreazione}
    onChange={(e) => {
      setCommessaCreazione(e.target.value);
      setShowCommessaCreazioneSuggestions(true);
    }}
    onClick={(e) => {
      e.stopPropagation();
      setShowCommessaCreazioneSuggestions(true);
    }}
    className="w-200"
  />
  {showCommessaCreazioneSuggestions && (
    <ul className="suggestions-list w-200">
      {suggestionsCommessa
        .filter((numero) =>
          numero.toLowerCase().includes(commessaCreazione.toLowerCase())
        )
        .map((numero, index) => (
          <li
            key={index}
            onClick={() => {
              const commessa = commesse.find(c => c.numero_commessa === numero);
              if (commessa) {
                setSelectedCommessaId(commessa.commessa_id);
                setSelectedCommessa(commessa);
                setCommessaCreazione(numero);
              }
              setShowCommessaCreazioneSuggestions(false);
            }}
          >
            {numero}
          </li>
        ))}
    </ul>
  )}
</div>


          <button
  onClick={handleCreateNewScheda}
  className="btn w-200 btn--blue btn--pill"
  disabled={!selectedCommessaId}
>
  Crea Nuova scheda
</button>
<h3>Filtri</h3>
<div className="suggestion-wrapper w-200">
  <input
  type="text"
  placeholder="Cerca per Numero Commessa"
  value={commessaFilter}
  onChange={(e) => {
  setCommessaFilter(e.target.value);
  setShowFiltroSuggestions(true);
}}
  onClick={(e) => e.stopPropagation()}
  className="w-200"
/>
  {showFiltroSuggestions && (
    <ul className="suggestions-list w-200">
      {suggestionsCommessa
        .filter(numero =>
          numero.toLowerCase().includes(commessaFilter.toLowerCase())
        )
        .map((numero, index) => (
          <li
            key={index}
            onClick={() => {
              setCommessaFilter(numero);
              setShowFiltroSuggestions(false);
            }}
          >
            {numero}
          </li>
        ))}
    </ul>
  )}
</div>

          </div> 

                              <select
  value={tipoFilter}
  onChange={(e) => setTipoFilter(e.target.value)}
  className="w-200"
>
  <option value="">Tutti i tipi</option>
  {tipiSchedeDisponibili.map((tipo, index) => (
    <option key={index} value={tipo}>
      {tipo}
    </option>
  ))}
</select>
            </div>
            </div>

      )}

      

      {/* CONTAINER PRINCIPALE: la tabella si sposta se il menu a burger è aperto */}
      <div className={`container ${isBurgerMenuOpen ? "shifted" : ""}`}>
        {/* Tabella delle commesse */}
        <table>
          <thead>
          <tr>
            <th>Commessa</th>
            <th>Scheda</th>
             <th>Creazione</th>
            <th>Ultima modifica</th>
            <th>Azioni</th>
          </tr>
          </thead>
           <tbody>
            {applyFilters().map((scheda) => (
              <tr key={scheda.id}>
                <td>{scheda.numero_commessa}</td>
                <td>{scheda.tipo}</td>
                 <td>{scheda.creato_da_nome} il {formatDateTime(scheda.data_creazione
                  
                 )}</td>
                <td>{formatDateTime(scheda.data_modifica)}</td>
                <td>
                  <button className="btn w-100 btn--warning btn--pill" onClick={() => handleEditScheda(scheda)}>
                    Modifica
                  </button>
                  <button
                    className="btn w-100 btn--danger btn--pill"
                    onClick={() => handleDelete(scheda.id)}
                    disabled={deleteLoadingId === scheda.id}
                  >
                    {deleteLoadingId === scheda.id ? "Eliminazione..." : "Elimina"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Popup per la creazione/modifica della commessa */}
{showPopup && (
  <SchedaTecnica
     editable={true}
    commessaId={selectedCommessa?.commessa_id || schedaInModifica?.commessa_id}
    numero_commessa={selectedCommessa?.numero_commessa|| schedaInModifica?.numero_commessa}
    schedaInModifica={schedaInModifica}
    setSchedaInModifica={setSchedaInModifica}
    onClose={handleClosePopup}
    isEditing={isEditing}
    reparti={reparti}
    fetchCommesse={loadData}
  />
)}
      </div>
    </div>
  );
}

export default SchedeTecnicheTable;
