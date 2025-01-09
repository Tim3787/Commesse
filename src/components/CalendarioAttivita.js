import React, { useState, useEffect } from "react";
import FullCalendar from "@fullcalendar/react";
import resourceTimelinePlugin from "@fullcalendar/resource-timeline";
import interactionPlugin from "@fullcalendar/interaction";
import "./style.css";

const CalendarioAttivita = () => {
  const [eventi, setEventi] = useState([]);
  const [risorse, setRisorse] = useState([]);

  useEffect(() => {
    const fetchDati = async () => {
      try {
        // Recupera eventi
        const responseEventi = await fetch("http://server-commesseun.onrender.com/api/attivita_commessa");
        const dataEventi = await responseEventi.json();

        const eventiTrasformati = dataEventi.map((att) => ({
          id: att.id,
          title: `${att.risorsa} - ${att.numero_commessa}`,
          start: att.data_inizio,
          end: new Date(
            new Date(att.data_inizio).setDate(new Date(att.data_inizio).getDate() + att.durata)
          ).toISOString(),
          resourceId: `${att.reparto}-${att.nome_attivita}`,
          extendedProps: {
            commessa_id: att.commessa_id,
            risorsa_id: att.risorsa_id,
            attivita_id: att.attivita_id,
          },
        }));

        setEventi(eventiTrasformati);

        // Recupera risorse
        const responseReparti = await fetch("http://server-commesseun.onrender.com/api/reparti");
        const dataReparti = await responseReparti.json();

        const responseAttivita = await fetch("http://server-commesseun.onrender.com/api/attivita");
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

    console.log("Dati evento aggiornato:", eventoAggiornato);

    if (!eventoAggiornato.commessa_id || !eventoAggiornato.risorsa_id || !eventoAggiornato.attivita_id) {
      console.error("Dati incompleti, aggiornamento annullato.");
      info.revert(); // Reverti la modifica nel frontend in caso di errore
      return;
    }

    try {
      const response = await fetch(`http://server-commesseun.onrender.com/api/attivita_commessa/${info.event.id}`, {
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
      info.revert(); // Reverti la modifica nel frontend in caso di errore
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

    console.log("Dati evento aggiornato:", eventoAggiornato);

    try {
      const response = await fetch(`http://server-commesseun.onrender.com/api/attivita_commessa/${info.event.id}`, {
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
      info.revert(); // Reverti la modifica nel frontend in caso di errore
    }
  };

  return (
    <div className="calendar-container">
      <h1>Calendario attività</h1>

      <FullCalendar
        plugins={[resourceTimelinePlugin, interactionPlugin]}
        initialView="resourceTimelineWeek"
        views={{
          resourceTimelineWeek: {
            type: "resourceTimeline",
            duration: { weeks: 1 },
            slotLabelFormat: [{ weekday: "short" }],
          },
          resourceTimelineMonth: {
            type: "resourceTimeline",
            duration: { months: 1 },
            slotLabelFormat: [{ day: "numeric" }],
          },
          resourceTimelineYear: {
            type: "resourceTimeline",
            duration: { years: 1 },
            slotLabelFormat: [{ month: "short" }],
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
      />
    </div>
  );
};

export default CalendarioAttivita;
