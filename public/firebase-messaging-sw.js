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
messaging.onBackgroundMessage((payload) => {
  console.log('Messaggio ricevuto in background:', payload);

  // Mostra la notifica solo se contiene il titolo e il corpo
  if (payload.notification) {
    const notificationTitle = payload.notification.title || "Nuova notifica";
    const notificationOptions = {
      body: payload.notification.body || "Hai un nuovo messaggio.",
      icon: '/logo192.png'
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
  } else {
    console.warn("Nessuna notifica da mostrare.");
  }
});

