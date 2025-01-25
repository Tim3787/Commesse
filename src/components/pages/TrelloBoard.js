import React, { useEffect, useState } from "react";
import { getBoardCards } from "../api/trello";

const TrelloBoard = () => {
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const boardId = "id-della-board"; // Sostituisci con l'ID della tua board

  useEffect(() => {
    const fetchCards = async () => {
      try {
        setLoading(true);
        const data = await getBoardCards(boardId); // Chiama l'API
        setCards(data); // Aggiorna lo stato con le schede
      } catch (err) {
        setError("Errore durante il recupero delle schede.");
      } finally {
        setLoading(false);
      }
    };

    fetchCards();
  }, [boardId]);

  if (loading) return <p>Caricamento...</p>;
  if (error) return <p>{error}</p>;

  return (
    <div>
      <h1>Schede Trello</h1>
      <ul>
        {cards.map((card) => (
          <li key={card.id}>
            <strong>{card.name}</strong> - <a href={card.url}>Apri scheda</a>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default TrelloBoard;
