// src/pages/Ordonnance.jsx
import { useEffect, useMemo, useState } from "react";
import Input from "../components/ui/Input/Input";
import OrdonnanceDocument from "../components/ordonnance/OrdonnanceDocument";

const API = "http://127.0.0.1:8000/api";

const DOSAGES = ["250 mg", "500 mg", "1 g"];
const FREQUENCES = [
  "1 fois/jour",
  "2 fois/jour",
  "3 fois/jour",
  "Toutes les 8h",
];

const iconEdit = (
  <svg
    width="20"
    height="20"
    fill="none"
    stroke="#b2b2b2"
    strokeWidth="2"
    viewBox="0 0 24 24"
  >
    <path d="M12 20h9" />
    <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
  </svg>
);
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

  const [medicaments, setMedicaments] = useState([]);
  const [lines, setLines] = useState([]);

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

  const PrintIcon = (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path
        d="M7 8V4h10v4"
        stroke="grey"
        strokeWidth="2"
        strokeLinecap="round"
      />
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

  // ✅ patient/medecin : priorité aux props (pour éviter show consultation sans relations)
  const resolvedPatient =
    patientProp ||
    consultation?.dme?.patient?.user ||
    consultation?.patient?.user ||
    consultation?.dme?.patient ||
    consultation?.patient ||
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

  // ✅ Enrichir lignes backend : si backend renvoie seulement medicament_id, on map avec la liste medicaments
  const printableLines = useMemo(() => {
    const medsById = new Map(medicaments.map((m) => [Number(m.id), m]));
    return (lines || []).map((l) => {
      const mid = Number(l?.medicament_id ?? l?.medicament?.id);
      const medObj = l?.medicament?.libelle
        ? l.medicament
        : medsById.get(mid) || null;
      return {
        ...l,
        medicament_id: mid || l?.medicament_id,
        medicament: medObj,
        medicament_libelle:
          l?.medicament_libelle || medObj?.libelle || l?.medicament?.libelle,
      };
    });
  }, [lines, medicaments]);

  const formatLine = (l) => {
    const label = l?.medicament?.libelle || l?.medicament_libelle || "—";
    return `${label} | ${l?.dosage || "—"} | ${l?.frequence || "—"} | ${l?.duree || "—"}`;
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
        setConsultation(consTxt ? JSON.parse(consTxt) : null);
      } else {
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
      medicament: medObj, // utile côté UI
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

  // ✅ PRINT: ouvre modal + lance print (sans redirect)
  const handlePrint = () => {
    if (!printableLines.length) {
      setError("Aucune ligne à imprimer.");
      return;
    }
    setError("");
    setTimeout(() => {
      window.print();
    }, 250);
  };

  return (
    <div>
      <style>{`
  @page { size: A4; margin: 12mm; }
  @media screen {
    #print-root { display: none; }
  }
  @media print {
    body * { visibility: hidden !important; }
    #print-root, #print-root * { visibility: visible !important; }
    #print-root {
      display: block !important;
      position: fixed;
      left: 0;
      top: 0;
      width: 100%;
    }
  }
`}</style>

      {loading && <div>Chargement...</div>}

      {error && (
        <div style={{ color: "red", fontWeight: 800, marginBottom: 10 }}>
          {error}
        </div>
      )}

      {!loading && (
        <>
          {/* ✅ bouton + en haut à droite (PAS de print ici pour éviter doublon) */}
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
          {printableLines.length > 0 && (
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
                <div style={{ textAlign: "right" }}>
                  <button
                    type="button"
                    onClick={handlePrint}
                    style={{
                      background: "transparent",
                      border: "grey",
                      padding: 0,
                      cursor: "pointer",
                      lineHeight: 0,
                    }}
                    title="Imprimer ordonnance"
                    aria-label="Imprimer ordonnance"
                  >
                    {PrintIcon}
                  </button>
                </div>
              </div>

              {printableLines.map((l, idx) => (
                <div
                  key={idx}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 120px",
                    padding: "10px 12px",
                    borderBottom:
                      idx === printableLines.length - 1
                        ? "none"
                        : "1px solid #eef2f7",
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
                      {iconEdit}
                    </button>

                    <button
                      type="button"
                      onClick={() => removeLine(idx)}
                      style={{
                        ...iconBtn,
                        borderColor: "#b2b2b2",
                        color: "#b2b2b2",
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
          {printableLines.length > 0 && !showForm && (
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
      <div id="print-root">
        <OrdonnanceDocument
          patient={resolvedPatient}
          medecin={resolvedMedecin}
          cabinet={resolvedCabinet}
          lignes={printableLines}
          dateOrdonnance={new Date().toISOString()}
        />
      </div>
    </div>
  );
}
