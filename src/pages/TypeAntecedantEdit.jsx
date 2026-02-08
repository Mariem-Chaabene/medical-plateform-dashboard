import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
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

export default function TypeAntecedantEdit() {
  const { id } = useParams();
  const { token } = useAuth();
  const navigate = useNavigate();

  const [values, setValues] = useState({ code: "", libelle: "" });
  const [loading, setLoading] = useState(true);
  const [apiErrors, setApiErrors] = useState({});
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (!token || !id) return;

    const controller = new AbortController();
    setLoading(true);
    setError("");
    setApiErrors({});
    setSuccess("");

    fetch(`${API_BASE}/type-antecedants/${id}`, {
      signal: controller.signal,
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
    })
      .then(async (res) => {
        const body = await res.json().catch(() => null);
        if (!res.ok) throw new Error(body?.message || "Introuvable");
        return body;
      })
      .then((payload) => {
        const data = payload?.data ?? payload;
        setValues({ code: data?.code || "", libelle: data?.libelle || "" });
      })
      .catch((e) => {
        if (e.name !== "AbortError") setError(e.message || "Erreur");
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [id, token]);

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
      const res = await fetch(`${API_BASE}/type-antecedants/${id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(values),
      });

      const body = await res.json().catch(() => null);

      if (!res.ok) {
        setError(body?.message || "Erreur modification");
        setApiErrors(normalizeErrors(body?.errors));
        return;
      }

      setSuccess("Modifié avec succès");
      setTimeout(() => navigate("/type_antecedants"), 700);
    } catch {
      setError("Erreur réseau");
    }
  };

  return (
    <Layout>
      <h2 style={{ marginBottom: 32 }}>Modifier Type d’antécédent</h2>

      {loading && <div>Chargement ...</div>}
      {error && <div style={{ color: "red", marginBottom: 16 }}>{error}</div>}
      {success && <div style={{ color: "green", marginBottom: 16 }}>{success}</div>}

      {!loading && (
        <form className="form" onSubmit={handleSubmit}>
          <div className="form-row" style={{ marginBottom: 24 }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Code</label>
              <Input
                value={values.code}
                onChange={(e) => setValues((v) => ({ ...v, code: e.target.value }))}
                error={apiErrors.code}
              />
              {apiErrors.code && <div className="form-error">{apiErrors.code}</div>}
            </div>

            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Libellé</label>
              <Input
                value={values.libelle}
                onChange={(e) => setValues((v) => ({ ...v, libelle: e.target.value }))}
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
      )}
    </Layout>
  );
}
