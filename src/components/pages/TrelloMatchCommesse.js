import React, { useEffect, useState } from "react";
import { getBoardCards } from "../services/api";
import axios from "axios";
import CommessaCrea from "../CommessaCrea";

const MatchCommesse = () => {

  const [cards, setCards] = useState([]);
  const [commesse, setCommesse] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedReparto, setSelectedReparto] = useState("software");
  const [showPopup, setShowPopup] = useState(false);
  const [selectedCommessa, setSelectedCommessa] = useState(null);

  const apiUrl = process.env.REACT_APP_API_URL;
  const boardIds = { software: "606e8f6e25edb789343d0871" };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
  
        const boardId = boardIds[selectedReparto];
        const [ boardCards] = await Promise.all([
          getBoardCards(boardId),
        ]);
  
 
  

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
  

  const extractCommessaNumber = (trelloName) => {
    const match = trelloName.match(/^\d{5}/);

    return match ? match[0] : null;
  };
  

  const handleOpenPopup = (card) => {
  const numeroCommessa = extractCommessaNumber(card.name);


  const commessaData = {
    numero_commessa: numeroCommessa,
    cliente: "", // Personalizza se necessario
    data_consegna: card.due ? new Date(card.due).toISOString().split("T")[0] : null,
    note: card.desc || "",
  };

  console.log("Dati per la nuova commessa:", commessaData);

  setSelectedCommessa(commessaData);
  setShowPopup(true);
  setSelectedReparto;
};


  const handleClosePopup = () => {
    setShowPopup(false);
    setSelectedCommessa(null);
  };

  
  return (
    <div>
      <h1>Match Commesse e Trello</h1>
      {loading ? (
        <p>Caricamento...</p>
      ) : (
        <div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "20px" }}>
            {cards
              .filter((card) => {
                const trelloNumero = extractCommessaNumber(card.name);
                return !commesse.find((c) => c.numero_commessa === trelloNumero);
              })
              .map((card) => (
                <div
                  key={card.id}
                  style={{ padding: "20px", border: "1px solid #ccc" }}
                  onDoubleClick={() => handleOpenPopup(card)}
                >
                  <p><strong>Commessa:</strong> {card.name}</p>
                  <p><strong>Data consegna:</strong> {card.due ? new Date(card.due).toLocaleDateString() : "N/A"}</p>
                </div>
              ))}
          </div>
        </div>
      )}

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
