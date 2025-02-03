import { initializeApp } from "firebase/app";
import { getMessaging } from "firebase/messaging/sw";

// Configurazione di Firebase
const firebaseConfig = {
  apiKey: "AIzaSyBx0gwLzC70YSKp-AgCQ5TBj38oREz6v-0",
  authDomain: "commesseun.firebaseapp.com",
  projectId: "commesseun",
  storageBucket: "commesseun.firebasestorage.app",
  messagingSenderId: "358807670062",
  appId: "1:358807670062:web:c55589f0d2ad8226113ebf",
  measurementId: "G-VSFPKH8QT3",
};

// Inizializza Firebase
const app = initializeApp(firebaseConfig);

// Ottieni un'istanza del servizio di messaggistica
const messaging = getMessaging(app);

// Esporta il servizio
export { app, messaging };
