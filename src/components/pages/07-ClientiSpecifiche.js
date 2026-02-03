// src/components/ClientiSpecifiche.js
import { useEffect, useState } from 'react';
import logo from '../img/Animation - 1738249246846.gif';
import '../style/02-StatoAvanzamento-reparto.css'; // o un tuo CSS generico

import {
  fetchClientiSpecifiche,
  createClienteSpecifica,
  updateClienteSpecifica,
  deleteClienteSpecifica,
} from '../services/API/clientiSpecifiche-api';

import { useAppData } from '../context/AppDataContext';

import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function ClientiSpecifiche() {
  const { reparti } = useAppData();

  const [loading, setLoading] = useState(false);
  const [specifiche, setSpecifiche] = useState([]);

  // filtri
  const [filtroCliente, setFiltroCliente] = useState('');
  const [filtroRepartoId, setFiltroRepartoId] = useState('');

  // form
  const [formData, setFormData] = useState({
    cliente: '',
    reparto_id: '',
    titolo: '',
    descrizione: '',
    attivo: true,
  });

  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);

  // caricamento iniziale
  const loadData = async () => {
    try {
      setLoading(true);
      const data = await fetchClientiSpecifiche({ tutte: 1 }); // 👈 CHIAVE
      setSpecifiche(data);
    } catch (err) {
      console.error('Errore nel caricamento specifiche cliente:', err);
      toast.error('Errore nel caricamento delle specifiche cliente.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // gestione form
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (type === 'checkbox') {
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else if (name === 'reparto_id') {
      setFormData((prev) => ({
        ...prev,
        reparto_id: value === '' ? '' : parseInt(value, 10),
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const resetForm = () => {
    setFormData({
      cliente: '',
      reparto_id: '',
      titolo: '',
      descrizione: '',
      attivo: true,
    });
    setIsEditing(false);
    setEditId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.cliente || !formData.titolo || !formData.descrizione) {
      toast.error('Compila almeno Cliente, Titolo e Descrizione.');
      return;
    }

    try {
      setLoading(true);

      const payload = {
        ...formData,
        // se reparto_id è "", mandiamo null
        reparto_id:
          formData.reparto_id === '' || formData.reparto_id === null ? null : formData.reparto_id,
      };

      if (isEditing && editId) {
        await updateClienteSpecifica(editId, payload);
        toast.success('Scheda cliente aggiornata con successo.');
      } else {
        await createClienteSpecifica(payload);
        toast.success('Scheda cliente creata con successo.');
      }

      await loadData();
      resetForm();
    } catch (err) {
      console.error('Errore salvataggio scheda cliente:', err);
      toast.error('Errore durante il salvataggio della scheda cliente.');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (item) => {
    setFormData({
      cliente: item.cliente || '',
      reparto_id: item.reparto_id || '',
      titolo: item.titolo || '',
      descrizione: item.descrizione || '',
      attivo: item.attivo === 1 || item.attivo === true,
    });
    setIsEditing(true);
    setEditId(item.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleHardDelete = async (item) => {
    const first = window.confirm(
      `ATTENZIONE: vuoi ELIMINARE DEFINITIVAMENTE la scheda "${item.titolo}" (${item.cliente})?`
    );
    if (!first) return;

    const second = window.confirm("Conferma finale: l'operazione è irreversibile. Continuare?");
    if (!second) return;

    try {
      setLoading(true);
      await deleteClienteSpecifica(item.id);
      toast.success('Scheda eliminata definitivamente.');
      await loadData();
    } catch (err) {
      console.error('Errore hard delete scheda cliente:', err);
      toast.error("Errore durante l'eliminazione definitiva della scheda cliente.");
    } finally {
      setLoading(false);
    }
  };
  const handleToggleAttivo = async (item) => {
    try {
      setLoading(true);
      await updateClienteSpecifica(item.id, {
        cliente: item.cliente,
        reparto_id: item.reparto_id,
        titolo: item.titolo,
        descrizione: item.descrizione,
        attivo: Number(item.attivo) !== 1, // toggle
      });
      toast.success(Number(item.attivo) === 1 ? 'Scheda disattivata.' : 'Scheda riattivata.');
      await loadData();
    } catch (err) {
      console.error('Errore toggle attivo:', err);
      toast.error("Errore durante l'aggiornamento dello stato.");
    } finally {
      setLoading(false);
    }
  };

  // filtraggio lato frontend
  const filteredSpecifiche = specifiche.filter((s) => {
    const matchCliente = s.cliente.toLowerCase().includes(filtroCliente.toLowerCase());

    const matchReparto =
      !filtroRepartoId || s.reparto_id === parseInt(filtroRepartoId, 10) || s.reparto_id === null; // le globali le mostriamo sempre

    return matchCliente && matchReparto;
  });

  const getRepartoName = (id) => {
    if (!id) return 'Tutti';
    const r = reparti.find((rep) => rep.id === id);
    return r ? r.nome : id;
  };

  return (
    <div className="page-wrapper">
      {loading && (
        <div className="loading-overlay">
          <img src={logo} alt="Logo" className="logo-spinner" />
        </div>
      )}

      <ToastContainer position="top-left" autoClose={2000} hideProgressBar />

      {/* HEADER */}
      <div className="header">
        <div className="flex-center header-row">
          <h1>SPECIFICHE CLIENTI</h1>
        </div>
      </div>

      {/* CONTENUTO */}
      <div className="container mh-80 ">
        <div className="flex-column-center">
          {/* FORM CREAZIONE / MODIFICA */}

          <h2>{isEditing ? 'Modifica scheda cliente' : 'Nuova scheda cliente'}</h2>
          <form
            onSubmit={handleSubmit}
            className="flex-column-center"
            style={{ gap: 8, alignItems: 'stretch' }}
          >
            Cliente:
            <input
              type="text"
              name="cliente"
              value={formData.cliente}
              onChange={handleChange}
              className="w-400"
              placeholder="Nome cliente (es. Barilla)"
            />
            Reparto (vuoto = tutti):
            <select
              name="reparto_id"
              value={formData.reparto_id}
              onChange={handleChange}
              className="w-400"
            >
              <option value="">Tutti i reparti</option>
              {reparti.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.nome}
                </option>
              ))}
            </select>
            Titolo:
            <input
              type="text"
              name="titolo"
              value={formData.titolo}
              onChange={handleChange}
              className="w-400"
              placeholder="Titolo scheda (es. Standard SW Palletizzatore)"
            />
            Descrizione:
            <textarea
              name="descrizione"
              value={formData.descrizione}
              onChange={handleChange}
              rows="4"
              className="w-400"
              placeholder="Note, richieste particolari, standard da seguire..."
            />
            <label className="flex-row-center" style={{ gap: 8 }}>
              <input
                type="checkbox"
                name="attivo"
                checked={formData.attivo}
                onChange={handleChange}
              />
              Scheda attiva
            </label>
            <div className="flex-center" style={{ gap: 8, marginTop: 8 }}>
              <button type="submit" className="btn w-200 btn--blue btn--pill" disabled={loading}>
                {isEditing ? 'Aggiorna scheda' : 'Crea scheda'}
              </button>
              {isEditing && (
                <button
                  type="button"
                  className="btn w-200 btn--warning btn--pill"
                  onClick={resetForm}
                >
                  Annulla modifica
                </button>
              )}
            </div>
          </form>
        </div>

        {/* FILTRI E TABELLA */}
        <div className="Reparto-table-container mh-60">
          <h2>Elenco schede cliente</h2>

          {/* Filtri */}
          <div className="flex-center" style={{ gap: 12, marginBottom: 10, flexWrap: 'wrap' }}>
            <input
              type="text"
              value={filtroCliente}
              onChange={(e) => setFiltroCliente(e.target.value)}
              placeholder="Filtra per cliente"
              className="w-200"
            />

            <select
              value={filtroRepartoId}
              onChange={(e) => setFiltroRepartoId(e.target.value)}
              className="w-200"
            >
              <option value="">Tutti i reparti</option>
              {reparti.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.nome}
                </option>
              ))}
            </select>
          </div>

          {/* Tabella */}
          <table>
            <thead>
              <tr>
                <th>Cliente</th>
                <th>Reparto</th>
                <th>Titolo</th>
                <th>Descrizione</th>
                <th>Attivo</th>
                <th>Azioni</th>
              </tr>
            </thead>
            <tbody>
              {filteredSpecifiche.length === 0 ? (
                <tr>
                  <td colSpan="6">Nessuna scheda trovata.</td>
                </tr>
              ) : (
                filteredSpecifiche.map((item) => (
                  <tr key={item.id}>
                    <td>{item.cliente}</td>
                    <td>{getRepartoName(item.reparto_id)}</td>
                    <td>{item.titolo}</td>
                    <td style={{ maxWidth: 400, whiteSpace: 'pre-wrap' }}>{item.descrizione}</td>
                    <td>{Number(item.attivo) === 1 ? 'Sì' : 'No'}</td>

                    <td>
                      <button
                        className="btn w-100 btn--warning btn--pill"
                        onClick={() => handleEdit(item)}
                      >
                        Modifica
                      </button>
                      <button
                        className={`btn w-100 btn--pill ${Number(item.attivo) === 1 ? 'btn--danger' : 'btn--blue'}`}
                        onClick={() => handleToggleAttivo(item)}
                      >
                        {Number(item.attivo) === 1 ? 'Disattiva' : 'Riattiva'}
                      </button>
                      {Number(item.attivo) !== 1 && (
                        <button
                          className="btn w-100 btn--danger btn--pill"
                          onClick={() => handleHardDelete(item)}
                        >
                          Elimina
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default ClientiSpecifiche;
