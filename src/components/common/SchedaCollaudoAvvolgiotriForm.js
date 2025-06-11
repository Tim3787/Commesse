// ===== IMPORT =====
import { useState, useEffect, useRef } from "react";
import {
  uploadImmagineScheda,
  getImmaginiScheda,
  deleteImmagineScheda,
  getTagSuggeriti,
} from "../services/API/schedeTecniche-api";
import html2pdf from "html2pdf.js";

// ===== DATI STATICI / CONFIG =====

const vociChecklist1 = [
"Provare tutti i pulsanti di emergenza ed il relativo ripristino. Il led deve segnalare lo stato emergenza",
 "Provare tutti i cancelli ed il relativo ripristino e status sul pannello",
"Provare tutte le barriere verificando le funzioni di override e muting, il relativo ripristino e status sul pannello",
 "Provare altri dispositivi di sicurezza",
"Verificare fermata emergenza durante rotazione regolando quick stop e tempi nel safety",
];
const vociChecklist2 = [
"Verificare corretto dimensionamento inverter Braccio Avvolgitori 300 (vedi tabella allegata)",
"Verificare presenza resistenze di frenatura e la rispettiva taglia (vedi tabella allegata)",
"Effettuare MOTID inverter",
"Riportare a 0.1 il P346 ed il P347 degli inverter del prestiro",
"Verificare STO",

];
const vociChecklist3 = [
"Verificare il funzionamento del pulsante svolgimento con cancelli aperti",
"Impostare minimo e massimo ballerino da configurazione macchina. Verificare che gli offset siano a zero e poi regolarli come serve",
"Sbloccare il freno rotazione per attivare prestiro utilizzando prestiro 0, 100 e 200",
"regolare la velocità massima in modo che il tensionamento risulti lento a 5% e tirato oltre all’80%",
"effettuare cicli di fasciatura utilizzando varie combinazioni di tiro e prestiro",
];
const vociChecklist4 = [
"Verificare che tutti i conteggi lavorino correttamente e diano un risultato accettabile",
"Verificare che a pannello ci siano tutti i parametri per correggere centraggi e rallentamenti",
];
const vociChecklist5 = [
"Verificare tutti i lampeggianti, le sirene ed i led pulsanti",
];
const vociChecklist6 = [
"Provare comandi manuali macchine e trasporti",
"Verificare velocità di carico e scarico se presenti in specifica",
"Verificare su HMI presenza lingua di destinazione come da specifica",
"Verificare cambio velocità su tutte le rulliere da HMI",
"Simulare carico e scarico con muletto se presente",
"Provare linea piena con pallet vuoti e macchine disinserite",
"Verificare fotocellule di sicurezza",
"Provare cicli con le varie dimensioni di pallet e prodotto come da specifica",
"Verificare i tempi ciclo ed annotare criticità riscontrate",
"Effettuare prove di stop ciclo e richiesta apertura cancelli",
"Verificare passaggio programma su tutte le rulliere",
"Fare un passaggio con programma a 0",
"Verificare che su ogni memoria di load ci sia il timeout corretto",
];

const vociChecklist7 = [
"Verificare i segnali di scambio in ingresso utilizzando una rulliera folle",
"Verificare il passaggio del programma di fasciatura",
"Verificare i segnali di scambio in uscita utilizzando una rulliera folle",
"Verificare i segnali di scambio con etichettatrice",
"Verificare i segnali di emergenze esterne",
];

const vociChecklist8 = [
"Aggiornare trello",
"Fare l’upload di tutti gli inverter",
"Fare uno snapshot delle DB",
"Programmare teleassistenza",
"Foto, video e firma sicurezza",
"Archiviare tutto sul server",
];


