
import axios from "axios";
// Configurazione base di Axios
const apiClient = axios.create({
  baseURL: process.env.REACT_APP_API_URL, // URL base dalla variabile di ambiente
    timeout: 15000, // Timeout di 15 secondi
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


// Funzione per ottenere le commesse associate a un tag specifico
export const CommesseByTag = async (tag) => {
  try {
    const response = await apiClient.get("/api/commesse/by-tag", {
      params: { tag }, // <-- qui passa il tag come query param
    });

    return response.data.filter((commessa) => commessa.data_FAT); // eventualmente filtraggio
  } catch (error) {
    console.error("Errore durante il recupero delle commesse con tag:", error);
    throw error;
  }
};

export const updateStatoAttualeReparto = async (commessaId, repartoId, statoId, isActive) => {
  try {
    await apiClient.put(`/api/commesse/${commessaId}/reparti/${repartoId}/stato`, {
      stato_id: statoId,
      is_active: isActive,
    });
  } catch (error) {
    console.error("Errore aggiornando lo stato attuale del reparto:", error);
    throw error;
  }
};

export const updateStatoCommessa = async (commessaId, statoId) => {
  try {
    await apiClient.put(`/api/commesse/${commessaId}/stato`, {
      stato_commessa: statoId,
    });
  } catch (error) {
    console.error("Errore aggiornando lo stato della commessa:", error);
    throw error;
  }
};

export const updateStatoDate = async (commessaId, repartoId, statoId, field, value) => {
  try {
    await apiClient.put(`/api/commesse/${commessaId}/reparti/${repartoId}/stato`, {
      stato_id: statoId,
      [field]: value,
    });
  } catch (error) {
    console.error("Errore aggiornando la data:", error);
    throw error;
  }
};

