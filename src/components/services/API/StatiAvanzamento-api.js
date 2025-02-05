
import axios from "axios";
// Configurazione base di Axios
const apiClient = axios.create({
  baseURL: process.env.REACT_APP_API_URL, // URL base dalla variabile di ambiente
  timeout: 10000, // Timeout di 10 secondi
});


// Funzione per ottenere gli stati di avanzamento
export const fetchStatiAvanzamento = async () => {
  try {
    const response = await apiClient.get("/api/stati-avanzamento");
    return response.data;
  } catch (error) {
    console.error("Errore durante il recupero degli stati di avanzamento:", error);
    throw error;
  }
};

// Funzione per creare uno stato avanzamento
export const createStatoAvanzamento = async (formData) => {
  try {
    const response = await apiClient.post("/api/stati-avanzamento", formData);
    return response.data;
  } catch (error) {
    console.error("Errore durante la creazione dello stato avanzamento:", error);
    throw error;
  }
};

// Funzione per aggiornare uno stato avanzamento
export const updateStatoAvanzamento = async (id, formData) => {
  try {
    const response = await apiClient.put(`/api/stati-avanzamento/${id}`, formData);
    return response.data;
  } catch (error) {
    console.error("Errore durante l'aggiornamento dello stato avanzamento:", error);
    throw error;
  }
};

// Funzione per eliminare uno stato avanzamento
export const deleteStatoAvanzamento = async (id) => {
  try {
    await apiClient.delete(`/api/stati-avanzamento/${id}`);
  } catch (error) {
    console.error("Errore durante l'eliminazione dello stato avanzamento:", error);
    throw error;
  }
};


// Funzione per aggiornare l'ordine di tutti gli stati per un reparto
export const ordinaStatiAvanzamento = async (id, repartoId, stati) => {
  try {
    const response = await apiClient.put(`/api/stati-avanzamento/${id}/reparti/${repartoId}/ordina-stati`, {
      stati,  // Stato atteso: un array di oggetti, ad esempio [{ stato_id: 4, ordine: 1 }, ...]
    });
    return response.data;
  } catch (error) {
    console.error("Errore durante l'ordinamento degli stati:", error);
    throw error;
  }
};

