import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "./Dashboard.css";
import axios from "axios";

function Dashboard({ role }) {
    const [attivita, setAttivita] = useState([]);
    const risorsaId = localStorage.getItem("risorsa_id");
  
    useEffect(() => {
      const fetchData = async () => {
        try {
          const response = await axios.get("http://localhost:5000/api/users/dashboard", {
            headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
          });
          setAttivita(response.data);
        } catch (error) {
          console.error("Errore durante il recupero della bacheca:", error);
        }
      };
  
      fetchData();
    }, []);
  
    return (
      <div>
        <h1>Bacheca Personale</h1>
        <h2>Attività Assegnate</h2>
        {attivita.length > 0 ? (
          <ul>
            {attivita.map((attivita) => (
              <li key={attivita.id}>
                <strong>Commessa:</strong> {attivita.numero_commessa} | <strong>Attività:</strong>{" "}
                {attivita.nome_attivita} | <strong>Inizio:</strong>{" "}
                {new Date(attivita.data_inizio).toLocaleDateString()}
              </li>
            ))}
          </ul>
        ) : (
          <p>Nessuna attività assegnata.</p>
        )}
      </div>
    );
  }
export default Dashboard;
