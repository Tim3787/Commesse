import React, { useState, useEffect } from "react";
import "../style.css";
import logo from "../img/Animation - 1738249246846.gif";

// Import del popup per la creazione/modifica della commessa
import CommessaCrea from "../popup/CommessaCrea";

// Import Toastify per le notifiche
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Import API
import { fetchCommesse, deleteCommessa } from "../services/API/commesse-api";
import { fetchReparti } from "../services/API/reparti-api";
import { fetchAttivita } from "../services/API/attivita-api";
import { fetchStatiCommessa } from "../services/API/statoCommessa-api";

// Import icone per il menu a burger
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEyeSlash } from "@fortawesome/free-solid-svg-icons";


function GestioneCommesse() {
  /* ===============================
     STATO DEL COMPONENTE
  =============================== */
  const [commesse, setCommesse] = useState([]);
  const [reparti, setReparti] = useState([]);
  const [attivita, setAttivita] = useState([]);
  const [statiCommessa, setStatiCommessa] = useState([]);

  // Stati per la gestione della commessa selezionata (per modifica/creazione)
  const [selectedCommessa, setSelectedCommessa] = useState(null);
  const [editId, setEditId] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [selezioniAttivita, setSelezioniAttivita] = useState({});

  // Stati per il caricamento e per il pulsante di eliminazione
  const [loading, setLoading] = useState(false);
  const [deleteLoadingId, setDeleteLoadingId] = useState(null);

  // Stati per i filtri di ricerca
  const [clienteFilter, setClienteFilter] = useState("");
  const [tipoMacchinaFilter, setTipoMacchinaFilter] = useState("");
  const [commessaFilter, setCommessaFilter] = useState("");

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
      toast.error("Errore durante il caricamento dei dati.");
    } finally {
      setLoading(false);
    }
  };

  /* ===============================
     GESTIONE DELLA CREAZIONE/MODIFICA
  =============================== */
  // Apre il popup per creare una nuova commessa
  const handleCreateNewCommessa = () => {
    setIsEditing(false);
    setSelectedCommessa(null);
    setShowPopup(true);
  };

  // Apre il popup per modificare una commessa esistente
  const handleEditCommessa = (commessa) => {
    setIsEditing(true);
    setSelectedCommessa(commessa);
    setEditId(commessa.commessa_id);
    setShowPopup(true);
  };

  // Chiude il popup e resetta gli stati di modifica/creazione
  const handleClosePopup = () => {
    setShowPopup(false);
    setSelectedCommessa(null);
    setEditId(null);
  };

  // Gestione dell'eliminazione di una commessa
  const handleDelete = async (commessaId) => {
    if (window.confirm("Sei sicuro di voler eliminare questa commessa?")) {
      setDeleteLoadingId(commessaId);
      try {
        await deleteCommessa(commessaId);
        toast.success("Commessa eliminata con successo!");
        await loadData();
      } catch (error) {
        console.error("Errore durante l'eliminazione della commessa:", error);
        toast.error("Errore durante l'eliminazione della commessa.");
      } finally {
        setDeleteLoadingId(null);
      }
    }
  };

  /* ===============================
     FILTRAGGIO DEI DATI
  =============================== */
  const applyFilters = () => {
    return commesse.filter((commessa) => {
      return (
        commessa.numero_commessa.toString().includes(commessaFilter) &&
        commessa.cliente.toLowerCase().includes(clienteFilter.toLowerCase()) &&
        commessa.tipo_macchina.toLowerCase().includes(tipoMacchinaFilter.toLowerCase())
      );
    });
  };

  // Funzione helper per ottenere il nome dello stato dalla commessa
  const getStatoNome = (id) => {
    const stato = statiCommessa.find((stato) => stato.id === id);
    return stato ? stato.nome_stato : "Non assegnato";
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
      <ToastContainer position="top-left" autoClose={3000} hideProgressBar />
      {loading && (
        <div className="loading-overlay">
          <img src={logo} alt="Logo" className="logo-spinner" />
        </div>
      )}

      {/* HEADER */}
      <div className="header">
        <h1>Gestione Commesse</h1>
        
      </div>

      {/* MENU A BURGER: pannello dei filtri (visibile solo se aperto) */}
      {isBurgerMenuOpen && (
        <div className="burger-menu">
          <div className="burger-menu-header">
            {/* Bottone per chiudere il burger menu */}
            <button onClick={toggleBurgerMenu} className="close-burger">
              <FontAwesomeIcon icon={faEyeSlash} className="settings-icon" />
            </button>
          </div>
          <div className="burger-menu-content">
          <div className="filters-burger">
          <h3>Azioni</h3>
              {/* Bottone per aggiungere una nuova commessa*/}
          <button onClick={handleCreateNewCommessa} className="btn btn-primary create-activity-btn">
          Crea Nuova Commessa
        </button>
        </div> 
            <div className="filters-burger">
            <h3>Filtri</h3>
            {/* Sezione Filtri: sposta qui la sezione dei filtri */}
             <div className="filter-group">
              <input
                type="text"
                placeholder="Numero Commessa"
                value={commessaFilter}
                onChange={(e) => setCommessaFilter(e.target.value)}
                className="input-field"
              />
              <input
                type="text"
                placeholder="Cliente"
                value={clienteFilter}
                onChange={(e) => setClienteFilter(e.target.value)}
                className="input-field"
              />
              <input
                type="text"
                placeholder="Tipo Macchina"
                value={tipoMacchinaFilter}
                onChange={(e) => setTipoMacchinaFilter(e.target.value)}
                className="input-field"
              />
            </div>
            </div>
          </div>
        </div>
      )}

      

      {/* CONTAINER PRINCIPALE: la tabella si sposta se il menu a burger è aperto */}
      <div className={`main-container ${isBurgerMenuOpen ? "shifted" : ""}`}>
        {/* Bottone per aprire/chiudere il burger menu */}
      <button onClick={toggleBurgerMenu} className="burger-icon">
        Filtri ed Opzioni
      </button>
        {/* Tabella delle commesse */}
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
                <td>
                  {commessa.data_FAT
                    ? new Date(commessa.data_FAT).toLocaleDateString()
                    : "-"}
                </td>
                <td>{getStatoNome(commessa.stato)}</td>
                <td>
                  <button className="btn btn-warning" onClick={() => handleEditCommessa(commessa)}>
                    Modifica
                  </button>
                  <button
                    className="btn btn-danger"
                    onClick={() => handleDelete(commessa.commessa_id)}
                    disabled={deleteLoadingId === commessa.commessa_id}
                  >
                    {deleteLoadingId === commessa.commessa_id ? "Eliminazione..." : "Elimina"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Popup per la creazione/modifica della commessa */}
        {showPopup && (
          <CommessaCrea
            commessa={selectedCommessa}
            onClose={handleClosePopup}
            isEditing={isEditing}
            reparti={reparti}
            attivita={attivita}
            selezioniAttivita={selezioniAttivita}
            setSelezioniAttivita={setSelezioniAttivita}
            fetchCommesse={loadData}
            editId={editId}
            stato_commessa={statiCommessa}
          />
        )}
      </div>
    </div>
  );
}

export default GestioneCommesse;
