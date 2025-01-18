import React, { useState, useEffect } from "react";
import "./CalendarioAttivita.css";
import logo from"../assets/unitech-packaging.png";

const CalendarioAttivita = () => {
  const [eventi, setEventi] = useState([]);
  const [risorse, setRisorse] = useState([]);
  const giorniVisualizzati = 30;
  const dataInizio = new Date();
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    const fetchDati = async () => {
      setLoading(true);
      try {
        const responseRisorse = await fetch(`${process.env.REACT_APP_API_URL}/api/reparti`);
        const dataRisorse = await responseRisorse.json();

        const responseAttivita = await fetch(`${process.env.REACT_APP_API_URL}/api/attivita`);
        const dataAttivita = await responseAttivita.json();

        const risorseConAttivita = dataRisorse.map((reparto) => ({
          id: reparto.id,
          nome: reparto.nome,
          attivita: dataAttivita.filter((att) => att.reparto_id === reparto.id),
        }));

        setRisorse(risorseConAttivita);

        const responseEventi = await fetch(`${process.env.REACT_APP_API_URL}/api/attivita_commessa`);
        const dataEventi = await responseEventi.json();

        setEventi(
          dataEventi.map((evento) => ({
            ...evento,
            data_inizio: new Date(evento.data_inizio),
            data_fine: new Date(new Date(evento.data_inizio).setDate(new Date(evento.data_inizio).getDate() + evento.durata - 1)),
          }))
        );
      } catch (error) {
        console.error("Errore durante il recupero dei dati:", error);
      }finally {
        setLoading(false);
      }
    };

    fetchDati();
  }, []);

  const generaIntervalloDate = (inizio, durata) => {
    const giorni = [];
    const current = new Date(inizio);
    for (let i = 0; i < durata; i++) {
      giorni.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    return giorni;
  };

  const giorniVisibili = generaIntervalloDate(dataInizio, giorniVisualizzati);

  
  const handleDragStart = (evento, e) => {
    e.dataTransfer.setData("eventoId", evento.id);
  };
  
  const handleDrop = (attivitaId, giorno, e) => {
    e.preventDefault();
    const eventoId = e.dataTransfer.getData("eventoId");
  
    if (!eventoId) return;
  
    const evento = eventi.find((ev) => ev.id === parseInt(eventoId, 10));
    if (!evento) return;
  
    const nuovaDataInizio = new Date(giorno);
    const nuovaDataFine = new Date(
      nuovaDataInizio.setDate(nuovaDataInizio.getDate() + evento.durata - 1)
    );
  
    const eventoAggiornato = {
      ...evento,
      data_inizio: nuovaDataInizio,
      data_fine: nuovaDataFine,
    };
  
    setEventi((prevEventi) =>
      prevEventi.map((ev) => (ev.id === evento.id ? eventoAggiornato : ev))
    );
  
    fetch(`${process.env.REACT_APP_API_URL}/api/attivita_commessa/${evento.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(eventoAggiornato),
    }).catch((error) => console.error("Errore aggiornamento evento:", error));
  };
  
  const handleResizeStart = (evento, e) => {
    e.preventDefault();
  
    const onMouseMove = (moveEvent) => {
      const nuovaDataFine = new Date(evento.data_inizio);
      nuovaDataFine.setDate(
        nuovaDataFine.getDate() +
        Math.ceil((moveEvent.clientX - e.clientX) / 20) // Adatta al pixel
      );
  
      setEventi((prevEventi) =>
        prevEventi.map((ev) =>
          ev.id === evento.id
            ? {
                ...ev,
                data_fine: nuovaDataFine,
                durata: Math.ceil(
                  (nuovaDataFine - ev.data_inizio) / (1000 * 60 * 60 * 24)
                ),
              }
            : ev
        )
      );
    };
  
    const onMouseUp = () => {
      const eventoAggiornato = eventi.find((ev) => ev.id === evento.id);
  
      fetch(`${process.env.REACT_APP_API_URL}/api/attivita_commessa/${evento.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(eventoAggiornato),
      }).catch((error) => console.error("Errore aggiornamento evento:", error));
  
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    };
  
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  };
  
  
  return (
    <div className="calendario-container">
      {loading && (
        <div className="loading-overlay">
            <img src={logo} alt="Logo"  className="logo-spinner"/>
        </div>
      )}
      <h1>Calendario Attività</h1>
      <div className="calendario">
        <div className="calendario-header">
          <div className="calendario-cell risorsa-header">Reparti / Attività</div>
          {giorniVisibili.map((data, index) => (
            <div key={index} className="calendario-cell giorno-header">
              {data.toLocaleDateString("it-IT", { day: "2-digit", month: "short" })}
            </div>
          ))}
        </div>

        {risorse.map((reparto) => (
          <React.Fragment key={reparto.id}>
            <div className="calendario-riga reparto">
              <div className="calendario-cell risorsa">{reparto.nome}</div>
              {giorniVisibili.map((_, index) => (
                <div key={index} className="calendario-cell vuota"></div>
              ))}
            </div>

            {reparto.attivita.map((attivita) => (
              <div key={attivita.id} className="calendario-riga attivita">
                <div className="calendario-cell attivita-nome">{attivita.nome_attivita}</div>
                {giorniVisibili.map((data, index) => (
                  <div
                    key={index}
                    className="calendario-cell giorno"
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => handleDrop(attivita.id, data, e)}
                  >
                    {eventi
  .filter(
    (evento) =>
      evento.attivita_id === attivita.id &&
      evento.data_inizio <= data &&
      evento.data_fine >= data
  )
  .map((evento) => (
    <div
      key={evento.id}
      className="evento"
      draggable
      onDragStart={(e) => handleDragStart(evento, e)}
    >
      {evento.numero_commessa} - {evento.risorsa}

      {/* Maniglia per il resize */}
      {evento.data_fine.toDateString() === data.toDateString() && (
        <div
          className="resize-handle"
          onMouseDown={(e) => handleResizeStart(evento, e)}
        ></div>
      )}
    </div>
  ))}

                  </div>
                ))}
              </div>
            ))}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

export default CalendarioAttivita;
