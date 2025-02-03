
import axios from "axios";
// Configurazione base di Axios
const apiClient = axios.create({
  baseURL: process.env.REACT_APP_API_URL, // URL base dalla variabile di ambiente
  timeout: 10000, // Timeout di 10 secondi
});



// Funzione per ottenere gli stati della commessa
export const fetchStatiCommessa = async () => {
  try {
    const response = await apiClient.get("/api/stato-commessa");
    return response.data;
  } catch (error) {
    console.error("Errore durante il recupero degli stati della commessa:", error);
    throw error;
  }
};

// Funzione per creare uno stato della commessa
export const createStatoCommessa = async (formData) => {
  try {
    const response = await apiClient.post("/api/stato-commessa", formData);
    return response.data;
  } catch (error) {
    console.error("Errore durante la creazione dello stato della commessa:", error);
    throw error;
  }
};

// Funzione per aggiornare uno stato della commessa
export const updateStatoCommessa = async (id, formData) => {
  try {
    const response = await apiClient.put(`/api/stato-commessa/${id}`, formData);
    return response.data;
  } catch (error) {
    console.error("Errore durante l'aggiornamento dello stato della commessa:", error);
    throw error;
  }
};

// Funzione per eliminare uno stato della commessa
export const deleteStatoCommessa = async (id) => {
  try {
    await apiClient.delete(`/api/stato-commessa/${id}`);
  } catch (error) {
    console.error("Errore durante l'eliminazione dello stato della commessa:", error);
    throw error;
  }
};


