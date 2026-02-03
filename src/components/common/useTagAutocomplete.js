import { useEffect, useRef, useState } from 'react';
import { getAuthUser } from '../utils/auth';
import { getTagSuggeriti } from '../services/API/schedeTecniche-api';

const MAX = 15;

export default function useTagAutocomplete({ enabled = true } = {}) {
  const [tagSuggeriti, setTagSuggeriti] = useState([]);
  const [suggestionsVisibili, setSuggestionsVisibili] = useState([]);
  const [filtroTag, setFiltroTag] = useState('');
  const [cursorPos, setCursorPos] = useState(null);

  // 👇 salva l’ultimo testo (per ricalcolare quando arrivano i tag)
  const lastTextRef = useRef('');

  useEffect(() => {
    if (!enabled) return;
    const u = getAuthUser();
    const reparto = (u?.reparto || '').toLowerCase();
    getTagSuggeriti({ reparto, includeGlobal: 1 }).then(setTagSuggeriti);
  }, [enabled]);

  const recomputeSuggestions = (text, pos) => {
    const testoPrima = (text || '').substring(0, pos);
    const match = testoPrima.match(/#([a-zA-Z0-9_]+)?$/);

    if (!match) {
      setSuggestionsVisibili([]);
      setFiltroTag('');
      return;
    }

    const raw = (match[1] || '').toLowerCase();

    // se ho appena scritto "#"
    if (!raw) {
      setSuggestionsVisibili(tagSuggeriti.slice(0, MAX));
      setFiltroTag('');
      return;
    }

    const filtrati = tagSuggeriti.filter((t) =>
      String(t?.nome || '')
        .toLowerCase()
        .startsWith(raw)
    );

    setSuggestionsVisibili(filtrati.slice(0, MAX));
    setFiltroTag(match[1] || '');
  };

  const handleNoteChange = (testo, pos) => {
    lastTextRef.current = testo || '';
    setCursorPos(pos);
    recomputeSuggestions(testo, pos);
  };

  // ✅ quando arrivano i tag dal backend, ricalcola i suggerimenti
  useEffect(() => {
    if (!enabled) return;
    if (cursorPos == null) return;

    recomputeSuggestions(lastTextRef.current, cursorPos);
  }, [tagSuggeriti]);

  const clearSuggestions = () => {
    setSuggestionsVisibili([]);
    setFiltroTag('');
  };

  return {
    tagSuggeriti,
    suggestionsVisibili,
    filtroTag,
    cursorPos,
    handleNoteChange,
    clearSuggestions,
  };
}
