import { useEffect, useMemo, useState } from "react";
import Input from "../components/ui/Input/Input";

const API = "http://127.0.0.1:8000/api";

export default function Analyses({ token, dmeId, consultationId }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const [types, setTypes] = useState([]);
  const [items, setItems] = useState([]);
  const [error, setError] = useState("");

  // ✅ mode add/edit
  const [showForm, setShowForm] = useState(false);
  const [mode, setMode] = useState("add"); // "add" | "edit"
  const [editingId, setEditingId] = useState(null);

  const [form, setForm] = useState({
    type_analyse_id: "",
    date_analyse: "",
    resultat: "",
    remarques: "",
  });

  const parseArray = (raw) => {
    if (!raw) return [];
    const json = JSON.parse(raw);
    if (Array.isArray(json)) return json;
    if (json && Array.isArray(json.data)) return json.data;
    return [];
  };

  const authHeaders = useMemo(
    () => ({
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    }),
    [token]
  );

  const canSubmit = useMemo(() => {
    return String(form.type_analyse_id || "").trim() !== "";
  }, [form.type_analyse_id]);

  const load = async () => {
    if (!token || !dmeId) return;

    try {
      setLoading(true);
      setError("");

      const [resTypes, resItems] = await Promise.all([
        fetch(`${API}/type-analyses`, { headers: authHeaders }),
        fetch(`${API}/dmes/${dmeId}/analyses`, { headers: authHeaders }),
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

  const openAdd = () => {
    setError("");
    setMode("add");
    setEditingId(null);
    setForm({ type_analyse_id: "", date_analyse: "", resultat: "", remarques: "" });
    setShowForm(true);
  };

  const openEdit = (it) => {
    if (!it?.id) return;
    setError("");
    setMode("edit");
    setEditingId(it.id);

    setForm({
      type_analyse_id: String(it.type_analyse_id ?? it.typeAnalyse?.id ?? it.type_analyse?.id ?? ""),
      date_analyse: it.date_analyse ? String(it.date_analyse).slice(0, 16) : "",
      resultat: it.resultat ?? "",
      remarques: it.remarques ?? "",
    });

    setShowForm(true);
  };

  const cancel = () => {
    setShowForm(false);
    setMode("add");
    setEditingId(null);
    setForm({ type_analyse_id: "", date_analyse: "", resultat: "", remarques: "" });
  };

  const submit = async () => {
    if (!canSubmit) {
      setError("Veuillez choisir un type d’analyse.");
      return;
    }

    try {
      setSaving(true);
      setError("");

      if (mode === "add") {
        // ✅ création = demande (résultat optionnel)
        const payload = {
          dme_id: Number(dmeId),
          consultation_id: consultationId ? Number(consultationId) : null,
          type_analyse_id: Number(form.type_analyse_id),
          date_analyse: form.date_analyse || null, // ✅ peut être null (backend met now())
          resultat: form.resultat?.trim() ? form.resultat.trim() : null,
          remarques: form.remarques?.trim() ? form.remarques.trim() : null,
        };

        const res = await fetch(`${API}/analyses`, {
          method: "POST",
          headers: { ...authHeaders, "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const txt = await res.text();
        if (!res.ok) {
          console.error("add analyse error:", res.status, txt);
          setError(res.status === 422 ? "Champs invalides." : "Erreur lors de l’ajout.");
          return;
        }
      } else {
        // ✅ compléter/modifier plus tard
        if (!editingId) return;

        const payload = {
          type_analyse_id: Number(form.type_analyse_id),
          date_analyse: form.date_analyse || null,
          resultat: form.resultat?.trim() ? form.resultat.trim() : null,
          remarques: form.remarques?.trim() ? form.remarques.trim() : null,
        };

        const res = await fetch(`${API}/analyses/${editingId}`, {
          method: "PUT",
          headers: { ...authHeaders, "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const txt = await res.text();
        if (!res.ok) {
          console.error("update analyse error:", res.status, txt);
          setError(res.status === 422 ? "Champs invalides." : "Erreur lors de la mise à jour.");
          return;
        }
      }

      cancel();
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
        headers: authHeaders,
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

  const getStatus = (it) => {
    const done = Boolean((it?.resultat && String(it.resultat).trim()) || (it?.remarques && String(it.remarques).trim()));
    return done ? "Terminé" : "En attente";
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
          {/* ✅ bouton ajouter */}
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }}>
            <button
              type="button"
              onClick={openAdd}
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                border: "none",
                background: "#48c6ef",
                color: "#fff",
                cursor: "pointer",
                fontWeight: 900,
                fontSize: 20,
              }}
              title="Ajouter analyse"
              aria-label="Ajouter analyse"
            >
              +
            </button>
          </div>

          {/* ✅ form add/edit */}
          {showForm && (
            <div
              style={{
                background: "#fff",
                border: "1px solid #eef2f7",
                borderRadius: 14,
                padding: 14,
                marginBottom: 14,
              }}
            >
              <div style={{ fontWeight: 900, marginBottom: 10 }}>
                {mode === "edit" ? "Compléter / modifier l’analyse" : "Nouvelle analyse (demande)"}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div className="form-group">
                  <label className="form-label">Type d’analyse *</label>
                  <select
                    className="custom-input"
                    style={{ width: "100%", padding: 10 }}
                    value={form.type_analyse_id}
                    onChange={(e) => setForm((f) => ({ ...f, type_analyse_id: e.target.value }))}
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
                  <label className="form-label">Date (optionnel)</label>
                  <Input
                    type="datetime-local"
                    value={form.date_analyse}
                    onChange={(e) => setForm((f) => ({ ...f, date_analyse: e.target.value }))}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Résultat</label>
                  <Input
                    value={form.resultat}
                    onChange={(e) => setForm((f) => ({ ...f, resultat: e.target.value }))}
                  />
                </div>

                <div className="form-group" style={{ gridColumn: "1 / span 2" }}>
                  <label className="form-label">Remarques</label>
                  <textarea
                    className="custom-input"
                    style={{ minHeight: 80, padding: 10, width: "100%" }}
                    value={form.remarques}
                    onChange={(e) => setForm((f) => ({ ...f, remarques: e.target.value }))}
                  />
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 12, gap: 10 }}>
                <button
                  type="button"
                  onClick={cancel}
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
                  disabled={saving || !canSubmit}
                  onClick={submit}
                  style={{
                    background: "#10b981",
                    color: "#fff",
                    border: "none",
                    borderRadius: 10,
                    padding: "10px 16px",
                    cursor: saving || !canSubmit ? "not-allowed" : "pointer",
                    fontWeight: 900,
                    opacity: saving || !canSubmit ? 0.7 : 1,
                  }}
                >
                  {saving ? "En cours..." : mode === "edit" ? "Enregistrer" : "Ajouter"}
                </button>
              </div>
            </div>
          )}

          {/* ✅ liste */}
          <div style={{ marginTop: 14 }}>
            <div style={{ fontWeight: 900, marginBottom: 10 }}>Analyses</div>

            {items.length === 0 ? (
              <div style={{ color: "#6b7280" }}>Aucune analyse.</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {items.map((it) => {
                  const status = getStatus(it);
                  const isDone = status === "Terminé";

                  return (
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

                        <div style={{ fontSize: 13, color: "#6b7280", marginTop: 2 }}>
                          Statut : <b>{status}</b>
                        </div>

                        <div style={{ fontSize: 13, color: "#6b7280" }}>
                          Date : {formatDate(it.date_analyse)}
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

                      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                        <button
                          type="button"
                          onClick={() => openEdit(it)}
                          style={{
                            background: isDone ? "#eef2ff" : "#ecfeff",
                            color: "#111827",
                            border: "none",
                            borderRadius: 10,
                            padding: "8px 12px",
                            cursor: "pointer",
                            fontWeight: 800,
                            whiteSpace: "nowrap",
                          }}
                        >
                          {isDone ? "Modifier" : "Ajouter résultat"}
                        </button>

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
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
