import axios from "axios";

// Configurazione base di Axios
const apiClient = axios.create({
  baseURL: process.env.REACT_APP_API_URL,
  timeout: 15000,
});

// =============================
// API per SchedeMulti
// =============================

// Ottieni tutte le schede (filtrabili per tipo o commessa_id)
export const fetchSchedeMulti = async (params = {}) => {
  try {
    const response = await apiClient.get("/api/schede-multi", { params });
    return response.data;
  } catch (error) {
    console.error("Errore durante il recupero delle schede:", error);
    throw error;
  }
};

// Crea una nuova scheda
export const createSchedaMulti = async (formData) => {
  try {
    const response = await apiClient.post("/api/schede-multi", formData);
    return response.data;
  } catch (error) {
    console.error("Errore durante la creazione della scheda:", error);
    throw error;
  }
};

// =============================
// API per Note collegate a una scheda
// =============================

// Ottiene le note di una specifica scheda
export const fetchNoteScheda = async (schedaId) => {
  try {
    const response = await apiClient.get(`/api/schede-multi/${schedaId}/note`);
    return response.data;
  } catch (error) {
    console.error("Errore durante il recupero delle note:", error);
    throw error;
  }
};

// Aggiunge una nuova nota a una scheda
export const addNotaToScheda = async (schedaId, formData) => {
  try {
    const response = await apiClient.post(`/api/schede-multi/${schedaId}/note`, formData);
    return response.data;
  } catch (error) {
    console.error("Errore durante l'aggiunta della nota:", error);
    throw error;
  }
};

// Aggiorna una nota
export const updateNotaScheda = async (notaId, formData) => {
  try {
    const response = await apiClient.put(`/api/schede-multi/note/${notaId}`, formData);
    return response.data;
  } catch (error) {
    console.error("Errore durante l'aggiornamento della nota:", error);
    throw error;
  }
};

// Elimina una nota
export const deleteNotaScheda = async (notaId) => {
  try {
    await apiClient.delete(`/api/schede-multi/note/${notaId}`);
  } catch (error) {
    console.error("Errore durante l'eliminazione della nota:", error);
    throw error;
  }
};
// Ottieni i tipi di schede multi
export const fetchTipiSchedaMulti = async () => {
  try {
    const response = await apiClient.get("/api/schede-multi/tipi");
    return response.data;
  } catch (error) {
    console.error("Errore nel recupero dei tipi di schede multi:", error);
    throw error;
  }
};
// Aggiorna una scheda multi
export const updateSchedaMulti = async (id, formData) => {
  try {
    const response = await apiClient.put(`/api/schede-multi/${id}`, formData);
    return response.data;
  } catch (error) {
    console.error("Errore durante l'aggiornamento della scheda multi:", error);
    throw error;
  }
};
