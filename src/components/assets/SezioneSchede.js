import { useEffect, useState } from "react";
import { fetchSchedeTecniche } from "../services/API/schedeTecniche-api";

function SezioneSchede({ commessaId, numero_commessa, apriPopupScheda }) {
  const [schede, setSchede] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSchedeTecniche(commessaId)
      .then(setSchede)
      .catch(err => console.error("Errore nel caricamento delle schede:", err))
      .finally(() => setLoading(false));
  }, [commessaId]);

  return (
    <div className="flex-column-center">
      {loading ? (
        <p>Caricamento schede...</p>
      ) : (
        <>
          {schede.length === 0 ? (
            <p>Nessuna scheda</p>
          ) : (
           <ul style={{ listStyleType: "none", padding: 5, margin: 0, height: "fit-content" }}>

              {schede.map((s) => (
                <li key={s.id}>
                  <button
      className="btn btn--border btn--pill w-100"
      onClick={() =>
        apriPopupScheda({
          commessaId,
          numero_commessa,
          schedaInModifica: s,
        })
      }
    > 
    {s.tipo}
    </button>
                </li>
              ))}
            </ul>
          )}
     <div className="flex-column-center">
<button
  className="btn btn--blue w-100 btn--pill"
  onClick={() =>
    apriPopupScheda({ commessaId, numero_commessa })
  }
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