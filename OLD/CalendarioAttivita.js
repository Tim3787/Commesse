import React, { useState, useEffect } from "react";
import FullCalendar from "@fullcalendar/react";
import resourceTimelinePlugin from "@fullcalendar/resource-timeline";
import interactionPlugin from "@fullcalendar/interaction";
import "../style.css";

const CalendarioAttivita = () => {
  const [eventi, setEventi] = useState([]);
  const [risorse, setRisorse] = useState([]);
   const [loading, setLoading] = useState(false);
   const [slotDuration, setSlotDuration] = useState("01:00:00");

  useEffect(() => {
    const fetchDati = async () => {
      try {
        setLoading(true);
        // Recupera eventi
        const responseEventi = await fetch (`${process.env.REACT_APP_API_URL}/api/attivita_commessa`);
        const dataEventi = await responseEventi.json();

        const eventiTrasformati = dataEventi.map((att) => ({
          id: att.id,
          title: `${att.risorsa} - ${att.numero_commessa}`,
          start: att.data_inizio,
          end: new Date(
            new Date(att.data_inizio).setDate(new Date(att.data_inizio).getDate() + att.durata - 1)
          ).toISOString(), // Riduci di 1 giorno per correggere il problema
          resourceId: `${att.reparto}-${att.nome_attivita}`,
          extendedProps: {
            commessa_id: att.commessa_id,
            risorsa_id: att.risorsa_id,
            attivita_id: att.attivita_id,
          },
          
        }));
        

        setEventi(eventiTrasformati);

        // Recupera risorse
        const responseReparti = await fetch (`${process.env.REACT_APP_API_URL}/api/reparti`);
        const dataReparti = await responseReparti.json();

        const responseAttivita = await fetch (`${process.env.REACT_APP_API_URL}/api/attivita`);
        const dataAttivita = await responseAttivita.json();

        const risorseTrasformate = dataReparti.map((reparto) => ({
          id: reparto.nome,
          title: reparto.nome,
          children: dataAttivita
            .filter((att) => att.reparto === reparto.nome)
            .map((att) => ({
              id: `${reparto.nome}-${att.nome_attivita}`,
              title: att.nome_attivita,
            })),
        }));

        setRisorse(risorseTrasformate);
      } catch (error) {
        console.error("Errore durante il recupero dei dati:", error);
      }finally {
        setLoading(false);
      }
    };

    fetchDati();
  }, []);

  const handleEventDrop = async (info) => {
    const eventoAggiornato = {
      commessa_id: info.event.extendedProps.commessa_id,
      risorsa_id: info.event.extendedProps.risorsa_id,
      attivita_id: info.event.extendedProps.attivita_id,
      data_inizio: info.event.start.toISOString(),
      durata: Math.ceil((info.event.end - info.event.start) / (1000 * 60 * 60 * 24)),
    };


    if (!eventoAggiornato.commessa_id || !eventoAggiornato.risorsa_id || !eventoAggiornato.attivita_id) {
      console.error("Dati incompleti, aggiornamento annullato.");
      info.revert(); 
      return;
    }

    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/attivita_commessa/${info.event.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(eventoAggiornato),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Errore durante l'aggiornamento dell'evento: ${errorText}`);
      }

      alert("Evento aggiornato con successo!");
    } catch (error) {
      console.error("Errore durante l'aggiornamento dell'evento:", error);
      info.revert(); 
      
    }
  };

  const handleEventResize = async (info) => {
    const eventoAggiornato = {
      commessa_id: info.event.extendedProps.commessa_id,
      risorsa_id: info.event.extendedProps.risorsa_id,
      attivita_id: info.event.extendedProps.attivita_id,
      data_inizio: info.event.start.toISOString(),
      durata: Math.ceil((info.event.end - info.event.start) / (1000 * 60 * 60 * 24)),
    };


    
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/attivita_commessa/${info.event.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(eventoAggiornato),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Errore durante l'aggiornamento dell'evento: ${errorText}`);
      }

      alert("Evento aggiornato con successo!");
    } catch (error) {
      console.error("Errore durante l'aggiornamento dell'evento:", error);
      info.revert(); 
    }
  };

  const handleZoomChange = (zoomLevel) => {
    setSlotDuration(zoomLevel);
  };
  
  return (

    <div className="testCont ">
      {loading && (
        <div className="loading-overlay">
          <div className="spinner"></div>
        </div>
      )}
      <h1>Calendario attività</h1>
      <div>
        <button onClick={() => handleZoomChange("24:00:00")}>Zoom In</button>
        <button onClick={() => handleZoomChange("12:00:00")}>Zoom Out</button>
      </div>
      <FullCalendar
  plugins={[resourceTimelinePlugin, interactionPlugin]}
  initialView="resourceTimelineMonth"
  views={{
    resourceTimelineWeek: {
      type: "resourceTimeline",
      duration: { weeks: 1 },
      slotLabelFormat: [{ weekday: "short", day: "numeric" }], // Mostra giorno e numero
      slotDuration, // Utilizzo di slotDuration per impostare la durata dinamicamente
      slotMinWidth: 100,
      
      
    },
    resourceTimelineMonth: {
      type: "resourceTimeline",
      duration: { months: 1 },
      slotLabelFormat: [{ day: "numeric" }], // Mostra il giorno del mese
      slotDuration: "1 day", // Un giorno per slot
      slotMinWidth: 200
    },
    resourceTimelineYear: {
      type: "resourceTimeline",
      duration: { years: 1 },
      slotLabelFormat: [{ month: "short" }], // Mostra mese abbreviato
      slotMinWidth: 200
     
    },
  }}
  headerToolbar={{
    left: "prev,next today",
    center: "title",
    right: "resourceTimelineWeek,resourceTimelineMonth,resourceTimelineYear",
  }}
  resources={risorse}
  events={eventi}
  editable={true}
  droppable={true}
  resourceAreaHeaderContent="Reparti e Tipi di Attività"
  eventDrop={handleEventDrop}
  eventResize={handleEventResize}

  contentHeight="auto" // Adatta l'altezza al contenuto
/>

    </div>
  );
};

export default CalendarioAttivita;
