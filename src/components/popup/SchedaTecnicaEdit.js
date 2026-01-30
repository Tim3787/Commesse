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
import SchedaSpecificheForm from "../common/SchedaSpecificheForm";
import SchedaElettricoForm from "../common/SchedaElettricoForm";
import SchedaRevElettricheForm from "../common/SchedaRevElettricheForm";
import SchedaAppuntiForm from "../common/SchedaAppuntiForm.js";

import { fetchCurrentUser } from "../services/API/utenti-api";

function SchedaTecnica({ editable, commessaId,numero_commessa, onClose, schedaInModifica, setSchedaInModifica }) {
const [schede, setSchede] = useState([]);
const [loading, setLoading] = useState(true);
const [tipoSelezionato, setTipoSelezionato] = useState(null);
  const token = sessionStorage.getItem("token");    
  const [user, setUser] = useState(null); 
const [tipiSchede, setTipiSchede] = useState([]);


const FORMS_BY_TIPO_ID = {
  1: SchedaSviluppoForm,
  2: SchedaCollaudoForm,
  4: SchedaCollaudoReggiatriciForm,
  3: SchedaMSQuadroForm,
  5: SchedaCollaudoLineaForm,
8: SchedaElettricoForm,

  // esempi MULTI (nuovi modelli)
  6: SchedaRiunioneCommessaForm,
  7: SchedaSpecificheForm,
  9:SchedaRevElettricheForm,
  10:SchedaAppuntiForm,

};

const tipoIdToNome = useMemo(() => {
  const m = {};
  tipiSchede.forEach(t => m[t.id] = t.nome);
  return m;
}, [tipiSchede]);


useEffect(() => {
  if (!commessaId) return;
  setLoading(true);
  fetchSchedeTecniche(commessaId)
    .then(setSchede)
    .catch(console.error)
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
    const isAppunti = tipo.id === 10;

    // ✅ APPUNTI: 1 per utente (apri se esiste, altrimenti crea)
    if (isAppunti) {
      const giaEsisteAppuntiUtente = esistenti.find(
        (s) => s.tipo_id === 10 && s.creata_da === user.id
      );

      if (giaEsisteAppuntiUtente) {
        setSchedaInModifica(giaEsisteAppuntiUtente);
        return;
      }

      const titoloAppunti = `Appunti – ${user?.nome || user?.username || "Utente"}`;

      const nuova = await createSchedaTecnica({
        commessa_id: commessaId,
        tipo_id: 10,
        categoria: "multi",
        titolo: titoloAppunti,
        descrizione: null,
        creata_da: user.id,
      });

      setSchedaInModifica({
        ...nuova,
        categoria: "multi",
        tipo: tipo.nome,
      });
      return;
    }

    // ✅ TECNICHE: singleton (no duplicati)
    const giaEsiste = tipo.categoria === "tecnica"
      ? esistenti.find((s) => s.tipo_id === tipo.id)
      : null;

    if (giaEsiste) {
      setSchedaInModifica(giaEsiste);
      return;
    }

    // ✅ MULTI: crea sempre (oppure con titolo vuoto)
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
      tipo: tipo.nome,
    });
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
  <optgroup label="Schede di processo">
    {tipiSchede
      .filter(t => t.categoria === "tecnica")
      .map(tipo => (
        <option key={tipo.id} value={JSON.stringify(tipo)}>
          {tipo.nome}
        </option>
      ))}
  </optgroup>
  <optgroup label="Altre schede">
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
     {/* LISTA SCHEDE MULTI ESISTENTI */}
{!loading && (
  <div
   className="flex-column-center" style={{ marginTop: 20 }}>
    <h3>Schede esistenti</h3>

    {schede.filter(s => (tipoIdToCategoria?.[s.tipo_id] ?? s.categoria) === "multi").length === 0 ? (
      <div style={{ fontSize: 14, opacity: 0.7 }}>
        Nessuna scheda multi creata per questa commessa.
      </div>
    ) : (
      schede
        .filter(s => (tipoIdToCategoria?.[s.tipo_id] ?? s.categoria) === "multi")
        .map(s => (
          <button
          style={{ fontSize: 16}}
            key={s.id}
            className="btn w-200 btn--ghost btn--pill mt-2"
            onClick={() =>
              setSchedaInModifica({
                ...s,
                tipo: s.tipo || tipoIdToNome[s.tipo_id] || `Tipo ${s.tipo_id}`,
              })
            }
            title={s.titolo || s.descrizione || ""}
          >
{(s.titolo && s.titolo.trim())
  ? s.titolo
  : `${tipoIdToNome[s.tipo_id] || `Tipo ${s.tipo_id}`} `}

          </button>
        ))
    )}
  </div>
)}
{!loading && (
  <div className="flex-column-center" style={{ marginTop: 20 }}>
    <h3>Schede di processo esistenti</h3>

    {schede.filter(s => (tipoIdToCategoria?.[s.tipo_id] ?? s.categoria) === "tecnica").length === 0 ? (
      <div style={{ fontSize: 14, opacity: 0.7 }}>
        Nessuna scheda multi creata per questa commessa.
      </div>
    ) : (
      schede
        .filter(s => (tipoIdToCategoria?.[s.tipo_id] ?? s.categoria) === "tecnica")
        .map(s => (
          <button
           style={{ fontSize: 16}}
            key={s.id}
            className="btn w-200 btn--ghost btn--pill mt-2"
            onClick={() =>
              setSchedaInModifica({
                ...s,
                tipo: s.tipo || tipoIdToNome[s.tipo_id] || `Tipo ${s.tipo_id}`,
              })
            }
            title={s.titolo || s.descrizione || ""}
          >
{(s.titolo && s.titolo.trim())
  ? s.titolo
  : `${tipoIdToNome[s.tipo_id] || `Tipo ${s.tipo_id}`} `}

          </button>
        ))
    )}
  </div>
)}

    </div>
  </>
)}



{schedaInModifica && !user?.id && <p>Caricamento dati utente...</p>}
{schedaInModifica && user?.id && (
  
  <div className="container-fix">

    {(() => {
      const TipoForm = FORMS_BY_TIPO_ID[schedaInModifica.tipo_id];

if (!TipoForm) return <p>⚠️ Modulo per questo tipo non ancora implementato.</p>;

return (
  <TipoForm
    scheda={schedaInModifica}
    commessa={numero_commessa}
    onClose={() => setSchedaInModifica(null)}
    onSave={handleSaveScheda}
    userId={user.risorsa_id}
    username={user.username}
    editable={editable}
  />
);

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