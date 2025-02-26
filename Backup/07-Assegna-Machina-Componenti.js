import React, { useState, useEffect } from 'react';
import { getMacchine } from '../services/API/commesse-dettagli-api';
import Select from 'react-select';
import {
    
  associateMacchineToCommessa,
  getMacchineFromCommessa,
  getComponenti,
  associateComponentiToCommessa,
  getComponentiFromCommessa,   // Funzione per caricare i componenti già assegnati
  updateComponente          // Funzione per aggiornare un componente assegnato
} from '../services/API/commesse-dettagli-api';
import { fetchCommesse } from '../services/API/commesse-api';

// Import per Toastify (notifiche)
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";


function MachineComponentsTable({ assignedComponents,availableComponents, onUpdate, onRemove }) {
    const [editRow, setEditRow] = useState(null);
    const [editedType, setEditedType] = useState("");


    const handleEdit = (comp) => {
      setEditRow(comp.componente_id);
      setEditedType(comp.tipo || ""); // Se comp.tipo è undefined, assegna una stringa vuota
    };
  
    const handleSave = (comp) => {
      if (!editedType) {
        alert("Seleziona un tipo valido!");
        return;
      }
      onUpdate(comp.componente_id, editedType);
      setEditRow(null);
    };
  
    assignedComponents.reduce((acc, comp) => {
      if (!acc[comp.macchina]) acc[comp.macchina] = [];
      acc[comp.macchina].push(comp);
      return acc;
    }, {});
  
    return (
        <table border="1" cellPadding="5" cellSpacing="0" style={{ marginTop: '1rem', width: '100%' }}>
          <thead>
            <tr>
              <th>Componente</th>
              <th>Tipo</th>
              <th>Azioni</th>
            </tr>
          </thead>
          <tbody>
            {assignedComponents.map(comp => {
              // Trova il componente corrispondente nella lista dei disponibili per ottenere tutti i tipi
              const componentInfo = availableComponents.find(c => c.id === comp.componente_id);
              const tipiDisponibili = componentInfo ? componentInfo.tipo.split(',').map(t => t.trim()) : [];
    
              return (
                <tr key={comp.componente_id}>
                  <td>{comp.componente || "Sconosciuto"}</td>
                  <td>
                    {editRow === comp.componente_id ? (
                      <select value={editedType} onChange={(e) => setEditedType(e.target.value)}>
                        <option value="">Seleziona tipo</option>
                        {tipiDisponibili.map(option => (
                          <option key={option} value={option}>{option}</option>
                        ))}
                      </select>
                    ) : (
                      <span style={{ fontWeight: 'bold' }}>{comp.tipo_associato}</span>
                    )}
                  </td>
                  <td>
                    {editRow === comp.componente_id ? (
                      <>
                        <button onClick={() => handleSave(comp)}>Salva</button>
                        <button onClick={() => setEditRow(null)}>Annulla</button>
                      </>
                    ) : (
                      <>
                        <button onClick={() => handleEdit(comp)}>Modifica</button>
                        <button onClick={() => onRemove(comp.componente_id)}>Rimuovi</button>
                      </>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      );
    }
  
function AssignMachinePage() {
  // Stati per commesse e ricerca
  const [commesse, setCommesse] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [selectedCommessa, setSelectedCommessa] = useState(null);

  // Stati per macchine e componenti
  const [macchine, setMacchine] = useState([]);
  const [selectedMachineTypes, setSelectedMachineTypes] = useState([]);
  const [selectedMachineInstances, setSelectedMachineInstances] = useState([]);
  const [availableComponents, setAvailableComponents] = useState([]);
  // Stato per componenti assegnati (tabella dei componenti già associati)
  const [assignedComponents, setAssignedComponents] = useState([]);
  // Stato per selezioni nei nuovi componenti da aggiungere (se non inviati in batch)
  const [componentSelections, setComponentSelections] = useState({});

  // Carica commesse, macchine e componenti disponibili
  useEffect(() => {
    async function loadData() {
      try {
        const commData = await fetchCommesse();
        setCommesse(commData);
      } catch (error) {
        toast.error("Errore nel caricamento delle commesse.");
      }
    }
    loadData();
  }, []);

  useEffect(() => {
    async function loadMacchine() {
      try {
        const macData = await getMacchine();
        setMacchine(macData);
      } catch (error) {
        toast.error("Errore nel caricamento delle macchine.");
      }
    }
    loadMacchine();
  }, []);

  useEffect(() => {
    async function loadComponents() {
      try {
        const compData = await getComponenti();
        setAvailableComponents(compData);
      } catch (error) {
        toast.error("Errore nel caricamento dei componenti.");
      }
    }
    loadComponents();
  }, []);

  // Quando viene selezionata una commessa, carica le macchine e i componenti già assegnati
  useEffect(() => {
    async function loadAssignedMachines() {
      if (selectedCommessa) {
        try {
          const assignedMac = await getMacchineFromCommessa(selectedCommessa.commessa_id);
          // Convertiamo le macchine assegnate in formato per react-select
          const formattedMachines = assignedMac.map(m => ({
            value: m.id.toString(),
            label: `${m.macchina} - ${m.modello}`
          }));
          setSelectedMachineInstances(formattedMachines);
        } catch (error) {
          toast.error("Errore nel caricamento delle macchine assegnate.");
        }
      } else {
        setSelectedMachineInstances([]);
      }
    }
    loadAssignedMachines();
  }, [selectedCommessa]);
  
  useEffect(() => {
    async function loadAssignedComponents() {
      if (selectedCommessa) {
        try {
          const assignedComp = await getComponentiFromCommessa(selectedCommessa.commessa_id);
          // Il server dovrebbe restituire un array di oggetti con:
          // componente_id, nome_componente, macchina, tipo
          setAssignedComponents(assignedComp);
        } catch (error) {
          toast.error("Errore nel caricamento dei componenti assegnati.");
        }
      } else {
        setAssignedComponents([]);
      }
    }
    loadAssignedComponents();
  }, [selectedCommessa]);

      // Trasformiamo l'elenco delle macchine in un formato compatibile con react-select
      const machineOptions = macchine.map(m => ({
        value: m.id,
        label: `${m.macchina} - ${m.modello}`
      }));


  // Gestione ricerca commesse
  const handleInputChange = (e) => {
    const value = e.target.value;
    setInputValue(value);
    if (value.length > 0) {
      const filtered = commesse.filter(c =>
        c.numero_commessa.toLowerCase().includes(value.toLowerCase())
      );
      setSuggestions(filtered);
    } else {
      setSuggestions([]);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setInputValue(suggestion.numero_commessa);
    setSelectedCommessa(suggestion);
    setSuggestions([]);
  };

  // Gestione selezione macchine
  const handleMachineSelectChange = (selectedOptions) => {
    setSelectedMachineInstances(selectedOptions || []);
  };


  // Invia al backend la selezione delle macchine (con istanze multiple)
  const handleAssignMachineType = async (e) => {
    e.preventDefault();
    if (selectedMachineInstances.length === 0 || !selectedCommessa) {
      toast.error("Seleziona almeno una macchina e una commessa.");
      return;
    }

    // Estrai gli ID (potrebbero ripetersi)
    const machineIds = selectedMachineInstances.map(m => m.value);

    try {
      await associateMacchineToCommessa(selectedCommessa.commessa_id, machineIds);
      toast.success("Macchine assegnate con successo!");
    } catch (error) {
      toast.error("Errore nell'assegnazione delle macchine.");
    }
  };

  // Raggruppa i componenti disponibili in base alla macchina (per nuove assegnazioni)
  const selectedMachineObjects = macchine.filter(m => selectedMachineTypes.includes(m.id.toString()));
  const groupedComponents = selectedMachineObjects.reduce((acc, machine) => {
    const comps = availableComponents.filter(comp => comp.macchina === machine.macchina);
    if (comps.length > 0) {
      acc[machine.macchina] = comps;
    }
    return acc;
  }, {});

  // Gestione per aggiungere nuovi componenti (se non sono già assegnati)
  const handleComponentTypeChange = (compId, typeValue) => {
    setComponentSelections(prev => ({ ...prev, [compId]: typeValue }));
  };

  const handleAddComponent = async (comp) => {
    const type = componentSelections[comp.id];
    if (!type) {
      toast.error(`Seleziona il tipo per il componente ${comp.componente}`);
      return;
    }
    try {
      await associateComponentiToCommessa(
        selectedCommessa.commessa_id,
        [{ componente_id: comp.id, tipo_associato: type }]
      );
      toast.success(`Componente ${comp.componente} aggiunto con successo!`);
      // Aggiorna la lista dei componenti assegnati
      const updated = await getComponentiFromCommessa(selectedCommessa.commessa_id);
      setAssignedComponents(updated);
      // Rimuovi la selezione locale
      setComponentSelections(prev => {
        const newSel = { ...prev };
        delete newSel[comp.id];
        return newSel;
      });
    } catch (error) {
      toast.error(`Errore nell'aggiunta del componente ${comp.componente}`);
    }
  };

  // Funzione per aggiornare il tipo di un componente già assegnato
  const handleUpdateComponent = async (componentId, newType) => {
    try {
      // updateComponente è una funzione API che esegue l'UPDATE sulla riga specifica
      await updateComponente(selectedCommessa.commessa_id, componentId, { tipo: newType });
      toast.success("Componente aggiornato!");
      // Ricarica i componenti assegnati
      const updated = await getComponentiFromCommessa(selectedCommessa.commessa_id);
      setAssignedComponents(updated);
    } catch (error) {
      toast.error("Errore nell'aggiornamento del componente.");
    }
  };

  // Funzione per rimuovere un componente assegnato
  const handleRemoveComponent = async (componentId) => {
    try {
      // Supponiamo di avere una funzione API per rimuovere un'associazione componente
      await removeComponenteFromCommessa(selectedCommessa.commessa_id, componentId);
      toast.success("Componente rimosso!");
      const updated = await getComponentiFromCommessa(selectedCommessa.commessa_id);
      setAssignedComponents(updated);
    } catch (error) {
      toast.error("Errore nella rimozione del componente.");
    }
  };

  return (
    <div className="container">
      <ToastContainer position="top-right" autoClose={5000} />
      <h1>Assegna Macchine e Componenti alla Commessa</h1>
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
              {suggestions.map(commessa => (
                <li key={commessa.commessa_id} onClick={() => handleSuggestionClick(commessa)}>
                  {commessa.numero_commessa} - {commessa.cliente}
                </li>
              ))}
            </ul>
          )}
        </div>
        {selectedCommessa && (
          <div>
            <h3>Commessa Selezionata: {selectedCommessa.numero_commessa}</h3>
            <p>Cliente: {selectedCommessa.cliente}</p>
            <div>
            <h4>Assegna Macchine</h4>
      <form onSubmit={handleAssignMachineType}>
        <label>
          Seleziona macchine:
          <Select
            options={machineOptions}
            value={selectedMachineInstances}
            onChange={handleMachineSelectChange}
            isMulti  // Abilita selezione multipla
            isSearchable  // Permette di cercare una macchina
            placeholder="Seleziona macchine..."
            closeMenuOnSelect={false}  // Permette di selezionare più istanze senza chiudere il menu
          />
        </label>
        <button type="submit">Assegna Macchine</button>
      </form>
    </div>
            <div>
              <h4>Aggiungi Nuovi Componenti</h4>
              {Object.keys(groupedComponents).length === 0 ? (
                <p>Nessun componente disponibile per le macchine selezionate.</p>
              ) : (
                Object.entries(groupedComponents).map(([machineName, comps]) => (
                  <div key={machineName}>
                    <h5>Macchina: {machineName}</h5>
                    {comps.map(comp => (
                      <div key={comp.id} style={{ marginBottom: '1rem' }}>
                        <span>{comp.componente}</span>
                        <select
                          value={componentSelections[comp.id] || ''}
                          onChange={(e) => handleComponentTypeChange(comp.id, e.target.value)}
                        >
                          <option value="">Seleziona tipo</option>
                          {comp.tipo.split(',').map(t => t.trim()).map(option => (
                            <option key={option} value={option}>{option}</option>
                          ))}
                        </select>
                        <button onClick={() => handleAddComponent(comp)}>Aggiungi Componente</button>
                      </div>
                    ))}
                  </div>
                ))
              )}
            </div>
            
            <div>
              <h4>Componenti Assegnati</h4>
              {assignedComponents.length === 0 ? (
                <p>Nessun componente assegnato.</p>
              ) : (
                <AssignedComponentsTable 
                  assignedComponents={assignedComponents}
                  availableComponents={availableComponents}
                  onUpdate={handleUpdateComponent}
                  onRemove={handleRemoveComponent}
                />
              )}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

export default AssignMachinePage;
