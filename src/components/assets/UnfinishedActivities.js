// src/UnfinishedActivities.jsx
import React from "react";


function UnfinishedActivities({ unfinishedActivities, resources, onEdit }) {
  if (unfinishedActivities.length === 0) {
    return null;
  }

  return (
    <div className="unfinished-section">
      <div>
        {unfinishedActivities.map((activity) => {
          const resourceName = resources.find(
            (resource) => resource.id === activity.risorsa_id
          )?.nome || "Nome non disponibile";

          return (
            <div
              key={activity.id}
              style={{
                padding: "10px",
                backgroundColor: "#fff3cd",
                border: "1px solid #ffcc00",
                marginBottom: "10px",
              }}
            >
              <span
                className="unfinished-icon"
                title={`
                  Attività: ${activity.nome_attivita}
                  Data inizio: ${new Date(activity.data_inizio).toLocaleDateString()}
                  Risorsa: ${resourceName}
                  Note: ${activity.note}
                `}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  fill="#ffcc00"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 0C5.371 0 0 5.371 0 12s5.371 12 12 12 12-5.371 12-12S18.629 0 12 0zm1 17h-2v-2h2v2zm0-4h-2V7h2v6z" />
                </svg>
              </span>
              <br />
              <strong>ATTIVITÀ INCOMPLETA<br />{activity.nome_attivita}</strong>


                         <div className="flex-column-center">
                  <button
  className="btn btn--pill btn--blue w-100"
  onClick={(e) => {
    e.stopPropagation();
    onEdit(activity);
  }}
>
  Modifica
</button>

                </div>

            </div>
          );
        })}
      </div>
    </div>
  );
}

export default UnfinishedActivities;
