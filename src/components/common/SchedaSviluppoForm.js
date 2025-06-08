// SchedaSviluppoForm.jsx
import { useState, useEffect,useRef } from "react";
import { uploadImmagineScheda,getImmaginiScheda,deleteImmagineScheda, getTagSuggeriti    } from "../services/API/schedeTecniche-api";


const vociChecklist1 = [
"Importare dalla biblioteca la macchina",
"Controllare schede PLC",
"Verificare e ricablare IO",
"Controllare sensor supply sensori sicurezza",
"Verificare indirizzi IP ( vedi 4° pagina)",
"Verificare corretto dimensionamento inverter Braccio Avvolgitori 300 (vedi tabella allegata)",
"Verificare presenza resistenze di frenatura e la rispettiva taglia (vedi tabella allegata)",
];
const vociChecklist2 = [
"Controllare sicurezze",
"Controllare tipo barriere",
"Controllare cancelli",
"Controllare interfaccia ingresso/uscita",
"Controllare muting",
"Controllare configurazione macchina",
"Controllare configurazione trasporti",
];
const vociChecklist3 = [
"Controllare interfaccia ingresso/uscita HMI",
"Controllare lingua destinazione",
"Eliminare pannelli non utilizzati",
"Cambia password",
];
const vociChecklist4 = [
"Archiviare software",
];

function SchedaSviluppoForm({ scheda, onSave, userId,editable,username}) {

const [mostraDettagliSpunte, setMostraDettagliSpunte] = useState(true);
const [immagini, setImmagini] = useState([]);
const [immagineSelezionata, setImmagineSelezionata] = useState(null);
  const [note, setNote] = useState("");
  const [tagSuggeriti, setTagSuggeriti] = useState([]);
  const [suggestionsVisibili, setSuggestionsVisibili] = useState([]);
const [filtroTag, setFiltroTag] = useState("");
const [cursorPos, setCursorPos] = useState(null);
const textareaRef = useRef(null);
const [, setDropdownPos] = useState({ top: 0, left: 0 });

const normalizeChecklist = (rawChecklist) => {
  const normalized = {};
  for (const voce of Object.keys(rawChecklist)) {
    const valore = rawChecklist[voce];
    if (typeof valore === "object" && valore !== null && "fatto" in valore) {
      normalized[voce] = valore;
    } else {
      normalized[voce] = {
        fatto: !!valore,
        utente: null,
        timestamp: null,
      };
    }
  }
  return normalized;
};
const [form, setForm] = useState({
  titolo: scheda?.intestazione?.titolo || "",
  RevSoftware: scheda?.intestazione?.RevSoftware || "",
  RevMacchina: scheda?.intestazione?.  RevMacchina || "",
  RevSchema: scheda?.intestazione?.  RevSchema || "",
  checklist: normalizeChecklist(scheda?.contenuto?.checklist || {}),
  note: scheda?.note ||  "",
});
const toggleVoce = (voce) => {
  setForm((prev) => {
    const voceCorrente = prev.checklist[voce] || {
      fatto: false,
      utente: null,
      timestamp: null,
    };

    const giaSpuntato = voceCorrente.fatto;
    const stessoUtente = voceCorrente.utente === username;

    // Se è spuntato e NON è lo stesso utente -> non fare nulla
    if (giaSpuntato && !stessoUtente) {
      return prev; // nessuna modifica
    }

    const nuovoStato = !giaSpuntato;

    return {
      ...prev,
      checklist: {
        ...prev.checklist,
        [voce]: {
          fatto: nuovoStato,
          utente: nuovoStato ? username : null,
          timestamp: nuovoStato ? new Date().toISOString() : null,
        },
      },
    };
  });
};
const handleFileChange = async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  try {
    await uploadImmagineScheda(file, scheda?.id || scheda?.scheda_id);
    const nuoveImmagini = await getImmaginiScheda(scheda?.id || scheda?.scheda_id);
    setImmagini(nuoveImmagini);
  } catch (error) {
    console.error("Errore durante l’upload:", error);
  }
};


const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

const handleSubmit = () => {
  const datiPerBackend = {
    intestazione: {
      titolo: form.titolo,
      RevSoftware: form.RevSoftware,
      RevMacchina: form.RevMacchina,
      RevSchema: form.RevSchema,
    },
    contenuto: {
      checklist: form.checklist
    },
    note: form.note,
    allegati_standard: [], 
    risorsa_id: userId,
    descrizione: "Modifica effettuata da interfaccia sviluppo",
  };

  // Estrai i tag dalla nota
  const tagRegex = /#(\w+)/g;
  const tagSet = new Set();
  let match;
  while ((match = tagRegex.exec(form.note)) !== null) {
    tagSet.add(match[1]);
  }

  const tags = Array.from(tagSet);

  // Chiamata di salvataggio scheda
  onSave(datiPerBackend);

  // Invio tag al backend
  if (tags.length > 0) {
    fetch("https://commesseunserver.eu/api/schedeTecniche/tags", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scheda_id: scheda?.id || scheda?.scheda_id, tags }),
    }).catch(err => console.error("Errore salvataggio tag:", err));
  }
};


