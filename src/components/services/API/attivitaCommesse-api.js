
import axios from "axios";
// Configurazione base di Axios
const apiClient = axios.create({
  baseURL: process.env.REACT_APP_API_URL, // URL base dalla variabile di ambiente
  timeout: 10000, // Timeout di 10 secondi
});

// Funzione per ottenere le attività programmate
export const fetchAttivitaCommessa = async () => {
  const response = await apiClient.get("/api/attivita_commessa");
  return response.data;
};

// Funzione per eliminare un'attività
export const deleteAttivitaCommessa = async (id) => {
  if (!id) throw new Error("ID attività non valido.");
  await apiClient.delete(`/api/attivita_commessa/${id}`);
};
