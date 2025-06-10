// SchedaSviluppoForm.jsx
import { useState, useEffect,useRef } from "react";
import { uploadImmagineScheda,getImmaginiScheda,deleteImmagineScheda, getTagSuggeriti    } from "../services/API/schedeTecniche-api";
import html2pdf from "html2pdf.js";

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

const indirizzamenti = [
  {
    linea: "Unitech",
    PLC: 10,
    HMI: 7,
    Assistenza: 0,
    "11A1": 1,
    "13A1": 100,
    "15A1": 253,
    "16A1": 11,
    "31A1": 13,
    "32A1": 15,
    "60A1": 16,
    MAX: "…",
  },
  {
    linea: "Italmeccanica",
    PLC: 192,
    HMI: 168,
    Assistenza: 123,
    "11A1": 15,
    "13A1": 16,
    "15A1": 17,
    "16A1": 18,
    "31A1": 19,
    "32A1": 20,
    "60A1": 21,
    MAX: 49,
  },
  {
    linea: "PAYPER",
    PLC: 192,
    HMI: 168,
    Assistenza: 10,
    "11A1": 220,
    "13A1": 210,
    "15A1": 201,
    "16A1": 230,
    "31A1": 231,
    "32A1": 232,
    "60A1": 233,
    MAX: 249,
  },
];

const inverterSiemens = [
  { motore: "1,1 kW", inverter: "Siemens da 2,2 kW" },
  { motore: "1,5 kW", inverter: "Siemens da 3 kW" },
  { motore: "2,2 kW", inverter: "Siemens da 4 kW" },
];


const componentiSiemens = [
  {
    descrizione: "Resistenza frenatura 370 Ohm 75W fino 1,5kW",
    marca: "SIEMENS",
    articolo: "6SL32010BE143AA0",
    codice: "0050747",
  },
  {
    descrizione: "Sinamics G120C 3x380-480V 0,55kW 6D.I. Profinet filtro cl.A FSAA",
    marca: "SIEMENS",
    articolo: "6SL32101KE118AF2",
    codice: "0050745",
  },
  {
    descrizione: "Sinamics G120C 3x380-480V 1,1kW 6D.I. Profinet filtro cl.A FSAA",
    marca: "SIEMENS",
    articolo: "6SL32101KE132AF2",
    codice: "0051038",
  },
  {
    descrizione: "Sinamics G120C 3x380-480V 1,5kW 6D.I. Profinet filtro cl.A FSAA",
    marca: "SIEMENS",
    articolo: "6SL32101KE143AF2",
    codice: "0051039",
  },
  {
    descrizione: "Resistenza frenatura 140 Ohm 200W fino 4kW",
    marca: "SIEMENS",
    articolo: "6SL32010BE210AA0",
    codice: "0050748",
  },
  {
    descrizione: "Sinamics G120C 3x380-480V 2,2kW 6D.I. Profinet filtro cl.A FSAA",
    marca: "SIEMENS",
    articolo: "6SL32101KE158AF2",
    codice: "0051040",
  },
  {
    descrizione: "Sinamics G120C 3x380-480V 3kW 6D.I. Profinet filtro cl.A",
    marca: "SIEMENS",
    articolo: "6SL32101KE175AF1",
    codice: "0051162",
  },
  {
    descrizione: "Sinamics G120C 3x380-480V 4kW 6D.I. Profinet filtro cl.A",
    marca: "SIEMENS",
    articolo: "6SL32101KE188AF1",
    codice: "0051075",
  },
  {
    descrizione: "Resistenza frenatura 75 Ohm 375W fino 7,5kW",
    marca: "SIEMENS",
    articolo: "6SL32010BE218AA0",
    codice: "0051645",
  },
  {
    descrizione: "Sinamics G120C 3x380-480V 5,5kW 6D.I. Profinet filtro cl.A",
    marca: "SIEMENS",
    articolo: "6SL32101KE213AF1",
    codice: "0051165",
  },
  {
    descrizione: "Sinamics G120C 3x380-480V 7,5kW 6D.I. Profinet filtro cl.A",
    marca: "SIEMENS",
    articolo: "6SL32101KE217AF1",
    codice: "0051166",
  },
];


