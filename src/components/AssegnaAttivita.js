import React, { useState, useEffect } from "react";
import axios from "axios";
import "./style.css";

function AssegnaAttivita() {
  const [attivitaProgrammate, setAttivitaProgrammate] = useState([]);
  const [attivitaDefinite, setAttivitaDefinite] = useState([]);
  const [commesse, setCommesse] = useState([]);
  const [risorse, setRisorse] = useState([]);
  const [reparti, setReparti] = useState([]);
  const [attivitaFiltrate, setAttivitaFiltrate] = useState([]);
  const [sortOrder, setSortOrder] = useState("asc");
  const [formData, setFormData] = useState({
    commessa_id: "",
    reparto_id: "",
    risorsa_id: "",
    attivita_id: "",
    data_inizio: "",
    durata: "",
  });
  const [filters, setFilters] = useState({
    reparto_id: "",
    commessa_id: "",
    risorsa_id: "",
    attivita_id: "",
  });

  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);

  useEffect(() => {
    fetchOptions();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [filters, attivitaProgrammate, sortOrder]);



const fetchOptions = async () => {
  setIsLoading(true);
  try {
    const [commesseResponse, risorseResponse, repartiResponse, attivitaDefiniteResponse, attivitaProgrammateResponse] =
      await Promise.all([
        axios.get("http://localhost:5000/api/commesse"),
        axios.get("http://localhost:5000/api/risorse"),
        axios.get("http://localhost:5000/api/reparti"),
        axios.get("http://localhost:5000/api/attivita"),
        axios.get("http://localhost:5000/api/attivita_commessa"),
      ]);

    setCommesse(commesseResponse.data);
    setRisorse(risorseResponse.data);
    setReparti(repartiResponse.data);
    setAttivitaDefinite(attivitaDefiniteResponse.data);

    const programmateConDefault = attivitaProgrammateResponse.data.map((att) => ({
      ...att,
      data_inizio: att.data_inizio || "Non specificata",
      durata: att.durata || "Non definita",
      risorsa: att.risorsa || "Non assegnata",
    }));
    setAttivitaProgrammate(programmateConDefault);
    setAttivitaFiltrate(programmateConDefault);
  } catch (error) {
    console.error("Errore durante il recupero delle opzioni:", error);
  } finally {
    setIsLoading(false);
  }
};

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters({ ...filters, [name]: value });
  };

  const applyFilters = () => {
    let filtered = attivitaProgrammate;

    // Filtro per reparto
    if (filters.reparto_id) {
      const repartoNome = reparti.find((reparto) => reparto.id === parseInt(filters.reparto_id))?.nome;
      filtered = filtered.filter((att) => att.reparto === repartoNome);
    }

    // Filtro per commessa
    if (filters.commessa_id) {
      filtered = filtered.filter((att) => att.commessa_id === parseInt(filters.commessa_id));
    }

    // Filtro per risorsa
    if (filters.risorsa_id) {
      filtered = filtered.filter((att) => att.risorsa_id === parseInt(filters.risorsa_id));
    }

    // Filtro per attività
    if (filters.attivita_id) {
      filtered = filtered.filter((att) => att.attivita_id === parseInt(filters.attivita_id));
    }
    // Ordina le attività per data
    filtered.sort((a, b) => {
      const dateA = new Date(a.data_inizio);
      const dateB = new Date(b.data_inizio);
      return sortOrder === "asc" ? dateA - dateB : dateB - dateA;
    });
    setAttivitaFiltrate(filtered);
  };
  
  const toggleSortOrder = () => {
    setSortOrder((prevOrder) => (prevOrder === "asc" ? "desc" : "asc"));
  };


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
  
    setIsEditing(true);
    setEditId(attivita.id);
  };
  
  

  const handleDelete = async (id) => {
    try {
      await axios.delete(`http://localhost:5000/api/attivita_commessa/${id}`);
      alert("Attività eliminata con successo!");
      fetchOptions();
    } catch (error) {
      console.error("Errore durante l'eliminazione dell'attività:", error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
  
    const { commessa_id, reparto_id, risorsa_id, attivita_id, data_inizio, durata } = formData;
  
    if (!commessa_id || !reparto_id || !risorsa_id || !attivita_id || !data_inizio || !durata) {
      alert("Tutti i campi sono obbligatori.");
      return;
    }
  
    try {
      if (isEditing) {
        await axios.put(`http://localhost:5000/api/attivita_commessa/${editId}`, formData);
        alert("Attività aggiornata con successo!");
      } else {
        await axios.post("http://localhost:5000/api/attivita_commessa", formData);
        alert("Attività aggiunta con successo!");
      }
  
      setFormData({
        commessa_id: "",
        reparto_id: "",
        risorsa_id: "",
        attivita_id: "",
        data_inizio: "",
        durata: "",
      });
      setIsEditing(false);
      setEditId(null);
      fetchOptions();
    } catch (error) {
      console.error("Errore durante l'aggiunta o modifica dell'attività:", error);
    }
  };

  const getFilteredRisorse = () => {
    if (filters.reparto_id) {
      return risorse.filter((risorsa) => risorsa.reparto_id === parseInt(filters.reparto_id));
    }
    return risorse;
  };

  const getFilteredAttivita = () => {
    if (filters.reparto_id) {
      return attivitaDefinite.filter((attivita) => attivita.reparto_id === parseInt(filters.reparto_id));
    }
    return attivitaDefinite;
  };

  const getFilteredCommesse = () => {
    if (filters.risorsa_id) {
      return commesse.filter((commessa) =>
        attivitaProgrammate.some(
          (att) => att.commessa_id === commessa.id && att.risorsa_id === parseInt(filters.risorsa_id)
        )
      );
    }
    return commesse;
  };

  return (
    <div className="container">
      <h1>Assegna Attività</h1>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Commessa:</label>
          <select
            name="commessa_id"
            value={formData.commessa_id}
            onChange={handleChange}
            required
          >
            <option value="">Seleziona una commessa</option>
            {commesse.map((commessa) => (
              <option key={commessa.id} value={commessa.id}>
                {commessa.numero_commessa}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label>Reparto:</label>
          <select
            name="reparto_id"
            value={formData.reparto_id}
            onChange={handleChange}
            required
          >
            <option value="">Seleziona un reparto</option>
            {reparti.map((reparto) => (
              <option key={reparto.id} value={reparto.id}>
                {reparto.nome}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label>Risorsa:</label>
          <select
            name="risorsa_id"
            value={formData.risorsa_id}
            onChange={handleChange}
            required
            disabled={!formData.reparto_id}
          >
            <option value="">Seleziona una risorsa</option>
            {risorse
              .filter((risorsa) => risorsa.reparto_id === parseInt(formData.reparto_id))
              .map((risorsa) => (
                <option key={risorsa.id} value={risorsa.id}>
                  {risorsa.nome}
                </option>
              ))}
          </select>
        </div>
        <div>
          <label>Attività:</label>
          <select
            name="attivita_id"
            value={formData.attivita_id}
            onChange={handleChange}
            required
            disabled={!formData.reparto_id}
          >
            <option value="">Seleziona un'attività</option>
            {attivitaDefinite
              .filter((attivita) => attivita.reparto_id === parseInt(formData.reparto_id))
              .map((attivita) => (
                <option key={attivita.id} value={attivita.id}>
                  {attivita.nome_attivita}
                </option>
              ))}
          </select>
        </div>
        <div>
          <label>Data Inizio:</label>
          <input
            type="date"
            name="data_inizio"
            value={formData.data_inizio}
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <label>Durata:</label>
          <input
            type="number"
            name="durata"
            value={formData.durata}
            onChange={handleChange}
            required
          />
        </div>
        <button type="submit" className="btn btn-primary">
          {isEditing ? "Aggiorna Attività" : "Aggiungi Attività"}
        </button>
      </form>

      <h1>Riepilogo Attività Programmate</h1>
      <div className="filters">
        <div>
          <label>Reparto:</label>
          <select
            name="reparto_id"
            value={filters.reparto_id}
            onChange={handleFilterChange}
          >
            <option value="">Tutti</option>
            {reparti.map((reparto) => (
              <option key={reparto.id} value={reparto.id}>
                {reparto.nome}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label>Risorsa:</label>
          <select
            name="risorsa_id"
            value={filters.risorsa_id}
            onChange={handleFilterChange}
          >
            <option value="">Tutte</option>
            {getFilteredRisorse().map((risorsa) => (
              <option key={risorsa.id} value={risorsa.id}>
                {risorsa.nome}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label>Commessa:</label>
          <select
            name="commessa_id"
            value={filters.commessa_id}
            onChange={handleFilterChange}
          >
            <option value="">Tutte</option>
            {getFilteredCommesse().map((commessa) => (
              <option key={commessa.id} value={commessa.id}>
                {commessa.numero_commessa}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label>Attività:</label>
          <select
            name="attivita_id"
            value={filters.attivita_id}
            onChange={handleFilterChange}
          >
            <option value="">Tutte</option>
            {getFilteredAttivita().map((attivita) => (
              <option key={attivita.id} value={attivita.id}>
                {attivita.nome_attivita}
              </option>
            ))}
          </select>
        </div>
        <button onClick={toggleSortOrder} className="btn-Order">
        ({sortOrder === "asc" ? "Recente" : "Vecchia"})
      </button>
      </div>

      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Commessa</th>
            <th>Risorsa</th>
            <th>Reparto</th>
            <th>Attività</th>
            <th>Data Inizio</th>
            <th>Durata</th>
          </tr>
        </thead>
        <tbody>
  {attivitaFiltrate.map((att) => (
    <tr key={att.id}>
      <td>{att.id}</td>
      <td>{att.numero_commessa || "Non assegnato"}</td>
      <td>{att.risorsa || "Non assegnata"}</td>
      <td>{att.reparto || "Non assegnato"}</td>
      <td>{att.nome_attivita || "Non assegnata"}</td>
      <td>{att.data_inizio ? new Date(att.data_inizio).toLocaleDateString() : "Non assegnata"}</td>
      <td>{att.durata ? `${att.durata} giorni` : "Non assegnata"}</td>
      <td>
        <button className="btn btn-warning" onClick={() => handleEdit(att)}>
          Modifica
        </button>
        <button className="btn btn-danger" onClick={() => handleDelete(att.id)}>
          Elimina
        </button>
      </td>
    </tr>
  ))}
</tbody>

      </table>
    </div>
  );
}

export default AssegnaAttivita;