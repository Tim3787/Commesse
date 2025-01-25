import React, { useEffect, useState } from "react";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { getBoardCards, getBoardLists, moveCardToList } from "../API/trello";

const TrelloBoardSoftware = () => {
  const [lists, setLists] = useState([]);
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingCard, setEditingCard] = useState(null);

  const boardId = "606e8f6e25edb789343d0871"; // Sostituisci con l'ID della tua board

  // Recupera le liste e le schede della board
  useEffect(() => {
    const fetchBoardData = async () => {
      try {
        setLoading(true);

        // Recupera le liste e le schede utilizzando le API
        const [boardLists, boardCards] = await Promise.all([
          getBoardLists(boardId),
          getBoardCards(boardId),
        ]);
        setLists(boardLists);
        setCards(boardCards);
      } catch (err) {
        console.error("Errore durante il recupero dei dati della board:", err.message);
        setError("Errore durante il recupero dei dati.");
      } finally {
        setLoading(false);
      }
    };

    fetchBoardData();
  }, [boardId]);

  // Gestisce lo spostamento delle schede
  const handleCardDrop = async (card, targetListId) => {
    try {
      // Aggiorna localmente lo stato delle schede
      setCards((prevCards) =>
        prevCards.map((c) =>
          c.id === card.id ? { ...c, idList: targetListId } : c
        )
      );

      // Aggiorna nel backend tramite l'API
      await moveCardToList(card.id, targetListId);
      console.log(`Scheda ${card.id} spostata nella lista ${targetListId}`);
    } catch (error) {
      console.error("Errore durante lo spostamento della scheda:", error);
    }
  };

  const handleEditSave = async (updatedCard) => {
    try {
      // Aggiorna nel backend
      await axios.put(
        `https://api.trello.com/1/cards/${updatedCard.id}`,
        { due: updatedCard.due },
        {
          params: {
            key: process.env.REACT_APP_TRELLO_API_KEY,
            token: process.env.REACT_APP_TRELLO_TOKEN,
          },
        }
      );

      // Aggiorna lo stato locale
      setCards((prevCards) =>
        prevCards.map((card) =>
          card.id === updatedCard.id ? { ...card, ...updatedCard } : card
        )
      );

      setEditingCard(null); // Chiude il form di modifica
      console.log(`Scheda ${updatedCard.id} aggiornata con successo.`);
    } catch (error) {
      console.error("Errore durante l'aggiornamento della scheda:", error);
    }
  };

  const handleEditCancel = () => {
    setEditingCard(null); // Chiude il form di modifica
  };

  if (loading) return <p>Caricamento...</p>;
  if (error) return <p>{error}</p>;

  // Raggruppa le schede per lista
  const cardsByList = lists.map((list) => ({
    ...list,
    cards: cards.filter((card) => card.idList === list.id),
  }));

  return (
    <DndProvider backend={HTML5Backend}>
      <div style={styles.board}>
        {cardsByList.map((list) => (
          <List key={list.id} list={list} onCardDrop={handleCardDrop}  onEditCard={setEditingCard} />
        ))}
      </div>
      {editingCard && (
        <EditCardPopup
          card={editingCard}
          onSave={handleEditSave}
          onCancel={handleEditCancel}
        />
      )}

    </DndProvider>
  );
};

const List = ({ list, onCardDrop, onEditCard }) => {
  const [{ isOver }, drop] = useDrop(() => ({
    accept: "CARD",
    drop: (item) => onCardDrop(item, list.id),
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
    }),
  }));

  return (
    <div
      ref={drop}
      style={{
        ...styles.list,
        backgroundColor: isOver ? "#e0f7fa" : "#f4f5f7",
      }}
    >
      <h2 style={styles.listTitle}>{list.name}</h2>
      <div style={styles.cards}>
        {list.cards.map((card) => (
          <Card key={card.id} card={card} onEdit={() => onEditCard(card)} />
        ))}
      </div>
    </div>
  );
};

const Card = ({ card }) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: "CARD",
    item: card,
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }));

  return (
    <div
      ref={drag}
      style={{
        ...styles.card,
        opacity: isDragging ? 0.5 : 1,
        cursor: "move",
      }}
    >
      <h3>{card.name}</h3>
      <p>{card.desc || "Nessuna descrizione"}</p>
      <p>
        <strong>Scadenza:</strong>{" "}
        {card.due ? new Date(card.due).toLocaleString() : "Nessuna scadenza"}
      </p>
      <button onClick={onEdit} style={styles.editButton}>
        Modifica
      </button>
      <p>
        <strong>Etichette:</strong>{" "}
        {card.labels?.length > 0
          ? card.labels.map((label) => label.name).join(", ")
          : "Nessuna etichetta"}
      </p>
    </div>
  );
};
const EditCardPopup = ({ card, onSave, onCancel }) => {
  const [dueDate, setDueDate] = useState(card.due || "");

  const handleSave = () => {
    onSave({ ...card, due: dueDate });
  };

  return (
    <div style={styles.popup}>
      <h3>Modifica Scheda</h3>
      <label>
        Data di Scadenza:
        <input
          type="datetime-local"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
        />
      </label>
      <div style={styles.popupActions}>
        <button onClick={handleSave}>Salva</button>
        <button onClick={onCancel}>Annulla</button>
      </div>
    </div>
  );
};
const styles = {
  board: {
    display: "flex",
    gap: "20px",
    padding: "10px",
    overflowX: "auto",
  },
  list: {
    flex: "0 0 300px",
    borderRadius: "5px",
    padding: "10px",
    boxShadow: "0 2px 5px rgba(0, 0, 0, 0.1)",
    minHeight: "200px",
  },
  listTitle: {
    fontSize: "18px",
    fontWeight: "bold",
    marginBottom: "10px",
    color: "#0079bf",
  },
  cards: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },
  card: {
    background: "#fff",
    borderRadius: "5px",
    padding: "10px",
    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
  },
};

export default TrelloBoardSoftware;
