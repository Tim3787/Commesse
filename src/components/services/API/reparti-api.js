
import axios from "axios";
// Configurazione base di Axios
const apiClient = axios.create({
  baseURL: process.env.REACT_APP_API_URL, // URL base dalla variabile di ambiente
  timeout: 10000, // Timeout di 10 secondi
});

// Funzione per ottenere i reparti
export const fetchReparti = async () => {
  try {
    const response = await apiClient.get("/api/reparti");
    return response.data;
  } catch (error) {
    console.error("Errore durante il recupero dei reparti:", error);
    throw error;
  }
};

// Funzione per creare un reparto
export const createReparto = async (formData) => {
  try {
    const response = await apiClient.post("/api/reparti", formData);
    return response.data;
  } catch (error) {
    console.error("Errore durante la creazione del reparto:", error);
    throw error;
  }
};

// Funzione per aggiornare un reparto esistente
export const updateReparto = async (id, formData) => {
  try {
    const response = await apiClient.put(`/api/reparti/${id}`, formData);
    return response.data;
  } catch (error) {
    console.error("Errore durante l'aggiornamento del reparto:", error);
    throw error;
  }
};

// Funzione per eliminare un reparto
export const deleteReparto = async (id) => {
  try {
    await apiClient.delete(`/api/reparti/${id}`);
  } catch (error) {
    console.error("Errore durante l'eliminazione del reparto:", error);
    throw error;
  }
};

