import React, { useEffect, useState } from "react";
import { getBoardCards } from "../services/api";
import axios from "axios";
import CommessaCrea from "../CommessaCrea";
import logo from "../assets/unitech-packaging.png";

const MatchCommesse = () => {
  const [cards, setCards] = useState([]);
  const [commesse, setCommesse] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedReparto, setSelectedReparto] = useState("software");
  const [showPopup, setShowPopup] = useState(false);
  const [selectedCommessa, setSelectedCommessa] = useState(null);
  const [filterCommessa, setFilterCommessa] = useState(""); // Stato per il filtro delle commesse

  const apiUrl = process.env.REACT_APP_API_URL;
  const boardIds = { software: "606e8f6e25edb789343d0871" };
  const today = new Date(); // Data di oggi

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const boardId = boardIds[selectedReparto];
        const [boardCards] = await Promise.all([getBoardCards(boardId)]);
        setCards(boardCards);
        setSelectedReparto;

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

  const extractCommessaNumber = (trelloName) => {
    const match = trelloName.match(/^\d{5}/);
    return match ? match[0] : null;
  };

  const extractClienteName = (trelloName) => {
    const match = trelloName.match(/^\d{5}\s*(.*)/);
    return match ? match[1].trim() : "";
  };

  const handleOpenPopup = (card) => {
    const numeroCommessa = extractCommessaNumber(card.name);
    const clienteName = extractClienteName(card.name);

    const commessaData = {
      numero_commessa: numeroCommessa,
      cliente: clienteName,
      data_consegna: card.due
        ? new Date(card.due).toISOString().split("T")[0]
        : null,
      note: card.desc || "",
    };

    setSelectedCommessa(commessaData);
    setShowPopup(true);
  };

  const handleClosePopup = () => {
    setShowPopup(false);
    setSelectedCommessa(null);
  };

  // Filtro per commessa
  const filteredCards = cards.filter((card) => {
    const trelloNumero = extractCommessaNumber(card.name);
    const matchesFilter = !filterCommessa || card.name.includes(filterCommessa);
    return (
      !commesse.find((c) => c.numero_commessa === trelloNumero) && matchesFilter
    );
  });

  // Separare le commesse in base alla data di consegna
  const pastOrTodayCards = filteredCards.filter((card) => {
    const cardDate = card.due ? new Date(card.due) : null;
    return cardDate && cardDate <= today; // Data di oggi o precedente
  });

  const futureCards = filteredCards.filter((card) => {
    const cardDate = card.due ? new Date(card.due) : null;
    return cardDate && cardDate > today; // Data futura
  });

  return (
    <div className="container-scroll">
      {loading && (
        <div className="loading-overlay">
          <img src={logo} alt="Logo" className="logo-spinner" />
        </div>
      )}
      <div className="header">
        <h1>Commesse esistenti solo su Trello</h1>
        <div style={{ marginBottom: "20px" }}>
          <label htmlFor="filterCommessa" style={{ marginRight: "10px" }}>
            Filtra per commessa:
          </label>
          <input
            id="filterCommessa"
            type="text"
            value={filterCommessa}
            onChange={(e) => setFilterCommessa(e.target.value)}
            placeholder="Inserisci numero commessa"
          />
        </div>
      </div>
      <div className="commessa-container">
      <div>
          <h2>Commesse con data di consegna futura</h2>
          {futureCards.map((card) => (
            <div
              key={card.id}
              style={{ padding: "20px", border: "1px solid #ccc", marginBottom: "10px" }}
              onDoubleClick={() => handleOpenPopup(card)}
            >
              <p>
                <strong>Commessa:</strong> {card.name}
              </p>
              <p>
                <strong>Data consegna:</strong>{" "}
                {card.due
                  ? new Date(card.due).toLocaleDateString()
                  : "Nessuna scadenza"}
              </p>
            </div>
          ))}
        </div>
        <div>
          <h2>Commesse con data di consegna fino a oggi</h2>
          {pastOrTodayCards.map((card) => (
            <div
              key={card.id}
              style={{ padding: "20px", border: "1px solid #ccc", marginBottom: "10px" }}
              onDoubleClick={() => handleOpenPopup(card)}
            >
              <p>
                <strong>Commessa:</strong> {card.name}
              </p>
              <p>
                <strong>Data consegna:</strong>{" "}
                {card.due
                  ? new Date(card.due).toLocaleDateString()
                  : "Nessuna scadenza"}
              </p>
            </div>
          ))}
        </div>

        
      </div>

      {showPopup && (
        <CommessaCrea
          commessa={selectedCommessa}
          onClose={handleClosePopup}
          isEditing={true}
          reparti={[]} // Puoi passare i reparti, se necessari
          attivita={[]} // Puoi passare le attività, se necessarie
          selezioniAttivita={{}}
          setSelezioniAttivita={() => {}}
          fetchCommesse={() => {}}
          stato={[]}
        />
      )}
    </div>
  );
};

export default MatchCommesse;
