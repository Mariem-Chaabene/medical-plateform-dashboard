import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Layout from "../components/Layout";
import Input from "../components/ui/Input/Input";
import BackButton from "../components/ui/Button/BackButton";

export default function TypeAnalyseEdit() {
  const { id } = useParams();
  const { token } = useAuth();
  const navigate = useNavigate();

  const [libelle, setLibelle] = useState("");
  const [loading, setLoading] = useState(true);
  const [apiErrors, setApiErrors] = useState({});
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    setLoading(true);
    fetch(`http://127.0.0.1:8000/api/type-analyses/${id}`, {
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
    })
      .then(async (res) => {
        const body = await res.json().catch(() => null);
        if (!res.ok) throw new Error(body?.message || "Introuvable");
        return body;
      })
      .then((data) => setLibelle(data.libelle || ""))
      .catch((e) => setError(e.message || "Erreur"))
      .finally(() => setLoading(false));
  }, [id, token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); setSuccess(""); setApiErrors({});

    try {
      const res = await fetch(`http://127.0.0.1:8000/api/type-analyses/${id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ libelle }),
      });

      const body = await res.json().catch(() => null);

      if (!res.ok) {
        setError(body?.message || "Erreur modification");
        setApiErrors(body?.errors || {});
        return;
      }

      setSuccess("Modifié avec succès");
      setTimeout(() => navigate("/type_analyses"), 800);
    } catch {
      setError("Erreur réseau");
    }
  };

  if (loading) return <Layout><div>Chargement ...</div></Layout>;
  if (error) return <Layout><div style={{ color: "red" }}>{error}</div></Layout>;

  return (
    <Layout>
      <h2 style={{ marginBottom: 32 }}>Modifier Type d’analyse</h2>
      {success && <div style={{ color: "green", marginBottom: 16 }}>{success}</div>}

      <form className="form" onSubmit={handleSubmit}>
        <div className="form-row" style={{ marginBottom: 24 }}>
          <div className="form-group" style={{ flex: 1 }}>
            <label className="form-label">Libellé</label>
            <Input
              value={libelle}
              onChange={(e) => setLibelle(e.target.value)}
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
