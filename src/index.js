import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
import { initializeApp } from "firebase/app";
import { getMessaging, onMessage, getToken } from "firebase/messaging";

const firebaseConfig = {
  apiKey: "API_KEY",
  authDomain: "PROJECT_ID.firebaseapp.com",
  projectId: "PROJECT_ID",
  storageBucket: "PROJECT_ID.appspot.com",
  messagingSenderId: "SENDER_ID",
  appId: "APP_ID",
};

// Inizializza Firebase
const app = initializeApp(firebaseConfig);

// Inizializza Messaging
const messaging = getMessaging(app);

// Registra il Service Worker
if ("serviceWorker" in navigator) {
  navigator.serviceWorker
    .register(`${process.env.PUBLIC_URL}/firebase-messaging-sw.js`)
    .then((registration) => {
      console.log("Service Worker registrato con successo:", registration);
      messaging.useServiceWorker(registration);
    })
    .catch((err) => {
      console.error("Errore durante la registrazione del Service Worker:", err);
    });
}

// Richiedi il permesso per le notifiche
Notification.requestPermission()
  .then((permission) => {
    if (permission === "granted") {
      console.log("Notifiche autorizzate.");
      // Ottieni il token del dispositivo
      getToken(messaging, {
        vapidKey: "LA_TUA_CHIAVE_VAPID",
      })
        .then((currentToken) => {
          if (currentToken) {
            console.log("Token dispositivo:", currentToken);
          } else {
            console.error("Nessun token disponibile.");
          }
        })
        .catch((err) => {
          console.error("Errore durante l'ottenimento del token:", err);
        });
    } else {
      console.error("Permesso per le notifiche negato.");
    }
  })
  .catch((err) => console.error("Errore durante la richiesta di permesso:", err));

// Gestisci notifiche in arrivo
onMessage(messaging, (payload) => {
  console.log("Messaggio ricevuto in foreground:", payload);
  alert(`Nuova notifica: ${payload.notification.title}`);
});

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
