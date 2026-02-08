// ConsultationForm.jsx
import { useCallback, useEffect, useMemo, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import { useAuth } from "../context/AuthContext";
import Input from "../components/ui/Input/Input";
import Spinner from "../components/ui/Spinner/Spinner";
import Toast from "../components/ui/Toast/Toast";
import PatientMiniCard from "../components/ui/PatientMiniCard/PatientMiniCard";
import Tabs from "../components/ui/Tabs/Tabs";
import Antecedents from "./Antecedents";
import Examens from "./Examens";
import Analyses from "./Analyses";
import Ordonnance from "./Ordonnance";

// ✅ Bouton flottant IA (🤖 + drawer)
import AiFloating from "../components/AiFloating/AiFloating";

const toNumberOrNull = (v) => {
  if (v === "" || v === null || v === undefined) return null;
  const s = String(v).trim().replace(",", ".");
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
};

function computeImc(poids, tailleInput) {
  const p = toNumberOrNull(poids);
  let t = toNumberOrNull(tailleInput);
  if (!p || !t) return "";

  if (t > 0 && t < 3) t = t * 100;
  const m = t / 100;
  if (m <= 0) return "";
  return (p / (m * m)).toFixed(2);
}

function computeAgeYears(dateNaissance) {
  if (!dateNaissance) return null;
  const dob = new Date(dateNaissance);
  if (Number.isNaN(dob.getTime())) return null;

  const now = new Date();
  let age = now.getFullYear() - dob.getFullYear();
  const m = now.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < dob.getDate())) age--;
  return age;
}

function debounce(fn, delay = 700) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), delay);
  };
}

// ✅ petit helper pour éviter que snapshot IA bloque trop longtemps
async function fetchWithTimeout(url, options = {}, timeoutMs = 3500) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    return res;
  } finally {
    clearTimeout(id);
  }
}

