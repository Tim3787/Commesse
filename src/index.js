import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import reportWebVitals from "./components/utils/reportWebVitals";
import { messaging } from "./components/services/firebase"; 
import { getToken, onMessage } from "firebase/messaging";


const vapidKey = 'BEy_oianKnmIWUnHe-pmubXs0hXyeMeMdlFJeZ-KqMHSv6rfu1QizeAveFZSKgeuOFY6igPUXftwOeFgxPVchvs';

// Funzione per richiedere il permesso per le notifiche
const requestNotificationPermission = async () => {
  try {
    const permission = await Notification.requestPermission();
    if (permission === "granted") {

      await getToken(messaging, { vapidKey });
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

  alert(`Nuova notifica: ${payload.notification.body}`);
});

requestNotificationPermission();

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

reportWebVitals();

