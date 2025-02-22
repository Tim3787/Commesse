
import axios from "axios";
// Configurazione base di Axios
const apiClient = axios.create({
  baseURL: process.env.REACT_APP_API_URL, // URL base dalla variabile di ambiente
  timeout: 10000, // Timeout di 10 secondi
});

console.log(`Server in esecuzione TEST21  ${ process.env.REACT_APP_API_URL}`);
// Funzione per ottenere le attività

export const fetchAttivita = async () => {
  const response = await apiClient.get("/api/attivita");
  return response.data;
};

  

// Funzione per eliminare un'attività
export const deleteAttivita= async (id) => {
  if (!id) throw new Error("ID attività non valido.");
  await apiClient.delete(`/api/attivita/${id}`);
};

// Funzione per creare una nuova attività
export const createAttivita = async (formData) => {
  try {
    const response = await apiClient.post("/api/attivita", formData);
    return response.data;
  } catch (error) {
    console.error("Errore durante la creazione dell'attività:", error);
    throw error;
  }
};

// Funzione per aggiornare un'attività esistente
export const updateAttivita = async (id, formData) => {
  try {
    const response = await apiClient.put(`/api/attivita/${id}`, formData);
    return response.data;
  } catch (error) {
    console.error("Errore durante l'aggiornamento dell'attività:", error);
    throw error;
  }
};