// ===== COMPONENTE PRINCIPALE =====
function SchedaCollaudoForm({ scheda, onSave, userId, editable, username }) {
  // ===== HOOK: REFS =====
  const schedaRef = useRef();
  const pdfRef = useRef(); // contiene solo la parte da esportare in PDF

  const textareaRef = useRef(null);

  // ===== HOOK: STATE =====
  const [mostraDettagliSpunte, setMostraDettagliSpunte] = useState(true);
  const [immagini, setImmagini] = useState([]);
  const [immagineSelezionata, setImmagineSelezionata] = useState(null);
  const [tagSuggeriti, setTagSuggeriti] = useState([]);
  const [suggestionsVisibili, setSuggestionsVisibili] = useState([]);
  const [filtroTag, setFiltroTag] = useState("");
  const [cursorPos, setCursorPos] = useState(null);
  const [isVisibleInfo, setIsVisibleInfo] = useState(false);

  // ===== FUNZIONI DI UTILITÀ =====
  const autoResizeTextarea = () => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = "auto";
      el.style.height = `${el.scrollHeight}px`;
    }
  };
   const normalizeChecklist = (rawChecklist) => {
    const normalized = {};
    for (const voce of Object.keys(rawChecklist)) {
      const valore = rawChecklist[voce];
      normalized[voce] =
        typeof valore === "object" && valore !== null && "fatto" in valore
          ? valore
          : { fatto: !!valore, utente: null, timestamp: null };
    }
    return normalized;
  };

  // ===== HOOK: FORM =====
  const [form, setForm] = useState({
    titolo: scheda?.intestazione?.titolo || "",
    RevSoftware: scheda?.intestazione?.RevSoftware || "",
    RevMacchina: scheda?.intestazione?.RevMacchina || "",
    RevSchema: scheda?.intestazione?.RevSchema || "",
    checklist: normalizeChecklist(scheda?.contenuto?.checklist || {}),
    note: scheda?.note || "",
  });

  // ===== EVENTI / HANDLERS =====
  const toggleVoce = (voce) => {
    setForm((prev) => {
      const voceCorrente = prev.checklist[voce] || {
        fatto: false,
        utente: null,
        timestamp: null,
      };
      if (voceCorrente.fatto && voceCorrente.utente !== username) return prev;

      const nuovoStato = !voceCorrente.fatto;
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

  const toggleSectionVisibilityInfo = () => {
    setIsVisibleInfo((prev) => !prev);
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
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = () => {
    const datiPerBackend = {
      intestazione: {
        titolo: form.titolo,
        RevSoftware: form.RevSoftware,
        RevMacchina: form.RevMacchina,
        RevSchema: form.RevSchema,
      },
      contenuto: { checklist: form.checklist },
      note: form.note,
      allegati_standard: [],
      risorsa_id: userId,
      descrizione: "Modifica effettuata da interfaccia sviluppo",
    };

    const tagRegex = /#(\w+)/g;
    const tagSet = new Set();
    let match;
    while ((match = tagRegex.exec(form.note)) !== null) {
      tagSet.add(match[1]);
    }
    const tags = Array.from(tagSet);

    onSave(datiPerBackend);

    if (tags.length > 0) {
      fetch("https://commesseunserver.eu/api/schedeTecniche/tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scheda_id: scheda?.id || scheda?.scheda_id, tags }),
      }).catch((err) => console.error("Errore salvataggio tag:", err));
    }
  };

  const handleNoteChange = (e) => {
    const testo = e.target.value;
    setForm((prev) => ({ ...prev, note: testo }));

    const cursorPos = e.target.selectionStart;
    setCursorPos(cursorPos);

    const testoPrima = testo.substring(0, cursorPos);
    const match = testoPrima.match(/#(\w*)$/);

    if (match) {
      const cerca = match[1].toLowerCase();
      const filtra = tagSuggeriti.filter((tag) => tag.toLowerCase().startsWith(cerca));
      setSuggestionsVisibili(filtra.slice(0, 5));
      setFiltroTag(match[1]);
    } else {
      setSuggestionsVisibili([]);
      setFiltroTag("");
    }
  };

const handleDownloadPdf = () => {
  const element = schedaRef.current;


  element.classList.add("pdf-dark-mode");

  html2pdf()
    .set({
      margin: 10,
      filename: "Scheda collaudo.pdf",
      html2canvas: {
        scale: 2,
        backgroundColor: null, 
      },
      jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
    })
    .from(element)
    .save()
    .then(() => {
      element.classList.remove("pdf-dark-mode");
    });
};


  // ===== EFFECTS =====
  useEffect(() => {
    if (scheda?.id || scheda?.scheda_id) {
      const id = scheda.id || scheda.scheda_id;
      getImmaginiScheda(id)
        .then(setImmagini)
        .catch((err) => console.error("Errore nel caricamento immagini:", err));
    }
  }, [scheda]);

  useEffect(() => {
    getTagSuggeriti().then(setTagSuggeriti);
  }, []);

  useEffect(() => {
    autoResizeTextarea();
  }, [form.note]);

  return (
  // Contenitore che sarà usato per generare il PDF
  <div ref={pdfRef}>
    
    {/* Contenitore principale della scheda */}
    <div ref={schedaRef} className="flex-column-center">
      
      {/* Sezione revisioni */}
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

      {/* Pulsante mostra/nascondi dettagli spunte */}
      <button className="btn w-200 btn--shiny btn--pill" onClick={() => setMostraDettagliSpunte(prev => !prev)}>
        {mostraDettagliSpunte ? "Nascondi dettagli" : "Mostra dettagli"}
      </button>

      {/* Dettagli su data creazione e autore */}
      {mostraDettagliSpunte && (
        <div className="header-row">
          <label style={{ fontFamily: "serif", color: "darkgray" }}>
            Creata il {scheda?.data_creazione ? new Date(scheda.data_creazione).toLocaleString('it-IT') : "Data non disponibile"}
          </label>
          <label style={{ fontFamily: "serif", color: "darkgray" }}>
            da {scheda?.creato_da_nome || "utente sconosciuto"}
          </label>
        </div>
      )}

      {/* Checklist SICUREZZE */}
      <div className="flex-column-left">
        <h1>SICUREZZE</h1>
        {vociChecklist1.map((voce) => (
          <label key={voce} className="flex items-center">
            <input
              type="checkbox"
              checked={form.checklist?.[voce]?.fatto || false}
              onChange={() => toggleVoce(voce)}
              disabled={!editable}
            />
            {voce}
            <div style={{ marginTop: "5px", marginBottom: "15px", fontFamily: "serif", color: "darkgray" }}>
              {mostraDettagliSpunte && form.checklist?.[voce]?.fatto && form.checklist[voce].utente
                ? `-  Spuntato da ${form.checklist[voce].utente} il ${new Date(form.checklist[voce].timestamp).toLocaleString()}`
                : ""}
            </div>
          </label>
        ))}
      </div>

      {/* Checklist INVERTER */}
      <div className="flex-column-left">
        <h1>INVERTER</h1>
        {vociChecklist2.map((voce) => (
          <label key={voce} className="flex items-center">
            <input
              type="checkbox"
              checked={form.checklist?.[voce]?.fatto || false}
              onChange={() => toggleVoce(voce)}
              disabled={!editable}
            />
            {voce}
            <div style={{ marginTop: "5px", marginBottom: "15px", fontFamily: "serif", color: "darkgray" }}>
              {mostraDettagliSpunte && form.checklist?.[voce]?.fatto && form.checklist[voce].utente
                ? `-  Spuntato da ${form.checklist[voce].utente} il ${new Date(form.checklist[voce].timestamp).toLocaleString()}`
                : ""}
            </div>
          </label>
        ))}
      </div>

      {/* Checklist PRESTIRO */}
      <div className="flex-column-left">
        <h1>PRESTIRO</h1>
        {vociChecklist3.map((voce) => (
          <label key={voce} className="flex items-center">
            <input
              type="checkbox"
              checked={form.checklist?.[voce]?.fatto || false}
              onChange={() => toggleVoce(voce)}
              disabled={!editable}
            />
            {voce}
            <div style={{ marginTop: "5px", marginBottom: "15px", fontFamily: "serif", color: "darkgray" }}>
              {mostraDettagliSpunte && form.checklist?.[voce]?.fatto && form.checklist[voce].utente
                ? `-  Spuntato da ${form.checklist[voce].utente} il ${new Date(form.checklist[voce].timestamp).toLocaleString()}`
                : ""}
            </div>
          </label>
        ))}
      </div>

      {/* Checklist CONTEGGI E CENTRAGGI */}
      <div className="flex-column-left">
        <h1>CONTEGGI E CENTRAGGI</h1>
        {vociChecklist4.map((voce) => (
          <label key={voce} className="flex items-center">
            <input
              type="checkbox"
              checked={form.checklist?.[voce]?.fatto || false}
              onChange={() => toggleVoce(voce)}
              disabled={!editable}
            />
            {voce}
            <div style={{ marginTop: "5px", marginBottom: "15px", fontFamily: "serif", color: "darkgray" }}>
              {mostraDettagliSpunte && form.checklist?.[voce]?.fatto && form.checklist[voce].utente
                ? `-  Spuntato da ${form.checklist[voce].utente} il ${new Date(form.checklist[voce].timestamp).toLocaleString()}`
                : ""}
            </div>
          </label>
        ))}
      </div>

      {/* Checklist SEGNALAZIONI*/}
      <div className="flex-column-left">
        <h1>SEGNALAZIONI</h1>
        {vociChecklist5.map((voce) => (
          <label key={voce} className="flex items-center">
            <input
              type="checkbox"
              checked={form.checklist?.[voce]?.fatto || false}
              onChange={() => toggleVoce(voce)}
              disabled={!editable}
            />
            {voce}
            <div style={{ marginTop: "5px", marginBottom: "15px", fontFamily: "serif", color: "darkgray" }}>
              {mostraDettagliSpunte && form.checklist?.[voce]?.fatto && form.checklist[voce].utente
                ? `-  Spuntato da ${form.checklist[voce].utente} il ${new Date(form.checklist[voce].timestamp).toLocaleString()}`
                : ""}
            </div>
          </label>
        ))}
      </div>

      {/* Checklist COLLAUDO */}
      <div className="flex-column-left">
        <h1>COLLAUDO</h1>
        {vociChecklist6.map((voce) => (
          <label key={voce} className="flex items-center">
            <input
              type="checkbox"
              checked={form.checklist?.[voce]?.fatto || false}
              onChange={() => toggleVoce(voce)}
              disabled={!editable}
            />
            {voce}
            <div style={{ marginTop: "5px", marginBottom: "15px", fontFamily: "serif", color: "darkgray" }}>
              {mostraDettagliSpunte && form.checklist?.[voce]?.fatto && form.checklist[voce].utente
                ? `-  Spuntato da ${form.checklist[voce].utente} il ${new Date(form.checklist[voce].timestamp).toLocaleString()}`
                : ""}
            </div>
          </label>
        ))}
      </div>

      {/* Checklist SEGNALI SCAMBIO */}
      <div className="flex-column-left">
        <h1>SEGNALI SCAMBIO</h1>
        {vociChecklist7.map((voce) => (
          <label key={voce} className="flex items-center">
            <input
              type="checkbox"
              checked={form.checklist?.[voce]?.fatto || false}
              onChange={() => toggleVoce(voce)}
              disabled={!editable}
            />
            {voce}
            <div style={{ marginTop: "5px", marginBottom: "15px", fontFamily: "serif", color: "darkgray" }}>
              {mostraDettagliSpunte && form.checklist?.[voce]?.fatto && form.checklist[voce].utente
                ? `-  Spuntato da ${form.checklist[voce].utente} il ${new Date(form.checklist[voce].timestamp).toLocaleString()}`
                : ""}
            </div>
          </label>
        ))}
      </div>

      {/* FINE COLLAUDO */}
      <div className="flex-column-left">
        <h1>FINE COLLAUDO</h1>
        {vociChecklist8.map((voce) => (
          <label key={voce} className="flex items-center">
            <input
              type="checkbox"
              checked={form.checklist?.[voce]?.fatto || false}
              onChange={() => toggleVoce(voce)}
              disabled={!editable}
            />
            {voce}
            <div style={{ marginTop: "5px", marginBottom: "15px", fontFamily: "serif", color: "darkgray" }}>
              {mostraDettagliSpunte && form.checklist?.[voce]?.fatto && form.checklist[voce].utente
                ? `-  Spuntato da ${form.checklist[voce].utente} il ${new Date(form.checklist[voce].timestamp).toLocaleString()}`
                : ""}
            </div>
          </label>
        ))}
      </div>

      {/* Campo note */}
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

      {/* Suggerimenti tag visibili sotto il campo note */}
      {editable && suggestionsVisibili.length > 0 && (
        <ul className="tag-suggestions">
          {suggestionsVisibili.map((tag, idx) => (
            <li
              key={idx}
              className="tag-suggestion"
              onMouseDown={(e) => {
                e.preventDefault();
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
                #<strong>{tag.slice(0, filtroTag.length)}</strong>
                {tag.slice(filtroTag.length)}
              </>
            </li>
          ))}
        </ul>
      )}
    </div>

    {/* Fine pdfRef: da qui in poi NON incluso nel PDF */}

    {/* Toggle sezione info */}
    <div className="flex-column-center">
      <button className="btn w-200 btn--shiny btn--pill" onClick={toggleSectionVisibilityInfo}>
        {isVisibleInfo ? "▼" : "▶"} {" Info"}
      </button>
    </div>

    {/* Sezione info estesa con tabelle */}
    {isVisibleInfo && (
      <div className="flex-column-center">
        <div className="header-row"><h1>INFORMAZIONI</h1></div>

      </div>
    )}

    {/* Sezione immagini + pulsanti */}
    <div className="flex-column-center">
      <h1>IMMAGINI</h1>
      {editable && <input type="file" className="container w-fit" onChange={handleFileChange} />}
      <div className="container w-fit" style={{ border: 'solid 1px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
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

      {/* Pulsanti PDF e Salva */}
      <button onClick={handleDownloadPdf} className="btn btn--blue w-200 btn--pill">
        Scarica PDF
      </button>
      {editable && (
        <button className="btn btn--blue w-200 btn--pill" onClick={handleSubmit}>
          Salva
        </button>
      )}

      {/* Immagine ingrandita (modal) */}
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
          onClick={() => setImmagineSelezionata(null)}
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
export default SchedaCollaudoForm;
