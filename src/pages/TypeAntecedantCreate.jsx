import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Layout from "../components/Layout";
import Input from "../components/ui/Input/Input";
import BackButton from "../components/ui/Button/BackButton";

const API_BASE = "http://127.0.0.1:8000/api";

const normalizeErrors = (errors) => {
  if (!errors || typeof errors !== "object") return {};
  const out = {};
  Object.entries(errors).forEach(([k, v]) => {
    out[k] = Array.isArray(v) ? v[0] : v;
  });
  return out;
};

export default function TypeAntecedantCreate() {
  const { token } = useAuth();
  const navigate = useNavigate();

  const [values, setValues] = useState({ code: "", libelle: "" });
  const [apiErrors, setApiErrors] = useState({});
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setApiErrors({});

    if (!token) {
      setError("Session expirée. Reconnecte-toi.");
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/type-antecedants`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(values),
      });

      const body = await res.json().catch(() => null);

      if (!res.ok) {
        setError(body?.message || "Erreur création");
        setApiErrors(normalizeErrors(body?.errors));
        return;
      }

      setSuccess("Créé avec succès");
      setTimeout(() => navigate("/type_antecedants"), 700);
    } catch {
      setError("Erreur réseau");
    }
  };

  return (
    <Layout>
      <h2 style={{ marginBottom: 32 }}>Créer Type d’antécédent</h2>

      {error && <div style={{ color: "red", marginBottom: 16 }}>{error}</div>}
      {success && <div style={{ color: "green", marginBottom: 16 }}>{success}</div>}

      <form className="form" onSubmit={handleSubmit}>
        <div className="form-row" style={{ marginBottom: 24 }}>
          <div className="form-group" style={{ flex: 1 }}>
            <label className="form-label">Code</label>
            <Input
              value={values.code}
              onChange={(e) => setValues((v) => ({ ...v, code: e.target.value }))}
              placeholder="ex: RX01"
              error={apiErrors.code}
            />
            {apiErrors.code && <div className="form-error">{apiErrors.code}</div>}
          </div>

          <div className="form-group" style={{ flex: 1 }}>
            <label className="form-label">Libellé</label>
            <Input
              value={values.libelle}
              onChange={(e) => setValues((v) => ({ ...v, libelle: e.target.value }))}
              placeholder="ex: Hypertension"
              error={apiErrors.libelle}
            />
            {apiErrors.libelle && <div className="form-error">{apiErrors.libelle}</div>}
          </div>
        </div>

        <div className="form-btn-row">
          <BackButton />
          <button type="submit" className="form-btn">Enregistrer</button>
        </div>
      </form>
    </Layout>
  );
}
