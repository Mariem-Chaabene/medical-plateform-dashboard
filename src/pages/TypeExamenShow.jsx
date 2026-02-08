import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Layout from "../components/Layout";
import BackButton from "../components/ui/Button/BackButton";

export default function TypeExamenShow() {
  const { id } = useParams();
  const { token } = useAuth();

  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    fetch(`http://127.0.0.1:8000/api/type-examens/${id}`, {
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
    })
      .then(async (res) => {
        const body = await res.json().catch(() => null);
        if (!res.ok) throw new Error(body?.message || "Introuvable");
        return body;
      })
      .then(setItem)
      .catch((e) => setError(e.message || "Erreur"))
      .finally(() => setLoading(false));
  }, [id, token]);

  if (loading) return <Layout><div>Chargement ...</div></Layout>;
  if (error) return <Layout><div style={{ color: "red" }}>{error}</div></Layout>;

  return (
    <Layout>
      <h2 style={{ marginBottom: 24 }}>Détails Type Examen</h2>
      <div style={{ marginBottom: 16 }}><b>ID:</b> {item.id}</div>
      <div style={{ marginBottom: 16 }}><b>Code:</b> {item.code}</div>
      <div style={{ marginBottom: 16 }}><b>Libellé:</b> {item.libelle}</div>
      <BackButton />
    </Layout>
  );
}
