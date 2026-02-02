import { useEffect, useState } from "react";
import { getAuthUser } from "../utils/auth";
import { getTagSuggeriti } from "../services/API/schedeTecniche-api";

export default function useTagAutocomplete({ enabled = true } = {}) {
  const [tagSuggeriti, setTagSuggeriti] = useState([]);
  const [suggestionsVisibili, setSuggestionsVisibili] = useState([]);
  const [filtroTag, setFiltroTag] = useState("");
  const [cursorPos, setCursorPos] = useState(null);

  useEffect(() => {
    if (!enabled) return;
    const u = getAuthUser();
    const reparto = (u?.reparto || "").toLowerCase();
    getTagSuggeriti({ reparto, includeGlobal: 1 }).then(setTagSuggeriti);
  }, [enabled]);

  const handleNoteChange = (testo, pos) => {
    setCursorPos(pos);

    const testoPrima = (testo || "").substring(0, pos);
    const match = testoPrima.match(/#([a-zA-Z0-9_]+)?$/);

    if (!match) {
      setSuggestionsVisibili([]);
      setFiltroTag("");
      return;
    }

    const raw = (match[1] || "").toLowerCase();

    // se ho appena scritto "#"
    if (!raw) {
      setSuggestionsVisibili(tagSuggeriti.slice(0, 5));
      setFiltroTag("");
      return;
    }

    // ✅ filtro SOLO su nome
    const filtrati = tagSuggeriti.filter((t) =>
      String(t?.nome || "").toLowerCase().startsWith(raw)
    );

    setSuggestionsVisibili(filtrati.slice(0, 5));
    setFiltroTag(match[1] || "");
  };

  const clearSuggestions = () => {
    setSuggestionsVisibili([]);
    setFiltroTag("");
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
