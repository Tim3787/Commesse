// ===== IMPORT =====
import { useState, useEffect, useRef } from 'react';
import html2pdf from 'html2pdf.js';
import { getAuthUser } from '../utils/auth';
import useTagAutocomplete from '../common/useTagAutocomplete';
import TagSuggestions from '../common/TagSuggestions';
import { extractHashtagsLower } from '../common/tagUtils';
import {
  uploadImmagineScheda,
  getImmaginiScheda,
  deleteImmagineScheda,
  updateTagsByNames,
  uploadAllegatoScheda,
  getAllegatiScheda,
  deleteAllegatoScheda,
} from '../services/API/schedeTecniche-api';

const normalizeChecklist = (rawChecklist = {}) => {
  const normalized = {};
  for (const voce of Object.keys(rawChecklist)) {
    const valore = rawChecklist[voce];
    normalized[voce] =
      typeof valore === 'object' && valore !== null && 'fatto' in valore
        ? valore
        : { fatto: !!valore, utente: null, timestamp: null };
  }
  return normalized;
};

const vociChecklist1 = [
  'Taglio e preparazione cavi',
  'Montaggio e cablaggio cassette, pulsantiere, ciabatte e pulpiti',
  'Montaggio e cablaggio barriere e elettroserrature ',
  'Cablaggio contatto rotante, prove cortocircuito piste e continuità cavi verifica serraggio fili viola delle piste',
  'Controllo cablaggio di tutti i dispositivi in campo',
  'Stesura cavi a layout con scorta 4/5 mt nel Q.E',
  'Cablaggio impianto PE',
];

const vociChecklist2 = [
  'Ponticellare circuiti sicurezze esterne',
  'Regolazione sensori e fotocellule',
  'Allineamento e controllo funzionamento barriere e elettroserrature ',
  'Foto impianto',
  'Test ingressi',
];

const vociChecklist3 = [
  'Controllo componenti interno Q.E  (mancanti o provvisori)',
  'Rimuovere tutti i ponticelli sicurezze esterne ',
  'Fornitura barriere, elettroserrature, pulsantiere e pulpiti',
  'Fornitura di cavi scambio,  cavetti, sensoristica e connettori',
  'Fornitura canalina',
  'Fornitura corredo elettrico',
  'Foto materiale da spedire ',
];

