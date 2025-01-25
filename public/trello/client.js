TrelloPowerUp.initialize({
  // Configurazione per aggiungere un pulsante alla scheda
  "card-buttons": function (t, options) {
    return [
      {
        icon: "https://cdn.glitch.com/1b42d7fe-bda8-4af8-a6c8-eff0cea9e08a%2Frocket-ship.png?1494946700421",
        text: "Aggiungi Card",
        callback: async function (t) {
          // Mostra un pop-up per l'input dell'utente
          return t.popup({
            title: "Aggiungi una scheda",
            url: "./add-card.html", // Pagina HTML per creare una card
            height: 200,
          });
        },
      },
    ];
  },

  // Configurazione per aggiungere badge alle schede
  "card-badges": async function (t, options) {
    const card = await t.card("id", "name"); // Ottieni i dettagli della scheda

    return [
      {
        text: "Custom Badge",
        color: "blue",
      },
    ];
  },
});

