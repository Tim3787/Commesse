
import axios from "axios";
// Configurazione base di Axios
const apiClient = axios.create({
  baseURL: process.env.REACT_APP_API_URL, // URL base dalla variabile di ambiente
  timeout: 10000, // Timeout di 10 secondi
});


export const fetchDashboardActivities = async (monthStartDate, token) => {
  try {
    const response = await apiClient.get("/api/users/dashboard", {
      headers: { Authorization: `Bearer ${token}` },
      params: { startDate: monthStartDate.toISOString() },
    });
    return response.data;
  } catch (error) {
    console.error("Errore durante il recupero delle attività mensili:", error);
    throw error;
  }
};
