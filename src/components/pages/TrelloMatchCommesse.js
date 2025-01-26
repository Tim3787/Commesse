import React, { useEffect, useState } from "react";
import { getBoardCards, getBoardLists } from "../services/api";
import axios from "axios";

const MatchCommesse = () => {
  const [lists, setLists] = useState([]);
  const [cards, setCards] = useState([]);
  const [commesse, setCommesse] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedReparto, setSelectedReparto] = useState("software");

  // Tabella di accoppiamento stati
  const accoppiamentoStati = {
    software: {
      "in entrata": "S: In entrata",
      "analisi": "S: Analisi",
      "sviluppo programmato": "S: Sviluppo programmato",
      "sviluppo": "S: In sviluppo",
      "collaudo": "S: Testing",
    },
    elettrico: {
      "in entrata": "E: In entrata",
      "cablaggio": "E: Wiring",
      "collaudo": "E: Testing",
    },
    meccanico: {
      "in entrata": "M: To Do",
      "progettazione": "M: Design",
      "assemblaggio": "M: Assembly",
    },
  };

  const boardIds = {
    software: "606e8f6e25edb789343d0871",
    elettrico: "606efd4d2898f5705163448f",
  };

  const apiUrl = process.env.REACT_APP_API_URL;

  // Funzione per ottenere gli stati attivi per una commessa
  const getStatiAttiviPerCommessa = (commessa) => {
    return commessa.stati_avanzamento
      ?.map((reparto) => {
        const statoAttivo = reparto.stati_disponibili.find((stato) => stato.isActive);
        return {
          reparto_nome: reparto.reparto_nome,
          stato: statoAttivo || null,
        };
      })
      .filter((reparto) => reparto.stato !== null) || [];
  };

  // Fetch dei dati iniziali
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        const boardId = boardIds[selectedReparto];
        const [boardLists, boardCards] = await Promise.all([
          getBoardLists(boardId),
          getBoardCards(boardId),
        ]);
        setLists(boardLists);
        setCards(boardCards);

        const response = await axios.get(`${apiUrl}/api/commesse`);
        const parsedCommesse = response.data.map((commessa) => ({
          ...commessa,
          stati_avanzamento: typeof commessa.stati_avanzamento === "string"
            ? JSON.parse(commessa.stati_avanzamento)
            : commessa.stati_avanzamento,
        }));

        setCommesse(parsedCommesse);
      } catch (error) {
        console.error("Errore durante il recupero dei dati:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedReparto]);

  // Helper per estrarre il numero della commessa
  const extractCommessaNumber = (trelloName) => {
    const match = trelloName.match(/^\d{5}/);
    return match ? match[0] : null;
  };

  // Helper per ottenere il nome della lista Trello
  const getListNameById = (listId) => {
    const list = lists.find((list) => list.id === listId);
    return list ? list.name : "Lista sconosciuta";
  };

  // Render delle card Trello
  return (
    <div>
      <h1>Match Commesse e Trello</h1>

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
          <h2>Schede Trello:</h2>
          <div style={styles.container}>
            {cards.map((card) => {
              const trelloNumero = extractCommessaNumber(card.name);
              const commessa = commesse.find((c) => c.numero_commessa === trelloNumero);

              const trelloListName = getListNameById(card.idList);

              const statiAttivi = commessa ? getStatiAttiviPerCommessa(commessa) : [];
              const statoAttivo = statiAttivi.find(
                (s) => s.reparto_nome.toLowerCase() === selectedReparto
              );

              const expectedList = statoAttivo?.stato?.nome_stato
                ? accoppiamentoStati[selectedReparto]?.[
                    statoAttivo.stato.nome_stato.trim().toLowerCase()
                  ] || "Non accoppiata"
                : "Non assegnata";

              const isListDifferent = trelloListName !== expectedList;

              const trelloDate = card.due
                ? new Date(card.due).toLocaleDateString()
                : "Non specificata";
              const appDate = commessa?.data_consegna
                ? new Date(commessa.data_consegna).toLocaleDateString()
                : "Non specificata";

              const isDateDifferent =
                card.due &&
                commessa?.data_consegna &&
                new Date(card.due).toLocaleDateString() !== appDate;

              return (
                <div key={card.id} style={styles.card}>
                  <p><strong>Trello:</strong></p>
                  <p><strong>Commessa:</strong> {card.name}</p>
                  <p><strong>Numero Commessa:</strong> {trelloNumero || "Nessuno"}</p>
                  <p><strong>Lista Trello:</strong> {trelloListName || "N/A"}</p>
                  <p style={{ color: isListDifferent ? "red" : "black" }}>
                    <strong>Lista APP per metch:</strong> {expectedList}
                  </p>
                  <p><strong>Data di consegna Trello:</strong> {trelloDate}</p>

                  {commessa && (
                    <div>
                      <p><strong>APP:</strong></p>
                      <p><strong>Commessa:</strong> {commessa.numero_commessa}</p>
                      <p><strong>Cliente:</strong> {commessa.cliente}</p>
                      <p><strong>Tipo Macchina:</strong> {commessa.tipo_macchina}</p>
                      <p><strong>Stato avanzamento:</strong> {statoAttivo?.stato?.nome_stato || "Non assegnato"}</p>
                      <p style={{ color: isDateDifferent ? "red" : "black" }}>
                        <strong>Data di consegna APP:</strong> {appDate}
                      </p>
                    </div>
                  )}
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
    borderRadius: "10px",
    padding: "15px",
    boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
    width: "300px",
    transition: "transform 0.2s",
  },
};

export default MatchCommesse;
