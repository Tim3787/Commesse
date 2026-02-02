import React from "react";

export default function TagSuggestions({
  visible,
  suggestions,
  noteText,
  cursorPos,
  filtroTag,
  onPick,
}) {
  if (!visible || !suggestions?.length) return null;

  return (
    <ul className="tag-suggestions">
      {suggestions.map((t) => (
        <li
          key={t.id}
          onMouseDown={(e) => {
            e.preventDefault();
            if (cursorPos == null) return;

            const testo = noteText || "";
            const inizio = testo.lastIndexOf(`#${filtroTag}`, cursorPos);
            if (inizio === -1) return;

            const fine = inizio + (filtroTag?.length || 0) + 1; // include '#'

            const nuovoTesto =
              testo.substring(0, inizio) +
              `#${t.nome} ` +
              testo.substring(fine);

            onPick(nuovoTesto);
          }}
        >
          #{t.nome}
        </li>
      ))}
    </ul>
  );
}
