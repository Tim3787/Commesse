
import axios from "axios";
// Configurazione base di Axios
const apiClient = axios.create({
  baseURL: process.env.REACT_APP_API_URL, // URL base dalla variabile di ambiente
   timeout: 15000, // Timeout di 15 secondi
});

// Funzione per ottenere le attività programmate
export const fetchAttivitaCommessa = async () => {
  const response = await apiClient.get("/api/attivita_commessa");
  return response.data;
};

// Funzione per eliminare un'attività
export const deleteAttivitaCommessa = async (id, token) => {
  if (!id) {
    throw new Error("ID attività non valido.");
  }
  
  // Esegue la richiesta di DELETE, passando i headers nel secondo parametro
  await apiClient.delete(`/api/attivita_commessa/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
};

// ✅ Attività aperte della risorsa
export const fetchMyOpenActivities = async (token) => {
  const response = await apiClient.get("/api/attivita_commessa/me/aperte", {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

// ✅ Attività con note aperte
export const fetchMyOpenNotes = async (token) => {
  const response = await apiClient.get("/api/attivita_commessa/me/note-aperte", {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};
