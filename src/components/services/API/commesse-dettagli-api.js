import axios from 'axios';

// Configurazione base di Axios
const apiClient = axios.create({
  baseURL: process.env.REACT_APP_API_URL, // URL base dalla variabile di ambiente
  timeout: 15000, // Timeout di 15 secondi
});

// --- Macchine ---
export const getMacchine = async () => {
  try {
    const response = await apiClient.get('/api/commessa-dettagli/macchine');
    return response.data;
  } catch (error) {
    console.error('Errore durante il recupero delle macchine:', error);
    throw error;
  }
};

export const addMacchina = async (data) => {
  try {
    const response = await apiClient.post('/api/commessa-dettagli/macchine', data);
    return response.data;
  } catch (error) {
    console.error("Errore durante l'aggiunta della macchina:", error);
    throw error;
  }
};

export const updateMacchina = async (id, data) => {
  try {
    const response = await apiClient.put(`/api/commessa-dettagli/macchine/${id}`, data);
    return response.data;
  } catch (error) {
    console.error("Errore durante l'aggiornamento della macchina:", error);
    throw error;
  }
};

export const deleteMacchina = async (id) => {
  try {
    const response = await apiClient.delete(`/api/commessa-dettagli/macchine/${id}`);
    return response.data;
  } catch (error) {
    console.error("Errore durante l'eliminazione della macchina:", error);
    throw error;
  }
};

// --- Componenti ---
export const getComponenti = async () => {
  try {
    const response = await apiClient.get('/api/commessa-dettagli/componenti');
    return response.data;
  } catch (error) {
    console.error('Errore durante il recupero dei componenti:', error);
    throw error;
  }
};

export const addComponente = async (data) => {
  try {
    const response = await apiClient.post('/api/commessa-dettagli/componenti', data);
    return response.data;
  } catch (error) {
    console.error("Errore durante l'aggiunta del componente:", error);
    throw error;
  }
};

export const updateComponente = async (id, data) => {
  try {
    const response = await apiClient.put(`/api/commessa-dettagli/componenti/${id}`, data);
    return response.data;
  } catch (error) {
    console.error("Errore durante l'aggiornamento del componente:", error);
    throw error;
  }
};

export const deleteComponente = async (id) => {
  try {
    const response = await apiClient.delete(`/api/commessa-dettagli/componenti/${id}`);
    return response.data;
  } catch (error) {
    console.error("Errore durante l'eliminazione del componente:", error);
    throw error;
  }
};

// --- Associazioni: Commessa e Macchine (Commesse_Dettagli) ---

export const associateMacchineToCommessa = async (commessaId, macchina_ids) => {
  try {
    const response = await apiClient.post(
      `/api/commessa-dettagli/commesse/${commessaId}/macchine`,
      { macchina_ids }
    );
    return response.data;
  } catch (error) {
    console.error("Errore durante l'associazione delle macchine alla commessa:", error);
    throw error;
  }
};

export const getMacchineFromCommessa = async (commessaId) => {
  try {
    const response = await apiClient.get(`/api/commessa-dettagli/commesse/${commessaId}/macchine`);
    return response.data;
  } catch (error) {
    console.error('Errore durante il recupero delle macchine dalla commessa:', error);
    throw error;
  }
};

export const updateMacchineFromCommessa = async (commessaId, macchineArray) => {
  try {
    const response = await apiClient.put(`/api/commessa-dettagli/commesse/${commessaId}/macchine`, {
      macchine: macchineArray,
    });
    return response.data;
  } catch (error) {
    console.error("Errore durante l'aggiornamento delle macchine della commessa:", error);
    throw error;
  }
};

// --- Associazioni: Commessa e Componenti con Tipo Associato (Commesse_Componenti) ---
// Il payload atteso è un array di oggetti, per esempio:
// [
//   { componente_id: 1, tipo_associato: "1 motore" },
//   { componente_id: 2, tipo_associato: "2 motori" }
// ]
export const associateComponentiToCommessa = async (commessaId, componenti) => {
  try {
    const response = await apiClient.post(
      `/api/commessa-dettagli/commesse/${commessaId}/componenti`,
      { componenti }
    );
    return response.data;
  } catch (error) {
    console.error("Errore durante l'associazione dei componenti alla commessa:", error);
    throw error;
  }
};

export const getComponentiFromCommessa = async (commessaId) => {
  try {
    const response = await apiClient.get(
      `/api/commessa-dettagli/commesse/${commessaId}/componenti`
    );
    return response.data;
  } catch (error) {
    console.error('Errore durante il recupero dei componenti dalla commessa:', error);
    throw error;
  }
};

export const updateComponentiFromCommessa = async (commessaId, componenti) => {
  try {
    const response = await apiClient.put(
      `/api/commesse/${commessaId}/api/commessa-dettagli/componenti`,
      { componenti }
    );
    return response.data;
  } catch (error) {
    console.error("Errore durante l'aggiornamento dei componenti della commessa:", error);
    throw error;
  }
};
export const getComponentiFromMacchina = async (commessaId, macchinaId) => {
  try {
    const response = await apiClient.get(
      `/api/commessa-dettagli/commesse/${commessaId}/macchine/${macchinaId}/componenti`
    );
    return response.data;
  } catch (error) {
    console.error('Errore durante il recupero dei componenti dalla macchina:', error);
    throw error;
  }
};
export const associateComponentiToMacchina = async (commessaId, macchinaId, componenti) => {
  try {
    const response = await apiClient.post(
      `/api/commessa-dettagli/commesse/${commessaId}/macchine/${macchinaId}/componenti`,
      { componenti }
    );
    return response.data;
  } catch (error) {
    console.error("Errore durante l'associazione dei componenti alla macchina:", error);
    throw error;
  }
};
export const updateComponentiFromMacchina = async (commessaId, macchinaId, componenti) => {
  try {
    const response = await apiClient.put(
      `/api/commessa-dettagli/commesse/${commessaId}/macchine/${macchinaId}/componenti`,
      { componenti }
    );
    return response.data;
  } catch (error) {
    console.error("Errore durante l'aggiornamento dei componenti della macchina:", error);
    throw error;
  }
};
export const removeComponenteFromMacchina = async (commessaId, macchinaId, componenteId) => {
  try {
    const response = await apiClient.delete(
      `/api/commessa-dettagli/commesse/${commessaId}/macchine/${macchinaId}/componenti/${componenteId}`
    );
    return response.data;
  } catch (error) {
    console.error('Errore durante la rimozione del componente dalla macchina:', error);
    throw error;
  }
};
