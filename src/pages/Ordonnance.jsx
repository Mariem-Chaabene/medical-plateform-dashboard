// src/pages/Ordonnance.jsx
import { useEffect, useMemo, useState } from "react";
import Input from "../components/ui/Input/Input";
import { useNavigate } from "react-router-dom";

const API = "http://127.0.0.1:8000/api";

const DOSAGES = ["250 mg", "500 mg", "1 g"];
const FREQUENCES = [
  "1 fois/jour",
  "2 fois/jour",
  "3 fois/jour",
  "Toutes les 8h",
];

export default function Ordonnance({
  token,
  consultationId,
  patient: patientProp,
  medecin: medecinProp,
  cabinet: cabinetProp,
}) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const [medicaments, setMedicaments] = useState([]);
  const [lines, setLines] = useState([]);

  // ✅ on récupère consultation -> patient & medecin si props non fournies
  const [consultation, setConsultation] = useState(null);

  const [showForm, setShowForm] = useState(false);
  const [mode, setMode] = useState("add");
  const [editIndex, setEditIndex] = useState(null);

  const [draft, setDraft] = useState({
    medicament_id: "",
    dosage: "",
    frequence: "",
    duree: "",
  });

  const canSubmitLine = useMemo(() => {
    return (
      String(draft.medicament_id || "").trim() !== "" &&
      String(draft.dosage || "").trim() !== "" &&
      String(draft.frequence || "").trim() !== "" &&
      String(draft.duree || "").trim() !== ""
    );
  }, [draft]);

  const iconBtn = {
    width: 34,
    height: 34,
    borderRadius: 10,
    border: "1px solid #eef2f7",
    background: "#f7fbff",
    cursor: "pointer",
    fontWeight: 900,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
  };

  const getMedLabel = (l) => {
    if (l?.medicament?.libelle) return l.medicament.libelle;
    const m = medicaments.find((x) => Number(x.id) === Number(l.medicament_id));
    return m?.libelle || "—";
  };

  const formatLine = (l) => {
    return `${getMedLabel(l)} | ${l?.dosage || "—"} | ${l?.frequence || "—"} | ${l?.duree || "—"}`;
  };

  const resolvedPatient =
    patientProp ||
    consultation?.dme?.patient ||
    consultation?.patient ||
    consultation?.dme?.patient?.user ||
    null;

  const resolvedMedecin =
    medecinProp || consultation?.medecin || consultation?.doctor || null;

  const resolvedCabinet = cabinetProp || {
    nom: "Cabinet Médical",
    specialite: "Médecin généraliste",
    adresse: "Adresse du cabinet",
    ville: "Ville",
    tel: "Tél : 00 00 00 00 00",
  };

  const load = async () => {
    if (!token || !consultationId) return;

    try {
      setLoading(true);
      setError("");

      const [resMeds, resOrd, resCons] = await Promise.all([
        fetch(`${API}/medicaments`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API}/consultations/${consultationId}/ordonnance`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        // ✅ IMPORTANT pour récupérer patient/medecin si props absentes
        fetch(`${API}/consultations/${consultationId}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      // medicaments
      const medsTxt = await resMeds.text();
      if (!resMeds.ok)
        throw new Error("Impossible de charger la liste des médicaments.");
      const meds = medsTxt ? JSON.parse(medsTxt) : [];
      setMedicaments(Array.isArray(meds) ? meds : []);

      // consultation
      const consTxt = await resCons.text();
      if (resCons.ok) {
        const cons = consTxt ? JSON.parse(consTxt) : null;
        setConsultation(cons);
      } else {
        // si ton backend ne load pas encore relations dans show(), tu le verras ici
        setConsultation(null);
      }

      // ordonnance
      const ordTxt = await resOrd.text();
      if (resOrd.ok) {
        const ord = ordTxt ? JSON.parse(ordTxt) : null;
        const l = ord?.lignes || [];
        setLines(Array.isArray(l) ? l : []);
      } else {
        setLines([]);
      }
    } catch (e) {
      setError(e?.message || "Erreur réseau.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, consultationId]);

  const openAdd = () => {
    setError("");
    setMode("add");
    setEditIndex(null);
    setDraft({ medicament_id: "", dosage: "", frequence: "", duree: "" });
    setShowForm(true);
  };

  const openEdit = (idx) => {
    const l = lines[idx];
    if (!l) return;

    setError("");
    setMode("edit");
    setEditIndex(idx);

    setDraft({
      medicament_id: String(l.medicament_id ?? l?.medicament?.id ?? ""),
      dosage: l.dosage ?? "",
      frequence: l.frequence ?? "",
      duree: l.duree ?? "",
    });

    setShowForm(true);
  };

  const cancelForm = () => {
    setShowForm(false);
    setMode("add");
    setEditIndex(null);
    setDraft({ medicament_id: "", dosage: "", frequence: "", duree: "" });
  };

  const submitLine = () => {
    if (!canSubmitLine) {
      setError("Veuillez remplir tous les champs de la prescription.");
      return;
    }
    setError("");

    const medObj =
      medicaments.find((m) => Number(m.id) === Number(draft.medicament_id)) ||
      null;

    const newLine = {
      medicament_id: Number(draft.medicament_id),
      medicament: medObj,
      dosage: draft.dosage,
      frequence: draft.frequence,
      duree: draft.duree,
    };

    if (mode === "edit" && editIndex !== null) {
      setLines((prev) => prev.map((x, i) => (i === editIndex ? newLine : x)));
    } else {
      setLines((prev) => [...prev, newLine]);
    }

    cancelForm();
  };

  const removeLine = (index) => {
    if (!window.confirm("Supprimer cette prescription ?")) return;
    setLines((prev) => prev.filter((_, i) => i !== index));
  };

  const save = async () => {
    if (!consultationId) return;
    if (!lines.length) return;

    try {
      setSaving(true);
      setError("");

      const payload = {
        date_ordonnance: new Date().toISOString(),
        lignes: lines.map((l) => ({
          medicament_id: l.medicament_id,
          dosage: l.dosage || null,
          frequence: l.frequence || null,
          duree: l.duree || null,
        })),
      };

      const res = await fetch(
        `${API}/consultations/${consultationId}/ordonnance`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        },
      );

      const txt = await res.text();
      if (!res.ok) {
        console.error("save ordonnance error:", res.status, txt);
        setError("Erreur lors de l’enregistrement de l’ordonnance.");
        return;
      }

      await load();
    } catch {
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
          {/* ✅ bouton + en haut à droite */}
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              marginBottom: 12,
            }}
          >
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
              title="Ajouter médicament"
              aria-label="Ajouter médicament"
            >
              +
            </button>
          </div>

          {/* ✅ tableau en dessous (si lignes) */}
          {lines.length > 0 && (
            <div
              style={{
                border: "1px solid #eef2f7",
                borderRadius: 12,
                overflow: "hidden",
                background: "#fff",
              }}
            >
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 120px",
                  background: "#f7fbff",
                  borderBottom: "1px solid #eef2f7",
                  padding: "10px 12px",
                  fontWeight: 900,
                  fontSize: 13,
                }}
              >
                <div>Médicaments</div>
                <div style={{ textAlign: "right" }}>Actions</div>
              </div>

              {lines.map((l, idx) => (
                <div
                  key={idx}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 120px",
                    padding: "10px 12px",
                    borderBottom:
                      idx === lines.length - 1 ? "none" : "1px solid #eef2f7",
                    alignItems: "center",
                    gap: 10,
                  }}
                >
                  <div style={{ fontWeight: 800, fontSize: 13 }}>
                    • {formatLine(l)}
                  </div>

                  <div
                    style={{
                      display: "flex",
                      justifyContent: "flex-end",
                      gap: 8,
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => openEdit(idx)}
                      style={iconBtn}
                      title="Modifier"
                    >
                      ✎
                    </button>

                    <button
                      type="button"
                      onClick={() => removeLine(idx)}
                      style={{
                        ...iconBtn,
                        background: "#fee2e2",
                        borderColor: "#fecaca",
                        color: "#991b1b",
                      }}
                      title="Supprimer"
                    >
                      🗑
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ✅ actions en bas à droite */}
          {lines.length > 0 && !showForm && (
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                marginTop: 12,
                gap: 10,
              }}
            >
              <button
                type="button"
                onClick={save}
                disabled={saving}
                style={{
                  background: "#10b981",
                  color: "#fff",
                  border: "none",
                  borderRadius: 10,
                  padding: "10px 16px",
                  cursor: saving ? "not-allowed" : "pointer",
                  fontWeight: 900,
                  opacity: saving ? 0.7 : 1,
                }}
              >
                {saving ? "Enregistrement..." : "Enregistrer ordonnance"}
              </button>
            </div>
          )}

          {/* ✅ formulaire add/edit */}
          {showForm && (
            <div
              style={{
                background: "#fff",
                border: "1px solid #eef2f7",
                borderRadius: 14,
                padding: 14,
                marginTop: 12,
              }}
            >
              <div style={{ fontWeight: 900, marginBottom: 10 }}>
                {mode === "edit"
                  ? "Modifier prescription"
                  : "Nouvelle prescription"}
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 12,
                }}
              >
                <div
                  className="form-group"
                  style={{ gridColumn: "1 / span 2" }}
                >
                  <label className="form-label">Médicament *</label>
                  <select
                    className="custom-input"
                    style={{ width: "100%", padding: 10 }}
                    value={draft.medicament_id}
                    onChange={(e) =>
                      setDraft((d) => ({ ...d, medicament_id: e.target.value }))
                    }
                  >
                    <option value="">-- Choisir --</option>
                    {medicaments.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.libelle}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Dosage *</label>
                  <select
                    className="custom-input"
                    style={{ width: "100%", padding: 10 }}
                    value={draft.dosage}
                    onChange={(e) =>
                      setDraft((d) => ({ ...d, dosage: e.target.value }))
                    }
                  >
                    <option value="">-- Choisir --</option>
                    {DOSAGES.map((x) => (
                      <option key={x} value={x}>
                        {x}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Fréquence *</label>
                  <select
                    className="custom-input"
                    style={{ width: "100%", padding: 10 }}
                    value={draft.frequence}
                    onChange={(e) =>
                      setDraft((d) => ({ ...d, frequence: e.target.value }))
                    }
                  >
                    <option value="">-- Choisir --</option>
                    {FREQUENCES.map((x) => (
                      <option key={x} value={x}>
                        {x}
                      </option>
                    ))}
                  </select>
                </div>

                <div
                  className="form-group"
                  style={{ gridColumn: "1 / span 2" }}
                >
                  <label className="form-label">Durée *</label>
                  <Input
                    placeholder="ex: 14 jours"
                    value={draft.duree}
                    onChange={(e) =>
                      setDraft((d) => ({ ...d, duree: e.target.value }))
                    }
                  />
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: 10,
                  marginTop: 12,
                }}
              >
                <button
                  type="button"
                  onClick={cancelForm}
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
                  onClick={submitLine}
                  disabled={!canSubmitLine}
                  style={{
                    background: "#48c6ef",
                    color: "#fff",
                    border: "none",
                    borderRadius: 10,
                    padding: "10px 14px",
                    cursor: !canSubmitLine ? "not-allowed" : "pointer",
                    fontWeight: 900,
                    opacity: !canSubmitLine ? 0.7 : 1,
                  }}
                >
                  {mode === "edit" ? "Modifier" : "Ajouter"}
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
