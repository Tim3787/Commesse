import React, { useEffect, useState } from "react";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { getBoardCards, getBoardLists, moveCardToList } from "../services/API/trello-api";
import axios from "axios";
import "react-toastify/dist/ReactToastify.css";
import { ToastContainer, toast } from "react-toastify";
import apiClient from "../config/axiosConfig";


const TrelloBoardElettrico = () => {
  const [lists, setLists] = useState([]);
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingCard, setEditingCard] = useState(null);
  const [commessaFilter, setCommessaFilter] = useState(""); // Stato per il filtro della commessa
const [commesse, setCommesse] = useState([]);
const [rawCards, setRawCards] = useState([]);


const RepartoID = 2;  


  const boardId = "606efd4d2898f5705163448f";

const extractCommessa = (name) => {
  // Match molto potente:
  //  - opzionale prefisso M- o R-
  //  - numeri
  //  - eventuale sotto-commessa tipo -25 o -2
  const match = name.match(/^(M-|R-)?\d{4,8}(-\d{1,3})?/i);

  return match ? match[0].toUpperCase() : null;
};



  // Carica commesse (con stati_avanzamento parsati)
  const fetchCommesse = async () => {
    try {
      const res = await apiClient.get("/api/commesse");

      const parsed = res.data.map((commessa) => ({
        ...commessa,
        stati_avanzamento:
          typeof commessa.stati_avanzamento === "string"
            ? JSON.parse(commessa.stati_avanzamento)
            : commessa.stati_avanzamento,
      }));

      setCommesse(parsed);
    } catch (err) {
      console.error("Errore caricamento commesse/stati", err);
    }
  };

  // Primo effetto: carica commesse + liste Trello + card grezze
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        await fetchCommesse();

        const [boardLists, boardCards] = await Promise.all([
          getBoardLists(boardId),
          getBoardCards(boardId),
        ]);

        setLists(boardLists);
        setRawCards(boardCards); // 👈 salviamo le card grezze
      } catch (err) {
        console.error("Errore durante il recupero dei dati:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [boardId]);

  // Secondo effetto: quando ho commesse + rawCards → calcolo statoReparto
  useEffect(() => {
    if (commesse.length === 0 || rawCards.length === 0) return;

    const cardsWithState = rawCards.map((card) => {
      const numeroCommessa = extractCommessa(card.name);
      let statoReparto = null;

      if (numeroCommessa) {
     const commessa = commesse.find(
  (c) =>
    String(c.numero_commessa).trim().toUpperCase() ===
    String(numeroCommessa).trim().toUpperCase()
);


        if (commessa?.stati_avanzamento && Array.isArray(commessa.stati_avanzamento)) {
          // trova il blocco del reparto giusto
          const reparto = commessa.stati_avanzamento.find(
            (r) => r.reparto_id === RepartoID
          );

          // trova lo stato attivo
          const statoAttivo = reparto?.stati_disponibili?.find((s) => s.isActive);

          statoReparto = statoAttivo?.nome_stato || null;
        }
      }

      return { ...card, statoReparto };
    });

    setCards(cardsWithState);
  }, [commesse, rawCards, RepartoID]); // 👈 niente `cards` qui



  const handleCardDrop = async (card, targetListId) => {
    try {
      setCards((prevCards) =>
        prevCards.map((c) =>
          c.id === card.id ? { ...c, idList: targetListId } : c
        )
      );
      await moveCardToList(card.id, targetListId);
    } catch (error) {
      console.error("Errore durante lo spostamento della scheda:", error);
      toast.error("Errore durante lo spostamento della scheda:", error);
    }
  };

  const handleEditSave = async (updatedCard) => {
    try {
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

      setCards((prevCards) =>
        prevCards.map((card) =>
          card.id === updatedCard.id ? { ...card, ...updatedCard } : card
        )
      );

      setEditingCard(null);
    } catch (error) {
      console.error("Errore durante l'aggiornamento della scheda:", error);
      toast.error("Errore durante l'aggiornamento della scheda:", error);
    }
  };

  const handleEditCancel = () => {
    setEditingCard(null);
  };

  if (loading) return <p>Caricamento...</p>;


  // Filtra le schede in base al filtro della commessa
  const filteredCardsByList = lists.map((list) => ({
    ...list,
    cards: cards.filter(
      (card) =>
        card.idList === list.id &&
        (!commessaFilter || card.name.includes(commessaFilter)) // Filtro per commessa
    ),
  }));



return (
      
      <DndProvider backend={HTML5Backend}>
    <div className="page-wrapper">
      <ToastContainer position="top-left" autoClose={2000} hideProgressBar />
        {loading && (
          <div className="loading-overlay">
            <img src={logo} alt="Logo" className="logo-spinner" />
          </div>
        )}      
      {/* HEADER */}
      <div className=" header">
      <div className="flex-center header-row">
      <h1>BACHECA TRELLO ELETTRICO</h1>
        </div>
         <div className="flex-center header-row">
        <input
              id="commessaFilter"
              type="text"
              value={commessaFilter}
              onChange={(e) => setCommessaFilter(e.target.value)}
               placeholder="Filtra per commessa"
              className="w-200"
            />
          </div>
</div>
        <div className="Reparto-table-container mh-76">
        
        <div style={styles.board}>
          {filteredCardsByList.map((list) => (
            <List
              key={list.id}
              list={list}
              onCardDrop={handleCardDrop}
              onEditCard={setEditingCard}
            />
          ))}
        </div>
        {editingCard && (
          <EditCardPopup
            card={editingCard}
            onSave={handleEditSave}
            onCancel={handleEditCancel}
          />
        )}
      </div>
      </div>
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

  const isEmpty = !list.cards || list.cards.length === 0;
  const isCollapsed = isEmpty && !isOver; // vuota e non in hover

  return (
    <div
      ref={drop}
      style={{
        ...styles.list,
        // 👇 QUI override di flex, non solo width
        flex: isCollapsed ? "0 0 40px" : "0 0 300px",
        backgroundColor: isOver ? "#212838" : "#111827",
        border: "2px solid #fff",
        borderRadius: 8,
        boxShadow: "0 0 0 1px #fff inset",
        padding: isCollapsed ? 4 : 10,
        minHeight: 80,
        transition: "all 0.2s ease",
      }}
    >
      <h2
        style={{
          ...styles.listTitle,
          fontSize: isCollapsed ? 14 : 18,
          writingMode: isCollapsed ? "vertical-rl" : "horizontal-tb",
          textAlign: "center",
          marginBottom: isCollapsed ? 0 : 10,
          whiteSpace: "nowrap",
        }}
      >
        {list.name}
      </h2>

      {/* Quando è collassata non mostro le card */}
      {!isCollapsed && (
        <div style={styles.cards}>
          {list.cards.map((card) => (
            <Card key={card.id} card={card} onEdit={onEditCard} />
          ))}
        </div>
      )}

      {isEmpty && !isOver && (
        <div style={{ fontSize: 12, textAlign: "center", marginTop: 4 }}>
          Vuota
        </div>
      )}
      {isEmpty && isOver && (
        <div style={{ fontSize: 12, textAlign: "center", marginTop: 4 }}>
          Rilascia qui
        </div>
      )}
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

  if (!card) {
    console.error("Card undefined:", card);
    return null;
  }

  const stato = card?.statoReparto ?? null;

  return (
    <div
      ref={drag}
      style={{
        ...styles.card,
        opacity: isDragging ? 0.5 : 1,
        cursor: "move",
      }}
    >
      <h2>{card?.name || "Senza nome"}</h2>

      {/* Stato avanzamento reparto */}
      {stato && (
        <div style={styles.badge}>
          Stato su app: {stato}
        </div>
      )}

    </div>
  );
};


// Gli stili rimangono invariati
const styles = {
  filterContainer: {
    marginBottom: "20px",
    display: "flex",
    gap: "10px",
    alignItems: "center",
  },
  filterInput: {
    padding: "5px",
    fontSize: "16px",
    width: "200px",
  },
  board: {
    display: "flex",
    gap: "20px",
    padding: "10px",

  },
  list: {
    flex: "0 0 300px",
    background: "#111827",
    borderRadius: "5px",
    padding: "10px",
    boxShadow: "0 2px 5px rgba(0, 0, 0, 0.1)",
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
     background: "#233969ff",
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
  },
  popupActions: {
    marginTop: "10px",
    display: "flex",
    gap: "10px",
  },
  badge: {
  backgroundColor: "#4b5563",
  color: "white",
  padding: "4px 8px",
  borderRadius: "6px",
  fontSize: "12px",
  fontWeight: "bold",
  marginBottom: "8px",
  display: "inline-block",
},

};




export default TrelloBoardElettrico;
