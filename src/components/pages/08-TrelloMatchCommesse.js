import { useEffect, useState, useMemo } from 'react';
import { getBoardCards, getBoardLists } from '../services/API/trello-api';
import apiClient from '../config/axiosConfig';
import CommessaCrea from '../popup/CommessaCrea';
import logo from '../img/Animation - 1738249246846.gif';
import 'react-toastify/dist/ReactToastify.css';
import { ToastContainer, toast } from 'react-toastify';
import { fetchCommesse } from '../services/API/commesse-api';
import { fetchReparti } from '../services/API/reparti-api';
import { fetchAttivita } from '../services/API/attivita-api';
import { fetchStatiCommessa } from '../services/API/statoCommessa-api';
import { fetchStatiAvanzamento } from '../services/API/StatiAvanzamento-api';
import { useAppData } from '../context/AppDataContext';

const MatchCommesse = () => {
  const [cards, setCards] = useState([]);
  const [commesse, setCommesse] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedReparto] = useState('software');
  const [showPopup, setShowPopup] = useState(false);
  const [selectedCommessa, setSelectedCommessa] = useState(null);
  const boardIds = { software: '606e8f6e25edb789343d0871' };
  const today = new Date(); // Data di oggi
  const [cardsIgnorate, setCardsIgnorate] = useState([]);
  const [reparti, setReparti] = useState([]);
  const [attivita, setAttivita] = useState([]);
  const [statiCommessa, setStatiCommessa] = useState([]);
  const [statiAvanzamento, setStatiAvanzamento] = useState([]);
  const { setMissingTrelloCount } = useAppData();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const boardId = boardIds[selectedReparto];
        const [boardCards, boardLists, statoCommessaResponse] = await Promise.all([
          getBoardCards(boardId),
          getBoardLists(boardId),
          apiClient.get(`/api/stato-commessa`),
        ]);

        const listaCompletate = boardLists.find((list) =>
          list.name.toLowerCase().includes('complet')
        );

        const idListaCompletate = listaCompletate ? listaCompletate.id : null;

        // 🔥 ESCLUDO archiviate e completate
        const activeCards = boardCards.filter((card) => {
          const isArchived = card.closed === true;
          const isCompleted = idListaCompletate && card.idList === idListaCompletate;
          return !isArchived && !isCompleted;
        });

        setCards(activeCards);

        // se vuoi usare `statoCommessaResponse.data`, aggiungi eventualmente:
        setStatiCommessa(statoCommessaResponse.data);

        //  const response = await apiClient.get(`/api/commesse`);
        // const parsedCommesse = response.data.map((commessa) => ({
        //   ...commessa,
        //   stati_avanzamento:
        //    typeof commessa.stati_avanzamento === "string"
        //      ? JSON.parse(commessa.stati_avanzamento)
        //     : commessa.stati_avanzamento,
        // }));
        // setCommesse(parsedCommesse);
      } catch (error) {
        console.error('Errore durante il recupero dei dati:', error);
        toast.error('Errore durante il recupero dei dati:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedReparto]);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {}, [commesse]);
  const loadData = async () => {
    setLoading(true);
    try {
      // Esecuzione parallela delle chiamate API
      const [commesseData, repartiData, attivitaData, statiData, statiAvanzamentoData] =
        await Promise.all([
          fetchCommesse(),
          fetchReparti(),
          fetchAttivita(),
          fetchStatiCommessa(),
          fetchStatiAvanzamento(),
        ]);
      setCommesse(commesseData);
      setReparti(repartiData);
      setAttivita(attivitaData);
      setStatiCommessa(statiData);
      setStatiAvanzamento(statiAvanzamentoData);
    } catch (error) {
      console.error('Errore durante il caricamento dei dati:', error);
      toast.error('Errore durante il caricamento dei dati.');
    } finally {
      setLoading(false);
    }
  };
  const extractCommessaData = (trelloName) => {
    const numeroMatch = trelloName.match(/([A-Z]-)?\d{4,8}(\s*[-–]\s*\d{1,2})?/);
    const numero_commessa = numeroMatch ? numeroMatch[0].replace(/\s*/g, '').toUpperCase() : null;

    const parts = trelloName.split(' - ').map((p) => p.trim());

    const numeroIndex = parts.findIndex((p) =>
      numero_commessa ? p.replace(/\s*/g, '').toUpperCase().startsWith(numero_commessa) : false
    );

    const cliente = parts[numeroIndex + 1] || '';
    const tipo_macchina = parts.slice(numeroIndex + 2).join(' - ');

    return {
      numero_commessa,
      cliente,
      tipo_macchina,
    };
  };

  const handleOpenPopup = (card) => {
    const { numero_commessa, cliente, tipo_macchina } = extractCommessaData(card.name);

    const commessaData = {
      numero_commessa,
      cliente,
      tipo_macchina,
      data_consegna: card.due ? new Date(card.due).toISOString().split('T')[0] : null,
      note: card.desc || '',
    };

    setSelectedCommessa(commessaData);
    setShowPopup(true);
  };

  const handleClosePopup = () => {
    setShowPopup(false);
    setSelectedCommessa(null);
  };

  // Filtro per commessa
  const { filteredCards, ignorateCards } = useMemo(() => {
    const filtered = [];
    const ignorate = [];

    cards.forEach((card) => {
      const { numero_commessa } = extractCommessaData(card.name);

      if (!numero_commessa) {
        ignorate.push(card);
        return;
      }

      const existsInDb = commesse.find(
        (c) =>
          String(c.numero_commessa).trim().toUpperCase() ===
          String(numero_commessa).trim().toUpperCase()
      );

      if (!existsInDb) {
        filtered.push(card);
      }
    });

    return { filteredCards: filtered, ignorateCards: ignorate };
  }, [cards, commesse]);

  useEffect(() => {
    setCardsIgnorate(ignorateCards);
  }, [ignorateCards]);

  // Separare le commesse in base alla data di consegna
  const pastOrTodayCards = filteredCards.filter((card) => {
    const cardDate = card.due ? new Date(card.due) : null;
    return cardDate && cardDate <= today; // Data di oggi o precedente
  });

  const futureCards = filteredCards.filter((card) => {
    const cardDate = card.due ? new Date(card.due) : null;
    return cardDate && cardDate > today; // Data futura
  });
  useEffect(() => {
    if (typeof setMissingTrelloCount === 'function') {
      const totalMissing = pastOrTodayCards.length + futureCards.length;
      setMissingTrelloCount(totalMissing);
    }
  }, [pastOrTodayCards, futureCards]);
  return (
    <div className="container">
      <ToastContainer position="top-left" autoClose={2000} hideProgressBar />
      {loading && (
        <div className="loading-overlay">
          <img src={logo} alt="Logo" className="logo-spinner" />
        </div>
      )}
      <div className="user-dash">
        <div className="flex-center header-row">
          <h1>Commesse esistenti solo su Trello</h1>
        </div>
        <div className="commessa-container">
          {futureCards.length > 0 && (
            <div>
              <h2>Commesse con data di consegna futura</h2>
              {futureCards.map((card) => (
                <div
                  key={card.id}
                  style={{ padding: '20px', border: '1px solid #ccc', marginBottom: '10px' }}
                  onDoubleClick={() => handleOpenPopup(card)}
                >
                  <p>
                    <strong>Commessa:</strong> {card.name}
                  </p>
                  <p>
                    <strong>Data consegna:</strong>{' '}
                    {card.due ? new Date(card.due).toLocaleDateString() : 'Nessuna scadenza'}
                  </p>
                </div>
              ))}
            </div>
          )}
          {pastOrTodayCards.length > 0 && (
            <div>
              <h2>Commesse con data di consegna fino a oggi</h2>
              {pastOrTodayCards.map((card) => (
                <div
                  key={card.id}
                  style={{ padding: '20px', border: '1px solid #ccc', marginBottom: '10px' }}
                  onDoubleClick={() => handleOpenPopup(card)}
                >
                  <p>
                    <strong>Commessa:</strong> {card.name}
                  </p>
                  <p>
                    <strong>Data consegna:</strong>{' '}
                    {card.due ? new Date(card.due).toLocaleDateString() : 'Nessuna scadenza'}
                  </p>
                </div>
              ))}
            </div>
          )}
          {cardsIgnorate.length > 0 && (
            <div style={{ marginTop: '30px' }}>
              <h2 style={{ color: 'red' }}>⚠️ Commesse escluse (numero non estratto)</h2>
              {cardsIgnorate.map((card) => (
                <div
                  key={card.id}
                  style={{
                    padding: '15px',
                    border: '1px dashed red',
                    marginBottom: '10px',
                  }}
                >
                  <p>
                    <strong>{card.name}</strong>
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {showPopup && (
          <CommessaCrea
            commessa={selectedCommessa}
            onClose={handleClosePopup}
            isEditing={false}
            matchTrello={true}
            reparti={reparti}
            attivita={attivita}
            selezioniAttivita={{}}
            setSelezioniAttivita={() => {}}
            fetchCommesse={() => {}}
            stato_commessa={statiCommessa}
            stati_avanzamento={statiAvanzamento}
          />
        )}
      </div>
    </div>
  );
};

export default MatchCommesse;
