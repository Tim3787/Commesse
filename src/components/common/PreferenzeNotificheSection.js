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
      <h2 className="section-title">Preferenze notifiche</h2>
      <form onSubmit={handleSubmit} className="form-section">
        <label>Categoria</label>
<select
  name="categoria"
  value={formData.categoria}
  onChange={handleChange}
  required
  className="input w-300"
>
  <option value="">-- Seleziona una categoria --</option>
  {categorie.map((cat) => (
    <option key={cat} value={cat}>
      {cat}
    </option>
  ))}
</select>
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
        <button type="submit">{isEditing ? "Salva modifiche" : "Aggiungi"}</button>
        {isEditing && (
          <button
            type="button"
            onClick={() => {
              setIsEditing(false);
              setEditingCategoria(null);
              setFormData({ categoria: "", viaPush: true, viaEmail: false });
            }}
          >
            Annulla modifica
          </button>
        )}
      </form>

      {loading ? (
        <p>Caricamento in corso...</p>
      ) : preferenze.length === 0 ? (
        <p>Nessuna preferenza configurata.</p>
      ) : (
        <table className="table-section">
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
                  <button onClick={() => handleEdit(pref)}>Modifica</button>
                  <button onClick={() => handleDelete(pref.categoria)}>Elimina</button>
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
