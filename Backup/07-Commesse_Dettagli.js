import React, { useState, useEffect } from 'react';
import "../style.css";
import logo from "../img/Animation - 1738249246846.gif";

// Import per Toastify (notifiche)
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// API 
import {
  getMacchine,
  addMacchina,
  updateMacchina,
  deleteMacchina,
  getComponenti,
  addComponente,
  updateComponente,
  deleteComponente,
} from '../services/API/commesse-dettagli-api';
import { fetchCommesse, associateMacchineToCommessa } from "../services/API/commesse-api";

function CommesseDettagli() {
  // --------------------------
  // Gestione Macchine
  // --------------------------
  const [macchine, setMacchine] = useState([]);
  const [macchineLoading, setMacchineLoading] = useState(false);
  const [macchinaFormData, setMacchinaFormData] = useState({ macchina: '', modello: '' });
  const [isEditingMacchina, setIsEditingMacchina] = useState(false);
  const [editMacchinaId, setEditMacchinaId] = useState(null);
  const [selectedMachineType, setSelectedMachineType] = useState('');

  // --------------------------
  // Gestione Componenti
  // --------------------------
  // Ora usiamo "macchina" per salvare il nome della macchina, non l'ID numerico
  const [componenti, setComponenti] = useState([]);
  const [componentiLoading, setComponentiLoading] = useState(false);
  const [componenteFormData, setComponenteFormData] = useState({ nome_componente: '', macchina: '', tipo: '' });
  const [isEditingComponente, setIsEditingComponente] = useState(false);
  const [editComponenteId, setEditComponenteId] = useState(null);

  // --------------------------
  // Gestione Commesse
  // --------------------------
  const [commesse, setCommesse] = useState([]);
  const [selectedCommessa, setSelectedCommessa] = useState(null);
  const [commesseLoading, setCommesseLoading] = useState(false);
  const [commesseError, setCommesseError] = useState(null);
  const [inputValue, setInputValue] = useState('');
  const [suggestions, setSuggestions] = useState([]);

  // Caricamento iniziale dei dati
  useEffect(() => {
    loadMacchine();
    loadComponenti();
    loadCommesse();
  }, []);

  // --------------------------
  // Funzioni per Macchine
  // --------------------------
  const loadMacchine = async () => {
    setMacchineLoading(true);
    try {
      const data = await getMacchine();
      setMacchine(data);
    } catch (error) {
      console.error("Errore nel caricamento delle macchine:", error);
      toast.error("Errore nel caricamento delle macchine.");
    } finally {
      setMacchineLoading(false);
    }
  };

  const handleMacchinaChange = (e) => {
    setMacchinaFormData({ ...macchinaFormData, [e.target.name]: e.target.value });
  };

  const handleMacchinaSubmit = async (e) => {
    e.preventDefault();
    if (!macchinaFormData.macchina || !macchinaFormData.modello) {
      toast.error("I campi macchina e modello sono obbligatori.");
      return;
    }
    setMacchineLoading(true);
    try {
      if (isEditingMacchina) {
        await updateMacchina(editMacchinaId, macchinaFormData);
        toast.success("Macchina aggiornata con successo!");
      } else {
        await addMacchina(macchinaFormData);
        toast.success("Macchina aggiunta con successo!");
      }
      setMacchinaFormData({ macchina: '', modello: '' });
      setIsEditingMacchina(false);
      setEditMacchinaId(null);
      loadMacchine();
    } catch (error) {
      console.error("Errore nella gestione della macchina:", error);
      toast.error("Errore nella gestione della macchina.");
    } finally {
      setMacchineLoading(false);
    }
  };

  const handleMacchinaEdit = (macchina) => {
    setMacchinaFormData({ macchina: macchina.macchina, modello: macchina.modello });
    setIsEditingMacchina(true);
    setEditMacchinaId(macchina.id);
  };

  const handleMacchinaDelete = async (id) => {
    if (window.confirm("Eliminare questa macchina?")) {
      setMacchineLoading(true);
      try {
        await deleteMacchina(id);
        toast.success("Macchina eliminata!");
        loadMacchine();
      } catch (error) {
        console.error("Errore nell'eliminazione della macchina:", error);
        toast.error("Errore nell'eliminazione della macchina.");
      } finally {
        setMacchineLoading(false);
      }
    }
  };

  // Estrae i nomi univoci delle macchine per il menu a tendina nei componenti e per l'assegnazione
  const uniqueMacchine = [...new Set(macchine.map(m => m.macchina))];

  // --------------------------
  // Funzioni per Componenti
  // --------------------------
  const loadComponenti = async () => {
    setComponentiLoading(true);
    try {
      const data = await getComponenti();
      setComponenti(data);
    } catch (error) {
      console.error("Errore nel caricamento dei componenti:", error);
      toast.error("Errore nel caricamento dei componenti.");
    } finally {
      setComponentiLoading(false);
    }
  };

  const handleComponenteChange = (e) => {
    setComponenteFormData({ ...componenteFormData, [e.target.name]: e.target.value });
  };

  const handleComponenteSubmit = async (e) => {
    e.preventDefault();
    const { nome_componente, macchina, tipo } = componenteFormData;
    if (!nome_componente || !macchina || !tipo) {
      toast.error("I campi nome componente, macchina e tipo sono obbligatori.");
      return;
    }
    setComponentiLoading(true);
    try {
      if (isEditingComponente) {
        await updateComponente(editComponenteId, componenteFormData);
        toast.success("Componente aggiornato con successo!");
      } else {
        await addComponente(componenteFormData);
        toast.success("Componente aggiunto con successo!");
      }
      setComponenteFormData({ nome_componente: '', macchina: '', tipo: '' });
      setIsEditingComponente(false);
      setEditComponenteId(null);
      loadComponenti();
    } catch (error) {
      console.error("Errore nella gestione del componente:", error);
      toast.error("Errore nella gestione del componente.");
    } finally {
      setComponentiLoading(false);
    }
  };

  const handleComponenteEdit = (comp) => {
    setComponenteFormData({
      nome_componente: comp.componente,
      macchina: comp.macchina,
      tipo: comp.tipo,
    });
    setIsEditingComponente(true);
    setEditComponenteId(comp.id);
  };

  const handleComponenteDelete = async (id) => {
    if (window.confirm("Eliminare questo componente?")) {
      setComponentiLoading(true);
      try {
        await deleteComponente(id);
        toast.success("Componente eliminato!");
        loadComponenti();
      } catch (error) {
        console.error("Errore nell'eliminazione del componente:", error);
        toast.error("Errore nell'eliminazione del componente.");
      } finally {
        setComponentiLoading(false);
      }
    }
  };

  // --------------------------
  // Funzioni per Commesse
  // --------------------------
  const loadCommesse = async () => {
    setCommesseLoading(true);
    setCommesseError(null);
    try {
      const data = await fetchCommesse();
      console.log("Dati commesse:", data); // Verifica i dati ricevuti
      setCommesse(data);
    } catch (error) {
      console.error("Errore nel caricamento delle commesse:", error);
      setCommesseError("Errore nel caricamento delle commesse.");
    } finally {
      setCommesseLoading(false);
    }
  };

  const handleSelectCommessa = (commessa) => {
    setSelectedCommessa(commessa);
  };

  // --------------------------
  // Funzioni per l'input con suggerimenti
  // --------------------------
  const handleInputChange = (e) => {
    const value = e.target.value;
    setInputValue(value);
    if (value.length > 0) {
      const filteredSuggestions = commesse.filter((commessa) =>
        commessa.numero_commessa.toLowerCase().includes(value.toLowerCase())
      );
      setSuggestions(filteredSuggestions);
    } else {
      setSuggestions([]);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setInputValue(suggestion.numero_commessa);
    setSuggestions([]);
    setSelectedCommessa(suggestion);
  };

  // --------------------------
  // Funzione per assegnare il tipo di macchina alla commessa selezionata
  // --------------------------
  const associateMacchineToCommessa = async (e) => {
    e.preventDefault();
    if (!selectedMachineType) {
      toast.error("Seleziona un tipo di macchina.");
      return;
    }
    if (!selectedCommessa) {
      toast.error("Nessuna commessa selezionata.");
      return;
    }
    try {
      await associateMacchineToCommessa(selectedCommessa.commessa_id, selectedMachineType);
      toast.success("Tipo di macchina assegnato con successo!");
      loadCommesse();
    } catch (error) {
      console.error("Errore nell'assegnazione del tipo di macchina:", error);
      toast.error("Errore nell'assegnazione del tipo di macchina.");
    }
  };
  const handleAssignMachineType = async (e) => {
    e.preventDefault();
    if (!selectedMachineType) {
      toast.error("Seleziona un tipo di macchina.");
      return;
    }
    if (!selectedCommessa) {
      toast.error("Nessuna commessa selezionata.");
      return;
    }
    try {
      await associateMacchineToCommessa(selectedCommessa.commessa_id, selectedMachineType);
      toast.success("Tipo di macchina assegnato con successo!");
      loadCommesse();
    } catch (error) {
      console.error("Errore nell'assegnazione del tipo di macchina:", error);
      toast.error("Errore nell'assegnazione del tipo di macchina.");
    }
  };
  
  // --------------------------
  // Rendering
  // --------------------------
  return (
    <div className="container">
      <ToastContainer position="top-left" autoClose={3000} hideProgressBar />

      {/* Sezione Macchine */}
      <section className="section-global">
        <h1>Gestione Macchine</h1>
        {macchineLoading && (
          <div className="loading-overlay">
            <img src={logo} alt="Logo" className="logo-spinner" />
          </div>
        )}
        <form onSubmit={handleMacchinaSubmit}>
          <h3>{isEditingMacchina ? "Modifica Macchina" : "Aggiungi Macchina"}</h3>
          <div className="form-group-100">
            <label>Macchina:</label>
            <input
              type="text"
              name="macchina"
              value={macchinaFormData.macchina}
              onChange={handleMacchinaChange}
              required
            />
          </div>
          <div className="form-group-100">
            <label>Modello:</label>
            <input
              type="text"
              name="modello"
              value={macchinaFormData.modello}
              onChange={handleMacchinaChange}
              required
            />
          </div>
          <button type="submit" className="btn-new-comm">{isEditingMacchina ? "Aggiorna" : "Aggiungi"}</button>
          {isEditingMacchina && (
            <button
              type="button"
              onClick={() => {
                setMacchinaFormData({ macchina: '', modello: '' });
                setIsEditingMacchina(false);
                setEditMacchinaId(null);
              }}
              className="btn-danger"
            >
              Annulla
            </button>
          )}
        </form>
        {macchineLoading ? (
          <p>Caricamento macchine...</p>
        ) : (
          <>
            {macchine.length === 0 ? (
              <p>Nessuna macchina trovata.</p>
            ) : (
              <table className="table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Macchina</th>
                    <th>Modello</th>
                    <th>Azioni</th>
                  </tr>
                </thead>
                <tbody>
                  {macchine.map((m) => (
                    <tr key={m.id}>
                      <td>{m.id}</td>
                      <td>{m.macchina}</td>
                      <td>{m.modello}</td>
                      <td>
                        <button onClick={() => handleMacchinaEdit(m)} className="btn-warning">
                          Modifica
                        </button>
                        <button onClick={() => handleMacchinaDelete(m.id)} className="btn-danger">
                          Elimina
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </>
        )}
      </section>

      {/* Sezione Componenti */}
      <section className="section-global">
        <h2>Gestione Componenti</h2>
        <form onSubmit={handleComponenteSubmit}>
          <h3>{isEditingComponente ? "Modifica Componente" : "Aggiungi Componente"}</h3>
          <div className="form-group-100">
            <label>Nome Componente:</label>
            <input
              type="text"
              name="nome_componente"
              value={componenteFormData.nome_componente}
              onChange={handleComponenteChange}
              required
            />
          </div>
          <div className="form-group-100">
            <label>Seleziona Macchina:</label>
            <select
              name="macchina"
              value={componenteFormData.macchina}
              onChange={handleComponenteChange}
              required
            >
              <option value="">-- Seleziona una macchina --</option>
              {uniqueMacchine.map((nome, index) => (
                <option key={index} value={nome}>
                  {nome}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group-100">
            <label>Tipo:</label>
            <input
              type="text"
              name="tipo"
              value={componenteFormData.tipo}
              onChange={handleComponenteChange}
              required
            />
          </div>
          <button type="submit">{isEditingComponente ? "Aggiorna" : "Aggiungi"}</button>
          {isEditingComponente && (
            <button
              type="button"
              onClick={() => {
                setComponenteFormData({ nome_componente: '', macchina: '', tipo: '' });
                setIsEditingComponente(false);
                setEditComponenteId(null);
              }}
              className="btn-danger"
            >
              Annulla
            </button>
          )}
        </form>
        {componentiLoading ? (
          <p>Caricamento componenti...</p>
        ) : (
          <>
            {componenti.length === 0 ? (
              <p>Nessun componente trovato.</p>
            ) : (
              <table className="table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Nome Componente</th>
                    <th>Macchina</th>
                    <th>Tipo</th>
                    <th>Azioni</th>
                  </tr>
                </thead>
                <tbody>
                  {componenti.map((c) => (
                    <tr key={c.id}>
                      <td>{c.id}</td>
                      <td>{c.componente}</td>
                      <td>{c.macchina}</td>
                      <td>{c.tipo}</td>
                      <td>
                        <button onClick={() => handleComponenteEdit(c)} className="btn-warning">
                          Modifica
                        </button>
                        <button onClick={() => handleComponenteDelete(c.id)} className="btn-danger">
                          Elimina
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </>
        )}
      </section>

      {/* Sezione Commesse */}
      <section className="section-global">
        <div>
          <h2>Seleziona una Commessa</h2>
          <input
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            placeholder="Cerca commessa..."
          />
          {suggestions.length > 0 && (
            <ul>
              {suggestions.map((commessa) => (
                <li
                  key={commessa.commessa_id}
                  onClick={() => handleSuggestionClick(commessa)}
                >
                  {commessa.numero_commessa} - {commessa.cliente}
                </li>
              ))}
            </ul>
          )}
        </div>
        {selectedCommessa && (
          <div>
          <h3>Commessa Selezionata: {selectedCommessa.numero_commessa}</h3>
          <div>
            <h4>Assegna Tipo di Macchina</h4>
            <form onSubmit={handleAssignMachineType}>
              <label>
                Tipo di Macchina:
                <select
                  value={selectedMachineType}
                  onChange={(e) => setSelectedMachineType(e.target.value)}
                  required
                >
                  <option value="">-- Seleziona un tipo di macchina --</option>
                  {macchine.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.macchina} - {m.modello}
                    </option>
                  ))}
                </select>
              </label>
              <button type="submit">Assegna</button>
            </form>
          </div>
        </div>
        
        )}
      </section>
    </div>
  );
}

// Funzioni mancanti per l'autosuggest e l'assegnazione delle commesse

const handleInputChange = (e) => {
  const value = e.target.value;
  setInputValue(value);
  if (value.length > 0) {
    const filteredSuggestions = commesse.filter((commessa) =>
      commessa.numero_commessa.toLowerCase().includes(value.toLowerCase())
    );
    setSuggestions(filteredSuggestions);
  } else {
    setSuggestions([]);
  }
};

const handleSuggestionClick = (suggestion) => {
  setInputValue(suggestion.numero_commessa);
  setSuggestions([]);
  setSelectedCommessa(suggestion);
};

export default CommesseDettagli;
