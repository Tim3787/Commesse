import React, { useState, useEffect } from "react";
import "../style.css";
import CommessaCrea from "../popup/CommessaCrea"; 
import logo from "../img/Animation - 1738249246846.gif";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { fetchCommesse, deleteCommessa } from "../services/API/commesse-api";
import {fetchReparti} from "../services/API/reparti-api";
import {fetchAttivita} from "../services/API/attivita-api";
import {fetchStatiCommessa} from "../services/API/statoCommessa-api";

function GestioneCommesse() {
  const [commesse, setCommesse] = useState([]);
  const [reparti, setReparti] = useState([]);
  const [attivita, setAttivita] = useState([]);
  const [selectedCommessa, setSelectedCommessa] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [selezioniAttivita, setSelezioniAttivita] = useState({});
  const [editId, setEditId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [deleteLoadingId, setDeleteLoadingId] = useState(null);
  const [clienteFilter, setClienteFilter] = useState("");
  const [tipoMacchinaFilter, setTipoMacchinaFilter] = useState("");
  const [commessaFilter, setCommessaFilter] = useState("");
  const [statiCommessa, setStatiCommessa] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [commesseData, repartiData, attivitaData, statiData] = await Promise.all([
        fetchCommesse(),
        fetchReparti(),
        fetchAttivita(),
        fetchStatiCommessa(),
      ]);
      setCommesse(commesseData);
      setReparti(repartiData);
      setAttivita(attivitaData);
      setStatiCommessa(statiData);
    } catch (error) {
      console.error("Errore durante il caricamento dei dati:", error);
      toast.error("Errore durante il caricamento dei dati.");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNewCommessa = () => {
    setIsEditing(false);
    setSelectedCommessa(null);
    setShowPopup(true);
  };

  const handleEditCommessa = (commessa) => {
    setIsEditing(true);
    setSelectedCommessa(commessa);
    setEditId(commessa.commessa_id);
    setShowPopup(true);
  };

  const handleClosePopup = () => {
    setShowPopup(false);
    setSelectedCommessa(null);
    setEditId(null);
  };

  const handleDelete = async (commessaId) => {
    if (window.confirm("Sei sicuro di voler eliminare questa commessa?")) {
      setDeleteLoadingId(commessaId);
      try {
        await deleteCommessa(commessaId);
        toast.success("Commessa eliminata con successo!");
        await loadData();
      } catch (error) {
        console.error("Errore durante l'eliminazione della commessa:", error);
        toast.error("Errore durante l'eliminazione della commessa.");
      } finally {
        setDeleteLoadingId(null);
      }
    }
  };

  const applyFilters = () => {
    return commesse.filter((commessa) => {
      return (
        commessa.numero_commessa.toString().includes(commessaFilter) &&
        commessa.cliente.toLowerCase().includes(clienteFilter.toLowerCase()) &&
        commessa.tipo_macchina.toLowerCase().includes(tipoMacchinaFilter.toLowerCase())
      );
    });
  };

  const getStatoNome = (id) => {
    const stato = statiCommessa.find((stato) => stato.id === id);
    return stato ? stato.nome_stato : "Non assegnato";
  };

  return (
    <div className="container">
      <ToastContainer position="top-left" autoClose={3000} hideProgressBar />
      {loading && (
        <div className="loading-overlay">
          <img src={logo} alt="Logo" className="logo-spinner" />
        </div>
      )}

      <div className="header">
        <h1>Gestione Commesse</h1>
        <button onClick={handleCreateNewCommessa} className="create-activity-btn">
          Crea Nuova Commessa
        </button>
      </div>


        <div className="filters">
          <input
            type="text"
            placeholder="Filtra per Numero Commessa"
            value={commessaFilter}
            onChange={(e) => setCommessaFilter(e.target.value)}
            className="input-field"
          />
          <input
            type="text"
            placeholder="Filtra per Cliente"
            value={clienteFilter}
            onChange={(e) => setClienteFilter(e.target.value)}
            className="input-field"
          />
          <input
            type="text"
            placeholder="Filtra per Tipo Macchina"
            value={tipoMacchinaFilter}
            onChange={(e) => setTipoMacchinaFilter(e.target.value)}
            className="input-field"
          />
        </div>
      

      <table>
        <thead>
          <tr>
            <th>Numero Commessa</th>
            <th>Tipo Macchina</th>
            <th>Cliente</th>
            <th>Data Consegna</th>
            <th>Data FAT</th>
            <th>Stato</th>
            <th>Azioni</th>
          </tr>
        </thead>
        <tbody>
          {applyFilters().map((commessa) => (
            <tr key={commessa.id}>
              <td>{commessa.numero_commessa}</td>
              <td>{commessa.tipo_macchina}</td>
              <td>{commessa.cliente}</td>
              <td>{new Date(commessa.data_consegna).toLocaleDateString()}</td>
              <td>{commessa.data_FAT ? new Date(commessa.data_FAT).toLocaleDateString() : "Non specificata"}</td>
              <td>{getStatoNome(commessa.stato)}</td>
              <td>
                <button className="btn btn-warning" onClick={() => handleEditCommessa(commessa)}>
                  Modifica
                </button>
                <button
                  className="btn btn-danger"
                  onClick={() => handleDelete(commessa.commessa_id)}
                  disabled={deleteLoadingId === commessa.commessa_id}
                >
                  {deleteLoadingId === commessa.commessa_id ? "Eliminazione..." : "Elimina"}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {showPopup && (
        <CommessaCrea
          commessa={selectedCommessa}
          onClose={handleClosePopup}
          isEditing={isEditing}
          reparti={reparti}
          attivita={attivita}
          selezioniAttivita={selezioniAttivita}
          setSelezioniAttivita={setSelezioniAttivita}
          fetchCommesse={loadData}
          editId={editId}
          stato={statiCommessa}
        />
      )}
    </div>
  );
}

export default GestioneCommesse;
