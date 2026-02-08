import { useEffect, useMemo, useState } from "react";
import Input from "../components/ui/Input/Input";

const API = "http://127.0.0.1:8000/api";

const ETATS = [
  { value: "en_attente", label: "En attente" },
  { value: "termine", label: "Terminé" },
];

const PrintIcon = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <path d="M7 8V4h10v4" stroke="grey" strokeWidth="2" strokeLinecap="round" />
    <path
      d="M7 17h10v3H7v-3Z"
      stroke="grey"
      strokeWidth="2"
      strokeLinecap="round"
    />
    <path d="M6 12h12" stroke="grey" strokeWidth="2" strokeLinecap="round" />
    <path
      d="M6 15H5a2 2 0 0 1-2-2v-2a3 3 0 0 1 3-3h12a3 3 0 0 1 3 3v2a2 2 0 0 1-2 2h-1"
      stroke="grey"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
);

export default function Examens({ token, dmeId, consultationId }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);

  const [types, setTypes] = useState([]);
  const [items, setItems] = useState([]);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    type_examen_id: "",
    date_examen: "",
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
        if (json && Array.isArray(json.data)) return json.data;
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
        date_examen: form.date_examen || null,
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
        if (res.status === 422)
          setError("Veuillez remplir la date de l’examen.");
        else setError("Erreur lors de l’ajout de l’examen.");
        return;
      }

      setForm({
        type_examen_id: "",
        date_examen: "",
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

  // ✅ Saisir résultat plus tard
  const saisirResultat = async (it) => {
    const resultat = window.prompt(
      "Résultat (obligatoire) :",
      it?.resultat || "",
    );
    if (!resultat || !resultat.trim()) {
      setError("Résultat obligatoire pour terminer l’examen.");
      return;
    }
    const remarques = window.prompt(
      "Remarques (optionnel) :",
      it?.remarques || "",
    );

    try {
      setUpdatingId(it.id);
      setError("");

      const res = await fetch(`${API}/examens/${it.id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          etat: "termine",
          resultat: resultat.trim(),
          remarques: remarques?.trim() ? remarques.trim() : null,
        }),
      });

      const txt = await res.text();
      if (!res.ok) {
        console.error("update examen error:", res.status, txt);
        setError("Erreur lors de la mise à jour du résultat.");
        return;
      }

      await load();
    } catch (e) {
      console.error(e);
      setError("Erreur réseau.");
    } finally {
      setUpdatingId(null);
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
    return String(d).replace("T", " ").slice(0, 16);
  };

  // ✅ IMPRESSION d'un examen (fiche simple)
  const printExamen = (it) => {
    if (!it) return;

    const titre = it?.type?.libelle
      ? it.type.code
        ? `${it.type.code} — ${it.type.libelle}`
        : it.type.libelle
      : "Examen";

    const html = `
      <!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>${titre}</title>
          <style>
            @page { size: A4; margin: 12mm; }
            body { font-family: Arial, sans-serif; color:#111827; }
            .card { border:1px solid #e5e7eb; border-radius:12px; padding:16px; }
            h1 { font-size:16px; margin:0 0 10px; }
            .row { margin:6px 0; font-size:13px; }
            .label { color:#6b7280; font-weight:700; width:120px; display:inline-block; }
            .value { font-weight:600; }
            .muted { color:#6b7280; font-weight:500; }
          </style>
        </head>
        <body>
          <div class="card">
            <h1>${titre}</h1>

            <div class="row"><span class="label">Date</span><span class="value">${formatDate(it.date_examen)}</span></div>
            <div class="row"><span class="label">État</span><span class="value">${it.etat || "—"}</span></div>

            <div class="row"><span class="label">Résultat</span>
              <span class="value">${it.resultat ? it.resultat : "<span class='muted'>—</span>"}</span>
            </div>

            <div class="row"><span class="label">Remarques</span>
              <span class="value">${it.remarques ? it.remarques : "<span class='muted'>—</span>"}</span>
            </div>
          </div>

          <script>
            window.onload = function() {
              window.print();
              window.onafterprint = function(){ window.close(); };
            };
          </script>
        </body>
      </html>
    `;

    const w = window.open("", "_blank", "width=900,height=700");
    if (!w) {
      setError("Pop-up bloqué. Autorisez les pop-ups pour imprimer.");
      return;
    }
    w.document.open();
    w.document.write(html);
    w.document.close();
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

              <div className="form-group" style={{ gridColumn: "1 / span 2" }}>
                <label className="form-label">Remarques (optionnel)</label>
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
                        Statut:{" "}
                        {it.etat || (it.resultat ? "termine" : "en_attente")}
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

                    {/* ✅ actions: print + delete */}
                    {String(it.etat || "en_attente") !== "termine" && (
                      <button
                        type="button"
                        onClick={() => saisirResultat(it)}
                        disabled={updatingId === it.id}
                        style={{
                          background: "#10b981",
                          color: "#fff",
                          border: "none",
                          borderRadius: 10,
                          padding: "8px 12px",
                          cursor:
                            updatingId === it.id ? "not-allowed" : "pointer",
                          fontWeight: 800,
                          opacity: updatingId === it.id ? 0.7 : 1,
                          whiteSpace: "nowrap",
                        }}
                      >
                        {updatingId === it.id ? "..." : "Saisir résultat"}
                      </button>
                    )}
                    <div
                      style={{ display: "flex", gap: 10, alignItems: "center" }}
                    >
                      <button
                        type="button"
                        onClick={() => printExamen(it)}
                        title="Imprimer examen"
                        aria-label="Imprimer examen"
                        style={{
                          background: "transparent",
                          border: "none",
                          padding: 0,
                          cursor: "pointer",
                          lineHeight: 0,
                        }}
                      >
                        {PrintIcon}
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
