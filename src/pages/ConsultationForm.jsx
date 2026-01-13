import { useCallback, useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import { useAuth } from "../context/AuthContext";
import Input from "../components/ui/Input/Input";
import Spinner from "../components/ui/Spinner/Spinner";
import Toast from "../components/ui/Toast/Toast";
import PatientMiniCard from "../components/ui/PatientMiniCard/PatientMiniCard";

function computeImc(poids, tailleCm) {
  const p = Number(poids);
  const t = Number(tailleCm);
  if (!p || !t) return "";
  const m = t / 100;
  if (m <= 0) return "";
  return (p / (m * m)).toFixed(2);
}

export default function ConsultationForm() {
  const { token } = useAuth();
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [consult, setConsult] = useState(null);

  const [form, setForm] = useState({
    motif: "",
    diagnostic: "",
    traitement: "",
    poids: "",
    taille: "",
    imc: "", // ✅
    temperature: "",
    frequence_cardiaque: "",
    pression_arterielle: "",
  });

  const [toast, setToast] = useState({
    type: "success",
    title: "",
    message: "",
  });

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

      setForm({
        motif: data?.motif || "",
        diagnostic: data?.diagnostic || "",
        traitement: data?.traitement || "",
        poids: data?.poids ?? "",
        taille: data?.taille ?? "",
        imc: data?.imc ?? "", // ✅
        temperature: data?.temperature ?? "",
        frequence_cardiaque: data?.frequence_cardiaque ?? "",
        pression_arterielle: data?.pression_arterielle ?? "",
      });
    } catch (e) {
      console.error(e);
      setError("Erreur réseau.");
    } finally {
      setLoading(false);
    }
  }, [id, token]);

  useEffect(() => {
    if (!token) return;
    load();
  }, [token, load]);

  const setField = (k, v) =>
    setForm((f) => {
      const next = { ...f, [k]: v };

      if (k === "poids" || k === "taille") {
        next.imc = computeImc(next.poids, next.taille);
      }

      return next;
    });

  const save = async (finish = false) => {
    try {
      setSaving(true);
      setError("");

      const payload = {
        motif: form.motif,
        diagnostic: form.diagnostic ,
        traitement: form.traitement ,
        poids: Number(form.poids),
        taille:  Number(form.taille),
        temperature: Number(form.temperature),
        frequence_cardiaque: Number(form.frequence_cardiaque),
        pression_arterielle: form.pression_arterielle,
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
        return;
      }

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
    } finally {
      setSaving(false);
    }
  };
  const isValid = () => {
    const requiredText = [
      "motif",
      "diagnostic",
      "traitement",
      "pression_arterielle",
    ];
    const requiredNumber = [
      "poids",
      "taille",
      "temperature",
      "frequence_cardiaque",
    ];

    for (const k of requiredText) {
      if (!String(form[k] ?? "").trim()) return false;
    }
    for (const k of requiredNumber) {
      if (form[k] === "" || form[k] === null || Number.isNaN(Number(form[k])))
        return false;
    }
    return true;
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
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "360px 1fr",
            gap: 16,
            alignItems: "start",
          }}
        >
          {/* colonne gauche */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <PatientMiniCard
              variant="patient"
              patient={consult?.patient}
              dme={consult?.dme}
              title="Informations Patient"
            />

            <PatientMiniCard
              variant="vitals"
              title="Constantes Vitales"
              vitals={form}
              onChangeVital={setField}
            />
          </div>

          <div
            style={{
              background: "#fff",
              border: "1px solid #eee",
              borderRadius: 14,
              padding: 16,
            }}
          >
            <div className="form-group" style={{ marginBottom: 12 }}>
              <label className="form-label">Motif</label>
              <Input
                value={form.motif}
                onChange={(e) => setField("motif", e.target.value)}
              />
            </div>

            <div className="form-group" style={{ marginBottom: 12 }}>
              <label className="form-label">Diagnostic</label>
              <textarea
                className="custom-input"
                style={{ minHeight: 90, padding: 10 }}
                value={form.diagnostic}
                onChange={(e) => setField("diagnostic", e.target.value)}
              />
            </div>

            <div className="form-group" style={{ marginBottom: 12 }}>
              <label className="form-label">Traitement</label>
              <textarea
                className="custom-input"
                style={{ minHeight: 90, padding: 10 }}
                value={form.traitement}
                onChange={(e) => setField("traitement", e.target.value)}
              />
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: 12,
                marginTop: 14,
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
                disabled={saving || !isValid()}
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
                disabled={saving || !isValid()}
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
          </div>
        </div>
      )}

      <Toast
        type={toast.type}
        title={toast.title}
        message={toast.message}
        onClose={() => setToast({ ...toast, title: "", message: "" })}
      />
    </Layout>
  );
}
