// Importa gli SDK di Firebase necessari
importScripts('https://www.gstatic.com/firebasejs/11.2.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/11.2.0/firebase-messaging-compat.js');

// Configura Firebase
firebase.initializeApp({
  apiKey: "AIzaSyBx0gwLzC70YSKp-AgCQ5TBj38oREz6v-0",
  authDomain: "commesseun.firebaseapp.com",
  projectId: "commesseun",
  storageBucket: "commesseun.firebasestorage.app",
  messagingSenderId: "358807670062",
  appId: "1:358807670062:web:c55589f0d2ad8226113ebf",
  measurementId: "G-VSFPKH8QT3"
});

// Inizializza il messaging
const messaging = firebase.messaging();

// Mostra la notifica quando arriva un messaggio in background
// Ascolta i messaggi in background
messaging.onBackgroundMessage((payload) => {


  // Definisci valori di fallback
  let notificationTitle = "Nuova notifica";
  let notificationBody = "Hai un nuovo messaggio.";
  const notificationIcon = "/unitech-packaging.png";

  // Verifica se è presente il campo 'notification'
  if (payload.notification) {
    notificationTitle = payload.notification.title || notificationTitle;
    notificationBody = payload.notification.body || notificationBody;
  } 
  // Altrimenti, controlla se esistono dati personalizzati in 'data'
  else if (payload.data) {
    notificationTitle = payload.data.title || notificationTitle;
    notificationBody = payload.data.body || notificationBody;
  } else {
    console.warn("Nessuna notifica da mostrare.");
    return; // Esci se non ci sono dati utili
  }

  // Mostra la notifica con i parametri definiti
  self.registration.showNotification(notificationTitle, {
    body: notificationBody,
    icon: notificationIcon,
  });
});

