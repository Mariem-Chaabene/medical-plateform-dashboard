// src/pages/Examens.jsx
import { useEffect, useMemo, useState } from "react";
import Input from "../components/ui/Input/Input";

const API = "http://127.0.0.1:8000/api";

// ✅ datetime-local helper (local time)
const toLocalDatetimeInput = (d = new Date()) => {
  const dt = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return dt.toISOString().slice(0, 16);
};


/**
 * Bonne pratique (workflow):
 * - Pendant la consultation: le médecin "demande" un examen (type + date de demande).
 *   -> état = en_attente, résultat vide.
 * - Plus tard (après que le patient l'ait fait): on renseigne résultat/remarques et on passe état=termine.
 *
 * ✅ Dans l'écran ConsultationForm, passez allowResults={false}
 *    pour ne PAS afficher "Ajouter résultat" pendant la consultation.
 */
const ETATS = [
  { value: "en_attente", label: "En attente" },
  { value: "termine", label: "Terminé" },
];

const PrintIcon = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <path d="M7 8V4h10v4" stroke="grey" strokeWidth="2" strokeLinecap="round" />
    <path d="M7 17h10v3H7v-3Z" stroke="grey" strokeWidth="2" strokeLinecap="round" />
    <path d="M6 12h12" stroke="grey" strokeWidth="2" strokeLinecap="round" />
    <path
      d="M6 15H5a2 2 0 0 1-2-2v-2a3 3 0 0 1 3-3h12a3 3 0 0 1 3 3v2a2 2 0 0 1-2 2h-1"
      stroke="grey"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
);

