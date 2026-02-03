import axios from 'axios';
// Configurazione base di Axios
const apiClient = axios.create({
  baseURL: process.env.REACT_APP_API_URL, // URL base dalla variabile di ambiente
  timeout: 15000, // Timeout di 15 secondi
});

// GET con filtri opzionali (cliente, reparto_id)
export const fetchClientiSpecifiche = async (filters = {}) => {
  const response = await apiClient.get('/api/clienti-specifiche', {
    params: filters,
  });
  return response.data;
};

// POST - crea nuova scheda
export const createClienteSpecifica = async (payload) => {
  const response = await apiClient.post('/api/clienti-specifiche', payload);
  return response.data;
};

// PUT - aggiorna scheda esistente
export const updateClienteSpecifica = async (id, payload) => {
  const response = await apiClient.put(`/api/clienti-specifiche/${id}`, payload);
  return response.data;
};

// DELETE (soft delete lato server)
export const disableClienteSpecifica = async (id) => {
  const response = await apiClient.delete(`/api/clienti-specifiche/${id}`);
  return response.data;
};

// DELETE HARD (cancellazione definitiva)
export const deleteClienteSpecifica = async (id) => {
  const response = await apiClient.delete(`/api/clienti-specifiche/${id}/hard`);
  return response.data;
};
