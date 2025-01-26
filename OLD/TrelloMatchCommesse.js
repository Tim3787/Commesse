import React, { useEffect, useState } from "react";
import { getBoardCards, getBoardLists } from "../services/api";
import axios from "axios";

const MatchCommesse = () => {
  const [lists, setLists] = useState([]);
  const [cards, setCards] = useState([]);
  const [commesse, setCommesse] = useState([]);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedReparto, setSelectedReparto] = useState("software"); // Reparto selezionato

  // Mappa dei reparti ai rispettivi boardId
  const boardIds = {
    software: "606e8f6e25edb789343d0871",
    elettrico: "606e8f6e25edb789343d0872", // Sostituisci con l'ID reale
    meccanico: "606e8f6e25edb789343d0873", // Aggiungi altri reparti, se necessario
  };

  const apiUrl = process.env.REACT_APP_API_URL;

  // Funzione per recuperare i dati di Trello e delle commesse
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Recupera boardId del reparto selezionato
        const boardId = boardIds[selectedReparto];

        // Recupera le liste e le schede utilizzando le API
        const [boardLists, boardCards] = await Promise.all([
          getBoardLists(boardId),
          getBoardCards(boardId),
        ]);
        setLists(boardLists);
        setCards(boardCards);

        // Recupera le commesse dalla tua API
        const response = await axios.get(`${apiUrl}/api/commesse`);
        setCommesse(response.data);
        

        // Esegui il match tra Trello e le commesse
        const matchResults = matchCommesse(boardCards, response.data, boardLists);
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
  }, [selectedReparto]); // Ricarica i dati quando il reparto selezionato cambia

  const extractCommessaNumber = (trelloName) => {
    const match = trelloName.match(/^\d{5}/);
    return match ? match[0] : null;
  };

  const getListNameById = (listId) => {
    const list = lists.find((list) => list.id === listId);
    return list ? list.name : "Lista sconosciuta";
  };

  const matchCommesse = (boardCards, commesseApp, boardLists) => {
    const matches = [];
    const unmatchedTrello = [];
    const unmatchedApp = [...commesseApp];

    boardCards.forEach((card) => {
      const trelloNumero = extractCommessaNumber(card.name);
      const commessa = commesseApp.find((c) => c.numero_commessa === trelloNumero);

      if (commessa) {
        matches.push({
          id_trello_card: card.id,
          nome_trello_card: card.name,
          numero_commessa: trelloNumero,
          trello_due: card.due,
          trello_list: getListNameById(card.idList),
          app_list: commessa.lista || "Non assegnata",
          commessa_app: commessa,
        });

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

  return (
    <div>
      <h1>Match Commesse e Trello</h1>

      {/* Dropdown per selezionare il reparto */}
      <div>
        <label>
          Seleziona reparto:
          <select
            value={selectedReparto}
            onChange={(e) => setSelectedReparto(e.target.value)}
          >
            <option value="software">Software</option>
            <option value="elettrico">Elettrico</option>
            <option value="meccanico">Meccanico</option>
          </select>
        </label>
      </div>

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

              const isListDifferent =
                match.trello_list !== match.app_list;

              return (
                <div key={match.id_trello_card} style={styles.card}>
                  <p><strong>Trello:</strong></p>
                  <p><strong>Commessa:</strong> {match.nome_trello_card}</p>
                  <p><strong>Data di consegna Trello:</strong> {trelloDate}</p>
                  <p
                    style={{
                      color: isListDifferent ? "red" : "black",
                    }}
                  >
                    <strong>Lista Trello:</strong> {match.trello_list || "N/A"}
                  </p>
                  <p><strong>APP:</strong></p>
                  <p><strong>Commessa:</strong> {match.commessa_app.numero_commessa}</p>
                  <p><strong>Cliente:</strong> {match.commessa_app.cliente}</p>
                  <p><strong>Tipo Macchina:</strong> {match.commessa_app.tipo_macchina}</p>
                  <p
                    style={{
                      color: isDateDifferent ? "red" : "black",
                    }}
                  >
                    <strong>Data di consegna:</strong> {appDate}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

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
