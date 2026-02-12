import { useEffect, useRef, useState } from 'react';
import apiClient from '../config/axiosConfig';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function AfterSalesQuickPopup({ onClose }) {
  const token = sessionStorage.getItem('token');

  const [commesse, setCommesse] = useState([]);
  const [commessaSearch, setCommessaSearch] = useState('');
  const [suggestedCommesse, setSuggestedCommesse] = useState([]);
  const suggestionsRef = useRef(null);

  const [formData, setFormData] = useState({
    commessa_id: '',
    descrizione: '',
  });

  const [loading, setLoading] = useState(false);

  // ===== load commesse
  useEffect(() => {
    const fetchCommesse = async () => {
      try {
        const res = await apiClient.get('/api/commesse', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setCommesse(res.data || []);
      } catch (e) {
        console.error(e);
        toast.error('Errore caricamento commesse');
      }
    };
    fetchCommesse();
  }, [token]);

  // ===== click outside suggestions
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(e.target)) {
        setSuggestedCommesse([]);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectCommessa = (commessa) => {
    setCommessaSearch(commessa.numero_commessa);
    setFormData((p) => ({ ...p, commessa_id: commessa.commessa_id || commessa.id }));
    setSuggestedCommesse([]);
  };
  const handleSubmit = async (e) => {
    e.preventDefault();

    const numero = (commessaSearch || '').trim();
    if (!numero) {
      toast.warn('Seleziona una commessa valida');
      return;
    }

    const payload = {
      numero_commessa: numero,
      descrizione: (formData.descrizione || '').trim() || 'After Sales',
    };

    try {
      setLoading(true);

      await apiClient.post('/api/attivita_commessa/after-sales', payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      toast.success('Attività After Sales creata!');
      window.dispatchEvent(new CustomEvent('service:reload'));

      onClose?.();
    } catch (err) {
      console.error(err);
      toast.error(
        err?.response?.data?.message ||
          err?.response?.data ||
          "Errore durante la creazione dell'attività"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="popup" style={{ minWidth: '1000px', justifyContent: 'center' }}>
      <div className="popup-background" onClick={onClose} />
      <div className="popup-content" onClick={(e) => e.stopPropagation()}>
        <h2>Nuova richiesta After Sales</h2>

        <form onSubmit={handleSubmit}>
          <div className="flex-column-center">
            <label>Commessa:</label>
            <input
              type="text"
              value={commessaSearch || ''}
              placeholder="Cerca per numero commessa"
              className="w-400"
              onFocus={() => {
                if (!formData.commessa_id && commessaSearch.length >= 2) {
                  const filtered = commesse.filter((c) =>
                    String(c.numero_commessa).toLowerCase().includes(commessaSearch.toLowerCase())
                  );
                  setSuggestedCommesse(filtered);
                }
              }}
              onChange={(e) => {
                const inputValue = e.target.value;
                setCommessaSearch(inputValue);

                const match = commesse.find(
                  (c) => String(c.numero_commessa).toLowerCase() === inputValue.toLowerCase()
                );

                if (match) {
                  setFormData((p) => ({ ...p, commessa_id: match.commessa_id || match.id }));
                  setSuggestedCommesse([]);
                } else {
                  setFormData((p) => ({ ...p, commessa_id: '' }));

                  if (inputValue.length >= 2) {
                    const filtered = commesse.filter((c) =>
                      String(c.numero_commessa).toLowerCase().includes(inputValue.toLowerCase())
                    );
                    setSuggestedCommesse(filtered);
                  } else {
                    setSuggestedCommesse([]);
                  }
                }
              }}
            />

            {suggestedCommesse.length > 0 && (
              <ul
                className="suggestions-list w-400"
                style={{ position: 'relative' }}
                ref={suggestionsRef}
              >
                {suggestedCommesse.map((c) => (
                  <li key={c.id} onClick={() => handleSelectCommessa(c)}>
                    {c.numero_commessa}
                    {c.cliente ? ` - ${c.cliente}` : ''}
                  </li>
                ))}
              </ul>
            )}

            <label>Descrizione:</label>
            <textarea
              className="w-400"
              rows={5}
              placeholder="Scrivi cosa ha chiesto il cliente (problema, urgenza, contatto...)"
              value={formData.descrizione || ''}
              onChange={(e) => setFormData((p) => ({ ...p, descrizione: e.target.value }))}
            />

            <button type="submit" className="btn w-400 btn--blue btn--pill" disabled={loading}>
              {loading ? 'Creazione...' : 'Crea richiesta'}
            </button>

            <button
              type="button"
              className="btn w-400 btn--danger btn--pill"
              onClick={onClose}
              disabled={loading}
            >
              Annulla
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AfterSalesQuickPopup;
