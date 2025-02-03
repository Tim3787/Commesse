
import axios from "axios";
// Configurazione base di Axios
const apiClient = axios.create({
  baseURL: process.env.REACT_APP_API_URL, // URL base dalla variabile di ambiente
  timeout: 10000, // Timeout di 10 secondi
});


// Funzione per ottenere le commesse
export const fetchCommesse = async () => {
  try {
    const response = await apiClient.get("/api/commesse");
    return response.data; 
  } catch (error) {
    console.error("Errore durante il recupero delle commesse:", error);
    throw error; 
  }
};

// Funzione per eliminare una commessa
export const deleteCommessa = async (commessaId) => {
  if (!commessaId) throw new Error("ID della commessa non valido.");
  await apiClient.delete(`/api/commesse/${commessaId}`);
  
};



// Funzione per ottenere le date dei FAT
export const fetchFATDates = async (token) => {
  try {
    const response = await apiClient.get("/api/commesse", {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data.filter((commessa) => commessa.data_FAT);
  } catch (error) {
    console.error("Errore durante il recupero delle commesse con FAT:", error);
    throw error;
  }
};
