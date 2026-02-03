import { useState } from 'react';
import { fetchChatGPTResponse } from '../services/openaiService';

const ChatGPTChatbot = () => {
  const [userInput, setUserInput] = useState('');
  const [chatHistory, setChatHistory] = useState([
    { sender: 'bot', text: 'Ciao! Come posso aiutarti oggi?' },
  ]);

  const handleUserMessage = async () => {
    if (userInput.trim() === '') return;

    const newChatHistory = [...chatHistory, { sender: 'user', text: userInput }];
    setChatHistory(newChatHistory);
    setUserInput('');

    // Ottieni la risposta di ChatGPT
    const botResponse = await fetchChatGPTResponse(userInput);
    setChatHistory([...newChatHistory, { sender: 'bot', text: botResponse }]);
  };

  return (
    <div
      style={{ border: '1px solid #ccc', padding: '10px', borderRadius: '8px', maxWidth: '400px' }}
    >
      <h3>Chatbot GPT</h3>
      <div style={{ maxHeight: '300px', overflowY: 'auto', marginBottom: '10px' }}>
        {chatHistory.map((chat, index) => (
          <div
            key={index}
            style={{ margin: '5px 0', textAlign: chat.sender === 'user' ? 'right' : 'left' }}
          >
            <strong>{chat.sender === 'user' ? 'Tu' : 'Bot'}:</strong> {chat.text}
          </div>
        ))}
      </div>
      <input
        type="text"
        value={userInput}
        onChange={(e) => setUserInput(e.target.value)}
        placeholder="Scrivi un messaggio..."
        style={{ width: '80%', padding: '5px', marginRight: '5px' }}
      />
      <button onClick={handleUserMessage} style={{ padding: '5px 10px' }}>
        Invia
      </button>
    </div>
  );
};

export default ChatGPTChatbot;