useEffect(() => {
  if (scheda?.id || scheda?.scheda_id) {
    const id = scheda.id || scheda.scheda_id;
    getImmaginiScheda(id)
      .then((data) => {
        setImmagini(data);
      })
      .catch((err) => {
        console.error("Errore nel caricamento immagini:", err);
      });
  }
}, [scheda]);

  useEffect(() => {
    getTagSuggeriti().then(setTagSuggeriti);
  }, []);

const handleNoteChange = (e) => {
  const testo = e.target.value;
  setNote(testo);

  // Trova la parola corrente con # ovunque si trovi
  const cursorPos = e.target.selectionStart;
  const testoPrimaDelCursore = testo.substring(0, cursorPos);
  const match = testoPrimaDelCursore.match(/#(\w*)$/); // trova ultimo #tag anche parziale
setCursorPos(e.target.selectionStart);
  if (match) {
    const cerca = match[1].toLowerCase();
    const filtra = tagSuggeriti.filter(tag =>
      tag.toLowerCase().startsWith(cerca)
    );
    setSuggestionsVisibili(filtra.slice(0, 5)); // max 5 suggerimenti
    setFiltroTag(match[1]); // salviamo la parte da sostituire
    if (textareaRef.current) {
  const rect = textareaRef.current.getBoundingClientRect();
  const lineHeight = 20; // oppure calcola dinamicamente
  const offsetTop = rect.top + window.scrollY;
  const offsetLeft = rect.left + window.scrollX;

  const caretPos = textareaRef.current.selectionStart;
  const lines = testo.substring(0, caretPos).split("\n");
  const currentLine = lines.length - 1;
  const charOffset = lines[lines.length - 1].length;

  setDropdownPos({
    top: offsetTop + (currentLine + 1) * lineHeight,
    left: offsetLeft + charOffset * 8, // 8px per char circa
  });
}

  } else {
    setSuggestionsVisibili([]);
    setFiltroTag("");
  }
};



    return (
      <div className="flex-column-center">
         <div className="flex-center">
            <h2>Rev. Master:</h2>
            <input
              name="RevSoftware"
              className="w-100"
              value={form.RevSoftware}
              onChange={handleChange}
              readOnly={!editable}
           />
          <h2>Rev. Macchina:</h2>
          <input
            name="RevMacchina"
           className="w-100"
           value={form.RevMacchina}
           onChange={handleChange}
             readOnly={!editable}
         />
         <h2>Rev. schema:</h2>
          <input
            name="RevSchema"
           className="w-200"
           value={form.RevSchema}
           onChange={handleChange}
             readOnly={!editable}
         />
       </div>
       <button  className="btn w-200 btn--shiny btn--pill" onClick={() => setMostraDettagliSpunte(prev => !prev)}>
  {mostraDettagliSpunte ? "Nascondi dettagli" : "Mostra dettagli"}
</button>

      <div className="header-row">
<h2>Creata il {scheda?.data_creazione ? new Date(scheda.data_creazione).toLocaleString('it-IT') : "Data non disponibile"} </h2>
    <h2> da {scheda?.creato_da_nome || "utente sconosciuto"}</h2>

      </div>

        <div className="flex-column-left">
          <h1>HARDWARE</h1>
          {vociChecklist1.map((voce) => (
            <label key={voce} className="flex items-center">
              <input
                type="checkbox"
                checked={form.checklist?.[voce]?.fatto || false}
                onChange={() => toggleVoce(voce)}
                 disabled={!editable}
              />
               {voce}
                <div style={{ marginTop: "5px",  marginBottom: "15px",}}>
                  {mostraDettagliSpunte &&
                  form.checklist?.[voce]?.fatto &&
                  form.checklist[voce].utente
                  ? `-  Spuntato da ${form.checklist[voce].utente} il ${new Date(
                  form.checklist[voce].timestamp
                  ).toLocaleString()}`
                  : ""}
                </div>
            </label>
          ))}
        </div>
        <div className="flex-column-left">
          <h1>SOFTWARE</h1>
          {vociChecklist2.map((voce) => (
            <label key={voce} className="flex items-center">
              <input
                type="checkbox"
               checked={form.checklist?.[voce]?.fatto || false}
                onChange={() => toggleVoce(voce)}
                 disabled={!editable}
              />
               {voce}
                <div style={{ marginTop: "5px",  marginBottom: "15px",}}>
                  {mostraDettagliSpunte &&
                  form.checklist?.[voce]?.fatto &&
                  form.checklist[voce].utente
                  ? `-  Spuntato da ${form.checklist[voce].utente} il ${new Date(
                  form.checklist[voce].timestamp
                  ).toLocaleString()}`
                  : ""}
                </div>
            </label>
          ))}
        </div>

        <div className="flex-column-left">
          <h1>HMI</h1>
          {vociChecklist3.map((voce) => (
            <label key={voce} className="flex items-center">
              <input
                type="checkbox"
               checked={form.checklist?.[voce]?.fatto || false}
                onChange={() => toggleVoce(voce)}
                 disabled={!editable}
              />
               {voce}
                <div style={{ marginTop: "5px",  marginBottom: "15px",}}>
                  {mostraDettagliSpunte &&
                  form.checklist?.[voce]?.fatto &&
                  form.checklist[voce].utente
                  ? `-  Spuntato da ${form.checklist[voce].utente} il ${new Date(
                  form.checklist[voce].timestamp
                  ).toLocaleString()}`
                  : ""}
                </div>
            </label>
          ))}
        </div>
        <div className="flex-column-left">
           <h1>ARCHIVIO</h1>
          {vociChecklist4.map((voce) => (
            <label key={voce} className="flex items-center">
              <input
                type="checkbox"
               checked={form.checklist?.[voce]?.fatto || false}
                onChange={() => toggleVoce(voce)}
                 disabled={!editable}
              />
               {voce}
                <div style={{ marginTop: "5px",  marginBottom: "15px",}}>
                  {mostraDettagliSpunte &&
                  form.checklist?.[voce]?.fatto &&
                  form.checklist[voce].utente
                  ? `-  Spuntato da ${form.checklist[voce].utente} il ${new Date(
                  form.checklist[voce].timestamp
                  ).toLocaleString()}`
                  : ""}
                </div>
            </label>
          ))}
        </div>
        <h1>Note</h1>
        <textarea
  name="note"
  className="w-w"
  value={form.note}
  onChange={(e) => {
    handleChange(e);      // aggiorna il form
    handleNoteChange(e);  // aggiorna i suggerimenti
  }}
  readOnly={!editable}
/>
{editable && suggestionsVisibili.length > 0 && (
  <ul className="tag-suggestions">
    {suggestionsVisibili.map((tag, idx) => (
      <li
        key={idx}
        className="tag-suggestion"
onClick={() => {
  if (cursorPos === null || filtroTag === "") return;

  const testo = note;
  const inizio = testo.lastIndexOf(`#${filtroTag}`, cursorPos);
  if (inizio === -1) return;

  const fine = inizio + filtroTag.length + 1;
  const nuovoTesto =
    testo.substring(0, inizio) + `#${tag} ` + testo.substring(fine);

  setForm(prev => ({ ...prev, note: nuovoTesto }));
  setNote(nuovoTesto);
  setSuggestionsVisibili([]);
}}

      >
        <>
  #
  <strong>{tag.slice(0, filtroTag.length)}</strong>
  {tag.slice(filtroTag.length)}
</>
      </li>
    ))}
  </ul>
)}
        {editable && <input type="file"  className="btn--blue btn--pill w-400" onChange={handleFileChange} />}

<div className="container w-w" style={{ border: 'solid 1px', display:'flex', gap: '10px', flexWrap: 'wrap' }}>
  {immagini.map((img, index) => (
    <div key={index} style={{ position: 'relative' }}>
      <img
        src={`https://commesseunserver.eu${img.url}`}
        alt={`Immagine ${index + 1}`}
        style={{ width: '150px', height: 'auto', borderRadius: '8px', cursor: 'pointer' }}
        onClick={() => setImmagineSelezionata(`https://commesseunserver.eu${img.url}`)}
      />
      {editable && (
        <button
          onClick={async () => {
            try {
              await deleteImmagineScheda(img.id);
              setImmagini((prev) => prev.filter((i) => i.id !== img.id));
            } catch (error) {
              console.error("Errore eliminazione immagine:", error);
            }
          }}
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            background: 'red',
            color: 'white',
            border: 'none',
            borderRadius: '50%',
            width: '24px',
            height: '24px',
            cursor: 'pointer',
          }}
          title="Elimina"
        >
          ×
        </button>
      )}
    </div>
  ))}
</div>

{editable && (
  <button
    className="btn btn--blue w-200 btn--pill"
    onClick={handleSubmit}
  >
    Salva
  </button>
)}
{immagineSelezionata && (
  <div
    style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.8)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
    }}
    onClick={() => setImmagineSelezionata(null)} // chiude al clic
  >
    <img
      src={immagineSelezionata}
      alt="Ingrandita"
      style={{ maxHeight: '90%', maxWidth: '90%', borderRadius: '12px' }}
    />
  </div>
)}

  </div>
  );
}

export default SchedaSviluppoForm;
