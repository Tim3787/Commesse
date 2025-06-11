// ===== IMPORT =====
import { useState, useEffect, useRef } from "react";
import {
  getTagSuggeriti,
} from "../services/API/schedeTecniche-api";
import html2pdf from "html2pdf.js";


// ===== COMPONENTE PRINCIPALE =====
function SchedaRiunioneCommessaForm({ scheda, onSave, userId, editable }) {
  // ===== HOOK: REFS =====
  const schedaRef = useRef();
  const pdfRef = useRef(); 

  const textareaRef = useRef(null);

  // ===== HOOK: STATE =====
  const [mostraDettagliSpunte, setMostraDettagliSpunte] = useState(true);
  const [tagSuggeriti, setTagSuggeriti] = useState([]);
  const [suggestionsVisibili, setSuggestionsVisibili] = useState([]);
  const [filtroTag, setFiltroTag] = useState("");
  const [cursorPos, setCursorPos] = useState(null);

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


    {/* Sezione  pulsanti */}
    <div className="flex-column-center">
      
      {/* Pulsanti PDF e Salva */}
      <button onClick={handleDownloadPdf} className="btn btn--blue w-200 btn--pill">
        Scarica PDF
      </button>
      {editable && (
        <button className="btn btn--blue w-200 btn--pill" onClick={handleSubmit}>
          Salva
        </button>
      )}


    </div>
  </div>
);
}
export default SchedaRiunioneCommessaForm;
