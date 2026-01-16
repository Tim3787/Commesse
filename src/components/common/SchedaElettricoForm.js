import { useState, useEffect, useRef } from "react";
import { getTagSuggeriti } from "../services/API/schedeTecniche-api";
import html2pdf from "html2pdf.js";

const vociChecklist1 = [
  "Taglio e preparazione cavi",
  "Montaggio e cablaggio cassette, pulsantiere, ciabatte e pulpiti",
  "Montaggio e cablaggio barriere e elettroserrature ",
  "Cablaggio contatto rotante, prove cortocircuito piste e continuità cavi verifica serraggio fili viola delle piste",
  "Controllo cablaggio di tutti i dispositivi in campo",
  "Stesura cavi a layout con scorta 4/5 mt nel Q.E",
  "Cablaggio impianto PE",
];

const vociChecklist2 = [
  "Ponticellare circuiti sicurezze esterne",
  "Regolazione sensori e fotocellule",
  "Allineamento e controllo funzionamento barriere e elettroserrature ",
  "Foto impianto",
  "Test ingressi",
];

const vociChecklist3 = [
  "Controllo componenti interno Q.E  (mancanti o provvisori)",
  "Rimuovere tutti i ponticelli sicurezze esterne ",
  "Fornitura barriere, elettroserrature, pulsantiere e pulpiti",
  "Fornitura di cavi scambio,  cavetti, sensoristica e connettori",
  "Fornitura canalina",
  "Fornitura corredo elettrico",
  "Foto materiale da spedire ",
];

