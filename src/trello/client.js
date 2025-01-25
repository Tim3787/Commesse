const TRELLO_API_KEY = process.env.REACT_APP_TRELLO_API_KEY;
const TRELLO_TOKEN = process.env.REACT_APP_TRELLO_TOKEN;
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
            title: 'Aggiungi Etichetta',
            url: 'popup.html',
            
          });
        },
      },
    ];
  },
});
