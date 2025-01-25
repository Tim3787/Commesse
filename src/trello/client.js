// const TRELLO_API_KEY = process.env.REACT_APP_TRELLO_API_KEY;
// const TRELLO_TOKEN = process.env.REACT_APP_TRELLO_TOKEN;
// Chiavi API di Trello
const TRELLO_API_KEY = "92a08384395bfcb4e8b4068adf4b0334";
const TRELLO_TOKEN = "6e87b1d90570c101fad77ce36ad9529adbc6e9f16e7075fbf8020d6ff22aeba1";

console.log("API Key:", TRELLO_API_KEY);
console.log("Token:", TRELLO_TOKEN);
if (!TRELLO_API_KEY || !TRELLO_TOKEN) {
  console.error("API Key o Token non configurati correttamente.");
}

// Inizializza il Power-Up
TrelloPowerUp.initialize({
  
  'card-buttons': function (t, options) {
    return [
      {
        icon: 'https://cdn.glitch.me/sample-icon.png', // Sostituisci l'icona con una personalizzata
        text: 'TEST APP',
        callback: function (t) {
          return t.popup({
            title: 'TEST APP',
            url: 'popup.html',
            
          });
        },
      },
    ];
  },
});
