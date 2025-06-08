// SchedaSviluppoForm.jsx
import { useState } from "react";


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

function SchedaCollaudoForm({ scheda, onSave, userId,editable }) {


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
      timestamp: null
    };

    const nuovoStato = !voceCorrente.fatto;

    return {
      ...prev,
      checklist: {
        ...prev.checklist,
        [voce]: {
          fatto: nuovoStato,
          utente: nuovoStato ? userName : null,
          timestamp: nuovoStato ? new Date().toISOString() : null
        }
      }
    };
  });
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

  onSave(datiPerBackend); // ora manda l'oggetto compatibile col backend
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
        <div className="flex-column-left">
                  <h1>HARDWARE</h1>
          {vociChecklist1.map((voce) => (
            <label key={voce} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.checklist?.[voce] || false}
                onChange={() => toggleVoce(voce)}
                  disabled={!editable}
              />
              {voce}
            </label>
          ))}
        </div>
        <div className="flex-column-left">
         <h1>SOFTWARE</h1>
          {vociChecklist2.map((voce) => (
            <label key={voce} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.checklist?.[voce] || false}
                onChange={() => toggleVoce(voce)}
                  disabled={!editable}
              />
              {voce}
            </label>
          ))}
        </div>
           <div className="flex-column-left">
           <h1>HMI</h1>
          {vociChecklist3.map((voce) => (
            <label key={voce} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.checklist?.[voce] || false}
                onChange={() => toggleVoce(voce)}
                  disabled={!editable}
              />
              {voce}
            </label>
          ))}
        </div>
           <div className="flex-column-left">
          <h1>ARCHIVIO</h1>
          {vociChecklist4.map((voce) => (
            <label key={voce} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.checklist?.[voce] || false}
                onChange={() => toggleVoce(voce)}
                 disabled={!editable}
              />
              {voce}
            </label>
          ))}
        </div>
        <label>Note</label>
        <textarea
          name="note"
          className="w-400"
          value={form.note}
          onChange={handleChange}
           readOnly={!editable}
        />
{editable && (
  <button
    className="btn btn--blue w-200 btn--pill"
    onClick={handleSubmit}>
    Salva</button>
)}
  </div>
  );
}

export default SchedaCollaudoForm;
