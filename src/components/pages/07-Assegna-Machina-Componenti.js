import React, { useState, useEffect, useMemo } from 'react';
import Select from 'react-select';
import {
  associateMacchineToCommessa,
  getMacchine,
  getMacchineFromCommessa,
  getComponenti,
  getComponentiFromCommessa,
  updateComponente,
  removeComponenteFromMacchina,
  //updateComponentiFromMacchina,
  associateComponentiToMacchina,
  getComponentiFromMacchina
} from '../services/API/commesse-dettagli-api';
import { fetchCommesse } from '../services/API/commesse-api';
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Componente per visualizzare la tabella dei componenti assegnati
function AssignedComponentsTable({ assignedComponents, availableComponents, onUpdate, onRemove }) {
  const [editRow, setEditRow] = useState(null);
  const [editedType, setEditedType] = useState("");

  const handleEdit = (comp) => {
    setEditRow(comp.componente_id);
    setEditedType(comp.tipo_associato || ""); // Usa il campo tipo_associato
  };

  const handleSave = (comp) => {
    if (!editedType) {
      alert("Seleziona un tipo valido!");
      return;
    }
    onUpdate(comp.componente_id, editedType);
    setEditRow(null);
  };

  useEffect(() => {
    console.log("AssignedComponentsTable - dati ricevuti:", assignedComponents);
  }, [assignedComponents]);

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
  const [selectedMachineInstances, setSelectedMachineInstances] = useState([]);
  const [availableComponents, setAvailableComponents] = useState([]);
  const [assignedComponents, setAssignedComponents] = useState([]);
  const [componentSelections, setComponentSelections] = useState({});

  // Carica commesse
  useEffect(() => {
    const loadCommesseData = async () => {
      try {
        const commData = await fetchCommesse();
        setCommesse(commData);
      } catch (error) {
        toast.error("Errore nel caricamento delle commesse.");
      }
    };
    loadCommesseData();
  }, []);

  // Carica macchine
  useEffect(() => {
    const loadMacchineData = async () => {
      try {
        const macData = await getMacchine();
        setMacchine(macData);
      } catch (error) {
        toast.error("Errore nel caricamento delle macchine.");
      }
    };
    loadMacchineData();
  }, []);

  // Carica componenti disponibili
  useEffect(() => {
    const loadComponentiData = async () => {
      try {
        const compData = await getComponenti();
        setAvailableComponents(compData);
      } catch (error) {
        toast.error("Errore nel caricamento dei componenti.");
      }
    };
    loadComponentiData();
  }, []);

  // Quando viene selezionata una commessa, carica le macchine assegnate
  useEffect(() => {
    const loadAssignedMachines = async () => {
      if (selectedCommessa) {
        try {
          const assignedMac = await getMacchineFromCommessa(selectedCommessa.commessa_id);
          const formatted = assignedMac.map((m, index) => ({
            value: `${m.id}-${index}`, // ID unico per ogni istanza
            label: `Macchina ${index + 1} - ${m.macchina}`,
            macchina: m.macchina,
            macchina_id: m.id
          }));
          console.log("Macchine assegnate:", formatted);
          setSelectedMachineInstances(formatted);
        } catch (error) {
          toast.error("Errore nel caricamento delle macchine assegnate.");
        }
      } else {
        setSelectedMachineInstances([]);
      }
    };
    loadAssignedMachines();
  }, [selectedCommessa]);

  // Quando viene selezionata una commessa, carica i componenti assegnati per ogni macchina
  useEffect(() => {
    const loadAssignedComponents = async () => {
      if (selectedCommessa && selectedMachineInstances.length > 0) {
        try {
          let allComponents = [];
          // Per ogni macchina assegnata, carica i componenti specifici
          for (const machine of selectedMachineInstances) {
            const components = await getComponentiFromMacchina(selectedCommessa.commessa_id, machine.macchina_id);
            console.log(`Componenti per macchina ${machine.macchina_id}:`, components);
            allComponents = [...allComponents, ...components];
          }
          setAssignedComponents(allComponents);
          console.log("Componenti assegnati complessivi:", allComponents);
        } catch (error) {
          toast.error("Errore nel caricamento dei componenti assegnati.");
        }
      } else {
        setAssignedComponents([]);
      }
    };
    loadAssignedComponents();
  }, [selectedCommessa, selectedMachineInstances]);

  // Calcola il raggruppamento dei componenti per macchina
  const groupedComponents = useMemo(() => {
    return assignedComponents.reduce((acc, comp) => {
      if (!comp.macchina_id) return acc;
      const key = comp.macchina_id.toString();
      if (!acc[key]) acc[key] = [];
      acc[key].push(comp);
      return acc;
    }, {});
  }, [assignedComponents]);

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

  // Per il dropdown delle macchine
  const machineOptions = macchine.map(m => ({
    value: m.id,
    label: `${m.macchina} - ${m.modello}`
  }));

  // Gestione della selezione delle macchine (react-select)
  const handleMachineSelectChange = (selectedOptions) => {
    setSelectedMachineInstances(selectedOptions || []);
  };

  // Invia la selezione delle macchine al backend
  const handleAssignMachineType = async (e) => {
    e.preventDefault();
    if (selectedMachineInstances.length === 0 || !selectedCommessa) {
      toast.error("Seleziona almeno una macchina e una commessa.");
      return;
    }
    const machineIds = selectedMachineInstances.map(m => m.value);
    try {
      await associateMacchineToCommessa(selectedCommessa.commessa_id, machineIds);
      toast.success("Macchine assegnate con successo!");
    } catch (error) {
      toast.error("Errore nell'assegnazione delle macchine.");
    }
  };

  // Gestione per aggiungere componenti a una macchina specifica
  const handleAddComponentToMachine = async (macchinaId, componenteId, tipo) => {
    if (!selectedCommessa) {
      toast.error("Seleziona una commessa prima di assegnare un componente.");
      return;
    }
    if (!macchinaId || !componenteId || !tipo) {
      toast.error("Devi selezionare una macchina, un componente e un tipo.");
      return;
    }
    try {
      await associateComponentiToMacchina(
        selectedCommessa.commessa_id,
        macchinaId,
        [{ componente_id: componenteId, tipo_associato: tipo }]
      );
      toast.success("Componente assegnato con successo!");
      // Ricarica i componenti per quella macchina
      const updated = await getComponentiFromMacchina(selectedCommessa.commessa_id, macchinaId);
      // Aggiorna lo stato: sostituisci i componenti della macchina (o ricomponili)
      setAssignedComponents(prev => {
        // Filtra i componenti della macchina corrente
        const withoutCurrent = prev.filter(comp => comp.macchina_id.toString() !== macchinaId.toString());
        return [...withoutCurrent, ...updated];
      });
      // Resetta la selezione per quella macchina
      setComponentSelections(prev => {
        const newSelections = { ...prev };
        delete newSelections[macchinaId];
        return newSelections;
      });
    } catch (error) {
      toast.error("Errore nell'assegnazione del componente.");
    }
  };

  // Funzioni per aggiornare e rimuovere componenti (senza modificare la logica)
  const handleUpdateComponent = async (componentId, newType) => {
    try {
      await updateComponente(selectedCommessa.commessa_id, componentId, { tipo: newType });
      toast.success("Componente aggiornato!");
      const updated = await getComponentiFromCommessa(selectedCommessa.commessa_id);
      setAssignedComponents(updated);
    } catch (error) {
      toast.error("Errore nell'aggiornamento del componente.");
    }
  };

  const handleRemoveComponent = async (machineId, componentId) => {
    try {
      await removeComponenteFromMacchina(selectedCommessa.commessa_id, machineId, componentId);
      toast.success("Componente rimosso!");
      // Ricarica i componenti per quella macchina oppure per l'intera commessa
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
        {/* Sezione di ricerca per commessa */}
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

        {/* Se la commessa è selezionata */}
        {selectedCommessa && (
          <div>
            <h3>Commessa Selezionata: {selectedCommessa.numero_commessa}</h3>
            <p>Cliente: {selectedCommessa.cliente}</p>

            {/* Sezione per assegnare macchine */}
            <div>
              <h4>Assegna Macchine</h4>
              <form onSubmit={handleAssignMachineType}>
                <label>
                  Seleziona macchine:
                  <Select
                    options={machineOptions}
                    value={selectedMachineInstances}
                    onChange={handleMachineSelectChange}
                    isMulti
                    isSearchable
                    placeholder="Seleziona macchine..."
                    closeMenuOnSelect={false}
                  />
                </label>
                <button type="submit">Assegna Macchine</button>
              </form>
            </div>

            {/* Sezione per assegnare nuovi componenti per ogni macchina */}
            <div>
              <h4>Assegna Nuovi Componenti</h4>
              {selectedMachineInstances.length === 0 ? (
                <p>Seleziona una macchina prima di assegnare componenti.</p>
              ) : (
                selectedMachineInstances.map(machine => (
                  <div key={machine.macchina_id} style={{ marginBottom: '1rem', borderBottom: '1px solid #ddd', paddingBottom: '1rem' }}>
                    <h5>{machine.label}</h5>
                    <Select
                      options={availableComponents.map(c => ({ value: c.id, label: c.componente }))}
                      value={
                        componentSelections[machine.macchina_id]?.componenteId
                          ? { 
                              value: componentSelections[machine.macchina_id].componenteId, 
                              label: availableComponents.find(c => c.id === componentSelections[machine.macchina_id].componenteId)?.componente || '' 
                            }
                          : null
                      }
                      onChange={selected =>
                        setComponentSelections(prev => ({
                          ...prev,
                          [machine.macchina_id]: {
                            componenteId: selected.value,
                            tipo: ''
                          }
                        }))
                      }
                      placeholder="Seleziona un componente"
                    />
                    <select
                      value={componentSelections[machine.macchina_id]?.tipo || ''}
                      onChange={(e) =>
                        setComponentSelections(prev => ({
                          ...prev,
                          [machine.macchina_id]: {
                            ...prev[machine.macchina_id],
                            tipo: e.target.value
                          }
                        }))
                      }
                    >
                      <option value="">Seleziona tipo</option>
                      {availableComponents
                        .find(c => c.id === componentSelections[machine.macchina_id]?.componenteId)
                        ?.tipo.split(',')
                        .map(t => <option key={t} value={t}>{t}</option>)
                      }
                    </select>
                    <button
                      onClick={() =>
                        handleAddComponentToMachine(
                          machine.macchina_id,
                          componentSelections[machine.macchina_id]?.componenteId,
                          componentSelections[machine.macchina_id]?.tipo
                        )
                      }
                    >
                      Aggiungi Componente
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Sezione per visualizzare i componenti assegnati, raggruppati per macchina */}
            <div>
              <h4>Componenti Assegnati per Macchina</h4>
              {assignedComponents.length === 0 ? (
                <p>Nessun componente assegnato.</p>
              ) : (
                Object.entries(groupedComponents).map(([macchina_id, components]) => {
                  const macchinaInfo = selectedMachineInstances.find(m => m.macchina_id.toString() === macchina_id);
                  return (
                    <div key={macchina_id} style={{ marginBottom: '2rem', border: '1px solid #ccc', padding: '1rem' }}>
                      <h5>{macchinaInfo ? macchinaInfo.label : `Macchina ${macchina_id}`}</h5>
                      <AssignedComponentsTable
                        assignedComponents={components}
                        availableComponents={availableComponents}
                        onUpdate={handleUpdateComponent}
                        onRemove={handleRemoveComponent}
                      />
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

export default AssignMachinePage;
