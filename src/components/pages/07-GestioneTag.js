import { useEffect, useState } from 'react';
import logo from '../img/Animation - 1738249246846.gif';
import '../style/02-StatoAvanzamento-reparto.css';

import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { useAppData } from '../context/AppDataContext';
import { fetchTags, createTag, updateTag, deleteTag } from '../services/API/tag-api';

function GestioneTag() {
  const { reparti } = useAppData();

  const [loading, setLoading] = useState(false);
  const [tags, setTags] = useState([]);

  // filtri
  const [filtroSearch, setFiltroSearch] = useState('');
  const [filtroReparto, setFiltroReparto] = useState('');
  const [soloAttivi, setSoloAttivi] = useState(false);

  // form
  const [formData, setFormData] = useState({
    nome: '',
    prefisso: '',
    reparto: '', // stringa o "" (globale)
    colore: '#cccccc',
    descrizione: '',
    attivo: true,
  });

  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);
  const to01 = (v, def = 1) => {
    if (v === undefined || v === null) return def;
    return Number(v) === 1 || v === true ? 1 : 0;
  };

  const loadData = async () => {
    try {
      setLoading(true);

      const data = await fetchTags({
        reparto: filtroReparto || undefined,
        includeGlobal: 1,
        search: filtroSearch || undefined,
      });

      const normalized = (data || []).map((t) => ({
        ...t,
        attivo: to01(t.attivo, 1), // sempre 0/1
      }));

      setTags(normalized); // ✅ SOLO QUESTO
    } catch (err) {
      console.error('Errore nel caricamento tag:', err);
      toast.error('Errore nel caricamento tag.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === 'checkbox') {
      setFormData((prev) => ({ ...prev, [name]: checked }));
      return;
    }
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setFormData({
      nome: '',
      prefisso: '',
      reparto: '',
      colore: '#cccccc',
      descrizione: '',
      attivo: true,
    });
    setIsEditing(false);
    setEditId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.nome || !formData.prefisso) {
      toast.error('Compila almeno Nome e Prefisso.');
      return;
    }

    try {
      setLoading(true);

      const payload = {
        nome: formData.nome.trim(),
        prefisso: formData.prefisso.trim().toUpperCase(),
        reparto: formData.reparto === '' ? null : formData.reparto,
        colore: formData.colore || '#cccccc',
        descrizione: formData.descrizione || null,
        attivo: formData.attivo ? 1 : 0, // ✅ QUI
      };

      if (isEditing && editId) {
        await updateTag(editId, payload);
        toast.success('Tag aggiornato con successo.');
      } else {
        await createTag(payload);
        toast.success('Tag creato con successo.');
      }

      await loadData();
      resetForm();
    } catch (err) {
      console.error('Errore salvataggio tag:', err);
      toast.error('Errore durante il salvataggio del tag.');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (item) => {
    setFormData({
      nome: item.nome || '',
      prefisso: item.prefisso || '',
      reparto: item.reparto || '',
      colore: item.colore || '#cccccc',
      descrizione: item.descrizione || '',
      attivo: to01(item.attivo, 1) === 1, // ✅
    });
    setIsEditing(true);
    setEditId(item.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const normalizeReparto = (value) => {
    if (value === '' || value === undefined) return null;
    return value;
  };

  const handleToggleAttivo = async (item) => {
    const isAttivo = to01(item.attivo, 1) === 1;
    const nextAttivo = isAttivo ? 0 : 1;

    try {
      setLoading(true);

      await updateTag(item.id, {
        nome: (item.nome ?? '').trim(),
        prefisso: (item.prefisso ?? '').trim().toUpperCase(),
        reparto: normalizeReparto(item.reparto),
        colore: item.colore || '#cccccc',
        descrizione: item.descrizione || null,
        attivo: nextAttivo,
      });

      toast.success(isAttivo ? 'Tag disattivato.' : 'Tag riattivato.');

      setTags((prev) => prev.map((t) => (t.id === item.id ? { ...t, attivo: nextAttivo } : t)));
    } catch (err) {
      console.error('Errore toggle attivo:', err?.response?.status, err?.response?.data || err);
      toast.error(err?.response?.data?.message || "Errore durante l'aggiornamento dello stato.");
    } finally {
      setLoading(false);
    }
  };

  const handleHardDelete = async (item) => {
    // (facoltativo) se vuoi impedire delete su attivi:
    // if (isAttivo) {
    //   toast.error('Disattiva il tag prima di eliminarlo definitivamente.');
    //   return;
    // }

    const first = window.confirm(
      `ATTENZIONE: vuoi ELIMINARE DEFINITIVAMENTE il tag "${item.prefisso} ${item.nome}"?`
    );
    if (!first) return;

    const second = window.confirm("Conferma finale: l'operazione è irreversibile. Continuare?");
    if (!second) return;

    try {
      setLoading(true);
      await deleteTag(item.id);
      toast.success('Tag eliminato definitivamente.');

      // ✅ aggiorna subito la UI
      setTags((prev) => prev.filter((t) => t.id !== item.id));
    } catch (err) {
      console.error('Errore hard delete tag:', err);
      toast.error("Errore durante l'eliminazione definitiva del tag.");
    } finally {
      setLoading(false);
    }
  };

  // filtro lato frontend (utile se endpoint lookup ti torna già filtrato)
  const filtered = tags.filter((t) => {
    const matchSearch =
      !filtroSearch || `${t.prefisso} ${t.nome}`.toLowerCase().includes(filtroSearch.toLowerCase());

    const matchReparto = !filtroReparto || t.reparto === filtroReparto || t.reparto === null;

    const matchAttivo = !soloAttivi || to01(t.attivo, 1) === 1;

    return matchSearch && matchReparto && matchAttivo;
  });

  const repartiOptions = [
    { value: '', label: 'Globale (tutti)' },
    ...reparti.map((r) => ({ value: r.nome, label: r.nome })),
  ];

  return (
    <div className="page-wrapper">
      {loading && (
        <div className="loading-overlay">
          <img src={logo} alt="Logo" className="logo-spinner" />
        </div>
      )}

      <ToastContainer position="top-left" autoClose={2000} hideProgressBar />

      <div className="header">
        <div className="flex-center header-row">
          <h1>GESTIONE TAG</h1>
        </div>
      </div>

      <div className="container mh-80">
        <div className="flex-column-center">
          <h2>{isEditing ? 'Modifica tag' : 'Nuovo tag'}</h2>

          <form
            onSubmit={handleSubmit}
            className="flex-column-center"
            style={{ gap: 8, alignItems: 'stretch' }}
          >
            Nome:
            <input
              type="text"
              name="nome"
              value={formData.nome}
              onChange={handleChange}
              className="w-400"
              placeholder="es. UCA Vassoi"
            />
            Prefisso:
            <input
              type="text"
              name="prefisso"
              value={formData.prefisso}
              onChange={handleChange}
              className="w-400"
              placeholder="es. SW"
            />
            Reparto (vuoto = globale):
            <select
              name="reparto"
              value={formData.reparto}
              onChange={handleChange}
              className="w-400"
            >
              {repartiOptions.map((o) => (
                <option key={o.value || 'global'} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            Colore:
            <input
              type="color"
              name="colore"
              value={formData.colore}
              onChange={handleChange}
              className="w-200"
            />
            Descrizione:
            <textarea
              name="descrizione"
              value={formData.descrizione}
              onChange={handleChange}
              rows="3"
              className="w-400"
              placeholder="Opzionale..."
            />
            <label className="flex-row-center" style={{ gap: 8 }}>
              <input
                type="checkbox"
                name="attivo"
                checked={formData.attivo}
                onChange={handleChange}
              />
              Tag attivo
            </label>
            <div className="flex-center" style={{ gap: 8, marginTop: 8 }}>
              <button type="submit" className="btn w-200 btn--blue btn--pill" disabled={loading}>
                {isEditing ? 'Aggiorna tag' : 'Crea tag'}
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

        <div className="Reparto-table-container mh-60">
          <h2>Elenco tag</h2>

          <div className="flex-center" style={{ gap: 12, marginBottom: 10, flexWrap: 'wrap' }}>
            <input
              type="text"
              value={filtroSearch}
              onChange={(e) => setFiltroSearch(e.target.value)}
              placeholder="Cerca (nome o prefisso)"
              className="w-200"
            />

            <select
              value={filtroReparto}
              onChange={(e) => setFiltroReparto(e.target.value)}
              className="w-200"
            >
              <option value="">Tutti (incluse globali)</option>
              {reparti.map((r) => (
                <option key={r.id} value={r.nome}>
                  {r.nome}
                </option>
              ))}
            </select>

            <label className="flex-row-center" style={{ gap: 8 }}>
              <input
                type="checkbox"
                checked={soloAttivi}
                onChange={(e) => setSoloAttivi(e.target.checked)}
              />
              Solo attivi
            </label>

            <button className="btn w-120 btn--blue btn--pill" onClick={loadData}>
              Refresh
            </button>
          </div>

          <table>
            <thead>
              <tr>
                <th>Prefisso</th>
                <th>Nome</th>
                <th>Reparto</th>
                <th>Colore</th>
                <th>Attivo</th>
                <th>Azioni</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan="6">Nessun tag trovato.</td>
                </tr>
              ) : (
                filtered.map((item) => {
                  const isActive = to01(item.attivo, 1) === 1;

                  return (
                    <tr key={item.id}>
                      <td>{item.prefisso}</td>
                      <td>{item.nome}</td>
                      <td>{item.reparto ?? 'Globale'}</td>
                      <td>
                        <span
                          style={{
                            display: 'inline-block',
                            width: 18,
                            height: 18,
                            borderRadius: 4,
                            background: item.colore || '#cccccc',
                            border: '1px solid rgba(0,0,0,0.2)',
                          }}
                        />
                      </td>
                      <td>{isActive ? 'Sì' : 'No'}</td>

                      <td style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        <button
                          className="btn w-100 btn--warning btn--pill"
                          onClick={() => handleEdit(item)}
                        >
                          Modifica
                        </button>

                        <button
                          className={`btn w-100 btn--pill ${isActive ? 'btn--danger' : 'btn--blue'}`}
                          onClick={() => handleToggleAttivo(item)}
                        >
                          {isActive ? 'Disattiva' : 'Riattiva'}
                        </button>

                        <button
                          className="btn w-100 btn--danger btn--pill"
                          onClick={() => handleHardDelete(item)}
                        >
                          Elimina
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>

          <div style={{ marginTop: 10, fontSize: 12, opacity: 0.8 }}>
            Nota: se vedi solo tag attivi è perché la tua route <code>/schedeTecniche/tag</code>{' '}
            filtra <code>attivo=1</code>. Per una gestione completa (anche inattivi), conviene
            aggiungere un router admin <code>/api/tags</code>.
          </div>
        </div>
      </div>
    </div>
  );
}

export default GestioneTag;
