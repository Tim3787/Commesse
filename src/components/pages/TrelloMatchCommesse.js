import React, { useEffect, useState } from "react";
import { getBoardCards } from "../services/api";
import axios from "axios";
import CommessaCrea from "../CommessaCrea";
import logo from"../assets/unitech-packaging.png";
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
  
  const extractClienteName = (trelloName) => {
    const match = trelloName.match(/^\d{5}\s*(.*)/); // Estrae tutto ciò che segue i primi 5 numeri
    return match ? match[1].trim() : ""; // Rimuove spazi aggiuntivi
  };
  
  const handleOpenPopup = (card) => {
  const numeroCommessa = extractCommessaNumber(card.name);
  const clienteName = extractClienteName(card.name);

  const commessaData = {
    numero_commessa: numeroCommessa,
    cliente: clienteName,
    data_consegna: card.due ? new Date(card.due).toISOString().split("T")[0] : null,
    note: card.desc || "",
  };



  setSelectedCommessa(commessaData);
  setShowPopup(true);
  setSelectedReparto;
};


  const handleClosePopup = () => {
    setShowPopup(false);
    setSelectedCommessa(null);
  };

  
  return (
  
      <div className="container-scroll">
   {loading && (
        <div className="loading-overlay">
            <img src={logo} alt="Logo"  className="logo-spinner"/>
        </div>
      )}
      <div className="header">
                <h1>Commesse esistenti solo su Trello</h1>
                 </div>
        
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
