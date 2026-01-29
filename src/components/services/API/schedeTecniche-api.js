import axios from "axios";
// Configurazione base di Axios
const apiClient = axios.create({
  baseURL: process.env.REACT_APP_API_URL, // URL base dalla variabile di ambiente
  timeout: 15000, // Timeout di 15 secondi
});


export const fetchSchedeTecniche = async (commessaId = null) => {
    try {
  const url = commessaId ? `/api/schedeTecniche/${commessaId}/schede` : `/api/schedeTecniche`;
  const response = await apiClient.get(url);
  return response.data;
  } catch (error) {
    console.error("Errore durante il recupero delle schede:", error);
    throw error; 
  }
};

export const createSchedaTecnica = async ({
  commessa_id,
  tipo_id,
  creata_da,
  categoria = null,
  titolo = "",
  descrizione = null,
}) => {
  const response = await apiClient.post("/api/schedeTecniche", {
    commessa_id,
    tipo_id,
    creata_da,
    categoria,
    titolo,
    descrizione,
  });
  return response.data;
};



export const updateSchedaTecnica = async (id, schedaData) => {
  const response = await apiClient.put(`/api/schedeTecniche/${id}`, schedaData);
  return response.data;
};

export const deleteSchedaTecnica = async (id) => {
  await apiClient.delete(`/api/schedeTecniche/${id}`);
};

export const fetchModificheScheda = async (schedaId) => {
  const response = await apiClient.get(`/api/${schedaId}/modifiche`);
  return response.data;
};

export const getSchedaById = async (id) => {
  const response = await apiClient.get(`/api/schedeTecniche/${id}`);
  return response.data;
};

// ✅ Ottieni i tipi di scheda tecnica
export const fetchTipiSchedaTecnica = async () => {
  const res = await apiClient.get(`/api/schedeTecniche/tipiSchedaTecnica`);
  return res.data;
};

// ✅ Crea un nuovo tipo di scheda tecnica
export const createTipoSchedaTecnica = async (nome) => {
  const res = await apiClient.post(`/api/schedeTecniche/tipiSchedaTecnica`, { nome });
  return res.data;
};

// ✅ Aggiorna un tipo di scheda tecnica
export const updateTipoSchedaTecnica = async (id, nome) => {
  const res = await apiClient.put(`/api/schedeTecniche/tipiSchedaTecnica/${id}`, { nome });
  return res.data;
};

// ✅ Elimina un tipo di scheda tecnica
export const deleteTipoSchedaTecnica = async (id) => {
  const res = await apiClient.delete(`/api/schedeTecniche/tipiSchedaTecnica/${id}`);
  return res.data;
};

export const uploadImmagineScheda = async (file, scheda_id) => {
  const formData = new FormData();
  formData.append("image", file);
  formData.append("scheda_id", scheda_id);
  

  const response = await apiClient.post("/api/upload/upload-image", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
    
  });

  return response.data; // contiene ad esempio: { success: true, url: ..., filename: ... }
};

export const getImmaginiScheda = async (scheda_id) => {
  try {
    const response = await apiClient.get(`/api/upload/immagini/${scheda_id}`);
    return response.data.immagini || [];
  } catch (error) {
    console.error("Errore nel recupero immagini:", error);
    return [];
  }
};

export const deleteImmagineScheda = async (immagineId) => {
  const response = await fetch(`https://commesseunserver.eu/api/schedeTecniche/immagini/${immagineId}`, {
    method: 'DELETE',
    credentials: 'include', // se servono cookie/sessioni
  });
  if (!response.ok) throw new Error('Errore durante l’eliminazione dell’immagine');
  return response.json();
};

export async function getTagSuggeriti() {
  try {
    const response = await apiClient.get("/api/schedeTecniche/tag");
    return response.data; // ← axios fornisce direttamente i dati qui
  } catch (error) {
    console.error("Errore API getTagSuggeriti:", error);
    return [];
  }
}

