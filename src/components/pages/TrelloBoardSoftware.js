import React, { useEffect, useState } from "react";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import { getBoardCards, getBoardLists, moveCardToList } from "../API/trello";

const TrelloBoardSoftware = () => {
  const [lists, setLists] = useState([]);
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const boardId = "606e8f6e25edb789343d0871"; // Sostituisci con l'ID della tua board

  useEffect(() => {
    const fetchBoardData = async () => {
      try {
        setLoading(true);

        // Recupera tutte le liste della board
        const boardLists = await getBoardLists(boardId);
        setLists(boardLists);

        // Recupera tutte le schede della board
        const boardCards = await getBoardCards(boardId);
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

  const handleDragEnd = async (result) => {
    console.log("handleDragEnd triggered:", result);
    const { destination, source, draggableId } = result;
    console.log(`Moving card ${draggableId} to list ${destinationListId}`);
    console.log("Drag Result:", result);
  
    if (!destination) {
      console.log("Elemento non rilasciato in una destinazione valida.");
      return;
    }
  
    console.log(
      `Spostando la scheda ${draggableId} da lista ${source.droppableId} a lista ${destination.droppableId}`
    );
  
    
    const destinationListId = destination.droppableId;
  
    const updatedCards = [...cards];
    const movedCardIndex = updatedCards.findIndex((card) => card.id === draggableId);
  
    if (movedCardIndex > -1) {
      updatedCards[movedCardIndex].idList = destinationListId;
      setCards(updatedCards);
  
      try {
        await moveCardToList(draggableId, destinationListId);
        console.log(`Scheda ${draggableId} aggiornata nel backend.`);
      } catch (error) {
        console.error("Errore durante lo spostamento della scheda:", error);
      }
    }
  };
  

  if (loading) return <p>Caricamento...</p>;
  if (error) return <p>{error}</p>;

  // Raggruppa le schede per lista
  const cardsByList = lists.map((list) => ({
    ...list,
    cards: cards.filter((card) => card.idList === list.id),
  }));

  return (
    <div>
      <h1>Bacheca Trello Software</h1>
      <DragDropContext onDragEnd={handleDragEnd}>
        <div style={styles.board}>
          {cardsByList.map((list) => (
           <Droppable droppableId={list.id.toString()} key={list.id}>
              {(provided) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  style={styles.list}
                >
                  <h2 style={styles.listTitle}>{list.name}</h2>
                  <div style={styles.cards}>
                    {list.cards.map((card, index) => (
                      <Draggable draggableId={card.id.toString()} index={index}>
                        {(provided) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            style={{
                              ...styles.card,
                              ...provided.draggableProps.style,
                            }}
                          >
                            <h3>{card.name}</h3>
                            <p>
                              <strong>Descrizione:</strong>{" "}
                              {card.desc || "Nessuna descrizione"}
                            </p>
                            <p>
                              <strong>Scadenza:</strong>{" "}
                              {card.due
                                ? new Date(card.due).toLocaleString()
                                : "Nessuna scadenza"}
                            </p>
                            <p>
                              <strong>Etichette:</strong>{" "}
                              {card.labels.length > 0
                                ? card.labels.map((label) => label.name).join(", ")
                                : "Nessuna etichetta"}
                            </p>
                            <a
                              href={card.url}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              Apri scheda
                            </a>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                </div>
              )}
            </Droppable>
          ))}
        </div>
      </DragDropContext>
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
    background: "#f4f5f7",
    borderRadius: "5px",
    boxShadow: "0 2px 5px rgba(0, 0, 0, 0.1)",
    padding: "10px",
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