export default function ConsultationForm() {
  const { token } = useAuth();
  const { id } = useParams();
  const navigate = useNavigate();

  const [aiLive, setAiLive] = useState({
    loading: false,
    risk_level: "stable",
    risk_score: 0,
    alerts: [],
    observations: [],
    metrics: null,
    checklist: [],
    error: "",
  });
  const GROUPES_SANGUINS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [consult, setConsult] = useState(null);
  const [activeTab, setActiveTab] = useState("consultation");

  const [ageYears, setAgeYears] = useState(null);

  const [form, setForm] = useState({
    motif: "",
    diagnostic: "",
    plan: "",
    poids: "",
    taille: "",
    imc: "",
    temperature: "",
    frequence_cardiaque: "",
    pression_arterielle: "",
    groupe_sanguin: "",
  });

  const [toast, setToast] = useState({
    type: "success",
    title: "",
    message: "",
  });

  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = useCallback((data) => {
    const e = {};
    const requiredText = ["motif"];
    const requiredNumber = [
      "poids",
      "taille",
      "temperature",
      "frequence_cardiaque",
    ];
   
    for (const k of requiredText) {
      if (!String(data[k] ?? "").trim()) e[k] = "Champ obligatoire";
    }

    for (const k of requiredNumber) {
      const n = toNumberOrNull(data[k]);
      if (n === null) e[k] = "Champ obligatoire";
    }

    return e;
  }, []);

  // ✅ évite les réponses IA qui arrivent dans le désordre
  const abortRef = useRef(null);
 const isFinished =
      consult?.salle_attente?.statut === "termine" ||
      consult?.salleAttente?.statut === "termine";
  const runAiPreview = useMemo(
    () =>
      debounce(async (nextForm, ageOverride = null) => {
        if (!token || !id) return;

        const ageToSend =
          typeof ageOverride === "number" ? ageOverride : ageYears;

        try {
          setAiLive((prev) => ({ ...prev, loading: true, error: "" }));

          if (abortRef.current) abortRef.current.abort();
          const controller = new AbortController();
          abortRef.current = controller;

          const res = await fetch(
            "http://127.0.0.1:8000/api/ai/preview/consultation",
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
              signal: controller.signal,
              body: JSON.stringify({
                consultation_id: Number(id),
                age_years: ageToSend,

                temperature: toNumberOrNull(nextForm.temperature),
                frequence_cardiaque: toNumberOrNull(
                  nextForm.frequence_cardiaque,
                ),
                pression_arterielle:
                  String(nextForm.pression_arterielle || "").trim() || null,

                poids: toNumberOrNull(nextForm.poids),
                taille: toNumberOrNull(nextForm.taille),
              }),
            },
          );

          const data = await res.json();

          setAiLive((prev) => ({
            ...prev,
            loading: false,
            risk_level: data.risk_level ?? "stable",
            risk_score: data.risk_score ?? 0,
            alerts: data.alerts ?? [],
            observations: data.observations ?? [],
            metrics: data.metrics ?? null,
            checklist: Array.isArray(data.checklist) ? data.checklist : [],
            error: data.error ?? "",
          }));
        } catch (e) {
          if (e.name === "AbortError") return;
          setAiLive((prev) => ({
            ...prev,
            loading: false,
            error: "IA indisponible",
          }));
        }
      }, 700),
    [token, id, ageYears],
  );

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const res = await fetch(`http://127.0.0.1:8000/api/consultations/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const txt = await res.text();
      if (!res.ok) {
        console.error("Consultation show error:", res.status, txt);
        setError("Impossible de charger la consultation.");
        return;
      }

      const data = txt ? JSON.parse(txt) : null;
      setConsult(data);

      const dob =
        data?.patient?.user?.date_naissance ||
        data?.dme?.patient?.user?.date_naissance ||
        data?.patient?.date_naissance ||
        data?.dme?.patient?.date_naissance ||
        null;

      const computedAge = computeAgeYears(dob);
      setAgeYears(computedAge);

      const next = {
        motif: data?.motif ?? "",
        diagnostic: data?.diagnostic ?? "",
        plan: data?.plan ?? data?.traitement ?? "",
        poids: data?.poids ?? "",
        taille: data?.taille ?? "",
        imc: data?.imc ?? "",
        temperature: data?.temperature ?? "",
        frequence_cardiaque: data?.frequence_cardiaque ?? "",
        pression_arterielle: data?.pression_arterielle ?? "",
        groupe_sanguin: data?.dme?.groupe_sanguin ?? "", // ✅
      };

      if (!next.imc) next.imc = computeImc(next.poids, next.taille);

      setForm(next);
      runAiPreview(next, computedAge);

      setSubmitAttempted(false);
      setErrors({});
    } catch (e) {
      console.error(e);
      setError("Erreur réseau.");
    } finally {
      setLoading(false);
    }
  }, [id, token, runAiPreview]);

  useEffect(() => {
    if (!token) return;
    load();
  }, [token, load]);

  const setField = (k, v) => {
    setForm((f) => {
      const next = { ...f, [k]: v };

      if (k === "poids" || k === "taille") {
        next.imc = computeImc(next.poids, next.taille);
      }

      if (submitAttempted) {
        setErrors(validate(next));
      }

      const vitalKeys = new Set([
        "poids",
        "taille",
        "temperature",
        "frequence_cardiaque",
        "pression_arterielle",
      ]);

      if (vitalKeys.has(k)) {
        runAiPreview(next, ageYears);
      }

      return next;
    });
  };

  // ✅ Enregistrer snapshot IA (historique) — appelé seulement après un PUT réussi
  const saveAiSnapshot = useCallback(
    async (source) => {
      if (!token || !id) return;

      try {
        await fetchWithTimeout(
          "http://127.0.0.1:8000/api/ai/snapshot/consultation",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              consultation_id: Number(id),
              age_years: typeof ageYears === "number" ? ageYears : null,

              temperature: toNumberOrNull(form.temperature),
              frequence_cardiaque: toNumberOrNull(form.frequence_cardiaque),
              pression_arterielle:
                String(form.pression_arterielle || "").trim() || null,

              poids: toNumberOrNull(form.poids),
              taille: toNumberOrNull(form.taille),

              source, // "save" | "finish"
            }),
          },
          3500,
        );
      } catch (e) {
        // ✅ Pro: ne pas bloquer la sauvegarde consultation si snapshot IA échoue
        console.warn("Snapshot IA non enregistré:", e);
      }
    },
    [token, id, ageYears, form],
  );

  const save = async (finish = false) => {
    setSubmitAttempted(true);

    const e = validate(form);
    setErrors(e);

    if (Object.keys(e).length > 0) {
      setToast({
        type: "error",
        title: "Champs manquants",
        message: "Veuillez remplir tous les champs obligatoires.",
      });
      return;
    }

    try {
      setSaving(true);
      setError("");

      const payload = {
        motif: form.motif.trim(),
        diagnostic: form.diagnostic.trim(),
        plan: form.plan?.trim() || null,
        poids: toNumberOrNull(form.poids),
        taille: toNumberOrNull(form.taille),
        temperature: toNumberOrNull(form.temperature),
        frequence_cardiaque: toNumberOrNull(form.frequence_cardiaque),
        pression_arterielle: form.pression_arterielle.trim(),
        groupe_sanguin: form.groupe_sanguin || null, // ✅
        finish,
      };

      const res = await fetch(`http://127.0.0.1:8000/api/consultations/${id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const txt = await res.text();
      if (!res.ok) {
        console.error("Consultation update error:", res.status, txt);
        setError("Erreur lors de l’enregistrement.");
        setToast({
          type: "error",
          title: "Erreur",
          message: "Enregistrement impossible. Vérifiez les champs.",
        });
        return;
      }

      // ✅ Snapshot IA (historique) — après sauvegarde OK
      await saveAiSnapshot(finish ? "finish" : "save");

      setToast({
        type: "success",
        title: "OK",
        message: finish
          ? "Consultation enregistrée et terminée."
          : "Consultation enregistrée.",
      });

      if (finish) {
        navigate("/medecin");
      } else {
        await load();
      }
    } catch (e) {
      console.error(e);
      setError("Erreur réseau.");
      setToast({
        type: "error",
        title: "Erreur réseau",
        message: "Veuillez réessayer.",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Layout>
      <h2>Consultation</h2>

      {loading && (
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Spinner size={18} color="#48c6ef" />
          Chargement...
        </div>
      )}

      {error && <div style={{ color: "red", fontWeight: "bold" }}>{error}</div>}

      {!loading && consult && (
        <div style={{ display: "flex", gap: 16, flexDirection: "column" }}>
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: 16,
              flexWrap: "wrap",
            }}
          >
            <div style={{ flexShrink: 0, minWidth: 320 }}>
              <PatientMiniCard
                variant="patient"
                patient={consult?.patient}
                dme={consult?.dme}
                title="Informations Patient"
              />

              <div style={{ marginTop: 12 }}>
                <PatientMiniCard
                  variant="vitals"
                  title="Constantes Vitales"
                  vitals={form}
                  onChangeVital={setField}
                  submitAttempted={submitAttempted}
                  errors={errors}
                />
              </div>
            </div>

            <div style={{ flex: 2, minWidth: 520 }}>
              <Tabs
                activeKey={activeTab}
                onChange={setActiveTab}
                tabs={[
                  {
                    key: "consultation",
                    label: "Consultation",
                    content: (
                      <>
                        <div
                          className="form-group"
                          style={{ marginBottom: 12 }}
                        >
                          <label className="form-label">Motif</label>
                          <Input
                            value={form.motif}
                            onChange={(e) => setField("motif", e.target.value)}
                          />
                        </div>

                        <div
                          className="form-group"
                          style={{ marginBottom: 12 }}
                        >
                          <label className="form-label">Diagnostic</label>
                          <textarea
                            className="custom-input"
                            style={{ minHeight: 90, padding: 10 }}
                            value={form.diagnostic}
                            onChange={(e) =>
                              setField("diagnostic", e.target.value)
                            }
                          />
                        </div>

                        <div
                          className="form-group"
                          style={{ marginBottom: 12 }}
                        >
                          <label className="form-label">Plan / Notes</label>
                          <textarea
                            className="custom-input"
                            style={{ minHeight: 90, padding: 10 }}
                            value={form.plan}
                            onChange={(e) => setField("plan", e.target.value)}
                          />
                        </div>

                        <div
                          style={{
                            display: "flex",
                            justifyContent: "flex-end",
                            gap: 12,
                            marginTop: 14,
                            flexWrap: "wrap",
                          }}
                        >
                          <button
                            type="button"
                            onClick={() => navigate("/medecin")}
                            style={{
                              background: "#f5f5f5",
                              border: "none",
                              borderRadius: 10,
                              padding: "10px 18px",
                              cursor: "pointer",
                            }}
                          >
                            Retour
                          </button>

                          <button
                            type="button"
                            disabled={saving}
                            onClick={() => save(false)}
                            style={{
                              background: "#48c6ef",
                              color: "#fff",
                              border: "none",
                              borderRadius: 10,
                              padding: "10px 18px",
                              cursor: "pointer",
                              fontWeight: 700,
                            }}
                          >
                            {saving ? "En cours..." : "Enregistrer"}
                          </button>

                          <button
                            type="button"
                            disabled={saving}
                            onClick={() => save(true)}
                            style={{
                              background: "#10b981",
                              color: "#fff",
                              border: "none",
                              borderRadius: 10,
                              padding: "10px 18px",
                              cursor: "pointer",
                              fontWeight: 700,
                            }}
                          >
                            {saving ? "En cours..." : "Enregistrer et terminer"}
                          </button>
                        </div>
                      </>
                    ),
                  },
                  {
                    key: "antecedents",
                    label: "Antécédents",
                    content: (
                      <Antecedents
                        token={token}
                        dmeId={consult?.dme?.id}
                        consultationId={consult?.id}
                      />
                    ),
                  },
                  {
                    key: "examens",
                    label: "Examens",
                    content: (
                      <Examens
                        token={token}
                        dmeId={consult?.dme?.id}
                        consultationId={consult?.id}
                        allowResults={isFinished}
                      />
                    ),
                  },
                  {
                    key: "analyses",
                    label: "Analyses",
                    content: (
                      <Analyses
                        token={token}
                        dmeId={consult?.dme?.id}
                        consultationId={consult?.id}
                        allowResults={false}
                      />
                    ),
                  },
                  {
                    key: "ordonnance",
                    label: "Ordonnance",
                    content: (
                      <Ordonnance
                        token={token}
                        consultationId={id}
                        patient={consult?.dme?.patient || consult?.patient}
                        medecin={consult?.medecin}
                      />
                    ),
                  },
                  {
                    key: "certificat",
                    label: "Certificat",
                    content: (
                      <div>
                        TODO: certificat (texte + génération PDF plus tard)
                      </div>
                    ),
                  },
                ]}
              />
            </div>
          </div>
        </div>
      )}

      <Toast
        type={toast.type}
        title={toast.title}
        message={toast.message}
        onClose={() => setToast({ ...toast, title: "", message: "" })}
      />

      {/* ✅ IA Floating (🤖 + badge + drawer) */}
      <AiFloating aiLive={aiLive} ageYears={ageYears} />
    </Layout>
  );
}
