import { useEffect, useState,useMemo } from 'react';
import { 
fetchSchedeTecniche,
  createSchedaTecnica,
  updateSchedaTecnica,
  fetchTipiSchedaTecnica
 } from "../services/API/schedeTecniche-api";


import SchedaSviluppoForm from "../common/SchedaSviluppoForm";
import SchedaCollaudoForm from "../common/SchedaCollaudoAvvolgiotriForm";
import SchedaMSQuadroForm from "../common/SchedaMSQuadroForm";
import SchedaCollaudoReggiatriciForm from "../common/SchedaCollaudoReggiatriciForm";
import SchedaCollaudoLineaForm from "../common/SchedaCollaudoLineaForm";
import SchedaRiunioneCommessaForm from "../common/SchedaRiunioneCommessaForm";


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
  const caricaTipiScheda = async () => {
    try {
      const tuttiITipi = await fetchTipiSchedaTecnica(); // ora restituisce anche 'categoria'
      setTipiSchede(tuttiITipi); // ognuno ha già { id, nome, categoria }
    } catch (error) {
      console.error("Errore nel caricamento tipi scheda:", error);
    }
  };

  caricaTipiScheda();
}, []);



const tipoIdToCategoria = useMemo(() => {
  const mappa = {};
  tipiSchede.forEach(tipo => {
    mappa[tipo.id] = tipo.categoria;
  });
  return mappa;
}, [tipiSchede]);

const handleSaveScheda = async (valoriAggiornati) => {
  try {
    const payload = {
      ...valoriAggiornati,
      risorsa_id: user?.risorsa_id,
      descrizione: `Modifica effettuata da ${user?.nome || 'utente'}`,
    };

    await updateSchedaTecnica(schedaInModifica.id, payload);
    const aggiornate = await fetchSchedeTecniche(commessaId);
    setSchede(aggiornate);
    const aggiornata = aggiornate.find(s => s.id === schedaInModifica.id);
    setSchedaInModifica(aggiornata);

    handleClosePopup();
  } catch (err) {
    console.error(err);
    alert("Errore nel salvataggio");
  }
};




const handleNuovaScheda = async (tipo) => {
  try {
    const esistenti = await fetchSchedeTecniche(commessaId);

    // per le schede tecniche evita duplicati, per le multi no
    const giaEsiste = tipo.categoria === "tecnica"
      ? esistenti.find(s => s.tipo_id === tipo.id)
      : null;

    if (giaEsiste) {
      setSchedaInModifica(giaEsiste);
    } else {
      const nuova = await createSchedaTecnica({
        commessa_id: commessaId,
        tipo_id: tipo.id,
        categoria: tipo.categoria,
        titolo: tipo.categoria === "multi" ? "" : null,
        descrizione: tipo.categoria === "multi" ? "" : null,
        creata_da: user.id,
      });

      setSchedaInModifica({ 
        ...nuova, 
        categoria: tipo.categoria, 
        tipo: tipo.nome 
      });
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
  const value = e.target.value;
  if (!value) {
    setTipoSelezionato(null);
    return;
  }
  try {
    const tipo = JSON.parse(value);
    setTipoSelezionato(tipo);
  } catch (err) {
    console.error("Errore nel parsing del tipo:", err);
    setTipoSelezionato(null);
  }
}}

>
  <option value="">-- Seleziona tipo --</option>
  <optgroup label="Schede tecniche">
    {tipiSchede
      .filter(t => t.categoria === "tecnica")
      .map(tipo => (
        <option key={tipo.id} value={JSON.stringify(tipo)}>
          {tipo.nome}
        </option>
      ))}
  </optgroup>
  <optgroup label="Schede multi">
    {tipiSchede
      .filter(t => t.categoria === "multi")
      .map(tipo => (
        <option key={tipo.id} value={JSON.stringify(tipo)}>
          {tipo.nome}
        </option>
      ))}
  </optgroup>
</select>



      <button
        className="btn w-200 btn--blue btn--pill mt-5"
onClick={() => {
  if (tipoSelezionato) {
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
        case "collaudo-reggiatrici":
          
          return (
            <SchedaCollaudoReggiatriciForm
              scheda={schedaInModifica}
              commessa={numero_commessa}
              onClose={() => setSchedaInModifica(null)}
              onSave={handleSaveScheda}
               userId={user.risorsa_id}
               username={user.username}
               editable={editable}
            />
          );

        case "messa-servizio-quadro":
          
          return (
            <SchedaMSQuadroForm
              scheda={schedaInModifica}
              commessa={numero_commessa}
              onClose={() => setSchedaInModifica(null)}
              onSave={handleSaveScheda}
               userId={user.risorsa_id}
               username={user.username}
               editable={editable}
            />
          );

        case "collaudo-linea":
          
          return (
            <SchedaCollaudoLineaForm
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
const categoria = tipoIdToCategoria?.[schedaInModifica?.tipo_id] ?? schedaInModifica?.categoria;

if (categoria === "multi") {

  return (
    <SchedaRiunioneCommessaForm
      scheda={schedaInModifica}
      commessa={numero_commessa}
      onClose={() => setSchedaInModifica(null)}
      onSave={handleSaveScheda}
      userId={user.risorsa_id}
      username={user.username}
      editable={editable}
    />
  );
}

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