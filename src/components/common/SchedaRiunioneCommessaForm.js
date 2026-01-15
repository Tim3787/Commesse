// ===== IMPORT =====
import { useState, useEffect, useRef } from "react";
import { addNotaToScheda, fetchNoteScheda, updateNotaScheda, deleteNotaScheda  } from "../services/API/schede-multi-api";
import html2pdf from "html2pdf.js";
import {

  getTagSuggeriti,
} from "../services/API/schedeTecniche-api";

// ===== COMPONENTE PRINCIPALE =====
function SchedaRiunioneCommessaForm({ scheda,  userId, editable, onClose}) {
  // ===== HOOK: REFS =====
  const schedaRef = useRef();
  const pdfRef = useRef(); 
  const textareaRef = useRef(null);
const allVerbaliRef = useRef(null);
const singleVerbaleRefs = useRef({});

  // ===== HOOK: STATE =====
  const [noteList, setNoteList] = useState([]);
  const [nuovaNota, setNuovaNota] = useState("");
  const [tagSuggeriti, setTagSuggeriti] = useState([]);
  const [suggestionsVisibili, setSuggestionsVisibili] = useState([]);
  const [filtroTag, setFiltroTag] = useState("");
  const [cursorPos, setCursorPos] = useState(null);
  const [mostraDettagliSpunte, setMostraDettagliSpunte] = useState(true);
  const [notaDaModificare, setNotaDaModificare] = useState(null);
  const [testoModificato, setTestoModificato] = useState("");

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
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSalvaNota = async () => {
  try {
await updateNotaScheda(notaDaModificare.id, {
  contenuto: testoModificato,
  allegato_path: notaDaModificare.allegato_path || null,
  utente_id: userId,
  scheda_id: scheda.id,
});
    setNotaDaModificare(null);
    setTestoModificato("");
    await caricaNote(); // Ricarica tutte le note aggiornate
  } catch (err) {
    console.error("Errore salvataggio nota:", err);
  }
};

const handleEditNota = (nota) => {
  setNotaDaModificare(nota);
  setTestoModificato(nota.contenuto);
};

  const caricaNote = async () => {
    try {
      const note = await fetchNoteScheda(scheda.id);
      setNoteList(note);
    } catch (err) {
      console.error("Errore caricamento note:", err);
    }
  };
  const handleNoteChange = (e) => {
    const testo = e.target.value;
    setNuovaNota(testo);
    const cursor = e.target.selectionStart;
    setCursorPos(cursor);

    const testoPrima = testo.substring(0, cursor);
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

  const handleAggiungiNota = async () => {
    if (!nuovaNota.trim()) return;
    try {
      await addNotaToScheda(scheda.id, {
        contenuto: nuovaNota,
        autore_id: userId,
      });
      setNuovaNota("");
      await caricaNote();
    if (onClose) onClose();  
      
    } catch (err) {
      console.error("Errore durante aggiunta nota:", err);
    }
  };

  const handleDeleteNota = async (nota) => {
  if (!window.confirm("Sei sicuro di voler eliminare questa nota?")) return;
  try {
    await deleteNotaScheda(nota.id);
    await caricaNote();
  } catch (err) {
    console.error("Errore durante l'eliminazione della nota:", err);
  }
};

useEffect(() => {
  (noteList || []).forEach((n) => {
    if (!singleVerbaleRefs.current[n.id]) {
      singleVerbaleRefs.current[n.id] = { current: null };
    }
  });
}, [noteList]);

function VerbalePdf({ scheda, nota }) {
  return (
    <div style={{ fontFamily: "Arial", color: "#000", background: "#fff", padding: 12 }}>
      <h2 style={{ margin: 0 }}>Verbale – Scheda #{scheda?.id ?? ""}</h2>

      <div style={{ fontSize: 12, margin: "6px 0 12px", color: "#000" }}>
        {nota?.creato_da_nome || "Autore sconosciuto"} —{" "}
        {nota?.data_creazione ? new Date(nota.data_creazione).toLocaleString("it-IT") : ""} — Nota #{nota?.id}
      </div>

      {nota?.modificato_da_nome &&
        nota?.data_ultima_modifica &&
        nota?.data_ultima_modifica !== nota?.data_creazione && (
          <div style={{ fontSize: 12, marginBottom: 10, color: "#000" }}>
            Ultima modifica: {new Date(nota.data_ultima_modifica).toLocaleString("it-IT")} — {nota.modificato_da_nome}
          </div>
        )}

      <div style={{ border: "1px solid #ccc", padding: 10, minHeight: 140, whiteSpace: "pre-wrap", color: "#000" }}>
        {nota?.contenuto}
      </div>

      {nota?.allegato_path && (
        <div style={{ marginTop: 8, fontSize: 12, color: "#000" }}>
          📎 Allegato: {nota.allegato_path}
        </div>
      )}
    </div>
  );
}

function VerbaliPdf({ scheda, noteList }) {
  return (
    <div style={{ fontFamily: "Arial", color: "#000", background: "#fff", padding: 12 }}>
      <h2>Scheda specifiche – Verbali</h2>

      <div style={{ fontSize: 12, marginBottom: 10, color: "#000" }}>
        Scheda #{scheda?.id ?? ""} — {scheda?.creato_da_nome ?? ""}
      </div>

      <hr />

      {noteList.map((n, i) => (
        <div
          key={n.id}
          style={{ pageBreakAfter: i === noteList.length - 1 ? "auto" : "always" }}
        >
          <div style={{ fontSize: 12, marginBottom: 6, color: "#000" }}>
            Verbale {i + 1} — {n.creato_da_nome || "Autore sconosciuto"}
          </div>

          <div style={{ border: "1px solid #ccc", padding: 10, whiteSpace: "pre-wrap", color: "#000" }}>
            {n.contenuto}
          </div>
        </div>
      ))}
    </div>
  );
}


const handleDownloadPdf = async () => {
  const element = schedaRef.current;
if (!element) return;
  element.classList.add("pdf-dark-mode");
  element.classList.add("pdf-exporting");

  try {
    await html2pdf()
      .set({
        margin: 10,
      filename: "Scheda riunioni.pdf",
      pagebreak: { mode: ["css", "legacy", "avoid-all"] },
        html2canvas: {
          scale: 2,
          backgroundColor: null,
          useCORS: true,
          scrollY: 0,
          windowWidth: element.scrollWidth,
        },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
      })
      .from(element)
      .save();
  } finally {
    element.classList.remove("pdf-dark-mode");
    element.classList.remove("pdf-exporting");
  }
};


const handleDownloadPdfAllVerbali = () => {
  html2pdf()
    .set({
      margin: 10,
      filename: `Scheda_Riunioni_${scheda?.id ?? ""}.pdf`,
      html2canvas: { scale: 2, backgroundColor: "#ffffff" },
      jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
    })
    .from(allVerbaliRef.current)
    .save();
};
const handleDownloadPdfSingleVerbale = (nota) => {
  const refObj = singleVerbaleRefs.current[nota.id];
  if (!refObj?.current) return;

  html2pdf()
    .set({
      margin: 10,
      filename: `Verbale_${nota.id}_Scheda_${scheda?.id ?? ""}.pdf`,
      html2canvas: { scale: 2, backgroundColor: "#ffffff" },
      jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
    })
    .from(refObj.current)
    .save();
};



  // ===== EFFECTS =====

  useEffect(() => {
    getTagSuggeriti().then(setTagSuggeriti);
  }, []);

  useEffect(() => {
    autoResizeTextarea();
  }, [form.note]);

  useEffect(() => {
    if (scheda?.id) {
     caricaNote();
  }
  }, [scheda?.id]);

  return (
  // Contenitore che sarà usato per generare il PDF
  <div ref={pdfRef}>
    
    {/* Contenitore principale della scheda */}
    <div ref={schedaRef} className="flex-column-center">
      
            {/* Dettagli su data creazione e autore */}
      {mostraDettagliSpunte && (
          <div className="row">
          <label style={{ fontFamily: "serif", color: "darkgray" }}>
            {scheda?.creato_da_nome || "utente sconosciuto"} ha creato un nuovo verbale il {scheda?.data_creazione ? new Date(scheda.data_creazione).toLocaleString('it-IT') : "Data non disponibile"}
              
          </label>
        </div>
      )}
      <textarea
        name="note"
         className="w-w note-textarea"
        ref={textareaRef}
        value={form.note}
        onChange={(e) => {
           handleChange(e);
          handleNoteChange(e);
          autoResizeTextarea();
        }}
        readOnly={!editable}
      />
{/* PDF: render affidabile multilinea */}
<div className="w-w note-print ">
  {form.note}
</div>

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
        <div className="row center" style={{ marginBottom: "30px", paddingBottom:"10px", borderBottom:"2px solid #ccc", }}>
      
      {/* Pulsanti PDF e Salva */}
            {editable && (
        <button className="btn btn--blue w-200 btn--pill" onClick={handleAggiungiNota}>
          Aggiungi verbale
        </button>
      )}

      <button onClick={handleDownloadPdf} className="btn btn--blue w-200 btn--pill">
        Scarica PDF verbale
      </button>


    </div>

{noteList.map((nota) => (
  <li key={nota.id} className="nota-item" style={{ listStyleType: "none",marginTop: "10px" }}>
    {mostraDettagliSpunte && (
    <div  className="row" style={{ fontFamily: "serif", color: "darkgray" }}>
      Verbale creato il: {new Date(nota.data_creazione).toLocaleString("it-IT")} — da {nota.creato_da_nome || "Autore sconosciuto"}
      {nota.modificato_da_nome && nota.data_ultima_modifica !== nota.data_creazione && (
  <div className="row" style={{ marginBottom: "10px" }}>
    Ultima modifica il : {new Date(nota.data_ultima_modifica).toLocaleString("it-IT")} — da {nota.modificato_da_nome}
  </div>
)}
    </div>
 )}
    {notaDaModificare?.id === nota.id ? (
      <div>
        <textarea
        className="w-w border"
        style={{ minHeight: "100px"}}
          value={testoModificato}
          onChange={(e) => setTestoModificato(e.target.value)}
        />
        <div className="row center">
          <button className="btn btn--blue w-200 btn--pill"onClick={handleSalvaNota}> Salva</button>
          <button className="btn btn--danger w-200 btn--pill" onClick={() => setNotaDaModificare(null)}> Annulla</button>
        </div>
      </div>
    ) : (
      <>
        <div  className="w-w border" style={{ minHeight: "100px", padding: "10px"}}>{nota.contenuto}</div>
        {nota.allegato_path && (
          <div style={{ marginTop: "0.5rem" }}>
            <a href={nota.allegato_path} target="_blank" rel="noopener noreferrer">
              📎 Allegato
            </a>
          </div>
        )}
        {nota.autore_id === userId && (
          <div className="row center" style={{ marginBottom: "30px", paddingBottom:"10px", borderBottom:"2px solid #ccc", }}>
            <button onClick={() => handleEditNota(nota)} className="btn btn--blue w-200 btn--pill">
              Modifica
            </button>
                        <button onClick={() => handleDeleteNota(nota)} className="btn btn--danger w-200 btn--pill">
              Elimina
            </button>
                            <button
  onClick={() => handleDownloadPdfSingleVerbale(nota)}
  className="btn btn--shiny w-200 btn--pill"
>
  Scarica PDF (questo verbale)
</button>
          </div>
        )}
      </>
    )}
  </li>
))}
      {/* Pulsante mostra/nascondi dettagli spunte */}
      <div className="flex-column-center ">
      <button className="btn w-200 btn--shiny btn--pill" onClick={() => setMostraDettagliSpunte(prev => !prev)}>
        {mostraDettagliSpunte ? "Nascondi dettagli" : "Mostra dettagli"}
      </button>
      <button onClick={handleDownloadPdfAllVerbali} className="btn btn--shiny w-200 btn--pill">
  Scarica PDF TUTTI i verbali
</button>
      </div>
      <div style={{ position: "fixed", left: "-10000px" }}>
  <div ref={allVerbaliRef}>
    <VerbaliPdf scheda={scheda} noteList={noteList} />
  </div>
</div>
<div style={{ position: "fixed", left: "-10000px", top: 0, background: "#fff" }}>
  {(noteList || []).map((nota) => (
    <div
      key={nota.id}
      ref={(el) => {
        if (!singleVerbaleRefs.current[nota.id]) singleVerbaleRefs.current[nota.id] = { current: null };
        singleVerbaleRefs.current[nota.id].current = el;
      }}
    >
      <VerbalePdf scheda={scheda} nota={nota} />
    </div>
  ))}
</div>

  </div>
);
}
export default SchedaRiunioneCommessaForm;
