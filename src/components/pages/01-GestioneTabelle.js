import React, { useState, useEffect } from "react";
import "../style.css";
import logo from "../img/Animation - 1738249246846.gif";

// Import per Toastify (notifiche)
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// API per Stati Commessa
import { 
  fetchStatiCommessa, 
  createStatoCommessa, 
  updateStatoCommessa, 
  deleteStatoCommessa 
} from "../services/API/statoCommessa-api";

// API per Reparti
import { 
  fetchReparti, 
  createReparto, 
  updateReparto, 
  deleteReparto 
} from "../services/API/reparti-api";

// API per Attività
import { 
  fetchAttivita, 
  createAttivita, 
  updateAttivita, 
  deleteAttivita 
} from "../services/API/attivita-api";

// API per Risorse
import { 
  fetchRisorse, 
  createRisorsa, 
  updateRisorsa, 
  deleteRisorsa 
} from "../services/API/risorse-api";

// API per Stati Avanzamento
import { 
  fetchStatiAvanzamento, 
  createStatoAvanzamento, 
  updateStatoAvanzamento, 
  deleteStatoAvanzamento,
  ordinaStatiAvanzamento
} from "../services/API/StatiAvanzamento-api";

// Import per Drag & Drop
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import DraggableColumn from "../assets/DraggableColumn"; // Assicurati che il percorso sia corretto

