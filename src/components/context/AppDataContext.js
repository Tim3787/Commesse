// context/AppDataContext.js
import React, { createContext, useContext, useEffect, useState } from "react";
import { fetchCommesse } from "../services/API/commesse-api";
import { fetchRisorse } from "../services/API/risorse-api";
import { fetchReparti } from "../services/API/reparti-api";
import { fetchAttivita } from "../services/API/attivita-api";
import { fetchAttivitaCommessa } from "../services/API/attivitaCommesse-api";
import { fetchStatiCommessa } from "../services/API/statoCommessa-api";

const AppDataContext = createContext();

export const AppDataProvider = ({ children }) => {
  const [commesse, setCommesse] = useState([]);
  const [risorse, setRisorse] = useState([]);
  const [reparti, setReparti] = useState([]);
  const [attivitaDefinite, setAttivitaDefinite] = useState([]);
  const [attivitaConReparto, setAttivitaConReparto] = useState([]);
  const [filteredActivities, setFilteredActivities] = useState([]);
  const [attivitaProgrammate, setAttivitaProgrammate] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statiCommessa, setStatiCommessa] = useState([]);


  // Fetch globale all'avvio
  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      const [
        commesseData,
        risorseData,
        repartiData,
        attivitaDefiniteData,
        attivitaProgrammateData,
        statiCommessaData,

      ] = await Promise.all([
        fetchCommesse(),
        fetchRisorse(),
        fetchReparti(),
        fetchAttivita(),
        fetchAttivitaCommessa(),
        fetchStatiCommessa()
      ]);

      setCommesse(commesseData);
      setRisorse(risorseData);
      setReparti(repartiData);
      setAttivitaDefinite(attivitaDefiniteData);
      setAttivitaProgrammate(attivitaProgrammateData);
      setStatiCommessa(statiCommessaData); 

      // mappa attivita con reparto
      const mapped = attivitaDefiniteData.map((attivita) => ({
        id: attivita.id,
        nome_attivita: attivita.nome || attivita.nome_attivita || "Nome non disponibile",
        reparto_id: attivita.reparto_id,
      }));
      setAttivitaConReparto(mapped);

      // uniche per nome
      const uniqueMap = new Map();
      attivitaDefiniteData.forEach((att) => {
        const nome = att.nome_attivita || att.nome || "Nome sconosciuto";
        if (!uniqueMap.has(nome)) {
          uniqueMap.set(nome, {
            nome,
            reparto_id: att.reparto_id || null,
          });
        }
      });
      const uniche = Array.from(uniqueMap.values());
      setFilteredActivities(uniche);

    } catch (error) {
      console.error("Errore nel fetch iniziale dei dati:", error);
    } finally {
      setLoading(false);
    }
  };

  const refreshAttivitaDefinite = async () => {
    try {
      const data = await fetchAttivita();
      setAttivitaDefinite(data);
      // rigenera anche attività con reparto e uniche
      const mapped = data.map((attivita) => ({
        id: attivita.id,
        nome_attivita: attivita.nome || attivita.nome_attivita || "Nome non disponibile",
        reparto_id: attivita.reparto_id,
      }));
      setAttivitaConReparto(mapped);

      const uniqueMap = new Map();
      data.forEach((att) => {
        const nome = att.nome_attivita || att.nome || "Nome sconosciuto";
        if (!uniqueMap.has(nome)) {
          uniqueMap.set(nome, {
            nome,
            reparto_id: att.reparto_id || null,
          });
        }
      });
      setFilteredActivities(Array.from(uniqueMap.values()));
    } catch (err) {
      console.error("Errore aggiornando le attività definite:", err);
    }
  };

  const refreshAttivitaProgrammate = async () => {
    try {
      const data = await fetchAttivitaCommessa();
      setAttivitaProgrammate(data);
    } catch (err) {
      console.error("Errore aggiornando le attività programmate:", err);
    }
  };

const refreshCommesse = async () => {
  try {
    const data = await fetchCommesse();
    setCommesse(data);
  } catch (error) {
    console.error("Errore aggiornando le commesse:", error);
  }
};

const refreshStatiCommessa = async () => {
  try {
    const data = await fetchStatiCommessa();
    setStatiCommessa(data);
  } catch (error) {
    console.error("Errore aggiornando gli stati commessa:", error);
  }
};

  return (
    <AppDataContext.Provider
      value={{
        commesse,
        setCommesse,
        risorse,
        reparti,
        attivitaDefinite,
        attivitaProgrammate,
        attivitaConReparto,
        filteredActivities,
        statiCommessa,
        refreshAttivitaDefinite,
        refreshAttivitaProgrammate,
        refreshCommesse,
        refreshStatiCommessa,
        loading
      }}
    >
      {children}
    </AppDataContext.Provider>
  );
};
export const useAppData = () => {
  const context = useContext(AppDataContext);
  if (!context) throw new Error("useAppData deve essere usato dentro AppDataProvider");
  return context;
};