export default function Examens({ token, dmeId, consultationId, allowResults }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const [types, setTypes] = useState([]);
  const [items, setItems] = useState([]);
  const [error, setError] = useState("");

  // Formulaire "demande d'examen"
  const [form, setForm] = useState({
    type_examen_id: "",
    date_examen: toLocalDatetimeInput(),
    // ✅ note d'indication dans remarques (pas le résultat)
    remarques: "",
  });

  // Modal "résultat"
  const [resultModal, setResultModal] = useState({
    open: false,
    id: null,
    etat: "termine",
    resultat: "",
    remarques: "",
    file: null,
  });

  // ✅ Par défaut: pas de saisie de résultats pendant la consultation (consultationId présent).
  // On activera la saisie après clôture en passant allowResults={true}.
  const allowResultsResolved =
    typeof allowResults === "boolean" ? allowResults : !consultationId;

  const canSubmit = useMemo(() => {
    return (
      String(form.type_examen_id || "").trim() !== "" &&
      String(form.date_examen || "").trim() !== ""
    );
  }, [form.type_examen_id, form.date_examen]);

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
    if (!String(form.type_examen_id || "").trim()) {
      setError("Veuillez choisir un type d’examen.");
      return;
    }
    if (!String(form.date_examen || "").trim()) {
      setError("Veuillez remplir la date de demande de l’examen.");
      return;
    }

    try {
      setSaving(true);
      setError("");

      const payload = {
        dme_id: Number(dmeId),
        consultation_id: consultationId ? Number(consultationId) : null,
        type_examen_id: Number(form.type_examen_id),
        date_examen: form.date_examen,
        etat: "en_attente",
        resultat: null,
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
        if (res.status === 422) setError("Champs invalides (date requise).");
        else setError("Erreur lors de l’ajout de l’examen.");
        return;
      }

      setForm({ type_examen_id: "", date_examen: toLocalDatetimeInput(), remarques: "" });
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
    return String(d).replace("T", " ").slice(0, 16);
  };

  const printExamen = (it) => {
    if (!it) return;

    const titre =
      it?.type?.libelle
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
            .label { color:#6b7280; font-weight:700; width:140px; display:inline-block; }
            .value { font-weight:600; }
            .muted { color:#6b7280; font-weight:500; }
          </style>
        </head>
        <body>
          <div class="card">
            <h1>${titre}</h1>
            <div class="row"><span class="label">Date demande</span><span class="value">${formatDate(it.date_examen)}</span></div>
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

  const openResult = (it) => {
    if (!it?.id) return;
    setError("");
    setResultModal({
      open: true,
      id: it.id,
      etat: "termine",
      resultat: it.resultat ?? "",
      remarques: it.remarques ?? "",
      file: null,
    });
  };

  const closeResult = () => {
    setResultModal({
      open: false,
      id: null,
      etat: "termine",
      resultat: "",
      remarques: "",
      file: null,
    });
  };

  const saveResult = async () => {
    if (!resultModal.id) return;

    const hasText = String(resultModal.resultat || "").trim() !== "";
    const hasFile = Boolean(resultModal.file);

    if (!hasText && !hasFile) {
      setError("Veuillez saisir le résultat ou joindre un fichier.");
      return;
    }

    try {
      setSaving(true);
      setError("");

      // 1) Mise à jour texte (si saisi) + remarques
      const updatePayload = {
        etat: resultModal.etat || "termine",
        remarques: String(resultModal.remarques || "").trim() || null,
      };
      if (hasText) updatePayload.resultat = resultModal.resultat.trim();

      const res = await fetch(`${API}/examens/${resultModal.id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatePayload),
      });

      const txt = await res.text();
      if (!res.ok) {
        console.error("update examen result error:", res.status, txt);
        setError("Impossible d’enregistrer le résultat.");
        return;
      }

      // 2) Upload fichier (optionnel)
      if (hasFile) {
        const fd = new FormData();
        fd.append("file", resultModal.file);

        const resFile = await fetch(`${API}/examens/${resultModal.id}/file`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: fd,
        });

        const txtFile = await resFile.text();
        if (!resFile.ok) {
          console.error("upload examen file error:", resFile.status, txtFile);
          setError("Résultat enregistré, mais l’upload du fichier a échoué.");
          // on continue quand même
        }
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

  const etatLabel = (etat) => {
    const x = ETATS.find((z) => z.value === etat);
    return x ? x.label : etat || "—";
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
                <label className="form-label">Type d’examen *</label>
                <select
                  className="custom-input"
                  style={{ width: "100%", padding: 10 }}
                  value={form.type_examen_id}
                  onChange={(e) => setForm((f) => ({ ...f, type_examen_id: e.target.value }))}
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
                <label className="form-label">Date de demande *</label>
                <Input
                  type="datetime-local"
                  value={form.date_examen}
                  onChange={(e) => setForm((f) => ({ ...f, date_examen: e.target.value }))}
                />
              </div>

              <div className="form-group" style={{ gridColumn: "1 / span 2" }}>
                <label className="form-label">Indication / Remarques (optionnel)</label>
                <textarea
                  className="custom-input"
                  style={{ minHeight: 80, padding: 10, width: "100%" }}
                  value={form.remarques}
                  onChange={(e) => setForm((f) => ({ ...f, remarques: e.target.value }))}
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
                {saving ? "Ajout..." : "Demander l’examen"}
              </button>
            </div>
          </div>

          {/* ✅ Liste */}
          <div style={{ marginTop: 14 }}>
            <div style={{ fontWeight: 900, marginBottom: 10 }}>Examens</div>

            {items.length === 0 ? (
              <div style={{ color: "#6b7280" }}>Aucun examen.</div>
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
                        {it?.type?.libelle
                          ? it.type.code
                            ? `${it.type.code} — ${it.type.libelle}`
                            : it.type.libelle
                          : "—"}
                      </div>

                      <div style={{ fontSize: 13, color: "#6b7280" }}>
                        Date: {formatDate(it.date_examen)} • État: {etatLabel(it.etat)}
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

                      {it?.result_file_url ? (
                        <div style={{ marginTop: 6, fontSize: 13 }}>
                          <b>Pièce jointe :</b>{" "}
                          <a
                            href={it.result_file_url}
                            target="_blank"
                            rel="noreferrer"
                          >
                            Voir fichier
                          </a>
                        </div>
                      ) : null}
                    </div>

                    <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
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

                      {/* ✅ Visible seulement si allowResults=true */}
                      {allowResultsResolved && it.etat !== "termine" ? (
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

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div className="form-group">
                  <label className="form-label">État</label>
                  <select
                    className="custom-input"
                    style={{ width: "100%", padding: 10 }}
                    value={resultModal.etat}
                    onChange={(e) => setResultModal((m) => ({ ...m, etat: e.target.value }))}
                  >
                    {ETATS.map((x) => (
                      <option key={x.value} value={x.value}>
                        {x.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Résultat (texte)</label>
                  <Input
                    value={resultModal.resultat}
                    onChange={(e) => setResultModal((m) => ({ ...m, resultat: e.target.value }))}
                  />
                </div>

                <div className="form-group" style={{ gridColumn: "1 / span 2" }}>
                  <label className="form-label">Pièce jointe (PDF/JPG/PNG)</label>
                  <input
                    type="file"
                    accept="application/pdf,image/png,image/jpeg"
                    onChange={(e) =>
                      setResultModal((m) => ({ ...m, file: e.target.files?.[0] || null }))
                    }
                  />
                  {resultModal.file ? (
                    <div style={{ fontSize: 12, color: "#6b7280", marginTop: 6 }}>
                      Fichier choisi : {resultModal.file.name}
                    </div>
                  ) : null}
                </div>

                <div className="form-group" style={{ gridColumn: "1 / span 2" }}>
                  <label className="form-label">Remarques (optionnel)</label>
                  <textarea
                    className="custom-input"
                    style={{ minHeight: 80, padding: 10, width: "100%" }}
                    value={resultModal.remarques}
                    onChange={(e) => setResultModal((m) => ({ ...m, remarques: e.target.value }))}
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
