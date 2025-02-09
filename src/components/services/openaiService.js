import axios from "axios";

const apiClient = axios.create({
  baseURL: "https://api.openai.com/v1",
  headers: {
    Authorization: `Bearer ${process.env.REACT_APP_OPENAI_API_KEY}`,
  },
});

export const fetchChatGPTResponse = async (userMessage) => {
  try {
    const response = await apiClient.post("/chat/completions", {
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: userMessage }],
      max_tokens: 150,
    });
    return response.data.choices[0].message.content;
  } catch (error) {
    if (error.response?.status === 429) {
      console.warn("Raggiunto limite di richieste. Attendi qualche secondo.");
      return "Limite di richieste raggiunto. Riprova più tardi.";
    } else {
      console.error("Errore durante la comunicazione con OpenAI:", error);
      return "Si è verificato un errore. Contatta l’amministratore.";
    }
  }
};
