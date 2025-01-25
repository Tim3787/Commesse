
import React, { useEffect, useState } from "react";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { getBoardCards, getBoardLists, moveCardToList } from "../API/trello";
import axios from "axios";

const TrelloBoardSoftware = () => {
  const [lists, setLists] = useState([]);
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingCard, setEditingCard] = useState(null);
  const handleEditCard = (card) => {
    console.log("Scheda in modifica:", card); // Log per debug
    setEditingCard(card);
  };
  
  const boardId = "606efd4d2898f5705163448f"; // Sostituisci con l'ID della tua board

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

    } catch (error) {
      console.error("Errore durante lo spostamento della scheda:", error);
    }
  };

  const handleEditSave = async (updatedCard) => {
    try {
      // Aggiorna la scheda nel backend
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
  
      // Aggiorna la scheda localmente
      setCards((prevCards) =>
        prevCards.map((card) =>
          card.id === updatedCard.id ? { ...card, ...updatedCard } : card
        )
      );
  
      // Chiudi il popup di modifica
      setEditingCard(null);
      console.log(`Scheda ${updatedCard.id} aggiornata con successo.`);
    } catch (error) {
      console.error("Errore durante l'aggiornamento della scheda:", error);
      alert("Non è stato possibile aggiornare la scheda. Riprova più tardi.");
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
          <List key={list.id} list={list} onCardDrop={handleCardDrop}   onEditCard={handleEditCard} />
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
          <Card key={card.id} card={card} onEdit={onEditCard} />
        ))}
      </div>
    </div>
  );
};


const Card = ({ card, onEdit }) => {
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
      <button onClick={() => onEdit(card)} style={styles.editButton}>
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
  // Converte la data nel formato compatibile con l'input datetime-local
  const formatDateForInput = (date) => {
    if (!date) return "";
    const localDate = new Date(date);
    return localDate.toISOString().slice(0, 16); // Prendi solo "yyyy-MM-ddThh:mm"
  };

  const [dueDate, setDueDate] = useState(formatDateForInput(card.due));

  const handleSave = () => {
    if (!dueDate) {
      alert("La data di scadenza non può essere vuota.");
      return;
    }

    // Converte il formato della data nel formato richiesto dall'API Trello
    const updatedCard = {
      ...card,
      due: new Date(dueDate).toISOString(), // Ripristina il formato ISO 8601
    };

    onSave(updatedCard);
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
    overflowY: "hidden", // Disabilita lo scroll verticale per la board
    height: "calc(100vh - 100px)", // Adatta l'altezza, escludendo eventuali header/footer
    boxSizing: "border-box", // Assicura che padding non ecceda l'altezza
  },
  list: {
    flex: "0 0 300px",
    background: "#f4f5f7",
    borderRadius: "5px",
    boxShadow: "0 2px 5px rgba(0, 0, 0, 0.1)",
    padding: "10px",
    height: "100%", // Adatta la lista all'altezza del contenitore
    overflowY: "auto", // Scroll verticale per il contenuto della lista
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
  popup: {
    position: "fixed",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    backgroundColor: "#fff",
    padding: "20px",
    borderRadius: "10px",
    boxShadow: "0 2px 10px rgba(0, 0, 0, 0.2)",
    zIndex: 1000,
    border: "2px solid red", // Aggiungi un bordo per debug
  },
  popupActions: {
    marginTop: "10px",
    display: "flex",
    gap: "10px",
  },
};

export default TrelloBoardSoftware;