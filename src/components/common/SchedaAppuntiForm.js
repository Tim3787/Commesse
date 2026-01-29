import { useState, useEffect, useRef, useLayoutEffect } from "react";
import { getTagSuggeriti } from "../services/API/schedeTecniche-api";


function SchedaAppuntiForm({ scheda, commessa, onSave, userId, editable, username }) {
  const schedaRef = useRef();
  const textareaRef = useRef(null);

  const [tagSuggeriti, setTagSuggeriti] = useState([]);
  const [, setSuggestionsVisibili] = useState([]);
  const [, setCursorPos] = useState(0);
  const [, setFiltroTag] = useState("");

  const normalizeChecklist = (rawChecklist = {}) => {
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

  const [form, setForm] = useState({
    checklist: normalizeChecklist(scheda?.contenuto?.checklist || {}),
    note: scheda?.note || "",
  });

  // IMPORTANTISSIMO: se cambia scheda, aggiorna form
  useEffect(() => {
    setForm({
      checklist: normalizeChecklist(scheda?.contenuto?.checklist || {}),
      note: scheda?.note || "",
    });
  }, [scheda?.id, scheda?.scheda_id]);

  const autoResizeTextarea = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "0px";
    el.style.height = `${el.scrollHeight}px`;
  };

  useLayoutEffect(() => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => autoResizeTextarea());
    });
  }, [form.note]);

  useEffect(() => {
    getTagSuggeriti().then(setTagSuggeriti);
  }, []);

  const handleNoteChange = (e) => {
    const testo = e.target.value;
    const pos = e.target.selectionStart;

    setForm((prev) => ({ ...prev, note: testo }));
    setCursorPos(pos);

    const testoPrima = testo.substring(0, pos);
    const match = testoPrima.match(/#(\w*)$/);

    if (match) {
      const cerca = match[1].toLowerCase();
      const filtra = tagSuggeriti.filter((tag) =>
        tag.toLowerCase().startsWith(cerca)
      );
      setSuggestionsVisibili(filtra.slice(0, 5));
      setFiltroTag(match[1]);
    } else {
      setSuggestionsVisibili([]);
      setFiltroTag("");
    }
  };

  const handleSubmit = () => {
    const datiPerBackend = {
      contenuto: { checklist: form.checklist },
      note: form.note,
      allegati_standard: [],
      risorsa_id: userId,
      descrizione: "Modifica appunti",
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

  // --- PERMESSO: solo il creatore può modificare intestazione + note ---
  const createdBy = (scheda?.creato_da_nome || "").trim();
  const currentUser = (username || "").trim();

  const canEditHeaderAndNote =
    editable &&
    createdBy &&
    currentUser &&
    createdBy.toLowerCase() === currentUser.toLowerCase();

  return (
    <div>
      <div ref={schedaRef} className="flex-column-center">
   <h1>Appunti commessa: {commessa}</h1>
  <div className="flex-column-left header-field">

    {/* STAMPA / PDF */}
    <div className="w-400 header-print only-print">
  </div>
        </div>
        {/* NOTE */}
<div className="note-page">
  <textarea
        name="note"
        className="w-w note-textarea"
        ref={textareaRef}
        value={form.note}
        onChange={handleNoteChange}
        readOnly={!canEditHeaderAndNote}
        disabled={!canEditHeaderAndNote}
      />
  <div className="w-w note-print">
    {form.note}
  </div>
</div>
   </div>
 <div className="flex-column-center">

{canEditHeaderAndNote && (
  <button className="btn btn--blue w-200 btn--pill" onClick={handleSubmit}>
    Salva
  </button>
)}

   </div>
    </div>
  );
}

export default SchedaAppuntiForm;
