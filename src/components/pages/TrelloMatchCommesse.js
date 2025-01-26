import React, { useEffect, useState } from "react";
import { getBoardCards } from "../services/api"; // Importa le funzioni per Trello
import axios from "axios";

const MatchCommesse = () => {
  const [trelloCards, setTrelloCards] = useState([]);
  const [commesse, setCommesse] = useState([]);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(false);

  const boardId = "606e8f6e25edb789343d0871"; // Sostituisci con il tuo ID della board Trello
  const apiUrl = process.env.REACT_APP_API_URL; // URL per la tua API delle commesse

  // Funzione per recuperare i dati di Trello e delle commesse
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Recupera le schede di Trello
        const trelloData = await getBoardCards(boardId);
        setTrelloCards(trelloData);

        // Recupera le commesse dalla tua API
        const response = await axios.get(`${apiUrl}/api/commesse`);
        setCommesse(response.data);

        // Esegui il match tra Trello e le commesse
        const matchResults = matchCommesse(trelloData, response.data);
        setMatches(matchResults.matches);

        console.log("Corrispondenze trovate:", matchResults.matches);
        console.log("Schede Trello senza corrispondenza:", matchResults.unmatchedTrello);
        console.log("Commesse senza corrispondenza:", matchResults.unmatchedApp);
      } catch (error) {
        console.error("Errore durante il recupero dei dati:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [boardId, apiUrl]);

  // Funzione per estrarre i primi 5 numeri dal nome della scheda Trello
  const extractCommessaNumber = (trelloName) => {
    const match = trelloName.match(/^\d{5}/);
    return match ? match[0] : null;
  };

  // Funzione per trovare il match tra le schede Trello e le commesse
  const matchCommesse = (trelloCards, commesseApp) => {
    const matches = [];
    const unmatchedTrello = [];
    const unmatchedApp = [...commesseApp]; // Copia delle commesse

    trelloCards.forEach((card) => {
      const trelloNumero = extractCommessaNumber(card.name);
      const commessa = commesseApp.find((c) => c.numero_commessa === trelloNumero);

      if (commessa) {
        matches.push({
          id_trello_card: card.id,
          nome_trello_card: card.name,
          numero_commessa: trelloNumero,
          trello_due: card.due, // Data di scadenza da Trello
          commessa_app: commessa,
        });

        // Rimuovi la commessa associata dall'elenco delle unmatched
        const index = unmatchedApp.findIndex((c) => c.numero_commessa === trelloNumero);
        if (index > -1) {
          unmatchedApp.splice(index, 1);
        }
      } else {
        unmatchedTrello.push(card);
      }
    });

    return { matches, unmatchedTrello, unmatchedApp };
  };

  // Rendi i risultati visibili
  return (
    <div>
      <h1>Match Commesse e Trello</h1>
      {loading ? (
        <p>Caricamento...</p>
      ) : (
        <div>
          <h2>Corrispondenze Trovate:</h2>
          <div style={styles.container}>
            {matches.map((match) => {
              const trelloDate = new Date(match.trello_due).toLocaleDateString();
              const appDate = match.commessa_app.data_consegna
                ? new Date(match.commessa_app.data_consegna).toLocaleDateString()
                : "Non specificata";

              const isDateDifferent =
                match.trello_due &&
                match.commessa_app.data_consegna &&
                new Date(match.trello_due).toLocaleDateString() !== appDate;

              return (
                <div key={match.id_trello_card} style={styles.card}>
                    <p>
                    <strong>Trello:</strong> 
                  </p>
                  <p>
                    <strong>Commessa:</strong> {match.nome_trello_card}
                  </p>
                  <p>
                    <strong>Data di consegna Trello:</strong> {trelloDate}
                  </p>
                  <strong>APP:</strong>
 
                  <p>
                    <strong>Commessa:</strong> {match.commessa_app.numero_commessa}
                  </p>
                  <p>
                    <strong>Cliente:</strong> {match.commessa_app.cliente}
                  </p>
                  <p>
                    <strong>Tipo Macchina:</strong> {match.commessa_app.tipo_macchina}
                  </p>
                  <p
                    style={{
                      color: isDateDifferent ? "red" : "black", // Colora in rosso se le date non corrispondono
                    }}
                  >
                    <strong>Data di consegna:</strong> {appDate}
                  </p>
                </div>
              );
            })}
          </div>

          <h2>Schede Trello senza corrispondenza:</h2>
          <ul>
            {trelloCards
              .filter((card) => !matches.find((match) => match.id_trello_card === card.id))
              .map((card) => (
                <li key={card.id}>{card.name}</li>
              ))}
          </ul>

          <h2>Commesse senza corrispondenza:</h2>
          <ul>
            {commesse
              .filter((c) => !matches.find((match) => match.commessa_app.id === c.id))
              .map((c) => (
                <li key={c.id}>
                  {c.numero_commessa} - {c.tipo_macchina}
                </li>
              ))}
          </ul>
        </div>
      )}
    </div>
  );
};

// Stili per il layout
const styles = {
  container: {
    display: "flex",
    flexWrap: "wrap",
    gap: "20px",
    marginTop: "20px",
  },
  card: {
    background: "#f9f9f9",
    border: "1px solid #ddd",
    borderRadius: "5px",
    padding: "15px",
    boxShadow: "0 2px 5px rgba(0, 0, 0, 0.1)",
    width: "300px",
  },
};

export default MatchCommesse;
