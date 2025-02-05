import { initializeApp } from "firebase/app";
import { getMessaging, getToken } from "firebase/messaging";

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

// Funzione per ottenere il token dispositivo
export const getDeviceToken = async () => {
  try {
    const token = await getToken(messaging, {
      vapidKey: "BEy_oianKnmIWUnHe-pmubXs0hXyeMeMdlFJeZ-KqMHSv6rfu1QizeAveFZSKgeuOFY6igPUXftwOeFgxPVchvs",
    });

    if (token) {

      return token;
    } else {
      console.error("Nessun token disponibile.");
      return null;
    }
  } catch (error) {
    console.error("Errore durante l'ottenimento del token dispositivo:", error);
    return null;
  }
};
// Esporta il servizio
export { app, messaging };
