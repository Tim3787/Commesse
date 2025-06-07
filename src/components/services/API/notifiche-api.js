
import axios from "axios";
// Configurazione base di Axios
const apiClient = axios.create({
  baseURL: process.env.REACT_APP_API_URL, // URL base dalla variabile di ambiente
    timeout: 15000, // Timeout di 15 secondi
});


export const updateActivityStatusAPI = async (activityId, newStatus, token) => {
  try {
    
    const response = await apiClient.put(
      `/api/notifiche/${activityId}/stato`,
      { stato: newStatus },
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Errore durante l'aggiornamento dello stato dell'attività:", error);
    throw error;
  }
};

export const updateActivityNotes = async (activityId, note, token) => {

  try {
    const response = await apiClient.put(
      `/api/notifiche/${activityId}/note`,
      { note },
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Errore durante l'aggiornamento delle note:", error);
    throw error;
  }
};


