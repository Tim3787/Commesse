
import axios from "axios";
// Configurazione base di Axios
const apiClient = axios.create({
  baseURL: process.env.REACT_APP_API_URL, // URL base dalla variabile di ambiente
    timeout: 15000, // Timeout di 15 secondi
});


// Funzione per ottenere le risorse
export const fetchRisorse = async () => {
  try {
    const response = await apiClient.get("/api/risorse");
    return response.data;
  } catch (error) {
    console.error("Errore durante il recupero delle risorse:", error);
    throw error;
  }
};

// Funzione per creare una risorsa
export const createRisorsa = async (formData) => {
  try {
    const response = await apiClient.post("/api/risorse", formData);
    return response.data;
  } catch (error) {
    console.error("Errore durante la creazione della risorsa:", error);
    throw error;
  }
};

// Funzione per aggiornare una risorsa esistente
export const updateRisorsa = async (id, formData) => {
  try {
    const response = await apiClient.put(`/api/risorse/${id}`, formData);
    return response.data;
  } catch (error) {
    console.error("Errore durante l'aggiornamento della risorsa:", error);
    throw error;
  }
};

// Funzione per eliminare una risorsa
export const deleteRisorsa = async (id) => {
  try {
    await apiClient.delete(`/api/risorse/${id}`);
  } catch (error) {
    console.error("Errore durante l'eliminazione della risorsa:", error);
    throw error;
  }
};

