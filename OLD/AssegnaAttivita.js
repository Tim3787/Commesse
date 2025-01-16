import React, { useState, useEffect } from "react";
import axios from "axios";
import "../style.css";
import AttivitaCrea from "../AttivitaCrea"; 

function AssegnaAttivita() {
  const [attivitaProgrammate, setAttivitaProgrammate] = useState([]);
  const [attivitaDefinite, setAttivitaDefinite] = useState([]);
  const [commesse, setCommesse] = useState([]);
  const [risorse, setRisorse] = useState([]);
  const [reparti, setReparti] = useState([]);
  const [attivitaFiltrate, setAttivitaFiltrate] = useState([]);
  const [filters, setFilters] = useState({
    
    reparto_id: "",
    commessa_id: "",
    risorsa_id: "",
    attivita_id: "",
  });

  const [showPopup, setShowPopup] = useState(false); 
  const [formData, setFormData] = useState({
    commessa_id: "",
    reparto_id: "",
    risorsa_id: "",
    attivita_id: "",
    data_inizio: "",
    durata: "",
  });
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);

  useEffect(() => {
    fetchOptions();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [filters, attivitaProgrammate]);

  const fetchOptions = async () => {
    try {
      const [commesseResponse, risorseResponse, repartiResponse, attivitaDefiniteResponse, attivitaProgrammateResponse] =
        await Promise.all([
          axios.get(`${process.env.REACT_APP_API_URL}/api/commesse`),
          axios.get(`${process.env.REACT_APP_API_URL}/api/risorse`),
          axios.get(`${process.env.REACT_APP_API_URL}/api/reparti`),
          axios.get(`${process.env.REACT_APP_API_URL}/api/attivita`),
          axios.get(`${process.env.REACT_APP_API_URL}/api/attivita_commessa`),
        ]);

      setCommesse(commesseResponse.data);
      setRisorse(risorseResponse.data);
      setReparti(repartiResponse.data);
      setAttivitaDefinite(attivitaDefiniteResponse.data);
      setAttivitaProgrammate(attivitaProgrammateResponse.data);
      setAttivitaFiltrate(attivitaProgrammateResponse.data);
      
    } catch (error) {
      console.error("Errore durante il recupero delle opzioni:", error);
    } finally {
    }
  };

  const applyFilters = () => {
    let filtered = attivitaProgrammate;

    if (filters.reparto_id) {
      const repartoNome = reparti.find((reparto) => reparto.id === parseInt(filters.reparto_id))?.nome;
      filtered = filtered.filter((att) => att.reparto === repartoNome);
    }

    if (filters.commessa_id) {
      filtered = filtered.filter((att) => att.commessa_id === parseInt(filters.commessa_id));
    }

    if (filters.risorsa_id) {
      filtered = filtered.filter((att) => att.risorsa_id === parseInt(filters.risorsa_id));
    }

    if (filters.attivita_id) {
      filtered = filtered.filter((att) => att.attivita_id === parseInt(filters.attivita_id));
    }
    setAttivitaFiltrate(filtered);
  };

    // Funzione per aprire il pop-up in modalità modifica
    const handleEdit = (attivita) => {

  
    // Controlla se `data_inizio` è una data valida
    const dataInizio = attivita.data_inizio && attivita.data_inizio !== "Non specificata"
      ? new Date(attivita.data_inizio).toISOString().split("T")[0]
      : ""; 
  
    setFormData({
      commessa_id: attivita.commessa_id || "",
      reparto_id: reparti.find((reparto) => reparto.nome === attivita.reparto)?.id || "",
      risorsa_id: risorse.find((risorsa) => risorsa.nome === attivita.risorsa)?.id || "",
      attivita_id: attivita.attivita_id || "",
      data_inizio: dataInizio,
      durata: attivita.durata && attivita.durata !== "Non definita" ? attivita.durata : "", 
    });
  
    setIsEditing(true);
    setEditId(attivita.id);
    setShowPopup(true);
  };
    
    
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };
  


  const handleAddNew = () => {
    setFormData({
      commessa_id: "",
      reparto_id: "",
      risorsa_id: "",
      attivita_id: "",
      data_inizio: "",
      durata: "",
    });
    setIsEditing(false);
    setShowPopup(true);
  };

  
  const handleDelete = async (id) => {
  try {
    await axios.delete(`${process.env.REACT_APP_API_URL}/api/attivita_commessa/${id}`);
    alert("Attività eliminata con successo!");
    fetchOptions(); 
  } catch (error) {
    console.error("Errore durante l'eliminazione dell'attività:", error);
    alert("Errore durante l'eliminazione dell'attività.");
  }
};


  return (
    <div className="container" onClick={closeSuggestions}>
      <h1>Assegna Attività</h1>
      <button onClick={handleAddNew} className="btn btn-primary">
        Aggiungi Attività
      </button>
      <div className="filters">
  <label>
    Reparto:
    <select name="reparto_id" value={filters.reparto_id} onChange={handleFilterChange}>
      <option value="">Tutti</option>
      {reparti.map((reparto) => (
        <option key={reparto.id} value={reparto.id}>
          {reparto.nome}
        </option>
      ))}
    </select>
  </label>

  <label>
    Commessa:
    <select name="commessa_id" value={filters.commessa_id} onChange={handleFilterChange}>
      <option value="">Tutti</option>
      {commesse.map((commessa) => (
        <option key={commessa.id} value={commessa.id}>
          {commessa.numero_commessa}
        </option>
      ))}
    </select>
  </label>

  <label>
    Risorsa:
    <select name="risorsa_id" value={filters.risorsa_id} onChange={handleFilterChange}>
      <option value="">Tutte</option>
      {risorse.map((risorsa) => (
        <option key={risorsa.id} value={risorsa.id}>
          {risorsa.nome}
        </option>
      ))}
    </select>
  </label>
</div>

      {/* Lista delle attività programmate */}
      <table>
        <thead>
          <tr>
            <th>Commessa</th>
            <th>Risorsa</th>
            <th>Reparto</th>
            <th>Attività</th>
            <th>Data Inizio</th>
            <th>Durata</th>
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
              <td>{new Date(attivita.data_inizio).toLocaleDateString()}</td>
              <td>{attivita.durata} giorni</td>
              <td>
                <button className="btn btn-warning" onClick={() => handleEdit(attivita)}>
                  Modifica
                </button>
                <button className="btn btn-danger" onClick={() => handleDelete(attivita.id)}>
          Elimina
        </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {showPopup && (
  <AttivitaCrea
    formData={formData} 
    setFormData={setFormData}
    isEditing={isEditing}
    setIsEditing={setIsEditing}
    editId={editId}
    fetchAttivita={fetchOptions}
    setShowPopup={setShowPopup}
    commesse={commesse}
    reparti={reparti}
    risorse={risorse}
    attivitaDefinite={attivitaDefinite}
  />
      )}
    </div>
  );
}

export default AssegnaAttivita;
