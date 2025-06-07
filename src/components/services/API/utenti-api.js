
import axios from "axios";
// Configurazione base di Axios
const apiClient = axios.create({
  baseURL: process.env.REACT_APP_API_URL, // URL base dalla variabile di ambiente
    timeout: 15000, // Timeout di 15 secondi
});

export const fetchUsers = async () => {
  const response = await apiClient.get("/api/users");
  return response.data;
};

export const fetchUserName = async (token) => {
  try {
    const response = await apiClient.get("/api/users", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const decoded = JSON.parse(atob(token.split(".")[1])); // Decodifica il token
    const userId = decoded.id;
    const currentUser = response.data.find((user) => user.id === userId);
    return currentUser ? currentUser.username || "Utente" : "Utente";
  } catch (error) {
    console.error("Errore durante il recupero del nome utente:", error);
    throw error;
  }
};

export const fetchCurrentUser = async (token) => {
  try {
    const decoded = JSON.parse(atob(token.split(".")[1]));
    const userId = decoded.id;

    const users = await fetchUsers(); // usa la tua funzione esistente
    const currentUser = users.find((user) => user.id === userId);

    return currentUser || null;
  } catch (error) {
    console.error("Errore nel recupero dell'utente:", error);
    throw error;
  }
};

export const fetchRoles = async () => {
  const response = await apiClient.get("/api/users/roles");
  return response.data;
};

export const updateUserRole = async (userId, roleId, username, email, risorsaId) => {
  try {
    // Controllo parametri obbligatori
    if (!userId || !username || !email || !roleId || !risorsaId) {
      console.error("Parametri mancanti:", { userId, roleId, username, email, risorsaId });
      throw new Error("Parametri obbligatori mancanti per l'aggiornamento dell'utente.");
    }
    const response = await apiClient.put(`/api/users/${userId}`, {
      username,
      email,
      role_id: roleId,
      risorsa_id: risorsaId,
    });
    return response.data;
  } catch (error) {
    console.error("Errore durante l'aggiornamento del ruolo:", error);
    throw error;
  }
};


export const updateUsername = async (userId, roleId, username, email, risorsaId) => {
  try {
    // Controllo parametri obbligatori
    if (!userId || !username || !email || !roleId || !risorsaId) {
      console.error("Parametri mancanti:", { userId, roleId, username, email, risorsaId });
      throw new Error("Parametri obbligatori mancanti per l'aggiornamento dell'utente.");
    }

    // Esegui la richiesta PUT
    const response = await apiClient.put(`/api/users/${userId}`, {
      username,
      email: email,
      role_id: roleId,
      risorsa_id: risorsaId,
    });

    return response.data;
  } catch (error) {
    console.error("Errore durante l'aggiornamento dell'utente:", error);
    throw error;
  }
};


export const assignResourceToUser = async (userId, resourceId) => {
  const response = await apiClient.put(`/api/users/${userId}/assign-resource`, { risorsa_id: resourceId });
  return response.data;
};

export const deleteUser = async (userId) => {
  await apiClient.delete(`/api/users/${userId}`);
};

