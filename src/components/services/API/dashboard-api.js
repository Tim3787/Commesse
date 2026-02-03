import axios from 'axios';
// Configurazione base di Axios
const apiClient = axios.create({
  baseURL: process.env.REACT_APP_API_URL, // URL base dalla variabile di ambiente
  timeout: 15000, // Timeout di 15 secondi
});

export const fetchDashboardActivities = async (monthStartDate, token) => {
  try {
    const response = await apiClient.get('/api/users/dashboard', {
      headers: { Authorization: `Bearer ${token}` },
      params: { startDate: monthStartDate.toISOString() },
    });
    return response.data;
  } catch (error) {
    console.error('Errore durante il recupero delle attività mensili:', error);
    throw error;
  }
};
export const fetchDashboardActivityById = async (activityId, token) => {
  try {
    const response = await apiClient.get(`/api/users/dashboard/${activityId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error) {
    console.error('Errore durante il recupero dettaglio attività:', error);
    throw error;
  }
};
export const fetchDeptActivityById = async (repartoId, activityId, token) => {
  try {
    const response = await apiClient.get(
      `/api/users/reparto-dashboard/${repartoId}/activity/${activityId}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  } catch (error) {
    console.error('Errore durante il recupero dettaglio attività reparto:', error);
    throw error;
  }
};
