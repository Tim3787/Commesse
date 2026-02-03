import { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { updateTagsByNames } from '../services/API/schedeTecniche-api';
import { getAuthUser } from '../utils/auth';
import useTagAutocomplete from '../common/useTagAutocomplete';
import TagSuggestions from '../common/TagSuggestions';
import { extractHashtagsLower } from '../common/tagUtils';

function SchedaAppuntiForm({ scheda, commessa, onSave, userId, editable, username }) {
  const schedaRef = useRef();
  const textareaRef = useRef(null);

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

  const [form, setForm] = useState({
    checklist: normalizeChecklist(scheda?.contenuto?.checklist || {}),
    note: scheda?.note || '',
  });

  // IMPORTANTISSIMO: se cambia scheda, aggiorna form
  useEffect(() => {
    setForm({
      checklist: normalizeChecklist(scheda?.contenuto?.checklist || {}),
      note: scheda?.note || '',
    });

    clearSuggestions?.();
    requestAnimationFrame(autoResizeTextarea);
  }, [scheda?.id, scheda?.scheda_id]);

  const autoResizeTextarea = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  };

  useLayoutEffect(() => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => autoResizeTextarea());
    });
  }, [form.note]);

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
      contenuto: { checklist: form.checklist },
      note: form.note,
      allegati_standard: [],
      risorsa_id: userId,
      descrizione: 'Modifica appunti',
    };

    try {
      const maybePromise = onSave?.(datiPerBackend);
      if (maybePromise && typeof maybePromise.then === 'function') {
        await maybePromise;
      }

      const names = extractHashtagsLower(form.note);

      // ✅ chiama SEMPRE anche se [] -> così pulisce
      await updateTagsByNames(schedaId, names, token);
    } catch (err) {
      console.error('Errore salvataggio scheda/tag:', err);
    }
  };

  // --- PERMESSO: solo il creatore può modificare intestazione + note ---
  const createdBy = (scheda?.creato_da_nome || '').trim();
  const currentUser = (username || '').trim();

  const canEditHeaderAndNote =
    editable && createdBy && currentUser && createdBy.toLowerCase() === currentUser.toLowerCase();

  const { suggestionsVisibili, filtroTag, cursorPos, handleNoteChange, clearSuggestions } =
    useTagAutocomplete({ enabled: canEditHeaderAndNote });

  return (
    <div>
      <div ref={schedaRef} className="flex-column-center">
        <h1>Appunti commessa: {commessa}</h1>
        <div className="flex-column-left header-field">
          {/* STAMPA / PDF */}
          <div className="w-400 header-print only-print"></div>
        </div>
        {/* NOTE */}
        <div className="note-page">
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

                // opzionale ma utile: riporta focus sul textarea
                requestAnimationFrame(() => {
                  textareaRef.current?.focus();
                });
              }}
            />
          )}

          <div className="w-w note-print">{form.note}</div>
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
