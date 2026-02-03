import axios from 'axios';
// Configurazione base di Axios
const apiClient = axios.create({
  baseURL: process.env.REACT_APP_API_URL, // URL base dalla variabile di ambiente
  timeout: 15000, // Timeout di 15 secondi
});

export const fetchPrenotazioniSale = async () => {
  try {
    const response = await apiClient.get('/api/sale-riunioni');
    return response.data;
  } catch (error) {
    console.error('Errore durante il recupero delle prenotazioni', error);
    throw error;
  }
};

export const PrenotaSale = async (formData) => {
  try {
    const response = await apiClient.post('/api/sale-riunioni', formData);
    return response.data;
  } catch (error) {
    console.error('Errore durante la creazione della prenotazione:', error);
    throw error;
  }
};

export const deletePrenotazioneSale = async (id) => {
  try {
    await apiClient.delete(`/api/sale-riunioni/${id}`);
  } catch (error) {
    console.error("Errore durante l'eliminazione della prenotazione", error);
    throw error;
  }
};

export const updatePrenotazioneSale = async (id, formData) => {
  try {
    const response = await apiClient.put(`/api/sale-riunioni/${id}`, formData);
    return response.data;
  } catch (error) {
    console.error("Errore durante l'aggiornamento della prenotazione", error);
    throw error;
  }
};
