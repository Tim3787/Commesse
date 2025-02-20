import React, { useState, useEffect, useRef } from "react";
import "../style.css";
import logo from "../img/Animation - 1738249246846.gif";

// Import popup
import AttivitaCrea from "../popup/AttivitaCrea";

// Import sset per filtri
import { usePersistedFilters } from "../assets/usePersistedFilters";

// Import per Toastify (notifiche)
import "react-toastify/dist/ReactToastify.css";
import { ToastContainer, toast } from "react-toastify";

// Import API
import { fetchAttivita } from "../services/API/attivita-api";
import { fetchReparti } from "../services/API/reparti-api";
import { fetchRisorse } from "../services/API/risorse-api";
import {
  fetchAttivitaCommessa,
  deleteAttivitaCommessa,
} from "../services/API/attivitaCommesse-api";
import { fetchCommesse } from "../services/API/commesse-api";


function VisualizzaTutteLeAttivita() {
  /* ===============================
     STATO DEL COMPONENTE
  =============================== */
  const [attivitaProgrammate, setAttivitaProgrammate] = useState([]);
  const [attivitaDefinite, setAttivitaDefinite] = useState([]);
  const [commesse, setCommesse] = useState([]);
  const [risorse, setRisorse] = useState([]);
  const [reparti, setReparti] = useState([]);
  const [attivitaConReparto, setattivitaConReparto] = useState([]);
  
  // Stati per i dati filtrati
  const [filteredRisorse, setFilteredRisorse] = useState([]);
  const [filteredActivities, setFilteredActivities] = useState([]);
  const [attivitaFiltrate, setAttivitaFiltrate] = useState([]);

  // Stati per la gestione dei dropdown custom
  const [showStateDropdown, setShowStateDropdown] = useState(false);
  const [showActivityDropdown, setShowActivityDropdown] = useState(false);
  const activityDropdownRef = useRef(null);
  const stateDropdownRef = useRef(null);

  // Stato per i filtri persistenti
  const [filters, setFilters] = usePersistedFilters("savedFilters_AssegnaAttivita", {
    reparto_id: "",
    commessa_id: "",
    risorsa_id: "",
    attivita_id: [],
    stati: [],
  });

  // Stato per i suggerimenti nella ricerca della commessa
  const [commessaSuggestions, setCommessaSuggestions] = useState([]);

  // Stati per il caricamento e la gestione del popup/form
  const [loading, setLoading] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [formData, setFormData] = useState({
    commessa_id: "",
    reparto_id: "",
    risorsa_id: "",
    attivita_id: "",
    data_inizio: "",
    durata: "",
    stato: "",
    descrizione: "",
  });
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);

  // useEffect per l'inizializzazione (quando si modifica un'attività)
  useEffect(() => {
    if (isEditing && editId) {
      // Qui potresti aggiungere logica specifica per l'editing se necessario
    }
  }, [isEditing, editId]);

  // Applica i filtri ogni volta che cambiano i filtri o le attività programmate
  useEffect(() => {
    applyFilters();
  }, [filters, attivitaProgrammate]);

  // useEffect per il caricamento iniziale dei dati da API
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);

        const [
          commesseData,
          risorseData,
          repartiData,
          attivitaDefiniteData,
          attivitaProgrammateData,
        ] = await Promise.all([
          fetchCommesse(),
          fetchRisorse(),
          fetchReparti(),
          fetchAttivita(),
          fetchAttivitaCommessa(),
        ]);

        // Imposta i dati nello stato
        setCommesse(commesseData);
        setRisorse(risorseData);
        setReparti(repartiData);
        setAttivitaDefinite(attivitaDefiniteData);
        setAttivitaProgrammate(attivitaProgrammateData);
        setAttivitaFiltrate(attivitaProgrammateData);
        setFilteredRisorse(risorseData);

        // Trasforma le attività per includere reparto_id
        const attivitaConReparto = attivitaDefiniteData.map((attivita) => ({
          id: attivita.id,
          nome_attivita: attivita.nome || attivita.nome_attivita || "Nome non disponibile",
          reparto_id: attivita.reparto_id,
        }));
        setattivitaConReparto(attivitaConReparto);

        // Filtra attività uniche basandosi sul nome
        const uniqueActivities = Array.from(
          new Set(attivitaDefiniteData.map((att) => att.nome_attivita))
        ).map((nome) => ({ nome }));
        setAttivitaDefinite(uniqueActivities);
        setFilteredActivities(uniqueActivities);

        // Imposta un ID di modifica iniziale se esistono attività programmate
        if (attivitaProgrammateData.length > 0) {
          setEditId(attivitaProgrammateData[0].id);
        }
      } catch (error) {
        console.error("Errore durante il caricamento dei dati iniziali:", error);
        toast.error("Errore nel caricamento dei dati.");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Funzione per aprire il popup in modalità modifica
  const handleEdit = (attivita) => {
    // Controlla se data_inizio è una data valida e la formatta in YYYY-MM-DD
    const dataInizio =
      attivita.data_inizio && attivita.data_inizio !== "-"
        ? new Date(attivita.data_inizio).toISOString().split("T")[0]
        : "";

    setFormData({
      commessa_id: attivita.commessa_id || "",
      reparto_id: reparti.find((reparto) => reparto.nome === attivita.reparto)?.id || "",
      risorsa_id: risorse.find((risorsa) => risorsa.nome === attivita.risorsa)?.id || "",
      attivita_id: attivita.attivita_id || "",
      stato: attivita.stato || "",
      data_inizio: dataInizio,
      durata:
        attivita.durata && attivita.durata !== "-" ? attivita.durata : "",
      descrizione: attivita.descrizione_attivita || "",
    });

    setIsEditing(true);
    setEditId(attivita.id);
    setShowPopup(true);
  };

  // Funzione per applicare i filtri alle attività programmate
  const applyFilters = () => {
    let filtered = attivitaProgrammate;

    // Filtro per reparto
    if (filters.reparto_id) {
      const repartoNome = reparti.find(
        (reparto) => reparto.id === parseInt(filters.reparto_id)
      )?.nome;
      if (repartoNome) {
        filtered = filtered.filter((att) => att.reparto === repartoNome);
        const relatedActivities = attivitaDefinite.filter((act) =>
          filtered.some((att) => att.nome_attivita === act.nome)
        );
        setFilteredActivities(relatedActivities);
      }
    }

    // Filtro per commessa
    if (filters.commessa_id) {
      filtered = filtered.filter((att) =>
        att.numero_commessa.includes(filters.commessa_id)
      );
    }

    // Filtro per risorsa
    if (filters.risorsa_id) {
      filtered = filtered.filter(
        (att) => att.risorsa_id === parseInt(filters.risorsa_id)
      );
    }

    // Filtro per attività (nome attività)
    if (filters.attivita_id.length > 0) {
      filtered = filtered.filter((att) =>
        filters.attivita_id.includes(att.nome_attivita)
      );
    }

    // Filtro per stati
    if (filters.stati.length > 0) {
      filtered = filtered.filter((att) =>
        filters.stati.includes(att.stato.toString())
      );
    }
    setAttivitaFiltrate(filtered);
  };

  // Gestione delle modifiche ai filtri
  const handleFilterChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (type === "checkbox" && name === "attivita_id") {
      setFilters((prev) => ({
        ...prev,
        attivita_id: checked
          ? [...prev.attivita_id, value]
          : prev.attivita_id.filter((id) => id !== value),
      }));
    } else if (type === "checkbox" && name === "stati") {
      setFilters((prev) => ({
        ...prev,
        stati: checked
          ? [...prev.stati, value]
          : prev.stati.filter((stato) => stato !== value),
      }));
    } else if (name === "reparto_id") {
      const repartoId = parseInt(value, 10);

      if (repartoId) {
        // Filtra risorse e attività in base al reparto selezionato
        const filteredRisorse = risorse.filter(
          (risorsa) => risorsa.reparto_id === repartoId
        );
        setFilteredRisorse(filteredRisorse);

        const filteredActivities = attivitaDefinite.filter(
          (attivita) => attivita.reparto_id === repartoId
        );
        setFilteredActivities(filteredActivities);
      } else {
        setFilteredRisorse(risorse);
        setFilteredActivities(attivitaDefinite);
      }

      setFilters((prev) => ({
        ...prev,
        reparto_id: value,
        risorsa_id: "",
        attivita_id: [],
      }));
    } else {
      setFilters((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  // Gestione dell'input per la ricerca della commessa
  const handleCommessaInputChange = (e) => {
    const value = e.target.value;
    setFilters((prev) => ({ ...prev, commessa_id: value }));
    setCommessaSuggestions(
      commesse.filter((commessa) =>
        commessa.numero_commessa.toLowerCase().includes(value.toLowerCase())
      )
    );
  };

  // Selezione di un suggerimento per la commessa
  const selectCommessaSuggestion = (numeroCommessa) => {
    setFilters((prev) => ({ ...prev, commessa_id: numeroCommessa }));
    setCommessaSuggestions([]);
  };

  // Gestione del pulsante "Aggiungi Attività" per aprire il popup in modalità creazione
  const handleAddNew = () => {
    setFormData({
      commessa_id: "",
      reparto_id: "",
      risorsa_id: "",
      attivita_id: "",
      data_inizio: "",
      durata: "",
      stato: "",
      descrizione: "",
    });
    setIsEditing(false);
    setShowPopup(true);
  };

  // Gestione dell'eliminazione di un'attività programmata
  const handleDelete = async (id) => {
    if (window.confirm("Sei sicuro di voler eliminare questa attività?")) {
      try {
        await deleteAttivitaCommessa(id);

        // Aggiorna gli stati locali eliminando l'attività eliminata
        setAttivitaFiltrate((prev) =>
          prev.filter((attivita) => attivita.id !== id)
        );
        setAttivitaProgrammate((prev) =>
          prev.filter((attivita) => attivita.id !== id)
        );
      } catch (error) {
        console.error("Errore durante l'eliminazione dell'attività:", error);
        toast.error("Errore durante l'eliminazione dell'attività");
      }
    }
  };

  // Funzione per ricaricare le attività programmate da API
  const handleReloadActivities = async () => {
    try {
      const updatedActivities = await fetchAttivitaCommessa();
      setAttivitaProgrammate(updatedActivities);
      setAttivitaFiltrate(updatedActivities);
    } catch (error) {
      console.error("Errore durante il ricaricamento delle attività:", error);
      toast.error("Errore durante il ricaricamento delle attività");
    }
  };

  // Funzione per chiudere i suggerimenti se si clicca fuori dalla lista
  const closeSuggestions = (e) => {
    if (
      !e.target.closest(".suggestions-list") &&
      !e.target.closest("select")
    ) {
      setCommessaSuggestions(false);
    }
  };

  // Funzioni per il toggle dei dropdown (attività e stato)
  const toggleStateDropdown = () => {
    setShowStateDropdown((prev) => !prev);
  };

  const toggleActivityDropdown = () => {
    setShowActivityDropdown((prev) => !prev);
  };

  // useEffect per chiudere i dropdown cliccando fuori
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        activityDropdownRef.current &&
        !activityDropdownRef.current.contains(e.target)
      ) {
        setShowActivityDropdown(false);
      }
      if (
        stateDropdownRef.current &&
        !stateDropdownRef.current.contains(e.target)
      ) {
        setShowStateDropdown(false);
      }
    };

    document.addEventListener("click", handleClickOutside);

    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, []);

  return (
    <div className="container" onClick={closeSuggestions}>
      {loading && (
        <div className="loading-overlay">
          <img src={logo} alt="Logo" className="logo-spinner" />
        </div>
      )}

      <div className="header">
        <ToastContainer position="top-left" autoClose={3000} hideProgressBar />
        <h1>Attività</h1>
      </div>
      <button
        onClick={handleAddNew}
        className="btn btn-primary create-activity-btn"
      >
        Aggiungi Attività
      </button>

      {/* Sezione dei filtri */}
      <div className="filters">
        <div className="filter-group">
          <input
            type="text"
            value={filters.commessa_id}
            onChange={handleCommessaInputChange}
            placeholder="Cerca commessa..."
            className="input-field"
          />
          {commessaSuggestions.length > 0 && (
            <ul className="suggestions-list">
              {commessaSuggestions.map((commessa) => (
                <li
                  key={commessa.id}
                  onClick={() =>
                    selectCommessaSuggestion(commessa.numero_commessa)
                  }
                >
                  {commessa.numero_commessa}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="filter-group">
          <select
            name="reparto_id"
            value={filters.reparto_id}
            onChange={handleFilterChange}
            className="input-field"
          >
            <option value="">Seleziona reparto</option>
            {reparti.map((reparto) => (
              <option key={reparto.id} value={reparto.id}>
                {reparto.nome}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <select
            name="risorsa_id"
            value={filters.risorsa_id}
            onChange={handleFilterChange}
            className="input-field"
          >
            <option value="">Seleziona risorsa</option>
            {filteredRisorse.map((risorsa) => (
              <option key={risorsa.id} value={risorsa.id}>
                {risorsa.nome}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group" ref={activityDropdownRef}>
          <label onClick={toggleActivityDropdown} className="dropdown-label">
            Seleziona attività
          </label>
          {showActivityDropdown && (
            <div className="dropdown-menu">
              {filteredActivities.map((attivita) => (
                <label key={attivita.nome}>
                  <input
                    type="checkbox"
                    name="attivita_id"
                    value={attivita.nome}
                    checked={filters.attivita_id.includes(attivita.nome)}
                    onChange={handleFilterChange}
                  />
                  {attivita.nome}
                </label>
              ))}
            </div>
          )}
        </div>

        <div className="filter-group" ref={stateDropdownRef}>
          <label onClick={toggleStateDropdown} className="dropdown-label">
            Seleziona stato
          </label>
          {showStateDropdown && (
            <div className="dropdown-menu">
              {["0", "1", "2"].map((value) => (
                <label key={value}>
                  <input
                    type="checkbox"
                    name="stati"
                    value={value}
                    checked={filters.stati.includes(value)}
                    onChange={handleFilterChange}
                  />
                  {value === "0" && "Non iniziata"}
                  {value === "1" && "Iniziata"}
                  {value === "2" && "Completata"}
                </label>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Visualizzazione delle attività filtrate */}
      {loading ? (
        <p>Caricamento in corso...</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Commessa</th>
              <th>Risorsa</th>
              <th>Reparto</th>
              <th>Attività</th>
              <th>Data Inizio</th>
              <th>Durata</th>
              <th>Stato</th>
              <th>Azioni</th>
            </tr>
          </thead>
          <tbody>
            {attivitaFiltrate.map((attivita) => (
              <tr key={attivita.id}>
                <td>{attivita.numero_commessa}</td>
                <td>{attivita.risorsa}</td>
                <td>{attivita.reparto}</td>
                <td>{attivita.nome_attivita}</td>
                <td>
                  {attivita.data_inizio
                    ? new Date(attivita.data_inizio).toLocaleDateString()
                    : "Non definita"}
                </td>
                <td>{attivita.durata} giorni</td>
                <td>
                  {attivita.stato === 0 && "Non iniziata"}
                  {attivita.stato === 1 && "Iniziata"}
                  {attivita.stato === 2 && "Completata"}
                </td>
                <td>
                  <button
                    className="btn btn-warning"
                    onClick={() => handleEdit(attivita)}
                  >
                    Modifica
                  </button>
                  <button
                    className="btn btn-danger"
                    onClick={() => handleDelete(attivita.id)}
                  >
                    Elimina
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Popup per il form di creazione/modifica dell'attività */}
      {showPopup && (
        <AttivitaCrea
          formData={formData}
          setFormData={setFormData}
          isEditing={isEditing}
          setIsEditing={setIsEditing}
          editId={editId}
          setShowPopup={setShowPopup}
          commesse={commesse}
          reparti={reparti}
          risorse={risorse}
          attivitaDefinite={attivitaDefinite}
          attivitaConReparto={attivitaConReparto}
          reloadActivities={handleReloadActivities}
        />
      )}
    </div>
  );
}

export default VisualizzaTutteLeAttivita;


