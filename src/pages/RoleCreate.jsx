import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Layout from "../components/Layout";
import Input from "../components/ui/Input/Input";
import BackButton from "../components/ui/Button/BackButton";

export default function RoleCreate() {
  const { token } = useAuth();
  const navigate = useNavigate();

  const [values, setValues] = useState({ name: "", guard_name: "api" });
  const [apiErrors, setApiErrors] = useState({});
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); setSuccess(""); setApiErrors({});

    try {
      const res = await fetch("http://127.0.0.1:8000/api/roles", {
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
        setError(body?.message || "Erreur création rôle");
        setApiErrors(body?.errors || {});
        return;
      }

      setSuccess("Rôle créé !");
      setTimeout(() => navigate("/roles"), 900);
    } catch {
      setError("Erreur réseau");
    }
  };

  return (
    <Layout>
      <h2 style={{ marginBottom: 32 }}>Créer un rôle</h2>
      {error && <div style={{ color: "red", marginBottom: 16 }}>{error}</div>}
      {success && <div style={{ color: "green", marginBottom: 16 }}>{success}</div>}

      <form className="form" onSubmit={handleSubmit}>
        <div className="form-row" style={{ marginBottom: 24 }}>
          <div className="form-group" style={{ flex: 1 }}>
            <label className="form-label">Nom</label>
            <Input
              value={values.name}
              onChange={(e) => setValues((v) => ({ ...v, name: e.target.value }))}
              placeholder="ex: secretaire"
              error={apiErrors.name}
            />
            {apiErrors.name && <div className="form-error">{apiErrors.name}</div>}
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
