
import axios from "axios";
// Configurazione base di Axios
const apiClient = axios.create({
  baseURL: process.env.REACT_APP_API_URL, // URL base dalla variabile di ambiente
    timeout: 15000, // Timeout di 15 secondi
});


export const updateActivityStatusAPI = async (activityId, newStatus, token) => {
  try {
    
    const response = await apiClient.put(
      `/api/notifiche/${activityId}/stato`,
      { stato: newStatus },
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Errore durante l'aggiornamento dello stato dell'attività:", error);
    throw error;
  }
};

export const updateActivityNotes = async (activityId, note, token) => {

  try {
    const response = await apiClient.put(
      `/api/notifiche/${activityId}/note`,
      { note },
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Errore durante l'aggiornamento delle note:", error);
    throw error;
  }
};


export const getNotificationPreferencesAPI = async (token) => {
  try {
    const response = await apiClient.get("/api/notifichePreferenze", {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data; // Array di { categoria, via_push, via_email }
  } catch (error) {
    console.error("Errore nel recupero delle preferenze notifiche:", error);
    throw error;
  }
};



export const saveNotificationPreferenceAPI = async (
  categoria,
  viaPush,
  viaEmail,
  token
) => {
  try {
    const response = await apiClient.post(
      "/api/notifichePreferenze",
      {
        categoria,
        via_push: viaPush,
        via_email: viaEmail,
      },
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Errore nel salvataggio delle preferenze:", error);
    throw error;
  }
};



export const deleteNotificationPreferenceAPI = async (categoria, token) => {
  try {
    const response = await apiClient.delete(
      `/api/notifichePreferenze/${encodeURIComponent(categoria)}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    return response.data;
  } catch (error) {
    console.error("Errore durante l'eliminazione della preferenza:", error);
    throw error;
  }
};

// 📥 Ottieni tutti i destinatari notifiche (admin)
export const getNotificationDestinatariAPI = async () => {
  try {
    const response = await apiClient.get("/api/notificheDestinatari");
    return response.data; // Array con id, categoria, id_utente, nome
  } catch (error) {
    console.error("Errore nel recupero dei destinatari notifiche:", error);
    throw error;
  }
};

// ➕ Salva nuove assegnazioni destinatari (admin)
export const saveNotificationDestinatariAPI = async (categoria, idUtenti) => {
  try {
    const response = await apiClient.post("/api/notificheDestinatari", {
      categoria,
      idUtenti,
    });
    return response.data; // newAssignments
  } catch (error) {
    console.error("Errore nel salvataggio destinatari notifiche:", error);
    throw error;
  }
};

// ❌ Elimina un destinatario da una categoria (admin)
export const deleteNotificationDestinatarioAPI = async (id) => {
  try {
    const response = await apiClient.delete(`/api/notificheDestinatari/${id}`);
    return response.data; // idEliminato
  } catch (error) {
    console.error("Errore nell'eliminazione del destinatario:", error);
    throw error;
  }
};



export const fetchCategorie = async () => {
  try {
    const response = await apiClient.get("/api/notifiche/categorie");
    return response.data;
  } catch (error) {
    console.error("Errore nel caricamento delle categorie:", error);
    throw error;
  }
};