function SchedaSviluppoForm({ scheda, onSave, userId, editable, username}) {


const [mostraDettagliSpunte, setMostraDettagliSpunte] = useState(true);
const [immagini, setImmagini] = useState([]);
const [immagineSelezionata, setImmagineSelezionata] = useState(null);
const [tagSuggeriti, setTagSuggeriti] = useState([]);
const [suggestionsVisibili, setSuggestionsVisibili] = useState([]);
const [filtroTag, setFiltroTag] = useState("");
const [cursorPos, setCursorPos] = useState(null);
const schedaRef = useRef();
const pdfRef = useRef();
const textareaRef = useRef(null);
const autoResizeTextarea = () => {
  const el = textareaRef.current;
  if (el) {
    el.style.height = "auto"; // resetta altezza
    el.style.height = `${el.scrollHeight}px`; // imposta altezza in base al contenuto
  }
};
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


useEffect(() => {
  autoResizeTextarea();
}, [form.note]);



const handleNoteChange = (e) => {
  const testo = e.target.value;
  setForm((prev) => ({ ...prev, note: testo }));

  const cursorPos = e.target.selectionStart;
  setCursorPos(cursorPos);

  const testoPrimaDelCursore = testo.substring(0, cursorPos);
  const match = testoPrimaDelCursore.match(/#(\w*)$/);

  if (match) {
    const cerca = match[1].toLowerCase();
    const filtra = tagSuggeriti.filter(tag =>
      tag.toLowerCase().startsWith(cerca)
    );
    setSuggestionsVisibili(filtra.slice(0, 5));
    setFiltroTag(match[1]);
  } else {
    setSuggestionsVisibili([]);
    setFiltroTag("");
  }
};

const handleDownloadPdf = () => {
  const element = schedaRef.current;

  // Aggiunge classe temporanea
  element.classList.add("pdf-dark-mode");

  html2pdf()
    .set({
      margin: 10,
      filename: "Scheda sviluppo.pdf",
      html2canvas: {
        scale: 2,
        backgroundColor: null, // <- IMPORTANTE: evita di forzare il bianco
      },
      jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
    })
    .from(element)
    .save()
    .then(() => {
      element.classList.remove("pdf-dark-mode");
    });
};

const renderTabellaIndirizzamento = () => {
  if (!indirizzamenti || indirizzamenti.length === 0) return null;

  const intestazioni = Array.from(
    new Set(indirizzamenti.flatMap((row) => Object.keys(row)))
  );

  return (
    <div>
      <h1>INDIRIZZAMENTO IP LINEE</h1>
      <table>
        <thead>
          <tr>
            {intestazioni.map((header) => (
              <th
                key={header}
              >
                {header.toUpperCase()}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {indirizzamenti.map((row, i) => (
            <tr key={i}>
              {intestazioni.map((header) => (
                <td
                  key={header}                >
                  {row[header] !== undefined ? row[header] : "-"}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const renderTabellaInverterSiemens = () => {
  return (
    <div>
      <h1>DIMENSIONAMENTO INVERTER SIEMENS BRACCIO AVVOLGITORI 300</h1>
      <table>
        <thead>
          <tr>
            <th>Motore</th>
            <th>Inverter</th>
          </tr>
        </thead>
        <tbody>
          {inverterSiemens.map((item, i) => (
            <tr key={i}>
              <td>{item.motore}</td>
              <td>{item.inverter}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const renderTabellaComponentiSiemens = () => {
  return (
    <div>
      <h1>COMPONENTI SIEMENS – INVERTER E RESISTENZE</h1>
      <table>
        <thead>
          <tr>
            <th>Descrizione</th>
            <th>Marca</th>
            <th>Articolo</th>
            <th>Codice Interno</th>
          </tr>
        </thead>
        <tbody>
          {componentiSiemens.map((item, index) => (
            <tr key={index}>
              <td>{item.descrizione}</td>
              <td>{item.marca}</td>
              <td>{item.articolo}</td>
              <td>{item.codice}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};


    return (
      <div ref={pdfRef}>
      <div ref={schedaRef} className="flex-column-center">
         <div className="flex-column-left">
            <label>Revisione Master:</label>
            <input
              name="RevSoftware"
              className="w-200"
              value={form.RevSoftware}
              onChange={handleChange}
              readOnly={!editable}
           />
          <label>Revisione Macchina:</label>
          <input
            name="RevMacchina"
           className="w-200"
           value={form.RevMacchina}
           onChange={handleChange}
             readOnly={!editable}
         />
         <label>Revisione schema:</label>
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
{mostraDettagliSpunte && (
      <div className="header-row">
<label  style={{ fontFamily:"serif", color:"darkgray"}}>Creata il {scheda?.data_creazione ? new Date(scheda.data_creazione).toLocaleString('it-IT') : "Data non disponibile"} </label>
    <label  style={{ fontFamily:"serif", color:"darkgray"}}> da {scheda?.creato_da_nome || "utente sconosciuto"}</label>
      </div>
      )}
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
                <div style={{ marginTop: "5px",  marginBottom: "15px", fontFamily:"serif", color:"darkgray"}}>
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
                <div style={{ marginTop: "5px",  marginBottom: "15px",fontFamily:"serif", color:"darkgray"}}>
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
                <div style={{ marginTop: "5px",  marginBottom: "15px",fontFamily:"serif", color:"darkgray"}}>
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
                <div style={{ marginTop: "5px",  marginBottom: "15px",fontFamily:"serif", color:"darkgray"}}>
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
    ref={textareaRef} 
  value={form.note}
  onChange={(e) => {
    handleChange(e);
    handleNoteChange(e);
    autoResizeTextarea();
  }}
  readOnly={!editable}
/>

{editable && suggestionsVisibili.length > 0 && (
  <ul className="tag-suggestions">
    {suggestionsVisibili.map((tag, idx) => (
      <li
  key={idx}
  className="tag-suggestion"
  onMouseDown={(e) => {
    e.preventDefault(); // evita che il textarea perda focus
    if (cursorPos === null || filtroTag === "") return;

    const testo = form.note;
    const inizio = testo.lastIndexOf(`#${filtroTag}`, cursorPos);
    if (inizio === -1) return;

    const fine = inizio + filtroTag.length + 1;
    const nuovoTesto = testo.substring(0, inizio) + `#${tag} ` + testo.substring(fine);

    setForm((prev) => ({ ...prev, note: nuovoTesto }));
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
 </div>
<div className="flex-column-center">
       <div className=" header-row">
      <h1>INFO</h1>
      </div>  
           
{editable && renderTabellaIndirizzamento()}
{editable && renderTabellaInverterSiemens()}
{editable && renderTabellaComponentiSiemens()}
</div>
<div className="flex-column-center">
           <h1>IMMAGINI</h1>
        {editable && <input type="file"  className="container w-fit" onChange={handleFileChange} />}

<div className="container w-fit" style={{ border: 'solid 1px', display:'flex', gap: '10px', flexWrap: 'wrap' }}>
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
 <button onClick={handleDownloadPdf}
 className="btn btn--blue w-200 btn--pill">
  Scarica PDF
</button>
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
  </div>

  );
}

export default SchedaSviluppoForm;
