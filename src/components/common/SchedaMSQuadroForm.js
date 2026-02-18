// ===== IMPORT =====
import { useState, useEffect, useRef } from 'react';
import {
  uploadImmagineScheda,
  getImmaginiScheda,
  deleteImmagineScheda,
  updateTagsByNames,
  uploadAllegatoScheda,
  getAllegatiScheda,
  deleteAllegatoScheda,
} from '../services/API/schedeTecniche-api';
import html2pdf from 'html2pdf.js';
import { getAuthUser } from '../utils/auth';
import useTagAutocomplete from '../common/useTagAutocomplete';
import TagSuggestions from '../common/TagSuggestions';
import { extractHashtagsLower } from '../common/tagUtils';

import AllegatoPreviewModal from '../popup/AllegatoPreviewModal';

// ===== DATI STATICI / CONFIG =====

const vociChecklist1 = [
  'Verificare dati motore utilizzando il wizard inverter (prendere dati da targhetta motore)',
  'Verificare corretto dimensionamento inverter Braccio Avvolgitori 300 (vedi sezione info)',
  'Verificare presenza resistenze di frenatura e la rispettiva taglia (vedi sezione info)',
  'Verificare assorbimento massimo ( 100% del nominale)',
  'Verificare P2000 e P1082',
  'Caricare inverter',
];
const vociChecklist2 = [
  'Assegnare indirizzo IP',
  'Abilitare web server e vnc (Ehcolo)',
  'Caricare HMI ed effettuare sempre l’upgrade del firmware se richiesto',
];
const vociChecklist3 = ['Assegnare indirizzi profisafe alle schede'];

const vociChecklist4 = [
  'Verificare la configurazione dei trasporti',
  'Verificare la configurazione della macchina',
  'Verificare i rapporti di riduzione per i conteggi',
];

const inverterSiemens = [
  { motore: '1,1 kW', inverter: 'Siemens da 2,2 kW' },
  { motore: '1,5 kW', inverter: 'Siemens da 3 kW' },
  { motore: '2,2 kW', inverter: 'Siemens da 4 kW' },
];

const componentiSiemens = [
  {
    descrizione: 'Resistenza frenatura 370 Ohm 75W fino 1,5kW',
    marca: 'SIEMENS',
    articolo: '6SL32010BE143AA0',
    codice: '0050747',
  },
  {
    descrizione: 'Sinamics G120C 3x380-480V 0,55kW 6D.I. Profinet filtro cl.A FSAA',
    marca: 'SIEMENS',
    articolo: '6SL32101KE118AF2',
    codice: '0050745',
  },
  {
    descrizione: 'Sinamics G120C 3x380-480V 1,1kW 6D.I. Profinet filtro cl.A FSAA',
    marca: 'SIEMENS',
    articolo: '6SL32101KE132AF2',
    codice: '0051038',
  },
  {
    descrizione: 'Sinamics G120C 3x380-480V 1,5kW 6D.I. Profinet filtro cl.A FSAA',
    marca: 'SIEMENS',
    articolo: '6SL32101KE143AF2',
    codice: '0051039',
  },
  {
    descrizione: 'Resistenza frenatura 140 Ohm 200W fino 4kW',
    marca: 'SIEMENS',
    articolo: '6SL32010BE210AA0',
    codice: '0050748',
  },
  {
    descrizione: 'Sinamics G120C 3x380-480V 2,2kW 6D.I. Profinet filtro cl.A FSAA',
    marca: 'SIEMENS',
    articolo: '6SL32101KE158AF2',
    codice: '0051040',
  },
  {
    descrizione: 'Sinamics G120C 3x380-480V 3kW 6D.I. Profinet filtro cl.A',
    marca: 'SIEMENS',
    articolo: '6SL32101KE175AF1',
    codice: '0051162',
  },
  {
    descrizione: 'Sinamics G120C 3x380-480V 4kW 6D.I. Profinet filtro cl.A',
    marca: 'SIEMENS',
    articolo: '6SL32101KE188AF1',
    codice: '0051075',
  },
  {
    descrizione: 'Resistenza frenatura 75 Ohm 375W fino 7,5kW',
    marca: 'SIEMENS',
    articolo: '6SL32010BE218AA0',
    codice: '0051645',
  },
  {
    descrizione: 'Sinamics G120C 3x380-480V 5,5kW 6D.I. Profinet filtro cl.A',
    marca: 'SIEMENS',
    articolo: '6SL32101KE213AF1',
    codice: '0051165',
  },
  {
    descrizione: 'Sinamics G120C 3x380-480V 7,5kW 6D.I. Profinet filtro cl.A',
    marca: 'SIEMENS',
    articolo: '6SL32101KE217AF1',
    codice: '0051166',
  },
];

