
import axios from "axios";
// Configurazione base di Axios
const apiClient = axios.create({
  baseURL: process.env.REACT_APP_API_URL, // URL base dalla variabile di ambiente
  timeout: 10000, // Timeout di 10 secondi
});

/* ==============================
              UTENTI
                            ============================== */

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

export const fetchUsers = async () => {
  const response = await apiClient.get("/api/users");
  return response.data;
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



/* ==============================
              DASHBOARD
                            ============================== */

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

/* ==============================
              COMMESSE
                            ============================== */

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

/* ==============================
              STATO COMMESSA
                            ============================== */


// Funzione per ottenere gli stati della commessa
export const fetchStatiCommessa = async () => {
  try {
    const response = await apiClient.get("/api/stato-commessa");
    return response.data;
  } catch (error) {
    console.error("Errore durante il recupero degli stati della commessa:", error);
    throw error;
  }
};

// Funzione per creare uno stato della commessa
export const createStatoCommessa = async (formData) => {
  try {
    const response = await apiClient.post("/api/stato-commessa", formData);
    return response.data;
  } catch (error) {
    console.error("Errore durante la creazione dello stato della commessa:", error);
    throw error;
  }
};

// Funzione per aggiornare uno stato della commessa
export const updateStatoCommessa = async (id, formData) => {
  try {
    const response = await apiClient.put(`/api/stato-commessa/${id}`, formData);
    return response.data;
  } catch (error) {
    console.error("Errore durante l'aggiornamento dello stato della commessa:", error);
    throw error;
  }
};

// Funzione per eliminare uno stato della commessa
export const deleteStatoCommessa = async (id) => {
  try {
    await apiClient.delete(`/api/stato-commessa/${id}`);
  } catch (error) {
    console.error("Errore durante l'eliminazione dello stato della commessa:", error);
    throw error;
  }
};



/* ==============================
              ATTIVITA
                            ============================== */

// Funzione per ottenere le attività
export const fetchAttivita = async () => {
  const response = await apiClient.get("/api/attivita");
  return response.data;
};


// Funzione per eliminare un'attività
export const deleteAttivita= async (id) => {
  if (!id) throw new Error("ID attività non valido.");
  await apiClient.delete(`/api/attivita/${id}`);
};

// Funzione per creare una nuova attività
export const createAttivita = async (formData) => {
  try {
    const response = await apiClient.post("/api/attivita", formData);
    return response.data;
  } catch (error) {
    console.error("Errore durante la creazione dell'attività:", error);
    throw error;
  }
};

// Funzione per aggiornare un'attività esistente
export const updateAttivita = async (id, formData) => {
  try {
    const response = await apiClient.put(`/api/attivita/${id}`, formData);
    return response.data;
  } catch (error) {
    console.error("Errore durante l'aggiornamento dell'attività:", error);
    throw error;
  }
};

/* ==============================
              ATTIVITA COMMESSE
                            ============================== */

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


/* ==============================
              STATI AVANZAMENTO
                            ============================== */


// Funzione per ottenere gli stati di avanzamento
export const fetchStatiAvanzamento = async () => {
  try {
    const response = await apiClient.get("/api/stati-avanzamento");
    return response.data;
  } catch (error) {
    console.error("Errore durante il recupero degli stati di avanzamento:", error);
    throw error;
  }
};

// Funzione per creare uno stato avanzamento
export const createStatoAvanzamento = async (formData) => {
  try {
    const response = await apiClient.post("/api/stati-avanzamento", formData);
    return response.data;
  } catch (error) {
    console.error("Errore durante la creazione dello stato avanzamento:", error);
    throw error;
  }
};

// Funzione per aggiornare uno stato avanzamento
export const updateStatoAvanzamento = async (id, formData) => {
  try {
    const response = await apiClient.put(`/api/stati-avanzamento/${id}`, formData);
    return response.data;
  } catch (error) {
    console.error("Errore durante l'aggiornamento dello stato avanzamento:", error);
    throw error;
  }
};

// Funzione per eliminare uno stato avanzamento
export const deleteStatoAvanzamento = async (id) => {
  try {
    await apiClient.delete(`/api/stati-avanzamento/${id}`);
  } catch (error) {
    console.error("Errore durante l'eliminazione dello stato avanzamento:", error);
    throw error;
  }
};


/* ==============================
              REPARTI
                            ============================== */

// Funzione per ottenere i reparti
export const fetchReparti = async () => {
  try {
    const response = await apiClient.get("/api/reparti");
    return response.data;
  } catch (error) {
    console.error("Errore durante il recupero dei reparti:", error);
    throw error;
  }
};

// Funzione per creare un reparto
export const createReparto = async (formData) => {
  try {
    const response = await apiClient.post("/api/reparti", formData);
    return response.data;
  } catch (error) {
    console.error("Errore durante la creazione del reparto:", error);
    throw error;
  }
};

// Funzione per aggiornare un reparto esistente
export const updateReparto = async (id, formData) => {
  try {
    const response = await apiClient.put(`/api/reparti/${id}`, formData);
    return response.data;
  } catch (error) {
    console.error("Errore durante l'aggiornamento del reparto:", error);
    throw error;
  }
};

// Funzione per eliminare un reparto
export const deleteReparto = async (id) => {
  try {
    await apiClient.delete(`/api/reparti/${id}`);
  } catch (error) {
    console.error("Errore durante l'eliminazione del reparto:", error);
    throw error;
  }
};



/* ==============================
              RISORSE
                            ============================== */

// Funzione per ottenere le risorse
export const fetchRisorse = async () => {
  try {
    const response = await apiClient.get("/api/risorse");
    return response.data;
  } catch (error) {
    console.error("Errore durante il recupero delle risorse:", error);
    throw error;
  }
};

// Funzione per creare una risorsa
export const createRisorsa = async (formData) => {
  try {
    const response = await apiClient.post("/api/risorse", formData);
    return response.data;
  } catch (error) {
    console.error("Errore durante la creazione della risorsa:", error);
    throw error;
  }
};

// Funzione per aggiornare una risorsa esistente
export const updateRisorsa = async (id, formData) => {
  try {
    const response = await apiClient.put(`/api/risorse/${id}`, formData);
    return response.data;
  } catch (error) {
    console.error("Errore durante l'aggiornamento della risorsa:", error);
    throw error;
  }
};

// Funzione per eliminare una risorsa
export const deleteRisorsa = async (id) => {
  try {
    await apiClient.delete(`/api/risorse/${id}`);
  } catch (error) {
    console.error("Errore durante l'eliminazione della risorsa:", error);
    throw error;
  }
};


/* ==============================
              NOTIFICHE
                            ============================== */

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
  console.log("Dati inviati:", { activityId, note });
  console.log("Dati inviati:", { note });  // Deve essere una stringa semplice
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




/* ==============================
              TRELLO
                            ============================== */

// Funzione per ottenere le schede di una board
export const getBoardCards = async (boardId) => {
  try {
    const response = await axios.get(
      `https://api.trello.com/1/boards/${boardId}/cards`,
      {
        params: {
          key: process.env.REACT_APP_TRELLO_API_KEY,
          token: process.env.REACT_APP_TRELLO_TOKEN,
        },
      }
    );
    return response.data; // Restituisce i dati della risposta


  } catch (error) {
    console.error("Errore durante il recupero delle schede:", error);
    throw error;
  }
};


export const getBoardLists = async (boardId) => {
  const url = `https://api.trello.com/1/boards/${boardId}/lists?key=${process.env.REACT_APP_TRELLO_API_KEY}&token=${process.env.REACT_APP_TRELLO_TOKEN}`;
  try {
    const response = await axios.get(url);
    return response.data; // Restituisce le liste della board
  } catch (error) {
    console.error("Errore durante il recupero delle liste di Trello:", error);
    throw error;
  }
};

export const moveCardToList = async (cardId, destinationListId) => {
  const url = `https://api.trello.com/1/cards/${cardId}`;
  try {
    const response = await axios.put(
      url,
      { idList: destinationListId },
      {
        params: {
          key: process.env.REACT_APP_TRELLO_API_KEY,
          token: process.env.REACT_APP_TRELLO_TOKEN,
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error(
      `Errore durante lo spostamento della scheda ${cardId} nella lista ${destinationListId}:`,
      error
    );
    throw error;
  }
};