function SchedaElettricoForm({ scheda,commessa, onSave, userId, editable, username }) {
  const schedaRef = useRef();
  const textareaRef = useRef(null);

  const [mostraDettagliSpunte, setMostraDettagliSpunte] = useState(true);
  const [tagSuggeriti, setTagSuggeriti] = useState([]);
  const [, setSuggestionsVisibili] = useState([]);
  const [, setCursorPos] = useState(0);
  const [, setFiltroTag] = useState("");

  const autoResizeTextarea = () => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = "auto";
      el.style.height = `${el.scrollHeight}px`;
    }
  };

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
    // intestazione (separa i campi, così non schiacci tutto su RevSchema)
    destinazione: scheda?.intestazione?.destinazione || "",
    tipoMacchina: scheda?.intestazione?.tipoMacchina || "",
    progettistaElettrico: scheda?.intestazione?.progettistaElettrico || "",
    targhetteImpianto: scheda?.intestazione?.targhetteImpianto || "",
    prodotto: scheda?.intestazione?.prodotto || "",
    gestioneEFornitura: scheda?.intestazione?.gestioneEFornitura || "",
    soloFornitura: scheda?.intestazione?.soloFornitura || "",
    sicurezze: scheda?.intestazione?.sicurezze || "",
    alimentazione: scheda?.intestazione?.alimentazione || "",
    contattoRotante: scheda?.intestazione?.contattoRotante || "",
    motori: scheda?.intestazione?.motori || "",
    altezzaLinea: scheda?.intestazione?.altezzaLinea || "",

    checklist: normalizeChecklist(scheda?.contenuto?.checklist || {}),
    note: scheda?.note || "",
  });

  const headerFields = [
    { label: "Destinazione:", name: "destinazione" },
    { label: "Tipo di macchina:", name: "tipoMacchina" },
    { label: "Progettista Elettrico:", name: "progettistaElettrico" },
    { label: "Targhette Impianto:", name: "targhetteImpianto" },
    { label: "Prodotto:", name: "prodotto" },
    { label: "Gestione e fornitura:", name: "gestioneEFornitura" },
    { label: "Solo fornitura:", name: "soloFornitura" },
    { label: "Sicurezze:", name: "sicurezze" },
    { label: "Alimentazione:", name: "alimentazione" },
    { label: "Contatto rotante:", name: "contattoRotante" },
    { label: "Motori:", name: "motori" },
    { label: "Altezza linea:", name: "altezzaLinea" },
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const toggleVoce = (voce) => {
    setForm((prev) => {
      const voceCorrente = prev.checklist[voce] || {
        fatto: false,
        utente: null,
        timestamp: null,
      };

      // blocca lo "spunta" se è stato spuntato da un altro utente
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
      intestazione: {
        destinazione: form.destinazione,
        tipoMacchina: form.tipoMacchina,
        progettistaElettrico: form.progettistaElettrico,
        targhetteImpianto: form.targhetteImpianto,
        prodotto: form.prodotto,
        gestioneEFornitura: form.gestioneEFornitura,
        soloFornitura: form.soloFornitura,
        sicurezze: form.sicurezze,
        alimentazione: form.alimentazione,
        contattoRotante: form.contattoRotante,
        motori: form.motori,
        altezzaLinea: form.altezzaLinea,
      },
      contenuto: { checklist: form.checklist },
      note: form.note,
      allegati_standard: [],
      risorsa_id: userId,
      descrizione: "Modifica effettuata da interfaccia sviluppo",
    };

    // estrazione tag da note
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
 const filename = `Scheda elettrico commessa:${commessa}.pdf`;
  const handleDownloadPdf = async () => {
    const element = schedaRef.current;
  if (!element) return;
    element.classList.add("pdf-dark-mode");
    element.classList.add("pdf-exporting");
  
    try {
      await html2pdf()
        .set({
          margin: 10,
          filename,
          html2canvas: { scale: 2, backgroundColor: null },
          jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
        })
        .from(element)
        .save();
    } finally {
      element.classList.remove("pdf-dark-mode");
      element.classList.remove("pdf-exporting");
    }
  };

  useEffect(() => {
    getTagSuggeriti().then(setTagSuggeriti);
  }, []);

  useEffect(() => {
    autoResizeTextarea();
  }, [form.note]);

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
                  <h1>Scheda elettrica commessa: {commessa}</h1>
        <div className="flex-column-left">
          {headerFields.map((f) => (
  <div key={f.name} className="flex-column-left header-field">
    <label className="header-label">{f.label}</label>

    {/* SCHERMO */}
    <input
      name={f.name}
      className="w-400 header-input no-print"
      value={form[f.name] || ""}
      onChange={handleChange}
      readOnly={!canEditHeaderAndNote}
      disabled={!canEditHeaderAndNote}
    />

    {/* STAMPA / PDF */}
    <div className="w-400 header-print only-print">
      {form[f.name] || ""}
    </div>
  </div>
))}

        </div>
        {/* NOTE */}
<div className="note-page">
  <h1 className="note-title">Specifiche montaggio</h1>

  <textarea
    name="note"
    className="w-w note-textarea"
    ref={textareaRef}
    value={form.note}
    onChange={(e) => {
      handleNoteChange(e);
      autoResizeTextarea();
    }}
    readOnly={!canEditHeaderAndNote}
disabled={!canEditHeaderAndNote}

  />

  <div className="w-w note-print">
    {form.note}
  </div>
</div>
        <button
          className="btn w-200 btn--shiny btn--pill"
          onClick={() => setMostraDettagliSpunte((p) => !p)}
        >
          {mostraDettagliSpunte ? "Nascondi dettagli" : "Mostra dettagli"}
        </button>

        {mostraDettagliSpunte && (
          <div className="header-row">
            <label style={{ fontFamily: "serif", color: "darkgray" }}>
              Creata il{" "}
              {scheda?.data_creazione
                ? new Date(scheda.data_creazione).toLocaleString("it-IT")
                : "Data non disponibile"}
            </label>
            <label style={{ fontFamily: "serif", color: "darkgray" }}>
              da {scheda?.creato_da_nome || "utente sconosciuto"}
            </label>
          </div>
        )}

<div className="note-pdf-wrap">
        <div className="flex-column-left">
          <h1>FASE PREPARAZIONE E MONTAGGIO BM</h1>
          {vociChecklist1.map((voce) => (
            <label key={voce} className="flex items-center check-row">
              <input
                type="checkbox"
                checked={form.checklist?.[voce]?.fatto || false}
                onChange={() => toggleVoce(voce)}
                disabled={!editable}
              />
              {voce}
              <div
                style={{
                  marginTop: "5px",
                  marginBottom: "15px",
                  fontFamily: "serif",
                  color: "darkgray",
                }}
              >
                {mostraDettagliSpunte &&
                form.checklist?.[voce]?.fatto &&
                form.checklist[voce].utente
                  ? `- Spuntato da ${form.checklist[voce].utente} il ${new Date(
                      form.checklist[voce].timestamp
                    ).toLocaleString("it-IT")}`
                  : ""}
              </div>
            </label>
          ))}
        </div>

        <div className="flex-column-left">
          <h1>FASE PRECOLLAUDO</h1>
          {vociChecklist2.map((voce) => (
            <label key={voce} className="flex items-center check-row">
              <input
                type="checkbox"
                checked={form.checklist?.[voce]?.fatto || false}
                onChange={() => toggleVoce(voce)}
                disabled={!editable}
              />
              {voce}
              <div style={{ marginTop: "5px", marginBottom: "15px", fontFamily: "serif", color: "darkgray" }}>
                {mostraDettagliSpunte &&
                form.checklist?.[voce]?.fatto &&
                form.checklist[voce].utente
                  ? `- Spuntato da ${form.checklist[voce].utente} il ${new Date(
                      form.checklist[voce].timestamp
                    ).toLocaleString("it-IT")}`
                  : ""}
              </div>
            </label>
          ))}
        </div>

        <div className="flex-column-left">
          <h1>FASE SMONTAGGIO</h1>
          {vociChecklist3.map((voce) => (
            <label key={voce} className="flex items-center check-row">
              <input
                type="checkbox"
                checked={form.checklist?.[voce]?.fatto || false}
                onChange={() => toggleVoce(voce)}
                disabled={!editable}
              />
              {voce}
              <div style={{ marginTop: "5px", marginBottom: "15px", fontFamily: "serif", color: "darkgray" }}>
                {mostraDettagliSpunte &&
                form.checklist?.[voce]?.fatto &&
                form.checklist[voce].utente
                  ? `- Spuntato da ${form.checklist[voce].utente} il ${new Date(
                      form.checklist[voce].timestamp
                    ).toLocaleString("it-IT")}`
                  : ""}
              </div>
            </label>
          ))}
        </div>
        </div>
   </div>




        {/* qui eventualmente renderizzi suggestionsVisibili se ti serve */}
      
 <div className="flex-column-center">
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

export default SchedaElettricoForm;
