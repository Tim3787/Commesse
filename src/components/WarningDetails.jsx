import React from "react";


const WarningDetails = ({ warningActivities, resources }) => {
  if (warningActivities.length === 0) return null;

  return (
    <div className="warning-section">
     
      {warningActivities.map((activity) => {
        const resourceName = resources.find(
          (resource) => resource.id === activity.risorsa_id
        )?.nome || "Nome non disponibile";

        return (
          <div
            key={activity.id}
            style={{
              padding: "10px",
              backgroundColor: "#ffe6e6",
              border: "1px solid #e60000",
              marginBottom: "10px",
            }}
          >
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

          </div>
        );
      })}
    </div>
  );
};

export default WarningDetails;
