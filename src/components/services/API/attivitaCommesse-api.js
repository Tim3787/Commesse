
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
// ✅ Attività aperte del reparto
export const fetchRepartoOpenActivities = async (repartoId, token) => {
  const response = await apiClient.get(
    `/api/attivita_commessa/reparto/${repartoId}/aperte`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );
  return response.data;
};

// ✅ Note aperte del reparto
export const fetchRepartoOpenNotes = async (repartoId, token) => {
  const response = await apiClient.get(
    `/api/attivita_commessa/reparto/${repartoId}/note-aperte`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );
  return response.data;
};

// ✅ Dashboard reparto completa (consigliato)
export const fetchRepartoDashboard = async (repartoId, token) => {
  const response = await apiClient.get(
    `/api/attivita_commessa/reparto/${repartoId}/dashboard`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );
  return response.data;
};

export const fetchOpenNotesByCommessaReparto = async (
  { commessa_id, reparto_id, exclude_id },
  token
) => {
  const res = await apiClient.get("/api/attivita_commessa/open-notes", {
    params: { commessa_id, reparto_id, exclude_id },
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data || [];
};

