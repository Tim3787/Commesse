
import axios from "axios";
// Configurazione base di Axios
const apiClient = axios.create({
  baseURL: process.env.REACT_APP_API_URL, // URL base dalla variabile di ambiente
  timeout: 10000, // Timeout di 10 secondi
});

console.log("Dati inviati:", { apiClient });  // Deve essere una stringa semplice


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
