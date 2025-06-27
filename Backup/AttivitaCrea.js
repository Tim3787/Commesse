import React, { useState, useEffect, useRef } from "react";


// Import per Toastify (notifiche)
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function AttivitaCrea({
  formData,
  setFormData,
  isEditing,
  editId,
  setShowPopup,
  commesse,
  reparti,
  risorse,
  attivitaConReparto,
  reloadActivities,
}) {
  const [commessaSearch, setCommessaSearch] = useState("");
  const [suggestedCommesse, setSuggestedCommesse] = useState([]);
  const suggestionsRef = useRef(null);
  const [loading, setLoading] = useState(false);

  // Funzione helper per formattare una Date in YYYY-MM-DD senza shift di fuso
  const formatDateOnly = (dateObj) => {
    const y = dateObj.getFullYear();
    const m = String(dateObj.getMonth() + 1).padStart(2, '0');
    const d = String(dateObj.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  // Stati per le opzioni di weekend (sabati e domeniche)
  const [weekendOptions, setWeekendOptions] = useState([]);

  // Helper per normalizzare date (Date object senza orario)
  const normalizeDate = (dateStr) => {
    const d = new Date(dateStr);
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  };

  // Imposta "stato" a 0 di default se non è presente
  useEffect(() => {
    if (
      formData.stato === undefined ||
      formData.stato === null ||
      formData.stato === ""
    ) {
      setFormData((prevState) => ({ ...prevState, stato: 0 }));
    }
  }, [formData.stato, setFormData]);

  // Genera le opzioni di weekend in base a data_inizio e durata
  useEffect(() => {
    const { data_inizio, durata } = formData;
    if (!data_inizio || !durata) {
      setWeekendOptions([]);
      return;
    }
    const startDate = normalizeDate(data_inizio);
    const days = [];
    const total = Number(durata) || 0;
    for (let i = 0; i < total; i++) {
      const d = new Date(startDate);
      d.setDate(startDate.getDate() + i);
      const wd = d.getDay(); // 0=Dom,6=Sab
      if (wd === 6 || wd === 0) {
        days.push({
          date: formatDateOnly(d),
          dayName: wd === 6 ? "Sabato" : "Domenica",
        });
      }
    }
    setWeekendOptions(days);

    // Inizializza includedWeekends se non definito
    if (formData.includedWeekends === undefined) {
      setFormData((prev) => ({ ...prev, includedWeekends: [] }));
    }
  }, [formData.data_inizio, formData.durata, setFormData]);

  // Debounce della ricerca delle commesse
  useEffect(() => {
    const timer = setTimeout(() => {
      if (commessaSearch.trim()) {
        const filteredCommesse = commesse.filter((commessa) =>
          String(commessa.numero_commessa || "")
            .toLowerCase()
            .includes(commessaSearch.toLowerCase())
        );
        setSuggestedCommesse(filteredCommesse);
      } else {
        setSuggestedCommesse([]);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [commessaSearch, commesse]);

  // Chiude i suggerimenti quando si clicca fuori
  useEffect(() => {
    const closeSuggestions = (e) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(e.target)) {
        setSuggestedCommesse([]);
      }
    };
    document.addEventListener("click", closeSuggestions);
    return () => document.removeEventListener("click", closeSuggestions);
  }, []);

  useEffect(() => {
    if (isEditing && formData.commessa_id) {
      const commessa = commesse.find(
        (c) => c.commessa_id === parseInt(formData.commessa_id, 10)
      );
      if (commessa) {
        setCommessaSearch(commessa.numero_commessa);
      }
    }
  }, [isEditing, formData.commessa_id, commesse]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "stato") {
      setFormData({ ...formData, stato: value === "" ? 0 : parseInt(value, 10) });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSelectCommessa = (commessa) => {
    setCommessaSearch(commessa.numero_commessa);
    setFormData((prevState) => ({ ...prevState, commessa_id: commessa.commessa_id || "" }));
    setSuggestedCommesse([]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { commessa_id, reparto_id, risorsa_id, attivita_id, data_inizio, durata } = formData;

    if (!commessa_id || !reparto_id || !attivita_id || !risorsa_id || !data_inizio || !durata) {
      toast.error("Tutti i campi sono obbligatori.");
      return;
    }

    try {
      setLoading(true);
      const endpoint = isEditing
        ? `${process.env.REACT_APP_API_URL}/api/attivita_commessa/${editId}`
        : `${process.env.REACT_APP_API_URL}/api/attivita_commessa`;
      const method = isEditing ? "PUT" : "POST";

      const response = await fetch(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionStorage.getItem("token")}`,
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error("Errore nella richiesta");

      toast.success(
        isEditing
          ? "Attività aggiornata con successo!"
          : "Attività aggiunta con successo!"
      );
      reloadActivities();
    } catch (error) {
      console.error("Errore durante l'aggiunta o modifica dell'attività:", error);
      toast.error("Errore durante l'aggiunta o modifica dell'attività.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="popup">
      <div className="popup-background">
      <div className="popup-content">
        <h2>{isEditing ? "Modifica Attività" : "Aggiungi Attività"}</h2>
        <form onSubmit={handleSubmit}>
          <div className="flex-column-center">
            <label>Commessa:</label>
            <input
  type="text"
  name="commessa_id"
  value={commessaSearch || ""}
  onChange={(e) => {
    const inputValue = e.target.value;
    setCommessaSearch(inputValue);

    // Trova la commessa corrispondente
    const match = commesse.find(
      (c) => String(c.numero_commessa).toLowerCase() === inputValue.toLowerCase()
    );

    if (match) {
      setFormData((prev) => ({
        ...prev,
        commessa_id: match.commessa_id || match.id, // dipende da come è salvato
      }));
    } else {
      // Se non trova nulla, svuota commessa_id
      setFormData((prev) => ({
        ...prev,
        commessa_id: "",
      }));
    }
  }}
  placeholder="Cerca per numero commessa"
  className="w-400"
/>

            {suggestedCommesse.length > 0 && (
              <ul className="suggestions-list w-400" ref={suggestionsRef}>
                {suggestedCommesse.map((commessa) => (
                  <li key={commessa.id} onClick={() => handleSelectCommessa(commessa)}>
                    {commessa.numero_commessa}
                  </li>
                ))}
              </ul>
            )}
            </div>
            <div className="flex-column-center">
            <label>Reparto:</label>
            <select
              name="reparto_id"
              value={formData.reparto_id}
              onChange={handleChange}
              required
              className="w-400"
            >
              <option value="">Seleziona un reparto</option>
              {reparti.map((reparto) => (
                <option key={reparto.id} value={reparto.id}>
                  {reparto.nome}
                </option>
              ))}
            </select>

            <label>Risorsa:</label>
            <select
              name="risorsa_id"
              value={formData.risorsa_id}
              onChange={handleChange}
              required
              className="w-400"
            >
              <option value="">Seleziona una risorsa</option>
              {risorse
                .filter((risorsa) => risorsa.reparto_id === parseInt(formData.reparto_id, 10))
                .map((risorsa) => (
                  <option key={risorsa.id} value={risorsa.id}>
                    {risorsa.nome}
                  </option>
                ))}
            </select>

            <label>Attività:</label>
            <select
              name="attivita_id"
              value={formData.attivita_id}
              onChange={handleChange}
              required
              className="w-400"
            >
              <option value="">Seleziona un'attività</option>
              {attivitaConReparto
                .filter((attivita) => attivita.reparto_id === parseInt(formData.reparto_id, 10))
                .map((attivita) => (
                  <option key={attivita.id} value={attivita.id}>
                    {attivita.nome_attivita}
                  </option>
                ))}
            </select>

            <label>Data Inizio:</label>
            <input
              type="date"
              name="data_inizio"
              value={formData.data_inizio}
              onChange={handleChange}
              required
              className="w-400"
            />


            <label>Durata:</label>
            <input
              type="number"
              name="durata"
              value={formData.durata}
              onChange={handleChange}
              required
              className="w-400"
            />


            <label>Stato:</label>
            <select
              name="stato"
              value={formData.stato !== undefined && formData.stato !== null ? String(formData.stato) : "1"}
              onChange={handleChange}
              className="w-400"
            >
              <option value="0">Non iniziata</option>
              <option value="1">Iniziata</option>
              <option value="2">Completata</option>
            </select>


            <label>Descrizione:</label>
            <textarea
              name="descrizione"
              value={formData.descrizione || ""}
              onChange={handleChange}
              placeholder="Inserisci una descrizione (opzionale)"
              rows="4"
              className="w-400"
            />


          {/* Selezione dei weekend specifici */}
          {weekendOptions.length > 0 && (
            <fieldset className="flex-column-center ">
              <legend>Scegli quali giorni del weekend includere</legend>
              {weekendOptions.map((opt) => {
                const checked = formData.includedWeekends?.includes(opt.date);
                return (
                  <label key={opt.date}>
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) => {
                        setFormData((fd) => {
                          const setDates = new Set(fd.includedWeekends || []);
                          if (e.target.checked) {
                            setDates.add(opt.date);
                          } else {
                            setDates.delete(opt.date);
                          }
                          return { ...fd, includedWeekends: Array.from(setDates) };
                        });
                      }}
                    />
                    {opt.dayName} {opt.date}
                  </label>
                );
              })}
            </fieldset>
          )}

          <button type="submit" className="btn w-400 btn--blue btn--pill" disabled={loading}>
            {isEditing ? "Aggiorna" : "Aggiungi"}
          </button>
          <button type="button" className="btn w-400 btn--danger btn--pill" onClick={() => setShowPopup(false)}>
            Annulla
          </button>
          </div>
        </form>
      </div>
      </div>
    </div>
    
  );
}

export default AttivitaCrea;
