import React, { useState, useEffect } from "react";
import axios from "axios";
import "../style.css";
import AttivitaCrea from "../AttivitaCrea"; // Importiamo il componente del pop-up

function AssegnaAttivita() {
  const [attivitaProgrammate, setAttivitaProgrammate] = useState([]);
  const [attivitaDefinite, setAttivitaDefinite] = useState([]);
  const [commesse, setCommesse] = useState([]);
  const [risorse, setRisorse] = useState([]);
  const [reparti, setReparti] = useState([]);
  const [attivitaFiltrate, setAttivitaFiltrate] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
    const [selectedCommessa, setSelectedCommessa] = useState(null); // Stato per commessa selezionata
  const [filters, setFilters] = useState({
    
    reparto_id: "",
    commessa_id: "",
    risorsa_id: "",
    attivita_id: "",
  });

  const [showPopup, setShowPopup] = useState(false); // Stato per la visibilità del pop-up
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
    setIsLoading(true);
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
      console.log("Risorse:", risorse); // Log della commessa_id corretta
      setAttivitaProgrammate(attivitaProgrammateResponse.data);
      setAttivitaFiltrate(attivitaProgrammateResponse.data);
      
    } catch (error) {
      console.error("Errore durante il recupero delle opzioni:", error);
    } finally {
      setIsLoading(false);
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
    console.log("Attività da modificare:", attivita);
  
    // Controlla se `data_inizio` è una data valida
    const dataInizio = attivita.data_inizio && attivita.data_inizio !== "Non specificata"
      ? new Date(attivita.data_inizio).toISOString().split("T")[0]
      : ""; // Usa una stringa vuota se non è valida
  
    setFormData({
      commessa_id: attivita.commessa_id || "",
      reparto_id: reparti.find((reparto) => reparto.nome === attivita.reparto)?.id || "",
      risorsa_id: risorse.find((risorsa) => risorsa.nome === attivita.risorsa)?.id || "",
      attivita_id: attivita.attivita_id || "",
      data_inizio: dataInizio,
      durata: attivita.durata && attivita.durata !== "Non definita" ? attivita.durata : "", // Usa stringa vuota se `durata` non è valida
    });
  
    console.log("Commessa ID:", attivita.commessa_id);
  console.log("Reparto ID:", attivita.reparto_id);
  console.log("Risorsa ID:", attivita.risorsa_id);
  console.log("Attività ID:", attivita.attivita_id);
  console.log("Data Inizio:", attivita.data_inizio);
  console.log("Durata:", attivita.durata);


    setIsEditing(true);
    setEditId(attivita.id);
    setShowPopup(true);
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
    fetchOptions(); // Ricarica le attività
  } catch (error) {
    console.error("Errore durante l'eliminazione dell'attività:", error);
    alert("Errore durante l'eliminazione dell'attività.");
  }
};

  return (
    <div className="container">
      <h1>Assegna Attività</h1>
      <button onClick={handleAddNew} className="btn btn-primary">
        Aggiungi Attività
      </button>

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
                {/* Puoi aggiungere anche un pulsante di eliminazione qui */}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {/* Mostra il pop-up per aggiungere o modificare un'attività */}
      {showPopup && (
  <AttivitaCrea
    formData={formData} // Passa i dati del form
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
