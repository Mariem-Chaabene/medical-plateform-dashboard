import { useEffect, useMemo, useState } from "react";
import Input from "../components/ui/Input/Input";

const API = "http://127.0.0.1:8000/api";

const ETATS = [
  { value: "en_attente", label: "En attente" },
  { value: "termine", label: "Terminé" },
];

export default function Examens({ token, dmeId, consultationId }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const [types, setTypes] = useState([]);
  const [items, setItems] = useState([]);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    type_examen_id: "",
    date_examen: "",
    etat: "en_attente",
    resultat: "",
    remarques: "",
  });

  const canSubmit = useMemo(() => {
    return String(form.type_examen_id || "").trim() !== "";
  }, [form.type_examen_id]);

  const load = async () => {
    if (!token || !dmeId) return;

    try {
      setLoading(true);
      setError("");

      const [resTypes, resItems] = await Promise.all([
        fetch(`${API}/type-examens`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        // ✅ endpoint recommandé (voir section backend)
        fetch(`${API}/dmes/${dmeId}/examens`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      const ttxt = await resTypes.text();
      const itxt = await resItems.text();

      if (!resTypes.ok) {
        console.error("type-examens error:", resTypes.status, ttxt);
        throw new Error("Impossible de charger les types d’examens.");
      }
      if (!resItems.ok) {
        console.error("dme examens error:", resItems.status, itxt);
        throw new Error("Impossible de charger les examens.");
      }

      const parseArray = (raw) => {
        if (!raw) return [];
        const json = JSON.parse(raw);
        if (Array.isArray(json)) return json;
        if (json && Array.isArray(json.data)) return json.data; // si pagination
        return [];
      };

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
    if (!canSubmit) {
      setError("Veuillez choisir un type d’examen.");
      return;
    }

    try {
      setSaving(true);
      setError("");

      const payload = {
        dme_id: Number(dmeId),
        consultation_id: consultationId ? Number(consultationId) : null,
        type_examen_id: Number(form.type_examen_id),
        date_examen: form.date_examen || null, // backend accepte nullable selon migration (mais controller valide required)
        etat: form.etat || "en_attente",
        resultat: form.resultat?.trim() ? form.resultat.trim() : null,
        remarques: form.remarques?.trim() ? form.remarques.trim() : null,
      };

      const res = await fetch(`${API}/examens`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const txt = await res.text();
      if (!res.ok) {
        console.error("add examen error:", res.status, txt);

        // ⚠️ ton controller exige date_examen REQUIRED
        // donc si vide, ça va échouer => message clair
        if (res.status === 422) {
          setError("Veuillez remplir la date de l’examen.");
        } else {
          setError("Erreur lors de l’ajout de l’examen.");
        }
        return;
      }

      setForm({
        type_examen_id: "",
        date_examen: "",
        etat: "en_attente",
        resultat: "",
        remarques: "",
      });

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
    if (!window.confirm("Supprimer cet examen ?")) return;

    try {
      setDeletingId(id);
      setError("");

      const res = await fetch(`${API}/examens/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      const txt = await res.text();
      if (!res.ok) {
        console.error("delete examen error:", res.status, txt);
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
    return String(d).replace("T", " ").slice(0, 16); // yyyy-mm-dd hh:mm
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
          {/* Formulaire d'ajout */}
          <div
            style={{
              background: "#fff",
              border: "1px solid #eef2f7",
              borderRadius: 14,
              padding: 14,
            }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 12,
              }}
            >
              <div className="form-group">
                <label className="form-label">Type d’examen</label>
                <select
                  className="custom-input"
                  style={{ width: "96%", padding: 10 }}
                  value={form.type_examen_id}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, type_examen_id: e.target.value }))
                  }
                >
                  <option value="">-- Choisir --</option>
                  {types.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.code ? `${t.code} — ${t.libelle}` : t.libelle}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Date examen *</label>
                <Input
                  type="datetime-local"
                  value={form.date_examen}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, date_examen: e.target.value }))
                  }
                />
              </div>

              <div className="form-group">
                <label className="form-label">État</label>
                <select
                  className="custom-input"
                  style={{ width: "100%", padding: 10 }}
                  value={form.etat}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, etat: e.target.value }))
                  }
                >
                  {ETATS.map((x) => (
                    <option key={x.value} value={x.value}>
                      {x.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Résultat</label>
               <Input
                    value={form.resultat}
                    disabled={form.etat !== "en_attente"}
                    onChange={(e) => setForm((f) => ({ ...f, resultat: e.target.value }))}
                    />
              </div>

              <div className="form-group" style={{ gridColumn: "1 / span 2" }}>
                <label className="form-label">Remarques</label>
                <textarea
                  className="custom-input"
                  style={{ minHeight: 80, padding: 10, width: "96%" }}
                  value={form.remarques}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, remarques: e.target.value }))
                  }
                />
              </div>
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                marginTop: 12,
              }}
            >
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
            <div style={{ fontWeight: 900, marginBottom: 10 }}>
              Examens enregistrés
            </div>

            {items.length === 0 ? (
              <div style={{ color: "#6b7280" }}>Aucun examen.</div>
            ) : (
              <div
                style={{ display: "flex", flexDirection: "column", gap: 10 }}
              >
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
                        {it?.type?.libelle
                          ? it.type.code
                            ? `${it.type.code} — ${it.type.libelle}`
                            : it.type.libelle
                          : "—"}
                      </div>

                      <div style={{ fontSize: 13, color: "#6b7280" }}>
                        Date: {formatDate(it.date_examen)}
                      </div>

                      <div style={{ fontSize: 13, color: "#6b7280" }}>
                        État: {it.etat || "—"}
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
                        cursor:
                          deletingId === it.id ? "not-allowed" : "pointer",
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
