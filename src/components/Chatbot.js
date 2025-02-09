import React from 'react';
import { ChatBot } from 'react-simple-chatbot';
import { ThemeProvider } from 'styled-components';

// Tema personalizzato per il chatbot
const theme = {
  background: '#f5f8fb',
  headerBgColor: '#2196f3',
  headerFontColor: '#fff',
  headerFontSize: '20px',
  botBubbleColor: '#2196f3',
  botFontColor: '#fff',
  userBubbleColor: '#fff',
  userFontColor: '#4a4a4a',
};

// Passaggi della conversazione
const steps = [
  {
    id: '1',
    message: 'Ciao! Come posso aiutarti oggi?',
    trigger: 'userOptions',
  },
  {
    id: 'userOptions',
    options: [
      { value: 'commessaStatus', label: 'Verifica stato commessa', trigger: 'askCommessaId' },
      { value: 'ritardo', label: 'Mostra ritardi', trigger: 'ritardoCommessa' },
      { value: 'altro', label: 'Altro', trigger: 'otherOptions' },
    ],
  },
  {
    id: 'askCommessaId',
    message: 'Inserisci l’ID della commessa:',
    trigger: 'getCommessaId',
  },
  {
    id: 'getCommessaId',
    user: true,
    trigger: 'fetchCommessaStatus',
  },
  {
    id: 'otherOptions',
    message: 'Puoi contattare il team tecnico per maggiori dettagli.',
    end: true,
  },
];

// Componente chatbot
const SimpleChatbot = () => (
  <ThemeProvider theme={theme}>
    <ChatBot steps={steps} />
  </ThemeProvider>
);

export default SimpleChatbot;