function SchedaElettricoForm({ scheda, commessa, onSave, userId, editable, username }) {
  const schedaRef = useRef();
  const textareaRef = useRef(null);
  const [mostraDettagliSpunte, setMostraDettagliSpunte] = useState(true);
  const [immagini, setImmagini] = useState([]);
  const [immagineSelezionata, setImmagineSelezionata] = useState(null);
  const [allegati, setAllegati] = useState([]);
  const FILE_BASE_URL = process.env.REACT_APP_API_URL?.replace(/\/$/, '') || '';

  // --- PERMESSO: solo il creatore può modificare intestazione + note ---
  const createdBy = (scheda?.creato_da_nome || '').trim();
  const currentUser = (username || '').trim();

  const canEditHeaderAndNote =
    editable && createdBy && currentUser && createdBy.toLowerCase() === currentUser.toLowerCase();

  const { suggestionsVisibili, filtroTag, cursorPos, handleNoteChange, clearSuggestions } =
    useTagAutocomplete({ enabled: canEditHeaderAndNote });

  const autoResizeTextarea = () => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = 'auto';
      el.style.height = `${el.scrollHeight}px`;
    }
  };

  const [form, setForm] = useState({
    // intestazione (separa i campi, così non schiacci tutto su RevSchema)
    destinazione: scheda?.intestazione?.destinazione || '',
    tipoMacchina: scheda?.intestazione?.tipoMacchina || '',
    progettistaElettrico: scheda?.intestazione?.progettistaElettrico || '',
    targhetteImpianto: scheda?.intestazione?.targhetteImpianto || '',
    prodotto: scheda?.intestazione?.prodotto || '',
    gestioneEFornitura: scheda?.intestazione?.gestioneEFornitura || '',
    soloFornitura: scheda?.intestazione?.soloFornitura || '',
    sicurezze: scheda?.intestazione?.sicurezze || '',
    alimentazione: scheda?.intestazione?.alimentazione || '',
    contattoRotante: scheda?.intestazione?.contattoRotante || '',
    motori: scheda?.intestazione?.motori || '',
    altezzaLinea: scheda?.intestazione?.altezzaLinea || '',

    checklist: normalizeChecklist(scheda?.contenuto?.checklist || {}),
    note: scheda?.note || '',
  });

  const headerFields = [
    { label: 'Destinazione:', name: 'destinazione' },
    { label: 'Tipo di macchina:', name: 'tipoMacchina' },
    { label: 'Progettista Elettrico:', name: 'progettistaElettrico' },
    { label: 'Targhette Impianto:', name: 'targhetteImpianto' },
    { label: 'Prodotto:', name: 'prodotto' },
    { label: 'Gestione e fornitura:', name: 'gestioneEFornitura' },
    { label: 'Solo fornitura:', name: 'soloFornitura' },
    { label: 'Sicurezze:', name: 'sicurezze' },
    { label: 'Alimentazione:', name: 'alimentazione' },
    { label: 'Contatto rotante:', name: 'contattoRotante' },
    { label: 'Motori:', name: 'motori' },
    { label: 'Altezza linea:', name: 'altezzaLinea' },
  ];

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
  useEffect(() => {
    if (!scheda) return;

    setForm({
      destinazione: scheda?.intestazione?.destinazione || '',
      tipoMacchina: scheda?.intestazione?.tipoMacchina || '',
      progettistaElettrico: scheda?.intestazione?.progettistaElettrico || '',
      targhetteImpianto: scheda?.intestazione?.targhetteImpianto || '',
      prodotto: scheda?.intestazione?.prodotto || '',
      gestioneEFornitura: scheda?.intestazione?.gestioneEFornitura || '',
      soloFornitura: scheda?.intestazione?.soloFornitura || '',
      sicurezze: scheda?.intestazione?.sicurezze || '',
      alimentazione: scheda?.intestazione?.alimentazione || '',
      contattoRotante: scheda?.intestazione?.contattoRotante || '',
      motori: scheda?.intestazione?.motori || '',
      altezzaLinea: scheda?.intestazione?.altezzaLinea || '',
      checklist: normalizeChecklist(scheda?.contenuto?.checklist || {}),
      note: scheda?.note || '',
    });

    clearSuggestions();
    requestAnimationFrame(autoResizeTextarea);
  }, [scheda]); // ✅ più robusto

  const handleSubmit = async () => {
    const schedaId = scheda?.id || scheda?.scheda_id;
    const u = getAuthUser();
    const token = u?.token || sessionStorage.getItem('token') || localStorage.getItem('token');

    if (!token) {
      console.warn('Token mancante: fai login di nuovo o controlla getAuthUser()');
      return;
    }
    if (!schedaId) {
      console.warn('Scheda id mancante, impossibile salvare tags');
      return;
    }

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
      descrizione: 'Modifica effettuata da interfaccia sviluppo',
    };

    try {
      const maybePromise = onSave?.(datiPerBackend);
      if (maybePromise && typeof maybePromise.then === 'function') {
        await maybePromise;
      }

      const names = extractHashtagsLower(form.note);

      // ✅ sempre, anche [] -> pulisce
      await updateTagsByNames(schedaId, names, token);
    } catch (err) {
      console.error('Errore salvataggio scheda/tag:', err);
    }
  };

  const filename = `Scheda elettrico commessa:${commessa}.pdf`;
  const handleDownloadPdf = async () => {
    const element = schedaRef.current;
    if (!element) return;
    element.classList.add('pdf-dark-mode');
    element.classList.add('pdf-exporting');

    try {
      await html2pdf()
        .set({
          margin: 10,
          filename,
          html2canvas: { scale: 2, backgroundColor: null },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        })
        .from(element)
        .save();
    } finally {
      element.classList.remove('pdf-dark-mode');
      element.classList.remove('pdf-exporting');
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    const id = scheda?.id || scheda?.scheda_id;
    if (!file || !id) return;

    try {
      await uploadImmagineScheda(file, id);
      const nuoveImmagini = await getImmaginiScheda(id);
      setImmagini(nuoveImmagini);
      e.target.value = ''; // reset input
    } catch (error) {
      console.error('Errore durante l’upload:', error);
    }
  };
  const handleAllegatoChange = async (e) => {
    const file = e.target.files?.[0];
    const id = scheda?.id || scheda?.scheda_id;
    if (!file || !id) return;

    try {
      await uploadAllegatoScheda(file, id);
      const nuoviAllegati = await getAllegatiScheda(id);
      setAllegati(nuoviAllegati);
      e.target.value = '';
    } catch (error) {
      console.error('Errore durante upload allegato:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };
  // ===== EFFECTS =====
  useEffect(() => {
    const id = scheda?.id || scheda?.scheda_id;

    if (!id) {
      setImmagini([]);
      setAllegati([]);
      return;
    }

    getImmaginiScheda(id)
      .then(setImmagini)
      .catch((err) => console.error('Errore nel caricamento immagini:', err));

    getAllegatiScheda(id)
      .then(setAllegati)
      .catch((err) => console.error('Errore nel caricamento allegati:', err));
  }, [scheda]);

  useEffect(() => {
    autoResizeTextarea();
  }, [form.note]);

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
                value={form[f.name] || ''}
                onChange={handleChange}
                readOnly={!canEditHeaderAndNote}
                disabled={!canEditHeaderAndNote}
              />

              {/* STAMPA / PDF */}
              <div className="w-400 header-print only-print">{form[f.name] || ''}</div>
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
              const testo = e.target.value;
              const pos = e.target.selectionStart;

              setForm((prev) => ({ ...prev, note: testo }));
              handleNoteChange(testo, pos);

              autoResizeTextarea();
            }}
            onKeyDown={(e) => {
              if (e.key === 'Escape') clearSuggestions();
            }}
            readOnly={!canEditHeaderAndNote}
            disabled={!canEditHeaderAndNote}
          />
          {canEditHeaderAndNote && (
            <TagSuggestions
              visible={suggestionsVisibili.length > 0}
              suggestions={suggestionsVisibili}
              noteText={form.note}
              cursorPos={cursorPos}
              filtroTag={filtroTag}
              onPick={(nuovoTesto) => {
                setForm((prev) => ({ ...prev, note: nuovoTesto }));
                clearSuggestions();

                requestAnimationFrame(() => {
                  autoResizeTextarea();
                  textareaRef.current?.focus();
                });
              }}
            />
          )}

          <div className="w-w note-print">{form.note}</div>
        </div>
        <button
          className="btn w-200 btn--shiny btn--pill"
          onClick={() => setMostraDettagliSpunte((p) => !p)}
        >
          {mostraDettagliSpunte ? 'Nascondi dettagli' : 'Mostra dettagli'}
        </button>

        {mostraDettagliSpunte && (
          <div className="header-row">
            <label style={{ fontFamily: 'serif', color: 'darkgray' }}>
              Creata il{' '}
              {scheda?.data_creazione
                ? new Date(scheda.data_creazione).toLocaleString('it-IT')
                : 'Data non disponibile'}
            </label>
            <label style={{ fontFamily: 'serif', color: 'darkgray' }}>
              da {scheda?.creato_da_nome || 'utente sconosciuto'}
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
                    marginTop: '5px',
                    marginBottom: '15px',
                    fontFamily: 'serif',
                    color: 'darkgray',
                  }}
                >
                  {mostraDettagliSpunte &&
                  form.checklist?.[voce]?.fatto &&
                  form.checklist[voce].utente
                    ? `- Spuntato da ${form.checklist[voce].utente} il ${new Date(
                        form.checklist[voce].timestamp
                      ).toLocaleString('it-IT')}`
                    : ''}
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
                <div
                  style={{
                    marginTop: '5px',
                    marginBottom: '15px',
                    fontFamily: 'serif',
                    color: 'darkgray',
                  }}
                >
                  {mostraDettagliSpunte &&
                  form.checklist?.[voce]?.fatto &&
                  form.checklist[voce].utente
                    ? `- Spuntato da ${form.checklist[voce].utente} il ${new Date(
                        form.checklist[voce].timestamp
                      ).toLocaleString('it-IT')}`
                    : ''}
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
                <div
                  style={{
                    marginTop: '5px',
                    marginBottom: '15px',
                    fontFamily: 'serif',
                    color: 'darkgray',
                  }}
                >
                  {mostraDettagliSpunte &&
                  form.checklist?.[voce]?.fatto &&
                  form.checklist[voce].utente
                    ? `- Spuntato da ${form.checklist[voce].utente} il ${new Date(
                        form.checklist[voce].timestamp
                      ).toLocaleString('it-IT')}`
                    : ''}
                </div>
              </label>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-column-center">
        {/* ✅ IMMAGINI */}
        <h1>IMMAGINI</h1>
        {editable && <input type="file" className="container w-fit" onChange={handleFileChange} />}
        <h1 style={{ marginTop: 10 }}>immagini caricate</h1>
        <div
          className="container w-fit"
          style={{ border: 'solid 1px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}
        >
          {immagini.map((img, index) => (
            <div key={img.id || index} style={{ position: 'relative' }}>
              <img
                src={`${FILE_BASE_URL}${img.url}`}
                alt={`Immagine ${index + 1}`}
                style={{ width: '150px', height: 'auto', borderRadius: '8px', cursor: 'pointer' }}
                onClick={() => setImmagineSelezionata(`${FILE_BASE_URL}${img.url}`)}
              />
              {editable && (
                <button
                  onClick={async () => {
                    try {
                      await deleteImmagineScheda(img.id);
                      setImmagini((prev) => prev.filter((i) => i.id !== img.id));
                    } catch (error) {
                      console.error('Errore eliminazione immagine:', error);
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
          {immagini.length === 0 && (
            <div style={{ opacity: 0.6, padding: '8px 10px' }}>Nessuna immagine.</div>
          )}
        </div>
        {/* ✅ ALLEGATI */}
        <h1 style={{ marginTop: 20 }}>ALLEGATI</h1>
        {editable && (
          <input type="file" className="container w-fit" onChange={handleAllegatoChange} />
        )}
        <h1 style={{ marginTop: 10 }}>file caricati</h1>
        <div
          className="container w-fit"
          style={{ border: 'solid 1px', display: 'flex', flexDirection: 'column', gap: '8px' }}
        >
          {allegati.map((a) => {
            const url = `${FILE_BASE_URL}${a.url}`;
            const label = a.original_name || a.nome_file || 'allegato';

            return (
              <div
                key={a.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px',
                  padding: '6px 10px',
                  color: 'white',
                }}
              >
                <a
                  href={url}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    color: 'white',
                  }}
                >
                  {label}
                </a>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <a className="btn btn--blue btn--pill" href={url} download>
                    Download
                  </a>

                  {editable && (
                    <button
                      className="btn btn--danger btn--pill"
                      onClick={async () => {
                        try {
                          await deleteAllegatoScheda(a.id);
                          setAllegati((prev) => prev.filter((x) => x.id !== a.id));
                        } catch (error) {
                          console.error('Errore eliminazione allegato:', error);
                        }
                      }}
                    >
                      Elimina
                    </button>
                  )}
                </div>
              </div>
            );
          })}
          {allegati.length === 0 && (
            <div style={{ opacity: 0.6, padding: '8px 10px' }}>Nessun allegato.</div>
          )}
        </div>
        {/* Immagine ingrandita (modal) */}
        {immagineSelezionata && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0,0,0)',
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
              style={{ maxHeight: '70%', maxWidth: '70%', borderRadius: '12px' }}
            />
          </div>
        )}
        <button onClick={handleDownloadPdf} className="btn btn--blue w-200 btn--pill">
          Scarica PDF
        </button>

        <button className="btn btn--blue w-200 btn--pill" onClick={handleSubmit}>
          Salva
        </button>
      </div>
    </div>
  );
}

export default SchedaElettricoForm;
