import React from "react";
import  "../style/02-StatoAvanzamento-reparto.css";

const WarningDetails = ({ warningActivities, resources, deleteNote , closeNote  }) => {
  if (warningActivities.length === 0) return null;

  return (
    <div className="warning-section">
     
      {warningActivities.map((activity) => {
        const resourceName = resources.find(
          (resource) => resource.id === activity.risorsa_id
        )?.nome || "Nome non disponibile";

        return (
          <div key={activity.id} className="warning-card">
            <strong>NOTA ATTIVA</strong><br />
            <span 
  className="warning-icon"
  title={`
    Attività: ${activity.nome_attivita}
    Data inizio: ${new Date(activity.data_inizio).toLocaleDateString()}
    Risorsa: ${resourceName}
    Nota: ${activity.note || 'Nessuna'}
  `}
>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    fill="#e60000"
    viewBox="0 0 24 24"
  >
    <path d="M12 0C5.372 0 0 5.372 0 12s5.372 12 12 12 12-5.372 12-12S18.628 0 12 0zm0 22c-5.523 0-10-4.477-10-10S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zm-1-15h2v6h-2zm0 8h2v2h-2z" />
  </svg>
</span>
         <div className="row center">
            <button className="btn btn--danger btn--pill  w-100" onClick={(e) => { e.stopPropagation(); deleteNote(activity.id)}}>
             Elimina Nota
            </button>
            <button
                className="btn btn--pill btn--danger w-100"
                onClick={(e) => { e.stopPropagation(); closeNote(activity.id)}}
              >
                Chiudi nota
              </button>
          </div>
           </div>
        );
      })}
      
    </div>
  );
};

export default WarningDetails;
