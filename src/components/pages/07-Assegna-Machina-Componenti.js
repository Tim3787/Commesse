import React, { useState, useEffect } from 'react';
import { getMacchine } from '../services/API/commesse-dettagli-api';
import Select from 'react-select';
import {
    
  associateMacchineToCommessa,
  getMacchineFromCommessa,
  getComponenti,
  getComponentiFromCommessa,   // Funzione per caricare i componenti già assegnati
  updateComponente,          // Funzione per aggiornare un componente assegnato
  associateComponentiToMacchina,
  getComponentiFromMacchina

} from '../services/API/commesse-dettagli-api';
import { fetchCommesse } from '../services/API/commesse-api';

// Import per Toastify (notifiche)
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";


function AssignedComponentsTable({ assignedComponents,availableComponents, onUpdate, onRemove }) {
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
  
   React.useMemo(() => {
        return assignedComponents.reduce((acc, comp) => {
            if (!comp.macchina_id) return acc; // Se non ha una macchina, non lo includiamo
            const key = comp.macchina_id.toString();
            if (!acc[key]) acc[key] = [];
            acc[key].push(comp);
            return acc;
        }, {});
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
                
                // Trasformiamo in formato compatibile con react-select
                const assignedMachinesFormatted = assignedMac.map((m, index) => ({
                    value: `${m.id}-${index}`, // ID unico basato su index
                    label: `Macchina ${index + 1} - ${m.macchina}`,
                    macchina: m.macchina,
                    macchina_id: m.id
                }));
                setSelectedMachineInstances(assignedMachinesFormatted);
                
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
                let allComponents = [];
                for (const machine of selectedMachineInstances) {
                    const components = await getComponentiFromMacchina(selectedCommessa.commessa_id, machine.macchina_id);
                    allComponents = [...allComponents, ...components];
                }
                console.log("Componenti assegnati:", allComponents); // Debug
                setAssignedComponents(allComponents);
            } catch (error) {
                toast.error("Errore nel caricamento dei componenti assegnati.");
            }
        } else {
            setAssignedComponents([]);
        }
    }
    loadAssignedComponents();
}, [selectedCommessa, selectedMachineInstances]);



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

        // Aggiorna i componenti assegnati alla commessa
        const updated = await getComponentiFromMacchina(selectedCommessa.commessa_id, macchinaId);
        setAssignedComponents(prev => [...prev, ...updated]);

        // Resetta il valore selezionato per quella macchina
        setComponentSelections(prev => {
            const newSelections = { ...prev };
            delete newSelections[macchinaId];
            return newSelections;
        });

    } catch (error) {
        toast.error("Errore nell'assegnazione del componente.");
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
    <h4>Assegna Nuovi Componenti</h4>
    {selectedMachineInstances.length === 0 ? (
        <p>Seleziona una macchina prima di assegnare componenti.</p>
    ) : (
        selectedMachineInstances.map(machine => (
            <div key={machine.macchina_id} style={{ marginBottom: '1rem', borderBottom: '1px solid #ddd', paddingBottom: '1rem' }}>
                <h5>{machine.label}</h5>
                <Select
    options={availableComponents.map(c => ({ value: c.id, label: c.componente }))}
    value={componentSelections[machine.macchina_id]?.componenteId 
        ? { value: componentSelections[machine.macchina_id].componenteId, label: availableComponents.find(c => c.id === componentSelections[machine.macchina_id]?.componenteId)?.componente || '' }
        : null}
    onChange={selected => setComponentSelections(prev => ({
        ...prev,
        [machine.macchina_id]: {
            componenteId: selected.value,
            tipo: ''
        }
    }))}
    placeholder="Seleziona un componente"
/>
<select
    value={componentSelections[machine.macchina_id]?.tipo || ''}
    onChange={(e) => setComponentSelections(prev => ({
        ...prev,
        [machine.macchina_id]: {
            ...prev[machine.macchina_id],
            tipo: e.target.value
        }
    }))}
>
    <option value="">Seleziona tipo</option>
    {availableComponents
        .find(c => c.id === componentSelections[machine.macchina_id]?.componenteId)
        ?.tipo.split(',')
        .map(t => <option key={t} value={t}>{t}</option>)
    }
</select>

                <button 
                    onClick={() => handleAddComponentToMachine(
                        machine.macchina_id, 
                        componentSelections[machine.macchina_id]?.componenteId, 
                        componentSelections[machine.macchina_id]?.tipo
                    )}
                >
                    Aggiungi Componente
                </button>
            </div>
        ))
    )}
</div>


            
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
