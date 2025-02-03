import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import reportWebVitals from "./components/utils/reportWebVitals";
import { messaging } from "./firebase";  // Assicurati che il percorso sia corretto
import { getToken, onMessage } from "firebase/messaging";

const vapidKey = 'BEy_oianKnmIWUnHe-pmubXs0hXyeMeMdlFJeZ-KqMHSv6rfu1QizeAveFZSKgeuOFY6igPUXftwOeFgxPVchvs';

// Funzione per ottenere il token del dispositivo
getToken(messaging, { vapidKey })
  .then((currentToken) => {
    if (currentToken) {
      console.log("Token dispositivo:", currentToken);
      // Puoi inviare il token al backend per associarlo all'utente loggato.
    } else {
      console.error("Nessun token disponibile. Richiedi il permesso per le notifiche.");
    }
  })
  .catch((err) => {
    console.error("Errore durante l'ottenimento del token:", err);
  });

// Funzione per richiedere il permesso per le notifiche push
const requestNotificationPermission = async () => {
  try {
    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      console.log("Notifiche autorizzate.");
      const token = await getToken(messaging, { vapidKey });
      if (token) {
        console.log("Token dispositivo:", token);
      } else {
        console.error("Nessun token disponibile.");
      }
    } else {
      console.error("Permesso per le notifiche negato.");
    }
  } catch (error) {
    console.error("Errore nella richiesta di permesso:", error);
  }
};

if ("serviceWorker" in navigator) {
  navigator.serviceWorker
    .register(`${process.env.PUBLIC_URL}/firebase-messaging-sw.js`)
    .then((registration) => {
      console.log("Service Worker registrato con successo:", registration);
    })
    .catch((err) => {
      console.error("Errore durante la registrazione del Service Worker:", err);
    });
}

// Ascolta i messaggi in arrivo
onMessage(messaging, (payload) => {
  console.log("Messaggio ricevuto in foreground:", payload);
  alert(`Nuova notifica: ${payload.notification.title}`);
});

// Chiamata per richiedere il permesso all'avvio dell'app
requestNotificationPermission();

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);


fetch('http://il-tuo-backend.com/salva-token', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ token: currentToken }),
})
  .then(response => response.json())
  .then(data => console.log("Token salvato con successo:", data))
  .catch(err => console.error("Errore nel salvataggio del token:", err));


  
reportWebVitals();
