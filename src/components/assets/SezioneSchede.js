import { useEffect, useState } from 'react';
import { fetchSchedeTecniche } from '../services/API/schedeTecniche-api';

function SezioneSchede({ commessaId, numero_commessa, apriPopupScheda, activityStatus }) {
  const [schede, setSchede] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSchedeTecniche(commessaId)
      .then(setSchede)
      .catch((err) => console.error('Errore nel caricamento delle schede:', err))
      .finally(() => setLoading(false));
  }, [commessaId]);

  const statusClass =
    activityStatus === 0 ? 'not-started' : activityStatus === 1 ? 'started' : 'completed';

  return (
    <div className={`flex-column-center ${statusClass}`}>
      <strong>Schede:</strong>
      {loading ? (
        <p>Caricamento schede...</p>
      ) : (
        <>
          {schede.length === 0 ? (
            <p>Nessuna scheda</p>
          ) : (
            <ul style={{ listStyleType: 'none', padding: 5, margin: 0, height: 'fit-content' }}>
              {schede.map((s) => (
                <li key={s.id}>
                  <button
                    className="btn btn--scheda "
                    onClick={() =>
                      apriPopupScheda({
                        commessaId,
                        numero_commessa,
                        schedaInModifica: s,
                      })
                    }
                  >
                    📜- {s.titolo?.trim() || s.tipo || `Scheda #${s.id}`}
                  </button>
                </li>
              ))}
            </ul>
          )}
          <div className="flex-column-center">
            <button
              className="btn btn--blue w-200 btn--pill"
              onClick={() => apriPopupScheda({ commessaId, numero_commessa })}
            >
              Crea Scheda
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default SezioneSchede;