function GestioneTabelle() {
  // ================================
  // Stati Commessa (Global)
  // ================================
  const [statiCommessa, setStatiCommessa] = useState([]);
  const [statiCommessaLoading, setStatiCommessaLoading] = useState(false);
  const [statiCommessaFormData, setStatiCommessaFormData] = useState({ nome_stato: "" });
  const [isEditingStatiCommessa, setIsEditingStatiCommessa] = useState(false);
  const [editStatiCommessaId, setEditStatiCommessaId] = useState(null);

  // ================================
  // Reparti (Global)
  // ================================
  const [reparti, setReparti] = useState([]);
  const [repartiLoading, setRepartiLoading] = useState(false);
  const [repartiFormData, setRepartiFormData] = useState({ nome: "" });
  const [isEditingReparto, setIsEditingReparto] = useState(false);
  const [editRepartoId, setEditRepartoId] = useState(null);

  // ================================
  // Reparto selezionato per filtrare le altre sezioni
  // ================================
  const [selectedReparto, setSelectedReparto] = useState("");

  // ================================
  // Attività (Filtrate per Reparto)
  // ================================
  const [attivita, setAttivita] = useState([]);
  const [attivitaLoading, setAttivitaLoading] = useState(false);
  const [attivitaFormData, setAttivitaFormData] = useState({ nome_attivita: "", reparto_id: "" });
  const [isEditingAttivita, setIsEditingAttivita] = useState(false);
  const [editAttivitaId, setEditAttivitaId] = useState(null);

  // ================================
  // Risorse (Filtrate per Reparto)
  // ================================
  const [risorse, setRisorse] = useState([]);
  const [risorseLoading, setRisorseLoading] = useState(false);
  const [risorseFormData, setRisorseFormData] = useState({ nome: "", reparto_id: "" });
  const [isEditingRisorsa, setIsEditingRisorsa] = useState(false);
  const [editRisorsaId, setEditRisorsaId] = useState(null);

  // ================================
  // Stati Avanzamento (Filtrati per Reparto) e Riordino
  // ================================
  const [statiAvanzamento, setStatiAvanzamento] = useState([]);
  const [statiAvanzamentoLoading, setStatiAvanzamentoLoading] = useState(false);
  const [statiAvanzamentoFormData, setStatiAvanzamentoFormData] = useState({ nome_stato: "" });
  const [isEditingStatoAvanzamento, setIsEditingStatoAvanzamento] = useState(false);
  const [editStatoAvanzamentoId, setEditStatoAvanzamentoId] = useState(null);
  const [columnOrder, setColumnOrder] = useState([]);

  // ================================
  // Effetti di Caricamento Iniziale
  // ================================
  useEffect(() => {
    loadStatiCommessa();
    loadReparti();
  }, []);

  // Quando il reparto selezionato cambia, carica Attività, Risorse e Stati Avanzamento
  useEffect(() => {
    if (selectedReparto) {
      loadAttivita(selectedReparto);
      loadRisorse(selectedReparto);
      loadStatiAvanzamento(selectedReparto);
    }
  }, [selectedReparto]);

  // Quando gli Stati Avanzamento cambiano, inizializza il riordino delle colonne
  useEffect(() => {
    if (statiAvanzamento.length > 0) {
      const ordered = statiAvanzamento.slice().sort((a, b) => a.ordine - b.ordine);
      setColumnOrder(ordered);
    }
  }, [statiAvanzamento]);

  // ================================
  // Funzioni per Stati Commessa
  // ================================
  const loadStatiCommessa = async () => {
    setStatiCommessaLoading(true);
    try {
      const data = await fetchStatiCommessa();
      setStatiCommessa(data);
    } catch (error) {
      console.error("Errore nel caricamento degli stati commessa:", error);
      toast.error("Errore nel caricamento degli stati commessa.");
    } finally {
      setStatiCommessaLoading(false);
    }
  };

  const handleStatiCommessaChange = (e) => {
    const { name, value } = e.target;
    setStatiCommessaFormData({ ...statiCommessaFormData, [name]: value });
  };

  const handleStatiCommessaSubmit = async (e) => {
    e.preventDefault();
    if (!statiCommessaFormData.nome_stato) {
      toast.error("Il nome dello stato commessa è obbligatorio.");
      return;
    }
    setStatiCommessaLoading(true);
    try {
      if (isEditingStatiCommessa) {
        await updateStatoCommessa(editStatiCommessaId, statiCommessaFormData);
        toast.success("Stato commessa aggiornato!");
        setStatiCommessa((prev) =>
          prev.map((s) =>
            s.id === editStatiCommessaId ? { ...s, ...statiCommessaFormData } : s
          )
        );
      } else {
        const newStato = await createStatoCommessa(statiCommessaFormData);
        toast.success("Stato commessa creato!");
        setStatiCommessa((prev) => [...prev, newStato]);
      }
      setStatiCommessaFormData({ nome_stato: "" });
      setIsEditingStatiCommessa(false);
      setEditStatiCommessaId(null);
    } catch (error) {
      console.error("Errore nella gestione dello stato commessa:", error);
      toast.error("Errore nella gestione dello stato commessa.");
    } finally {
      setStatiCommessaLoading(false);
    }
  };

  const handleStatiCommessaEdit = (stato) => {
    setStatiCommessaFormData({ nome_stato: stato.nome_stato });
    setIsEditingStatiCommessa(true);
    setEditStatiCommessaId(stato.id);
  };

  const handleStatiCommessaDelete = async (id) => {
    if (window.confirm("Eliminare questo stato commessa?")) {
      setStatiCommessaLoading(true);
      try {
        await deleteStatoCommessa(id);
        setStatiCommessa((prev) => prev.filter((s) => s.id !== id));
        toast.success("Stato commessa eliminato!");
      } catch (error) {
        console.error("Errore nell'eliminazione dello stato commessa:", error);
        toast.error("Errore nell'eliminazione dello stato commessa.");
      } finally {
        setStatiCommessaLoading(false);
      }
    }
  };

  // ================================
  // Funzioni per Reparti
  // ================================
  const loadReparti = async () => {
    setRepartiLoading(true);
    try {
      const data = await fetchReparti();
      setReparti(data);
    } catch (error) {
      console.error("Errore nel caricamento dei reparti:", error);
      toast.error("Errore nel caricamento dei reparti.");
    } finally {
      setRepartiLoading(false);
    }
  };

  const handleRepartiChange = (e) => {
    const { name, value } = e.target;
    setRepartiFormData({ ...repartiFormData, [name]: value });
  };

  const handleRepartiSubmit = async (e) => {
    e.preventDefault();
    setRepartiLoading(true);
    try {
      if (isEditingReparto) {
        await updateReparto(editRepartoId, repartiFormData);
        toast.success("Reparto aggiornato con successo!");
        setReparti((prev) =>
          prev.map((r) => (r.id === editRepartoId ? { ...r, ...repartiFormData } : r))
        );
      } else {
        const newReparto = await createReparto(repartiFormData);
        toast.success("Reparto creato con successo!");
        setReparti((prev) => [...prev, newReparto]);
      }
      setRepartiFormData({ nome: "" });
      setIsEditingReparto(false);
      setEditRepartoId(null);
    } catch (error) {
      console.error("Errore nella gestione del reparto:", error);
      toast.error("Errore nella gestione del reparto.");
    } finally {
      setRepartiLoading(false);
    }
  };

  const handleRepartiEdit = (reparto) => {
    setRepartiFormData({ nome: reparto.nome });
    setIsEditingReparto(true);
    setEditRepartoId(reparto.id);
  };

  const handleRepartiDelete = async (id) => {
    if (window.confirm("Eliminare questo reparto?")) {
      setRepartiLoading(true);
      try {
        await deleteReparto(id);
        setReparti((prev) => prev.filter((r) => r.id !== id));
        toast.success("Reparto eliminato!");
      } catch (error) {
        console.error("Errore nell'eliminazione del reparto:", error);
        toast.error("Errore durante l'eliminazione del reparto.");
      } finally {
        setRepartiLoading(false);
      }
    }
  };

  // ================================
  // Funzioni per Attività (Filtrate per Reparto)
  // ================================
  const loadAttivita = async (repartoId) => {
    setAttivitaLoading(true);
    try {
      const data = await fetchAttivita();
      setAttivita(data.filter((a) => a.reparto_id === parseInt(repartoId)));
    } catch (error) {
      console.error("Errore nel caricamento delle attività:", error);
      toast.error("Errore nel caricamento delle attività.");
    } finally {
      setAttivitaLoading(false);
    }
  };

  useEffect(() => {
    setAttivitaFormData((prev) => ({ ...prev, reparto_id: selectedReparto }));
  }, [selectedReparto]);

  const handleAttivitaChange = (e) => {
    const { name, value } = e.target;
    setAttivitaFormData({ ...attivitaFormData, [name]: value });
  };

  const handleAttivitaSubmit = async (e) => {
    e.preventDefault();
    if (!attivitaFormData.nome_attivita) {
      toast.error("Tutti i campi sono obbligatori per le attività.");
      return;
    }
    const dataToSubmit = { ...attivitaFormData, reparto_id: selectedReparto };
    setAttivitaLoading(true);
    try {
      if (isEditingAttivita) {
        await updateAttivita(editAttivitaId, dataToSubmit);
        toast.success("Attività aggiornata!");
        setAttivita((prev) =>
          prev.map((a) => (a.id === editAttivitaId ? { ...a, ...dataToSubmit } : a))
        );
      } else {
        await createAttivita(dataToSubmit);
        toast.success("Attività creata!");
        await loadAttivita(selectedReparto);
      }
      setAttivitaFormData({ nome_attivita: "", reparto_id: selectedReparto });
      setIsEditingAttivita(false);
      setEditAttivitaId(null);
    } catch (error) {
      console.error("Errore nella gestione dell'attività:", error);
      toast.error("Errore nella gestione dell'attività.");
    } finally {
      setAttivitaLoading(false);
    }
  };

  const handleAttivitaEdit = (att) => {
    setAttivitaFormData({ nome_attivita: att.nome_attivita, reparto_id: att.reparto_id });
    setIsEditingAttivita(true);
    setEditAttivitaId(att.id);
  };

  const handleAttivitaDelete = async (id) => {
    if (window.confirm("Eliminare questa attività?")) {
      setAttivitaLoading(true);
      try {
        await deleteAttivita(id);
        setAttivita((prev) => prev.filter((a) => a.id !== id));
        toast.success("Attività eliminata!");
      } catch (error) {
        console.error("Errore nell'eliminazione dell'attività:", error);
        toast.error("Errore durante l'eliminazione dell'attività.");
      } finally {
        setAttivitaLoading(false);
      }
    }
  };

  // ================================
  // Funzioni per Risorse (Filtrate per Reparto)
  // ================================
  const loadRisorse = async (repartoId) => {
    setRisorseLoading(true);
    try {
      const data = await fetchRisorse();
      setRisorse(data.filter((r) => r.reparto_id === parseInt(repartoId)));
    } catch (error) {
      console.error("Errore nel caricamento delle risorse:", error);
      toast.error("Errore nel caricamento delle risorse.");
    } finally {
      setRisorseLoading(false);
    }
  };

  useEffect(() => {
    setRisorseFormData((prev) => ({ ...prev, reparto_id: selectedReparto }));
  }, [selectedReparto]);

  const handleRisorseChange = (e) => {
    const { name, value } = e.target;
    setRisorseFormData({ ...risorseFormData, [name]: value });
  };

  const handleRisorseSubmit = async (e) => {
    e.preventDefault();
    if (!risorseFormData.nome) {
      toast.error("Il nome della risorsa è obbligatorio.");
      return;
    }
    const dataToSubmit = { ...risorseFormData, reparto_id: selectedReparto };
    setRisorseLoading(true);
    try {
      if (isEditingRisorsa) {
        await updateRisorsa(editRisorsaId, dataToSubmit);
        toast.success("Risorsa aggiornata!");
        setRisorse((prev) =>
          prev.map((r) =>
            r.id === editRisorsaId ? { ...r, ...dataToSubmit } : r
          )
        );
      } else {
        await createRisorsa(dataToSubmit);
        toast.success("Risorsa creata!");
        await loadRisorse(selectedReparto);
      }
      setRisorseFormData({ nome: "", reparto_id: selectedReparto });
      setIsEditingRisorsa(false);
      setEditRisorsaId(null);
    } catch (error) {
      console.error("Errore nella gestione della risorsa:", error);
      toast.error("Errore nella gestione della risorsa.");
    } finally {
      setRisorseLoading(false);
    }
  };

  const handleRisorseEdit = (risorsa) => {
    setRisorseFormData({ nome: risorsa.nome, reparto_id: risorsa.reparto_id });
    setIsEditingRisorsa(true);
    setEditRisorsaId(risorsa.id);
  };

  const handleRisorseDelete = async (id) => {
    if (window.confirm("Eliminare questa risorsa?")) {
      setRisorseLoading(true);
      try {
        await deleteRisorsa(id);
        setRisorse((prev) => prev.filter((r) => r.id !== id));
        toast.success("Risorsa eliminata!");
      } catch (error) {
        console.error("Errore nell'eliminazione della risorsa:", error);
        toast.error("Errore durante l'eliminazione della risorsa.");
      } finally {
        setRisorseLoading(false);
      }
    }
  };

  // ================================
  // Funzioni per Stati Avanzamento e Riordino (Filtrati per Reparto)
  // ================================

  const loadStatiAvanzamento = async (repartoId) => {
    setStatiAvanzamentoLoading(true);
    try {
      const data = await fetchStatiAvanzamento();
      setStatiAvanzamento(data.filter((s) => s.reparto_id === parseInt(repartoId)));
    } catch (error) {
      console.error("Errore nel caricamento degli stati avanzamento:", error);
      toast.error("Errore nel caricamento degli stati avanzamento.");
    } finally {
      setStatiAvanzamentoLoading(false);
    }
  };

  useEffect(() => {
    setStatiAvanzamentoFormData((prev) => ({ ...prev, reparto_id: selectedReparto }));
  }, [selectedReparto]);

  const handleStatiAvanzamentoChange = (e) => {
    const { name, value } = e.target;
    setStatiAvanzamentoFormData({ ...statiAvanzamentoFormData, [name]: value });
  };

  const handleStatiAvanzamentoSubmit = async (e) => {
    e.preventDefault();
    if (!statiAvanzamentoFormData.nome_stato) {
      toast.error("Il nome dello stato avanzamento è obbligatorio.");
      return;
    }
    const dataToSubmit = { ...statiAvanzamentoFormData, reparto_id: selectedReparto };
    setStatiAvanzamentoLoading(true);
    try {
      if (isEditingStatoAvanzamento) {
        await updateStatoAvanzamento(editStatoAvanzamentoId, dataToSubmit);
        toast.success("Stato avanzamento aggiornato!");
        setStatiAvanzamento((prev) =>
          prev.map((s) =>
            s.id === editStatoAvanzamentoId ? { ...s, ...dataToSubmit } : s
          )
        );
      } else {
        await createStatoAvanzamento(dataToSubmit);
        toast.success("Stato avanzamento creato!");
        await loadStatiAvanzamento(selectedReparto);
      }
      setStatiAvanzamentoFormData({ nome_stato: "" });
      setIsEditingStatoAvanzamento(false);
      setEditStatoAvanzamentoId(null);
    } catch (error) {
      console.error("Errore nella gestione dello stato avanzamento:", error);
      toast.error("Errore nella gestione dello stato avanzamento.");
    } finally {
      setStatiAvanzamentoLoading(false);
    }
  };

  const handleStatiAvanzamentoEdit = (stato) => {
    setStatiAvanzamentoFormData({ nome_stato: stato.nome_stato });
    setIsEditingStatoAvanzamento(true);
    setEditStatoAvanzamentoId(stato.id);
  };

  const handleStatiAvanzamentoDelete = async (id) => {
    if (window.confirm("Eliminare questo stato avanzamento?")) {
      setStatiAvanzamentoLoading(true);
      try {
        await deleteStatoAvanzamento(id);
        setStatiAvanzamento((prev) => prev.filter((s) => s.id !== id));
        toast.success("Stato avanzamento eliminato!");
      } catch (error) {
        console.error("Errore nell'eliminazione dello stato avanzamento:", error);
        toast.error("Errore durante l'eliminazione dello stato avanzamento.");
      } finally {
        setStatiAvanzamentoLoading(false);
      }
    }
  };

  // ================================
  // Funzioni per il Riordino degli Stati Avanzamento (Drag & Drop)
  // ================================
  const moveColumn = (fromIndex, toIndex) => {
    setColumnOrder((prevOrder) => {
      const updatedOrder = [...prevOrder];
      const [removed] = updatedOrder.splice(fromIndex, 1);
      updatedOrder.splice(toIndex, 0, removed);
      return updatedOrder;
    });
  };

  const saveNewOrder = async () => {
    try {
      const statiDaAggiornare = columnOrder.map((stato, index) => ({
        stato_id: stato.id,
        ordine: index + 1,
      }));
      const idDaUsare = 1; // Modifica questo valore in base alla tua logica
      await ordinaStatiAvanzamento(idDaUsare, selectedReparto, statiDaAggiornare);
      setColumnOrder((prevOrder) =>
        prevOrder.map((stato, index) => ({ ...stato, ordine: index + 1 }))
      );
      toast.success("Ordine aggiornato con successo!");
    } catch (error) {
      console.error("Errore durante il salvataggio del nuovo ordine:", error);
      toast.error("Errore durante l'aggiornamento dell'ordine.");
    }
  };

  // ================================
  // Rendering della Pagina
  // ================================
  return (
    <div className="container">
      <ToastContainer position="top-left" autoClose={3000} hideProgressBar />

      {/* === Sezione Stati Commessa === */}
      <section className="section-global">
        <h1>Gestione Stati Commessa</h1>
        {statiCommessaLoading && (
          <div className="loading-overlay">
            <img src={logo} alt="Logo" className="logo-spinner" />
          </div>
        )}
        <form onSubmit={handleStatiCommessaSubmit}>
          <div className="form-group-100">
            <label>Nome Stato Commessa:</label>
            <input
              type="text"
              name="nome_stato"
              placeholder="Inserisci un nuovo stato"
              value={statiCommessaFormData.nome_stato}
              onChange={handleStatiCommessaChange}
              required
            />
          </div>
          <button type="submit" className="btn-new-comm">
            {isEditingStatiCommessa ? "Aggiorna Stato Commessa" : "Aggiungi Stato Commessa"}
          </button>
          {isEditingStatiCommessa && (
            <button
              type="button"
              className="btn-danger"
              onClick={() => {
                setStatiCommessaFormData({ nome_stato: "", reparto_id: selectedReparto });
                setIsEditingStatiCommessa(false);
                setEditStatiCommessaId(null);
              }}
            >
              Annulla
            </button>
          )}
        </form>
        {statiCommessaLoading ? (
          <p>Caricamento stati commessa...</p>
        ) : statiCommessa.length === 0 ? (
          <p style={{ color: "red" }}>Nessuno stato commessa trovato.</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Nome Stato Commessa</th>
                <th>Azioni</th>
              </tr>
            </thead>
            <tbody>
              {statiCommessa.map((s) => (
                <tr key={s.id} className={editStatiCommessaId === s.id ? "editing-row" : ""}>
                  <td>
                    {s.id} {editStatiCommessaId === s.id && <span className="editing-icon">✏️</span>}
                  </td>
                  <td>{s.nome_stato}</td>
                  <td>
                    <button onClick={() => handleStatiCommessaEdit(s)} className="btn-warning ">
                      Modifica
                    </button>
                    <button onClick={() => handleStatiCommessaDelete(s.id)} className="btn-danger">
                      Elimina
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {/* === Sezione Reparti === */}
      <section className="section-global">
        <h1>Gestione Reparti</h1>
        {repartiLoading && (
          <div className="loading-overlay">
            <img src={logo} alt="Logo" className="logo-spinner" />
          </div>
        )}
        <form onSubmit={handleRepartiSubmit}>
          <div className="form-group-100">
            <label>Nome Reparto:</label>
            <input
              type="text"
              name="nome"
              placeholder="Inserisci un nuovo reparto"
              value={repartiFormData.nome}
              onChange={handleRepartiChange}
              required
            />
          </div>
          <button type="submit" className="btn-new-comm">
            {isEditingReparto ? "Aggiorna Reparto" : "Aggiungi Reparto"}
          </button>
          {isEditingReparto && (
            <button
              type="button"
              className="btn-danger"
              onClick={() => {
                setRepartiFormData({ nome: "" });
                setIsEditingReparto(false);
                setEditRepartoId(null);
              }}
            >
              Annulla
            </button>
          )}
        </form>
        <table className="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Nome Reparto</th>
              <th>Azioni</th>
            </tr>
          </thead>
          <tbody>
            {reparti.map((r) => (
              <tr key={r.id} className={editRepartoId === r.id ? "editing-row" : ""}>
                <td>
                  {r.id} {editRepartoId === r.id && <span className="editing-icon">✏️</span>}
                </td>
                <td>{r.nome}</td>
                <td>
                  <button onClick={() => handleRepartiEdit(r)} className="btn-warning ">
                    Modifica
                  </button>
                  <button onClick={() => handleRepartiDelete(r.id)} className="btn-danger">
                    Elimina
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* === Sezione per Selezionare il Reparto === */}
      <section className="section-filter">
        <h2>Seleziona Reparto per Gestione</h2>
        <select value={selectedReparto} onChange={(e) => setSelectedReparto(e.target.value)}>
          <option value="">-- Seleziona --</option>
          {reparti.map((r) => (
            <option key={r.id} value={r.id}>
              {r.nome}
            </option>
          ))}
        </select>
      </section>

      {selectedReparto && (
        <section className="section-detail">
          {/* === Sezione Attività (Filtrate per Reparto) === */}
          <div className="section-box">
            <h2>Gestione Attività</h2>
            <form onSubmit={handleAttivitaSubmit}>
              <div className="form-group-100">
                <label>Nome Attività:</label>
                <input
                  type="text"
                  name="nome_attivita"
                  placeholder="Inserisci una nuova attivtà"
                  value={attivitaFormData.nome_attivita}
                  onChange={handleAttivitaChange}
                  required
                />
              </div>
              <input type="hidden" name="reparto_id" value={selectedReparto} />
              <button type="submit" className="btn-new-comm">
                {isEditingAttivita ? "Aggiorna Attività" : "Aggiungi Attività"}
              </button>
              {isEditingAttivita && (
                <button
                  type="button"
                  className="btn-danger"
                  onClick={() => {
                    setAttivitaFormData({ nome_attivita: "", reparto_id: selectedReparto });
                    setIsEditingAttivita(false);
                    setEditAttivitaId(null);
                  }}
                >
                  Annulla
                </button>
              )}
            </form>
            {attivitaLoading ? (
              <p>Caricamento attività...</p>
            ) : attivita.length === 0 ? (
              <p style={{ color: "red" }}>Nessuna attività trovata.</p>
            ) : (
              <table className="table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Nome Attività</th>
                    <th>Azioni</th>
                  </tr>
                </thead>
                <tbody>
                  {attivita.map((a) => (
                    <tr key={a.id} className={editAttivitaId === a.id ? "editing-row" : ""}>
                      <td>
                        {a.id} {editAttivitaId === a.id && <span className="editing-icon">✏️</span>}
                      </td>
                      <td>{a.nome_attivita}</td>
                      <td>
                        <button onClick={() => handleAttivitaEdit(a)} className="btn-warning ">
                         Modifica
                        </button>
                        <button onClick={() => handleAttivitaDelete(a.id)} className="btn-danger">
                        Elimina
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* === Sezione Risorse (Filtrate per Reparto) === */}
          <div className="section-box">
            <h2>Gestione Risorse</h2>
            <form onSubmit={handleRisorseSubmit}>
              <div className="form-group-100">
                <label>Nome Risorsa:</label>
                <input
                  type="text"
                  name="nome"
                  placeholder="Inserisci una nuova risorsa"
                  value={risorseFormData.nome}
                  onChange={handleRisorseChange}
                  required
                />
              </div>
              <input type="hidden" name="reparto_id" value={selectedReparto} />
              <button type="submit" className="btn-new-comm">
                {isEditingRisorsa ? "Aggiorna Risorsa" : "Aggiungi Risorsa"}
              </button>
              {isEditingRisorsa && (
                <button
                  type="button"
                  className="btn-danger"
                  onClick={() => {
                    setRisorseFormData({ nome: "", reparto_id: selectedReparto });
                    setIsEditingRisorsa(false);
                    setEditRisorsaId(null);
                  }}
                >
                  Annulla
                </button>
              )}
            </form>
            {risorseLoading ? (
              <p>Caricamento risorse...</p>
            ) : risorse.length === 0 ? (
              <p style={{ color: "red" }}>Nessuna risorsa trovata.</p>
            ) : (
              <table className="table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Nome Risorsa</th>
                    <th>Azioni</th>
                  </tr>
                </thead>
                <tbody>
                  {risorse.map((r) => (
                    <tr key={r.id} className={editRisorsaId === r.id ? "editing-row" : ""}>
                      <td>
                        {r.id} {editRisorsaId === r.id && <span className="editing-icon">✏️</span>}
                      </td>
                      <td>{r.nome}</td>
                      <td>
                        <button onClick={() => handleRisorseEdit(r)} className="btn-warning ">
                         Modifica
                        </button>
                        <button onClick={() => handleRisorseDelete(r.id)} className="btn-danger">
                        Elimina
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* === Sezione Stati Avanzamento e Riordino (Filtrati per Reparto) === */}
          <div className="section-box">
            <h2>Gestione Stati Avanzamento</h2>
            <form onSubmit={handleStatiAvanzamentoSubmit}>
              <div className="form-group-100">
                <label>Nome Stato Avanzamento:</label>
                <input
                  type="text"
                  name="nome_stato"
                  placeholder="Inserisci un nuovo stato"
                  value={statiAvanzamentoFormData.nome_stato}
                  onChange={handleStatiAvanzamentoChange}
                  required
                />
              </div>
              <button type="submit" className="btn-new-comm">
                {isEditingStatoAvanzamento ? "Aggiorna Stato Avanzamento" : "Aggiungi Stato Avanzamento"}
              </button>
              {isEditingStatoAvanzamento && (
                <button
                  type="button"
                  className="btn-danger"
                  onClick={() => {
                    setStatiAvanzamentoFormData({ nome_stato: "" });
                    setIsEditingStatoAvanzamento(false);
                    setEditStatoAvanzamentoId(null);
                  }}
                >
                  Annulla
                </button>
              )}
            </form>
            {statiAvanzamentoLoading ? (
              <p>Caricamento stati avanzamento...</p>
            ) : statiAvanzamento.length === 0 ? (
              <p style={{ color: "red" }}>Nessuno stato avanzamento trovato.</p>
            ) : (
              <table className="table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Nome Stato Avanzamento</th>
                    <th>Azioni</th>
                  </tr>
                </thead>
                <tbody>
                  {statiAvanzamento.map((s) => (
                    <tr key={s.id} className={editStatoAvanzamentoId === s.id ? "editing-row" : ""}>
                      <td>
                        {s.id} {editStatoAvanzamentoId === s.id && <span className="editing-icon">✏️</span>}
                      </td>
                      <td>{s.nome_stato}</td>
                      <td>
                      <button onClick={() => handleStatiAvanzamentoEdit(s)} className="btn-warning ">
                         Modifica
                        </button>
                        <button onClick={() => handleStatiAvanzamentoDelete(s.id)} className="btn-danger">
                        Elimina
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* Sezione Drag & Drop per il Riordino degli Stati Avanzamento */}
            <div className="drag-drop-section" style={{ marginTop: "2rem" }}>
              <h2>Ordina Colonne Stati Avanzamento</h2>
              <button onClick={saveNewOrder} className="btn-new-comm" style={{ marginBottom: "1rem" }}>
                Salva ordine colonne
              </button>
              <DndProvider backend={HTML5Backend}>
                <div className="Gen-table-container">
                  <table className="software2-schedule">
                    <thead>
                      <tr>
                        {columnOrder.map((stato, index) => (
                          <DraggableColumn
                            key={stato.id}
                            id={stato.id}
                            index={index}
                            moveColumn={moveColumn}
                          >
                            {stato.nome_stato}
                          </DraggableColumn>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        {columnOrder.map((stato) => (
                          <td key={stato.id}>
                           Ordine: {stato.ordine}
                          </td>
                        ))}
                      </tr>
                    </tbody>
                  </table>
                </div>
              </DndProvider>
            </div>
          </div>
        </section>
     )}
   </div>
  );
}

export default GestioneTabelle;
