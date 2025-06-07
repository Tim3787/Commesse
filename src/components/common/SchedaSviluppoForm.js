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

function SchedaSviluppoForm({ scheda, onSave, userId,editable }) {

const [form, setForm] = useState({
  titolo: scheda?.intestazione?.titolo || "",
  RevSoftware: scheda?.intestazione?.RevSoftware || "",
  RevMacchina: scheda?.intestazione?.  RevMacchina || "",
  RevSchema: scheda?.intestazione?.  RevSchema || "",
  checklist: scheda?.contenuto?.checklist || {},
  note: scheda?.note ||  "",
});
  const toggleVoce = (voce) => {
    setForm((prev) => ({
      ...prev,
      checklist: {
        ...prev.checklist,
        [voce]: !prev.checklist?.[voce]
      }
    }));
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
            <label>Revisione Master:</label>
            <input
              name="RevSoftware"
              className="w-100"
              value={form.RevSoftware}
              onChange={handleChange}
              readOnly={!editable}
           />
          <label>Revisione Macchina:</label>
          <input
            name="RevMacchina"
           className="w-100"
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
        <label>HARDWARE</label>
        <div className="flex-column-left">
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
        <label>SOFTWARE</label>
        <div className="flex-column-left">
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
          <label>HMI</label>
           <div className="flex-column-left">
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
           <label>ARCHIVIO</label>
           <div className="flex-column-left">
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
    onClick={handleSubmit}
  >
    Salva
  </button>
)}
  </div>
  );
}

export default SchedaSviluppoForm;
