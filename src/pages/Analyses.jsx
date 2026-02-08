// src/pages/Analyses.jsx
import { useEffect, useMemo, useState } from "react";
import Input from "../components/ui/Input/Input";

const API = "http://127.0.0.1:8000/api";

/**
 * Bonne pratique (workflow):
 * - Pendant la consultation: le médecin "demande" une analyse (type + date de demande + éventuelle indication).
 * - Les résultats arrivent plus tard (labo) => on renseigne résultat/remarques après.
 *
 * ✅ Dans l'écran ConsultationForm, passez allowResults={false}
 *    pour ne PAS afficher l'action "Ajouter résultat" pendant la consultation.
 * ✅ Dans un écran "Résultats / Historique" (plus tard), vous pourrez passer allowResults={true}.
 */
export default function Analyses({ token, dmeId, consultationId, allowResults = false }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const [types, setTypes] = useState([]);
  const [items, setItems] = useState([]);
  const [error, setError] = useState("");

  // Formulaire "demande d'analyse"
  const [form, setForm] = useState({
    type_analyse_id: "",
    date_analyse: "",
    // ✅ "remarques" ici = indication/notes de demande (optionnel)
    remarques: "",
  });

  // Modal "résultat"
  const [resultModal, setResultModal] = useState({
    open: false,
    id: null,
    resultat: "",
    remarques: "",
  });

  const parseArray = (raw) => {
    if (!raw) return [];
    const json = JSON.parse(raw);
    if (Array.isArray(json)) return json;
    if (json && Array.isArray(json.data)) return json.data; // pagination
    return [];
  };

  const canSubmit = useMemo(() => {
    return (
      String(form.type_analyse_id || "").trim() !== "" &&
      String(form.date_analyse || "").trim() !== ""
    );
  }, [form.type_analyse_id, form.date_analyse]);

  const load = async () => {
    if (!token || !dmeId) return;

    try {
      setLoading(true);
      setError("");

      const [resTypes, resItems] = await Promise.all([
        fetch(`${API}/type-analyses`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API}/dmes/${dmeId}/analyses`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      const ttxt = await resTypes.text();
      const itxt = await resItems.text();

      if (!resTypes.ok) {
        console.error("type-analyses error:", resTypes.status, ttxt);
        throw new Error("Impossible de charger les types d’analyses.");
      }
      if (!resItems.ok) {
        console.error("dme analyses error:", resItems.status, itxt);
        throw new Error("Impossible de charger les analyses.");
      }

      setTypes(parseArray(ttxt));
      setItems(parseArray(itxt));
    } catch (e) {
      setError(e?.message || "Erreur réseau.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, dmeId]);

  const add = async () => {
    if (!String(form.type_analyse_id || "").trim()) {
      setError("Veuillez choisir un type d’analyse.");
      return;
    }
    if (!String(form.date_analyse || "").trim()) {
      // controller: date_analyse required|date
      setError("Veuillez remplir la date de demande de l’analyse.");
      return;
    }

    try {
      setSaving(true);
      setError("");

      const payload = {
        dme_id: Number(dmeId),
        consultation_id: consultationId ? Number(consultationId) : null,
        type_analyse_id: Number(form.type_analyse_id),
        date_analyse: form.date_analyse,
        // ✅ Remarques = indication de demande (optionnel)
        remarques: form.remarques?.trim() ? form.remarques.trim() : null,
        // ✅ Résultat: jamais à la demande (bonne pratique)
        resultat: null,
      };

      const res = await fetch(`${API}/analyses`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const txt = await res.text();
      if (!res.ok) {
        console.error("add analyse error:", res.status, txt);
        setError(res.status === 422 ? "Champs invalides." : "Erreur lors de l’ajout.");
        return;
      }

      setForm({ type_analyse_id: "", date_analyse: "", remarques: "" });
      await load();
    } catch (e) {
      console.error(e);
      setError("Erreur réseau.");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id) => {
    if (!id) return;
    if (!window.confirm("Supprimer cette analyse ?")) return;

    try {
      setDeletingId(id);
      setError("");

      const res = await fetch(`${API}/analyses/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      const txt = await res.text();
      if (!res.ok) {
        console.error("delete analyse error:", res.status, txt);
        setError("Erreur lors de la suppression.");
        return;
      }

      await load();
    } catch (e) {
      console.error(e);
      setError("Erreur réseau.");
    } finally {
      setDeletingId(null);
    }
  };

  const formatDate = (d) => {
    if (!d) return "—";
    return String(d).replace("T", " ").slice(0, 16);
  };

  const getStatusLabel = (it) => {
    // ✅ si pas d'etat côté backend, on déduit du résultat
    return it?.resultat ? "Terminé" : "En attente";
  };

  const openResult = (it) => {
    if (!it?.id) return;
    setError("");
    setResultModal({
      open: true,
      id: it.id,
      resultat: it.resultat ?? "",
      remarques: it.remarques ?? "",
    });
  };

  const closeResult = () => {
    setResultModal({ open: false, id: null, resultat: "", remarques: "" });
  };

  const saveResult = async () => {
    if (!resultModal.id) return;

    if (!String(resultModal.resultat || "").trim()) {
      setError("Veuillez saisir le résultat.");
      return;
    }

    try {
      setSaving(true);
      setError("");

      // ⚠️ BACKEND: route PUT/PATCH /analyses/{id} nécessaire
      const res = await fetch(`${API}/analyses/${resultModal.id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          resultat: resultModal.resultat.trim(),
          remarques: String(resultModal.remarques || "").trim() || null,
        }),
      });

      const txt = await res.text();
      if (!res.ok) {
        console.error("update analyse result error:", res.status, txt);
        setError("Impossible d’enregistrer le résultat (route update manquante ?).");
        return;
      }

      closeResult();
      await load();
    } catch (e) {
      console.error(e);
      setError("Erreur réseau.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      {loading && <div>Chargement...</div>}
      {error && (
        <div style={{ color: "red", fontWeight: 800, marginBottom: 10 }}>
          {error}
        </div>
      )}

      {!loading && (
        <>
          {/* ✅ Formulaire DEMANDE */}
          <div
            style={{
              background: "#fff",
              border: "1px solid #eef2f7",
              borderRadius: 14,
              padding: 14,
            }}
          >
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div className="form-group">
                <label className="form-label">Type d’analyse *</label>
                <select
                  className="custom-input"
                  style={{ width: "100%", padding: 10 }}
                  value={form.type_analyse_id}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, type_analyse_id: e.target.value }))
                  }
                >
                  <option value="">-- Choisir --</option>
                  {types.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.libelle}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Date de demande *</label>
                <Input
                  type="datetime-local"
                  value={form.date_analyse}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, date_analyse: e.target.value }))
                  }
                />
              </div>

              <div className="form-group" style={{ gridColumn: "1 / span 2" }}>
                <label className="form-label">Indication / Remarques (optionnel)</label>
                <textarea
                  className="custom-input"
                  style={{ minHeight: 80, padding: 10, width: "100%" }}
                  value={form.remarques}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, remarques: e.target.value }))
                  }
                />
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 12 }}>
              <button
                type="button"
                disabled={saving || !canSubmit}
                onClick={add}
                style={{
                  background: "#48c6ef",
                  color: "#fff",
                  border: "none",
                  borderRadius: 10,
                  padding: "10px 16px",
                  cursor: saving || !canSubmit ? "not-allowed" : "pointer",
                  fontWeight: 800,
                  opacity: saving || !canSubmit ? 0.7 : 1,
                }}
              >
                {saving ? "Ajout..." : "Demander l’analyse"}
              </button>
            </div>
          </div>

          {/* ✅ Liste */}
          <div style={{ marginTop: 14 }}>
            <div style={{ fontWeight: 900, marginBottom: 10 }}>Analyses</div>

            {items.length === 0 ? (
              <div style={{ color: "#6b7280" }}>Aucune analyse.</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {items.map((it) => (
                  <div
                    key={it.id}
                    style={{
                      background: "#fff",
                      border: "1px solid #eef2f7",
                      borderRadius: 14,
                      padding: 12,
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 12,
                      alignItems: "flex-start",
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 900, color: "#111827" }}>
                        {it?.type_analyse?.libelle || it?.typeAnalyse?.libelle || "—"}
                      </div>

                      <div style={{ fontSize: 13, color: "#6b7280" }}>
                        Date: {formatDate(it.date_analyse)} • Statut: {getStatusLabel(it)}
                      </div>

                      {it.resultat ? (
                        <div style={{ marginTop: 6, fontSize: 13 }}>
                          <b>Résultat :</b> {it.resultat}
                        </div>
                      ) : null}

                      {it.remarques ? (
                        <div style={{ marginTop: 6, fontSize: 13 }}>
                          <b>Remarques :</b> {it.remarques}
                        </div>
                      ) : null}
                    </div>

                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      {/* ✅ Visible seulement si allowResults=true */}
                      {allowResults && !it.resultat ? (
                        <button
                          type="button"
                          onClick={() => openResult(it)}
                          disabled={saving}
                          style={{
                            background: "#e0f2fe",
                            color: "#075985",
                            border: "none",
                            borderRadius: 10,
                            padding: "8px 12px",
                            cursor: "pointer",
                            fontWeight: 800,
                            whiteSpace: "nowrap",
                          }}
                        >
                          Ajouter résultat
                        </button>
                      ) : null}

                      <button
                        type="button"
                        onClick={() => remove(it.id)}
                        disabled={deletingId === it.id}
                        style={{
                          background: "#fee2e2",
                          color: "#991b1b",
                          border: "none",
                          borderRadius: 10,
                          padding: "8px 12px",
                          cursor: deletingId === it.id ? "not-allowed" : "pointer",
                          fontWeight: 800,
                          opacity: deletingId === it.id ? 0.7 : 1,
                          whiteSpace: "nowrap",
                        }}
                      >
                        {deletingId === it.id ? "Supp..." : "Supprimer"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ✅ Modal résultat */}
          {resultModal.open && (
            <div
              style={{
                marginTop: 14,
                background: "#fff",
                border: "1px solid #eef2f7",
                borderRadius: 14,
                padding: 14,
              }}
            >
              <div style={{ fontWeight: 900, marginBottom: 10 }}>Renseigner le résultat</div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 12 }}>
                <div className="form-group">
                  <label className="form-label">Résultat *</label>
                  <Input
                    value={resultModal.resultat}
                    onChange={(e) =>
                      setResultModal((m) => ({ ...m, resultat: e.target.value }))
                    }
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Remarques (optionnel)</label>
                  <textarea
                    className="custom-input"
                    style={{ minHeight: 80, padding: 10, width: "100%" }}
                    value={resultModal.remarques}
                    onChange={(e) =>
                      setResultModal((m) => ({ ...m, remarques: e.target.value }))
                    }
                  />
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 12 }}>
                <button
                  type="button"
                  onClick={closeResult}
                  style={{
                    background: "#f3f4f6",
                    color: "#111827",
                    border: "none",
                    borderRadius: 10,
                    padding: "10px 14px",
                    cursor: "pointer",
                    fontWeight: 900,
                  }}
                >
                  Annuler
                </button>

                <button
                  type="button"
                  onClick={saveResult}
                  disabled={saving}
                  style={{
                    background: "#10b981",
                    color: "#fff",
                    border: "none",
                    borderRadius: 10,
                    padding: "10px 14px",
                    cursor: saving ? "not-allowed" : "pointer",
                    fontWeight: 900,
                    opacity: saving ? 0.7 : 1,
                  }}
                >
                  {saving ? "Enregistrement..." : "Enregistrer résultat"}
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
