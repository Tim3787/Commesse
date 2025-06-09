import { useEffect, useState } from 'react';
import { 
fetchSchedeTecniche,
  createSchedaTecnica,
  updateSchedaTecnica,
  fetchTipiSchedaTecnica
 } from "../services/API/schedeTecniche-api";
import SchedaSviluppoForm from "../common/SchedaSviluppoForm";
import SchedaCollaudoForm from "../common/SchedaCollaudoForm";
import { fetchCurrentUser } from "../services/API/utenti-api";

function SchedaTecnica({ editable, commessaId,numero_commessa, onClose, schedaInModifica, setSchedaInModifica }) {
  const [, setSchede] = useState([]);
  const [, setLoading] = useState(true);
const [tipoSelezionato, setTipoSelezionato] = useState(null);
  const token = sessionStorage.getItem("token");    
  const [user, setUser] = useState(null); 
const [tipiSchede, setTipiSchede] = useState([]);

useEffect(() => {
    if (!commessaId) return;
    fetchSchedeTecniche(commessaId)
      .then(data => setSchede(data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, [commessaId]);


  const handleClosePopup = () => {
    onClose();

  };

useEffect(() => {
  const fetchUserData = async () => {
    try {
      const userData = await fetchCurrentUser(token);
      setUser(userData); // ✅ salva oggetto completo
    } catch (error) {
    }
  };
   console.log("user:", user);
  fetchUserData();
}, [token]);




useEffect(() => {
  const caricaTipiSchedaTecnica = async () => {
    try {
      const data = await fetchTipiSchedaTecnica(); // chiamata API
      setTipiSchede(data);
    } catch (error) {
      console.error("Errore nel caricamento dei tipi di scheda:", error);
    }
  };

  caricaTipiSchedaTecnica();
}, []);



const handleSaveScheda = async (valoriAggiornati) => {
  try {
    await updateSchedaTecnica(schedaInModifica.id, {
      ...valoriAggiornati,
      risorsa_id: user?.risorsa_id,
      descrizione: `Modifica effettuata da ${user?.nome || 'utente'}`,
    });

    const aggiornate = await fetchSchedeTecniche(commessaId);
    setSchede(aggiornate);

    // Aggiorna anche i dati della scheda modificata
    const aggiornata = aggiornate.find(s => s.id === schedaInModifica.id);
    setSchedaInModifica(aggiornata);

    // Chiudi il popup
    handleClosePopup();
  } catch (err) {
    console.error(err);
    alert("Errore nel salvataggio");
  }
};


const handleNuovaScheda = async (tipo_id) => {
  try {
    const esistenti = await fetchSchedeTecniche(commessaId);
    const giaEsiste = esistenti.find(s => s.tipo_id === tipo_id);

    if (giaEsiste) {
      setSchedaInModifica(giaEsiste); // ha già scheda.tipo
    } else {
      const nuova = await createSchedaTecnica({
        commessa_id: commessaId,
         tipo_id,
        creata_da: user.id,
      });

      setSchedaInModifica(nuova); // ha già tipo
    }
  } catch (err) {
    console.error(err);
    alert("Errore nella creazione o apertura della scheda");
  }
};




    return (
    <div className="popup-Big">
      <div className="popup-Big-content">
{!schedaInModifica && (
  <>
    <div className="flex-column-center ">
      <label>Nuova scheda:</label>
      <select
  className="w-200"
  onChange={(e) => {
    const tipo = parseInt(e.target.value);
    if (!isNaN(tipo)) setTipoSelezionato(tipo);
  }}
>
  <option value="">-- Seleziona tipo --</option>
  {tipiSchede.map((tipo) => (
    <option key={tipo.id} value={tipo.id}>
      {tipo.nome}
    </option>
  ))}
</select>

      <button
        className="btn w-200 btn--blue btn--pill mt-5"
        onClick={() => {
          if (tipoSelezionato !== null) {
            handleNuovaScheda(tipoSelezionato);
          } else {
            alert("Seleziona un tipo di scheda prima di creare");
          }
        }}
      >
        Crea
      </button>
    </div>
  </>
)}



{schedaInModifica && !user?.id && <p>Caricamento dati utente...</p>}
{schedaInModifica && user?.id && (
  <div className="container-fix">
    <h1>SCHEDA {schedaInModifica.tipo} –{numero_commessa}</h1>
    {(() => {
      const tipo = schedaInModifica.tipo?.toLowerCase();
      switch (tipo) {
        case "sviluppo-software":
          return (
            <SchedaSviluppoForm
              scheda={schedaInModifica}
              commessa={numero_commessa}
              onClose={() => setSchedaInModifica(null)}
              onSave={handleSaveScheda}
              userId={user.risorsa_id}
              username={user.username}
              editable={editable}
            />
          );

        case "collaudo-avvolgitori":
          
          return (
            <SchedaCollaudoForm
              scheda={schedaInModifica}
              commessa={numero_commessa}
              onClose={() => setSchedaInModifica(null)}
              onSave={handleSaveScheda}
               userId={user.risorsa_id}
               username={user.username}
               editable={editable}
            />
          );

        default:
          return <p>⚠️ Modulo per questo tipo non ancora implementato.</p>;
      }
    })()}
  </div>
)}

<div className="flex-column-center">

        <button className="btn w-200 btn--danger btn--pill mt-5" onClick={handleClosePopup}>
          Chiudi
        </button>
        </div>
      </div>
    </div>
  );
}

export default SchedaTecnica;