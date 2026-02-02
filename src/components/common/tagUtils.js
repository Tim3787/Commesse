export const tagToTextRaw = (t) => {
  const pref = (t?.prefisso || "").trim();
  const nome = (t?.nome || "").trim();
  if (!nome) return "";
  return pref ? `${pref}_${nome}` : nome;
};

export const tagToTextLower = (t) => tagToTextRaw(t).toLowerCase();

export const extractHashtagsLower = (text) => {
  const tagRegex = /#([a-zA-Z0-9_]+)/g;
  const rawNames = new Set();
  let m;
  while ((m = tagRegex.exec(text || "")) !== null) {
    rawNames.add(String(m[1] || "").toLowerCase());
  }
  return [...rawNames];
};
