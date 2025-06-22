import React, { useEffect, useState } from "react";
import {
  getNotificationPreferencesAPI,
  saveNotificationPreferenceAPI,
  deleteNotificationPreferenceAPI,
  fetchCategorie
} from"../services/API/notifiche-api";
import { toast } from "react-toastify";

const PreferenzeNotificheSection = ({ token }) => {
  const [preferenze, setPreferenze] = useState([]);
  const [formData, setFormData] = useState({
    categoria: "",
    viaPush: true,
    viaEmail: false,
  });
  const [isEditing, setIsEditing] = useState(false);
  const [, setEditingCategoria] = useState(null);
  const [loading, setLoading] = useState(false);
const [categorie, setCategorie] = useState([]);

  const fetchPreferenze = async () => {
    try {
      setLoading(true);
      const data = await getNotificationPreferencesAPI(token);
      setPreferenze(data);
    } catch (error) {
      console.error("Errore durante il caricamento delle preferenze", error);
      toast.error("Errore durante il caricamento delle preferenze");
    } finally {
      setLoading(false);
    }
  };

useEffect(() => {
   fetchPreferenze();
  fetchCategorieDisponibili();
}, []);

  const handleChange = (e) => {
    const { name, type, checked, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleEdit = (pref) => {
    setFormData({
      categoria: pref.categoria,
      viaPush: pref.via_push,
      viaEmail: pref.via_email,
    });
    setIsEditing(true);
    setEditingCategoria(pref.categoria);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await saveNotificationPreferenceAPI(
        formData.categoria,
        formData.viaPush,
        formData.viaEmail,
        token
      );
      toast.success("Preferenza salvata!");
      setFormData({ categoria: "", viaPush: true, viaEmail: false });
      setIsEditing(false);
      setEditingCategoria(null);
      fetchPreferenze();
    } catch (error) {
      console.error("Errore nel salvataggio della preferenza", error);
      toast.error("Errore nel salvataggio della preferenza");
    }
  };

  const handleDelete = async (categoria) => {
    try {
      await deleteNotificationPreferenceAPI(categoria, token);
      toast.success("Preferenza eliminata!");
      fetchPreferenze();
    } catch (error) {
      console.error("Errore durante l'eliminazione della preferenza", error);
      toast.error("Errore durante l'eliminazione");
    }
  };
const fetchCategorieDisponibili = async () => {
  try {
    const data = await fetchCategorie();
    setCategorie(data);
  } catch (error) {
    console.error("Errore durante il caricamento delle categorie", error);
  }
};


  return (
    <div className="section-wrapper">
      <h2 className="section-title">Gestisci come ricevere le notifiche</h2>
      <form onSubmit={handleSubmit} className="form-section">
         <h2>
       Categoria
<select
  name="categoria"
  value={formData.categoria}
  onChange={handleChange}
  required
  className="input w-200"
   style={{ marginLeft: "15px",marginRight: "15px" }}
>
  <option value="">-- Seleziona categoria --</option>
  {categorie.map((cat) => (
    <option key={cat} value={cat}>
      {cat}
    </option>
  ))}
  
</select>
</h2>

 <h2>Seleziona come ricevere le notifiche: </h2>
 <div className="row">
        <label>
          <input
            type="checkbox"
            name="viaPush"
            checked={formData.viaPush}
            onChange={handleChange}
          />
          Notifica Push
        </label>
        <label>
          <input
            type="checkbox"
            name="viaEmail"
            checked={formData.viaEmail}
            onChange={handleChange}
          />
          Notifica Email
        </label>
          <div className="row" style={{ marginBottom: "10px" }}>
        <button type="submit" className="btn w-200 btn--shiny btn--pill">{isEditing ? "Salva modifiche" : "Aggiungi"}</button>
        {isEditing && (
          <button
            type="button"
             className="btn w-200 btn--danger btn--pill"
            onClick={() => {
              setIsEditing(false);
              setEditingCategoria(null);
              setFormData({ categoria: "", viaPush: true, viaEmail: false });
            }}
          >
            Annulla modifica
          </button>
          
        )}
        </div>
        </div>
      </form>

      {loading ? (
        <p>Caricamento in corso...</p>
      ) : preferenze.length === 0 ? (
        <p>Nessuna preferenza configurata.</p>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>Categoria</th>
              <th>Push</th>
              <th>Email</th>
              <th>Azioni</th>
            </tr>
          </thead>
          <tbody>
            {preferenze.map((pref) => (
              <tr key={pref.categoria}>
                <td>{pref.categoria}</td>
                <td>{pref.via_push ? "✅" : "❌"}</td>
                <td>{pref.via_email ? "✅" : "❌"}</td>
                <td>
                  <div className="row">
                  <button onClick={() => handleEdit(pref)} className="btn w-100 btn--warning  btn--pill">Modifica</button>
                  <button onClick={() => handleDelete(pref.categoria)}className="btn w-100 btn--danger btn--pill">Elimina</button>
               </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default PreferenzeNotificheSection;
