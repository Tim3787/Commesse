import React, { useState, useEffect } from "react";
import FullCalendar from "@fullcalendar/react";
import resourceTimelinePlugin from "@fullcalendar/resource-timeline";
import interactionPlugin from "@fullcalendar/interaction";
import "../style.css";

const CalendarioCommesse = () => {
  const [eventi, setEventi] = useState([]);
  const [risorse, setRisorse] = useState([]);

  useEffect(() => {
    const fetchDati = async () => {
      try {
        const responseCommesse = await fetch (`${process.env.REACT_APP_API_URL}/api/commesse`);
        const dataCommesse = await responseCommesse.json();

        // Organizza le risorse
        const risorseTrasformate = dataCommesse.map((commessa) => ({
          id: `commessa-${commessa.id}`,
          title: `Commessa ${commessa.numero_commessa}`,
          children: commessa.stati_avanzamento.map((reparto) => ({
            id: `commessa-${commessa.id}-reparto-${reparto.reparto_id}`,
            title: reparto.reparto_nome,
            children: reparto.stati_disponibili.map((stato) => ({
              id: `commessa-${commessa.id}-reparto-${reparto.reparto_id}-stato-${stato.stato_id}`,
              title: stato.nome_stato,
            })),
          })),
        }));

        setRisorse(risorseTrasformate);

        // Organizza gli eventi
        const eventiTrasformati = dataCommesse.flatMap((commessa) =>
          commessa.stati_avanzamento.flatMap((reparto) =>
            reparto.stati_disponibili.map((stato) => ({
              id: `stato-${stato.stato_id}`,
              title: `${stato.nome_stato} (${commessa.numero_commessa})`,
              start: stato.data_inizio ? new Date(stato.data_inizio) : null,
              end: stato.data_fine ? new Date(stato.data_fine) : null,
              resourceId: `commessa-${commessa.id}-reparto-${reparto.reparto_id}-stato-${stato.stato_id}`,
              extendedProps: {
                commessa_id: commessa.id,
                reparto_id: reparto.reparto_id,
                stato_id: stato.stato_id,
              },
            }))
          )
        );

        setEventi(eventiTrasformati);
      } catch (error) {
        console.error("Errore durante il recupero dei dati:", error);
      }
    };

    fetchDati();
  }, []);

  const handleEventUpdate = async (info) => {
    const eventoAggiornato = {
      data_inizio: info.event.start.toISOString(),
      data_fine: info.event.end.toISOString(),
    };
  
    try {
      // Esegui la chiamata al nuovo endpoint
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/api/commesse/${info.event.extendedProps.commessa_id}/stati-avanzamento/${info.event.extendedProps.stato_id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(eventoAggiornato),
        }
      );
  
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Errore durante l'aggiornamento dell'evento: ${errorText}`);
      }
  
      alert("Stato avanzamento aggiornato con successo!");
    } catch (error) {
      console.error("Errore durante l'aggiornamento dell'evento:", error);
      info.revert(); // Reverti la modifica nel frontend in caso di errore
    }
  };

  return (
    <div className="calendar-container">
      <h1>Calendario Stati Avanzamento</h1>
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
        resourceAreaHeaderContent="Commessa - Reparto - Stato"
        eventDrop={handleEventUpdate}
        eventResize={handleEventUpdate}
      />
    </div>
  );
};

export default CalendarioCommesse;
