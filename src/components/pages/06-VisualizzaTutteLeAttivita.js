import React, { useState, useEffect, useRef } from "react";
import logo from "../img/Animation - 1738249246846.gif";

// Import popup per la gestione/creazione/modifica dell'attività
import AttivitaCrea from "../popup/AttivitaCrea";

// Import per filtri persistenti
import { usePersistedFilters } from "../assets/usePersistedFilters";

// Import Toastify per notifiche
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

// Import icone per il menu a burger
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEyeSlash } from "@fortawesome/free-solid-svg-icons";

function VisualizzaTutteLeAttivita() {
  /* ===============================
     STATO DEI DATI PRINCIPALI
  =============================== */
  const [attivitaProgrammate, setAttivitaProgrammate] = useState([]);
  const [attivitaDefinite, setAttivitaDefinite] = useState([]);
  const [commesse, setCommesse] = useState([]);
  const [risorse, setRisorse] = useState([]);
  const [reparti, setReparti] = useState([]);
  const [attivitaConReparto, setattivitaConReparto] = useState([]);
  const [showStateDropdown, setShowStateDropdown] = useState(false);
  const [showActivityDropdown, setShowActivityDropdown] = useState(false);
  const token = sessionStorage.getItem("token");
  /* ===============================
     STATO DEI FILTRI E DEI DATI FILTRATI
  =============================== */
  const [filteredRisorse, setFilteredRisorse] = useState([]);
  const [filteredActivities, setFilteredActivities] = useState([]);
  const [attivitaFiltrate, setAttivitaFiltrate] = useState([]);

  // Stato per i filtri persistenti
  const [filters, setFilters] = usePersistedFilters("savedFilters_AssegnaAttivita", {
    reparto_id: "",
    commessa_id: "",
    risorsa_id: "",
    attivita_id: [],
    stati: [],
  });
  
  // Suggerimenti per la ricerca della commessa
  const [commessaSuggestions, setCommessaSuggestions] = useState([]);

  /* ===============================
     STATO DEL FORM E DEL POPUP
  =============================== */
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

  /* ===============================
     STATO PER IL MENU A BURGER
  =============================== */
  const [isBurgerMenuOpen, setIsBurgerMenuOpen] = useState(false);

  // Riferimenti per i dropdown custom (filtri)
  const activityDropdownRef = useRef(null);
  const stateDropdownRef = useRef(null);

  /* ===============================
     USEEFFECT PER INIZIALIZZAZIONE E CARICAMENTO DATI
  =============================== */
  // (Facoltativo) useEffect per eventuale logica in modalità modifica
  useEffect(() => {
    if (isEditing && editId) {
      // Logica specifica per l'editing (se necessaria)
    }
  }, [isEditing, editId]);

  // Applica i filtri ogni volta che cambiano i filtri o le attività programmate
  useEffect(() => {
    applyFilters();
  }, [filters, attivitaProgrammate]);

  // Carica i dati iniziali da API
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

        // Imposta i dati negli stati corrispondenti
        setCommesse(commesseData);
        setRisorse(risorseData);
        setReparti(repartiData);
        setAttivitaDefinite(attivitaDefiniteData);
        setAttivitaProgrammate(attivitaProgrammateData);
        setAttivitaFiltrate(attivitaProgrammateData);
        setFilteredRisorse(risorseData);

        // Trasforma le attività per includere "reparto_id"
        const attivitaConReparto = attivitaDefiniteData.map((attivita) => ({
          id: attivita.id,
          nome_attivita: attivita.nome || attivita.nome_attivita || "Nome non disponibile",
          reparto_id: attivita.reparto_id,
        }));
        setattivitaConReparto(attivitaConReparto);

        // Filtra le attività uniche (basandosi sul nome)
setAttivitaDefinite(attivitaDefiniteData); // mantiene tutto, incluso reparto_id

const uniqueActivities = Array.from(
  new Set(attivitaDefiniteData.map((att) => att.nome_attivita))
).map((nome) => ({ nome }));
setFilteredActivities(uniqueActivities); // usato solo per il rendering

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

  /* ===============================
     GESTIONE DEL FORM (MODIFICA/CREAZIONE)
  =============================== */
  // Apertura del popup in modalità modifica: precompila il form con i dati dell'attività
  const handleEdit = (attivita) => {
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
      durata: attivita.durata && attivita.durata !== "-" ? attivita.durata : "",
      descrizione: attivita.descrizione_attivita || "",
    });

    setIsEditing(true);
    setEditId(attivita.id);
    setShowPopup(true);
  };

  /* ===============================
     FILTRI E ORDINAMENTO DELLE ATTIVITÀ
  =============================== */
  // Applica i filtri alle attività programmate
  const applyFilters = () => {
    let filtered = Array.isArray(attivitaProgrammate) ? [...attivitaProgrammate] : [];
  
    // Rimuove attività nulle o senza ID
    filtered = filtered.filter(att => att && att.id);
  
    if (filters.reparto_id) {
      const repartoNome = reparti.find(
        (reparto) => reparto.id === parseInt(filters.reparto_id)
      )?.nome;
      if (repartoNome) {
        filtered = filtered.filter((att) => att.reparto === repartoNome);
      }
    }
  
    if (filters.commessa_id && filters.commessa_id.trim() !== "") {
      filtered = filtered.filter((att) => {
        let numeroCommessa;
        if (att.numero_commessa && typeof att.numero_commessa === "object") {
          numeroCommessa = att.numero_commessa.numero_commessa;
        } else {
          numeroCommessa = att.numero_commessa;
        }
        return String(numeroCommessa).includes(String(filters.commessa_id));
      });
    }
  
    if (filters.risorsa_id) {
      filtered = filtered.filter(
        (att) => att.risorsa_id === parseInt(filters.risorsa_id)
      );
    }
  
    if (filters.attivita_id.length > 0) {
      filtered = filtered.filter((att) =>
        filters.attivita_id.includes(att.nome_attivita)
      );
    }
  
    if (filters.stati.length > 0) {
      filtered = filtered.filter((att) =>
        filters.stati.includes(String(att.stato))
      );
    }
  
    setAttivitaFiltrate(Array.isArray(filtered) ? filtered : []);
  };
  
  // Gestione dei cambiamenti nei filtri
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
      commesse.filter((commessa) => {
        let numeroCommessa;
        if (commessa.numero_commessa && typeof commessa.numero_commessa === "object") {
          numeroCommessa = commessa.numero_commessa.numero_commessa;
        } else {
          numeroCommessa = commessa.numero_commessa;
        }
        return numeroCommessa.toLowerCase().includes(value.toLowerCase());
      })
    );
  };

  // Selezione di un suggerimento per la commessa
  const selectCommessaSuggestion = (numeroCommessa) => {
    setFilters((prev) => ({ ...prev, commessa_id: String(numeroCommessa) }));
    setCommessaSuggestions([]);
  };
  
  // Pulsante per aprire il popup in modalità creazione
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
        await deleteAttivitaCommessa(id, token, {
          headers: { Authorization: `Bearer ${token}` },
        });
        // Dopo la cancellazione, ricarica le attività
        await handleReloadActivities();
      } catch (error) {
        console.error("Errore durante l'eliminazione dell'attività:", error);
        toast.error("Si è verificato un errore durante l'eliminazione dell'attività.");
      }
    }
  };

  // Ricarica le attività programmate dalla API
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

  // Chiude i suggerimenti se si clicca fuori dalla lista
  const closeSuggestions = (e) => {
    if (!e.target.closest(".suggestions-list") && !e.target.closest("select")&&
  !e.target.closest(".dropdown-menu")) {
      setCommessaSuggestions([]);
    }
  };

  /* ===============================
     GESTIONE DEI DROPDOWN CUSTOM
  =============================== */
  // Toggle per il dropdown delle attività
  const toggleActivityDropdown = () => {
    setShowActivityDropdown((prev) => !prev);
  };

  // Toggle per il dropdown dello stato
  const toggleStateDropdown = () => {
    setShowStateDropdown((prev) => !prev);
  };

  // useEffect per chiudere i dropdown cliccando fuori
  useEffect(() => {
    const handleClickOutside = (e) => {
if (
  !e.target.closest(".suggestions-list") &&
  !e.target.closest("select") &&
  !e.target.closest(".dropdown-menu") &&
  !e.target.closest(".dropdown-label") // <--- aggiunto
) {
  setShowActivityDropdown(false);
}

    };
    document.addEventListener("click", handleClickOutside);
    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, []);

  /* ===============================
     GESTIONE DEL MENU A BURGER
  =============================== */
  // Toggle per aprire/chiudere il menu a burger che contiene filtri e opzioni
  const toggleBurgerMenu = () => {
    setIsBurgerMenuOpen((prev) => !prev);
  };

  /* ===============================
     RENDER DEL COMPONENTE
  =============================== */
  return (
    <div className="page-wrapper" onClick={closeSuggestions}>
      {loading && (
        <div className="loading-overlay">
          <img src={logo} alt="Logo" className="logo-spinner" />
        </div>
      )}

      {/* HEADER */}
      <div className=" header">
      <div className="flex-center header-row">
        <ToastContainer position="top-left" autoClose={2000} hideProgressBar />
        <h1>TUTTE LE ATTIVITA'</h1>
      </div>
                   {/* Bottone per aprire/chiudere il menu */}
            <div className="burger-header" >
        <button onClick={toggleBurgerMenu} className="btn w-200 btn--shiny btn--pill">
          Filtri ed Opzioni
        </button>
        </div>
        </div>
      {/* MENU A BURGER PER FILTRI ED OPZIONI */}
      {isBurgerMenuOpen && (
        <div className="burger-menu">
          <div className="burger-menu-header">
            <button onClick={toggleBurgerMenu} className="btn w-50 btn--ghost">
              <FontAwesomeIcon icon={faEyeSlash} className="burger-menu-close" />
            </button>
          </div>
          <div className="burger-menu-content">
              <h3>Azioni</h3>
              {/* Bottone per aggiungere una nuova attività */}
              <button onClick={handleAddNew} className="btn w-200 btn--blue btn--pill">
                Aggiungi Attività
              </button>
              <h3>Filtri</h3>
               <div className="suggestion-wrapper w-200 ">
                <input
                  type="text"
                  value={filters.commessa_id ? String(filters.commessa_id) : ""}
                  onChange={handleCommessaInputChange}
                  placeholder="Cerca commessa..."
                  className="w-200"
                />
                {commessaSuggestions.length > 0 && (
                  <ul className="suggestions-list w-200">
                    {commessaSuggestions
                      .filter((commessa) => {
                        let numeroCommessa;
                        if (commessa.numero_commessa && typeof commessa.numero_commessa === "object") {
                          numeroCommessa = commessa.numero_commessa.numero_commessa;
                        } else {
                          numeroCommessa = commessa.numero_commessa;
                        }
                        return String(numeroCommessa).includes(String(filters.commessa_id));
                      })
                      .map((commessa, index) => (
                        <li key={index} onClick={() => selectCommessaSuggestion(
                          commessa.numero_commessa && typeof commessa.numero_commessa === "object"
                            ? commessa.numero_commessa.numero_commessa
                            : commessa.numero_commessa
                        )}>
                          {commessa.numero_commessa && typeof commessa.numero_commessa === "object"
                            ? commessa.numero_commessa.numero_commessa
                            : String(commessa.numero_commessa)}
                        </li>
                      ))}
                  </ul>
                )}
 </div>

                <select
                  name="reparto_id"
                  value={filters.reparto_id}
                  onChange={handleFilterChange}
                  className="w-200"
                >
                  <option value="">Seleziona reparto</option>
                  {reparti.map((reparto) => (
                    <option key={reparto.id} value={reparto.id}>
                      {reparto.nome}
                    </option>
                  ))}
                </select>
                <select
                  name="risorsa_id"
                  value={filters.risorsa_id}
                  onChange={handleFilterChange}
                  className="w-200 "
           
                >
                  <option value="">Seleziona risorsa</option>
                  {filteredRisorse.map((risorsa) => (
                    <option  key={risorsa.id} value={risorsa.id}>
                      {risorsa.nome}
                    </option>
                  ))}
                </select>

              <div className="suggestion-wrapper w-200" ref={activityDropdownRef}>
                <label onClick={toggleActivityDropdown} className="dropdown-label w-200">
                  Seleziona attività
                </label>
                {showActivityDropdown && (
                  <div className="dropdown-menu w-200" >
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

              <div className="suggestion-wrapper w-200" ref={stateDropdownRef}>
                <label onClick={toggleStateDropdown} className="dropdown-label w-200">
                  Seleziona stato
                </label>
                {showStateDropdown && (
                  <div className="dropdown-menu w-200">
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
          </div>
      )}
      
      {/* CONTENITORE PRINCIPALE: la tabella si sposta a destra se il menu a burger è aperto */}
      <div className={`container ${isBurgerMenuOpen ? "shifted" : ""}`} onClick={closeSuggestions}>

        {/* Tabella delle attività filtrate */}
         <div className= "Reparto-table-container mh-76  ">
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
              {Array.isArray(attivitaFiltrate) && attivitaFiltrate.length > 0 ? (
                attivitaFiltrate.map((attivita) => {
                  if (!attivita) return null;
                  return (
                    <tr key={attivita.id || Math.random()}>
                      <td>
                        {attivita.numero_commessa
                          ? typeof attivita.numero_commessa === "object"
                            ? attivita.numero_commessa.numero_commessa
                            : String(attivita.numero_commessa)
                          : "N/A"}
                      </td>
                      <td>{attivita.risorsa ? String(attivita.risorsa) : "N/A"}</td>
                      <td>{attivita.reparto ? String(attivita.reparto) : "N/A"}</td>
                      <td>{attivita.nome_attivita ? String(attivita.nome_attivita) : "N/A"}</td>
                      <td>
                        {attivita.data_inizio
                          ? new Date(attivita.data_inizio).toLocaleDateString()
                          : "Non definita"}
                      </td>
                      <td>{attivita.durata ? `${attivita.durata} giorni` : "N/A"}</td>
                      <td>
                        {attivita.stato === 0
                          ? "Non iniziata"
                          : attivita.stato === 1
                          ? "Iniziata"
                          : attivita.stato === 2
                          ? "Completata"
                          : "Sconosciuto"}
                      </td>
                      <td>
                        <button className="btn w-100 btn--warning btn--pill" onClick={() => handleEdit(attivita)}>
                          Modifica
                        </button>
                        <button className="btn w-100 btn--danger btn--pill" onClick={() => handleDelete(attivita.id)}>
                          Elimina
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="8">Nessuna attività trovata</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

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
    </div>
  );
}

export default VisualizzaTutteLeAttivita;