const normalizeChecklist = (rawChecklist) => {
  const normalized = {};
  for (const voce of Object.keys(rawChecklist || {})) {
    const valore = rawChecklist[voce];

    if (typeof valore === 'object' && valore !== null && ('fatto' in valore || 'na' in valore)) {
      normalized[voce] = {
        fatto: !!valore.fatto,
        na: !!valore.na,
        utente: valore.utente ?? null,
        timestamp: valore.timestamp ?? null,
      };
    } else {
      normalized[voce] = { fatto: !!valore, na: false, utente: null, timestamp: null };
    }

    // regola: se na=true allora fatto=false (coerenza)
    if (normalized[voce].na) normalized[voce].fatto = false;
  }
  return normalized;
};

// ===== COMPONENTE PRINCIPALE =====
function SchedaMSQuadroForm({ scheda, commessa, onSave, userId, editable, username }) {
  // ===== HOOK: REFS =====
  const schedaRef = useRef();
  const pdfRef = useRef(); // contiene solo la parte da esportare in PDF

  const textareaRef = useRef(null);

  // ===== HOOK: STATE =====
  const [mostraDettagliSpunte, setMostraDettagliSpunte] = useState(true);
  const [immagini, setImmagini] = useState([]);
  const [immagineSelezionata, setImmagineSelezionata] = useState(null);

  const [isVisibleInfo, setIsVisibleInfo] = useState(false);
  const [allegati, setAllegati] = useState([]);
  const FILE_BASE_URL = process.env.REACT_APP_API_URL?.replace(/\/$/, '') || '';
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewAllegato, setPreviewAllegato] = useState(null);

  // ===== FUNZIONI DI UTILITÀ =====
  const { suggestionsVisibili, filtroTag, cursorPos, handleNoteChange, clearSuggestions } =
    useTagAutocomplete({ enabled: editable });

  const autoResizeTextarea = () => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = 'auto';
      el.style.height = `${el.scrollHeight}px`;
    }
  };

  // ===== HOOK: FORM =====
  const [form, setForm] = useState({
    titolo: scheda?.intestazione?.titolo || '',
    RevSoftware: scheda?.intestazione?.RevSoftware || '',
    RevMacchina: scheda?.intestazione?.RevMacchina || '',
    RevSchema: scheda?.intestazione?.RevSchema || '',
    checklist: normalizeChecklist(scheda?.contenuto?.checklist || {}),
    note: scheda?.note || '',
  });
  useEffect(() => {
    if (!scheda) return;

    setForm({
      titolo: scheda?.intestazione?.titolo || '',
      RevSoftware: scheda?.intestazione?.RevSoftware || '',
      RevMacchina: scheda?.intestazione?.RevMacchina || '',
      RevSchema: scheda?.intestazione?.RevSchema || '',
      checklist: normalizeChecklist(scheda?.contenuto?.checklist || {}),
      note: scheda?.note || '',
    });

    clearSuggestions?.();
  }, [scheda?.id, scheda?.scheda_id]);

  // ===== EVENTI / HANDLERS =====

  const toggleVoce = (voce) => {
    setForm((prev) => {
      const voceCorrente = prev.checklist[voce] || {
        fatto: false,
        na: false,
        utente: null,
        timestamp: null,
      };

      // blocca se N/A attivo
      if (voceCorrente.na) return prev;

      // blocca se spuntato da altro utente
      if (voceCorrente.fatto && voceCorrente.utente !== username) return prev;

      const nuovoStato = !voceCorrente.fatto;

      return {
        ...prev,
        checklist: {
          ...prev.checklist,
          [voce]: {
            fatto: nuovoStato,
            na: false,
            utente: nuovoStato ? username : null,
            timestamp: nuovoStato ? new Date().toISOString() : null,
          },
        },
      };
    });
  };
  const toggleNA = (voce) => {
    setForm((prev) => {
      const voceCorrente = prev.checklist[voce] || {
        fatto: false,
        na: false,
        utente: null,
        timestamp: null,
      };

      // blocca se già spuntato da altro utente
      if (voceCorrente.fatto && voceCorrente.utente !== username) return prev;

      const nuovoNA = !voceCorrente.na;

      return {
        ...prev,
        checklist: {
          ...prev.checklist,
          [voce]: {
            fatto: false,
            na: nuovoNA,
            utente: nuovoNA ? username : null,
            timestamp: nuovoNA ? new Date().toISOString() : null,
          },
        },
      };
    });
  };

  const toggleSectionVisibilityInfo = () => {
    setIsVisibleInfo((prev) => !prev);
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
        titolo: form.titolo,
        RevSoftware: form.RevSoftware,
        RevMacchina: form.RevMacchina,
        RevSchema: form.RevSchema,
      },
      contenuto: { checklist: form.checklist },
      note: form.note,
      allegati_standard: [],
      risorsa_id: userId,
      descrizione: 'Modifica effettuata da interfaccia messa servizio',
    };

    try {
      const maybePromise = onSave?.(datiPerBackend);
      if (maybePromise && typeof maybePromise.then === 'function') {
        await maybePromise;
      }

      const names = extractHashtagsLower(form.note);

      // ✅ SEMPRE, anche se [] -> così pulisce
      await updateTagsByNames(schedaId, names, token);
    } catch (err) {
      console.error('Errore salvataggio scheda/tag:', {
        status: err?.response?.status,
        data: err?.response?.data,
        message: err?.message,
      });
      alert(
        err?.response?.data?.message ||
          err?.response?.data?.error ||
          `Errore salvataggio (status ${err?.response?.status || '?'})`
      );
    }
  };

  const filename = `Scheda servizio QE commessa:${commessa}.pdf`;
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
          pagebreak: { mode: ['css', 'legacy', 'avoid-all'] },
          html2canvas: {
            scale: 2,
            backgroundColor: null,
            useCORS: true,
            scrollY: 0,
            windowWidth: element.scrollWidth,
          },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        })
        .from(element)
        .save();
    } finally {
      element.classList.remove('pdf-dark-mode');
      element.classList.remove('pdf-exporting');
    }
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
    const raf = requestAnimationFrame(() => autoResizeTextarea());
    return () => cancelAnimationFrame(raf);
  }, [form.note]);

  // ===== FUNZIONI DI RENDER SUPPORTO =====

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
    // Contenitore che sarà usato per generare il PDF
    <div ref={pdfRef}>
      {/* Contenitore principale della scheda */}
      <div ref={schedaRef} className="flex-column-center">
        <h1>Scheda servizio QE commessa: {commessa}</h1>
        {/* Sezione revisioni */}
        <div className="flex-column-left">
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
        <button
          className="btn w-200 btn--shiny btn--pill"
          onClick={() => setMostraDettagliSpunte((prev) => !prev)}
        >
          {mostraDettagliSpunte ? 'Nascondi dettagli' : 'Mostra dettagli'}
        </button>

        {/* Dettagli su data creazione e autore */}
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

        {/* Checklist INVERTER */}
        <div className="flex-column-left">
          <h1>INVERTER</h1>
          {vociChecklist1.map((voce) => (
            <label key={voce} className="flex items-center check-row">
              <input
                type="checkbox"
                checked={form.checklist?.[voce]?.fatto || false}
                onChange={() => toggleVoce(voce)}
                disabled={!editable || form.checklist?.[voce]?.na}
              />
              <button
                type="button"
                className={`btn-na ${form.checklist?.[voce]?.na ? 'on' : ''}`}
                disabled={!editable}
                onClick={() => toggleNA(voce)}
              >
                N/A
              </button>
              {voce}
              <div
                style={{
                  marginTop: '5px',
                  marginBottom: '15px',
                  fontFamily: 'serif',
                  color: 'darkgray',
                }}
              >
                {mostraDettagliSpunte && form.checklist?.[voce]?.utente
                  ? form.checklist?.[voce]?.na
                    ? `- N/A impostato da ${form.checklist[voce].utente} il ${new Date(
                        form.checklist[voce].timestamp
                      ).toLocaleString('it-IT')}`
                    : form.checklist?.[voce]?.fatto
                      ? `- Spuntato da ${form.checklist[voce].utente} il ${new Date(
                          form.checklist[voce].timestamp
                        ).toLocaleString('it-IT')}`
                      : ''
                  : ''}
              </div>
            </label>
          ))}
        </div>

        {/* Checklist HMI */}
        <div className="flex-column-left">
          <h1>HMI</h1>
          {vociChecklist2.map((voce) => (
            <label key={voce} className="flex items-center check-row">
              <input
                type="checkbox"
                checked={form.checklist?.[voce]?.fatto || false}
                onChange={() => toggleVoce(voce)}
                disabled={!editable || form.checklist?.[voce]?.na}
              />
              <button
                type="button"
                className={`btn-na ${form.checklist?.[voce]?.na ? 'on' : ''}`}
                disabled={!editable}
                onClick={() => toggleNA(voce)}
              >
                N/A
              </button>
              {voce}
              <div
                style={{
                  marginTop: '5px',
                  marginBottom: '15px',
                  fontFamily: 'serif',
                  color: 'darkgray',
                }}
              >
                {mostraDettagliSpunte && form.checklist?.[voce]?.utente
                  ? form.checklist?.[voce]?.na
                    ? `- N/A impostato da ${form.checklist[voce].utente} il ${new Date(
                        form.checklist[voce].timestamp
                      ).toLocaleString('it-IT')}`
                    : form.checklist?.[voce]?.fatto
                      ? `- Spuntato da ${form.checklist[voce].utente} il ${new Date(
                          form.checklist[voce].timestamp
                        ).toLocaleString('it-IT')}`
                      : ''
                  : ''}
              </div>
            </label>
          ))}
        </div>

        {/* Checklist MACCHINA */}
        <div className="flex-column-left">
          <h1>PLC</h1>
          {vociChecklist3.map((voce) => (
            <label key={voce} className="flex items-center check-row">
              <input
                type="checkbox"
                checked={form.checklist?.[voce]?.fatto || false}
                onChange={() => toggleVoce(voce)}
                disabled={!editable || form.checklist?.[voce]?.na}
              />
              <button
                type="button"
                className={`btn-na ${form.checklist?.[voce]?.na ? 'on' : ''}`}
                disabled={!editable}
                onClick={() => toggleNA(voce)}
              >
                N/A
              </button>
              {voce}
              <div
                style={{
                  marginTop: '5px',
                  marginBottom: '15px',
                  fontFamily: 'serif',
                  color: 'darkgray',
                }}
              >
                {mostraDettagliSpunte && form.checklist?.[voce]?.utente
                  ? form.checklist?.[voce]?.na
                    ? `- N/A impostato da ${form.checklist[voce].utente} il ${new Date(
                        form.checklist[voce].timestamp
                      ).toLocaleString('it-IT')}`
                    : form.checklist?.[voce]?.fatto
                      ? `- Spuntato da ${form.checklist[voce].utente} il ${new Date(
                          form.checklist[voce].timestamp
                        ).toLocaleString('it-IT')}`
                      : ''
                  : ''}
              </div>
            </label>
          ))}
        </div>

        {/* Checklist MACCHINA */}
        <div className="flex-column-left">
          <h1>MACCHINA</h1>
          {vociChecklist4.map((voce) => (
            <label key={voce} className="flex items-center check-row">
              <input
                type="checkbox"
                checked={form.checklist?.[voce]?.fatto || false}
                onChange={() => toggleVoce(voce)}
                disabled={!editable || form.checklist?.[voce]?.na}
              />
              <button
                type="button"
                className={`btn-na ${form.checklist?.[voce]?.na ? 'on' : ''}`}
                disabled={!editable}
                onClick={() => toggleNA(voce)}
              >
                N/A
              </button>
              {voce}
              <div
                style={{
                  marginTop: '5px',
                  marginBottom: '15px',
                  fontFamily: 'serif',
                  color: 'darkgray',
                }}
              >
                {mostraDettagliSpunte && form.checklist?.[voce]?.utente
                  ? form.checklist?.[voce]?.na
                    ? `- N/A impostato da ${form.checklist[voce].utente} il ${new Date(
                        form.checklist[voce].timestamp
                      ).toLocaleString('it-IT')}`
                    : form.checklist?.[voce]?.fatto
                      ? `- Spuntato da ${form.checklist[voce].utente} il ${new Date(
                          form.checklist[voce].timestamp
                        ).toLocaleString('it-IT')}`
                      : ''
                  : ''}
              </div>
            </label>
          ))}
        </div>

        {/* NOTE */}
        <div className="note-page">
          <h1 className="note-title">Note</h1>
          <textarea
            name="note"
            className="w-w note-textarea"
            ref={textareaRef}
            value={form.note}
            readOnly={!editable}
            disabled={!editable}
            onChange={(e) => {
              const testo = e.target.value;
              const pos = e.target.selectionStart;

              setForm((prev) => ({ ...prev, note: testo }));
              handleNoteChange(testo, pos);
              autoResizeTextarea();
            }}
            onKeyDown={(e) => {
              if (e.key === 'Escape') clearSuggestions?.();
            }}
          />

          <div className="w-w note-print">{form.note}</div>
          {/* Suggerimenti tag visibili sotto il campo note */}
          {editable && (
            <TagSuggestions
              visible={suggestionsVisibili.length > 0}
              suggestions={suggestionsVisibili}
              noteText={form.note}
              cursorPos={cursorPos}
              filtroTag={filtroTag}
              onPick={(nuovoTesto) => {
                setForm((prev) => ({ ...prev, note: nuovoTesto }));
                clearSuggestions?.();
                requestAnimationFrame(() => {
                  autoResizeTextarea();
                  textareaRef.current?.focus();
                });
              }}
            />
          )}
        </div>
      </div>

      {/* Fine pdfRef: da qui in poi NON incluso nel PDF */}

      {/* Toggle sezione info */}
      <div className="flex-column-center">
        <button className="btn w-200 btn--shiny btn--pill" onClick={toggleSectionVisibilityInfo}>
          {isVisibleInfo ? '▼' : '▶'} {' Info'}
        </button>
      </div>

      {/* Sezione info estesa con tabelle */}
      {isVisibleInfo && (
        <div className="flex-column-center">
          <div className="header-row">
            <h1>INFORMAZIONI</h1>
          </div>
          {editable && renderTabellaInverterSiemens()}
          {editable && renderTabellaComponentiSiemens()}
        </div>
      )}

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
                <a href={url} target="_blank" rel="noreferrer" style={{ color: 'white' }}>
                  {label}
                </a>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    className="btn btn--shiny btn--pill"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setPreviewAllegato({ ...a, absoluteUrl: url, label });
                      setPreviewOpen(true);
                    }}
                  >
                    Preview
                  </button>

                  <a className="btn btn--blue btn--pill" href={url} download>
                    Download
                  </a>

                  {editable && (
                    <button
                      type="button"
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
        <AllegatoPreviewModal
          open={previewOpen}
          allegato={previewAllegato}
          onClose={() => {
            setPreviewOpen(false);
            setPreviewAllegato(null);
          }}
        />
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
export default SchedaMSQuadroForm;
