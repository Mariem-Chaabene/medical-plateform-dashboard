import { useEffect, useMemo, useState } from "react";
import Input from "../components/ui/Input/Input";

const API = "http://127.0.0.1:8000/api";

export default function Antecedents({ token, dmeId }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const [types, setTypes] = useState([]);
  const [items, setItems] = useState([]);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    type_antecedent_id: "",
    date_diagnostic: "",
    remarques: "",
  });

  const canSubmit = useMemo(() => {
    return String(form.type_antecedent_id || "").trim() !== "";
  }, [form.type_antecedent_id]);

  const authHeaders = useMemo(() => {
    return {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    };
  }, [token]);

  const load = async () => {
    if (!token || !dmeId) return;

    try {
      setLoading(true);
      setError("");

      const [resTypes, resItems] = await Promise.all([
        fetch(`${API}/type-antecedents`, { headers: authHeaders }),
        fetch(`${API}/dmes/${dmeId}/antecedents`, { headers: authHeaders }),
      ]);

      const ttxt = await resTypes.text();
      const itxt = await resItems.text();

      if (!resTypes.ok) {
        console.error("type-antecedents error:", resTypes.status, ttxt);
        throw new Error("Impossible de charger les types d’antécédents.");
      }
      if (!resItems.ok) {
        console.error("dme antecedents error:", resItems.status, itxt);
        throw new Error("Impossible de charger les antécédents.");
      }

      setTypes(ttxt ? JSON.parse(ttxt) : []);
      setItems(itxt ? JSON.parse(itxt) : []);
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
    if (!canSubmit) {
      setError("Veuillez choisir un antécédent.");
      return;
    }

    try {
      setSaving(true);
      setError("");

      const payload = {
        type_antecedent_id: Number(form.type_antecedent_id),
        date_diagnostic: form.date_diagnostic || null,
        remarques: form.remarques?.trim() ? form.remarques.trim() : null,
      };

      const res = await fetch(`${API}/dmes/${dmeId}/antecedents`, {
        method: "POST",
        headers: {
          ...authHeaders,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const txt = await res.text();
      if (!res.ok) {
        console.error("add antecedent error:", res.status, txt);
        setError("Erreur lors de l’ajout de l’antécédent.");
        return;
      }

      setForm({ type_antecedent_id: "", date_diagnostic: "", remarques: "" });
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
    if (!window.confirm("Supprimer cet antécédent ?")) return;

    try {
      setDeletingId(id);
      setError("");

      const res = await fetch(`${API}/antecedents/${id}`, {
        method: "DELETE",
        headers: authHeaders,
      });

      const txt = await res.text();
      if (!res.ok) {
        console.error("delete antecedent error:", res.status, txt);
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
    return String(d).slice(0, 10);
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
          {/* Formulaire */}
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
                <label className="form-label">Antécédent *</label>
                <select
                  className="custom-input"
                  style={{ width: "100%", padding: 10 }}
                  value={form.type_antecedent_id}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, type_antecedent_id: e.target.value }))
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
                <label className="form-label">Date diagnostic</label>
                <Input
                  type="date"
                  value={form.date_diagnostic}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, date_diagnostic: e.target.value }))
                  }
                />
              </div>

              <div className="form-group" style={{ gridColumn: "1 / span 2" }}>
                <label className="form-label">Remarques</label>
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
                {saving ? "Ajout..." : "Ajouter"}
              </button>
            </div>
          </div>

          {/* Liste */}
          <div style={{ marginTop: 14 }}>
            <div style={{ fontWeight: 900, marginBottom: 10 }}>Antécédents enregistrés</div>

            {items.length === 0 ? (
              <div style={{ color: "#6b7280" }}>Aucun antécédent.</div>
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
                        {it?.type?.libelle || "—"}
                      </div>

                      <div style={{ fontSize: 13, color: "#6b7280" }}>
                        Date: {formatDate(it.date_diagnostic)}
                      </div>

                      {it.remarques ? (
                        <div style={{ marginTop: 6, fontSize: 13 }}>{it.remarques}</div>
                      ) : null}
                    </div>

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
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
