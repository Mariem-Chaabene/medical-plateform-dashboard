import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Layout from "../components/Layout";
import BackButton from "../components/ui/Button/BackButton";

const API_BASE = "http://127.0.0.1:8000/api";

export default function TypeAntecedantShow() {
  const { id } = useParams();
  const { token } = useAuth();

  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token || !id) return;

    const controller = new AbortController();
    setLoading(true);
    setError("");
    setItem(null);

    fetch(`${API_BASE}/type-antecedants/${id}`, {
      signal: controller.signal,
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
    })
      .then(async (res) => {
        const body = await res.json().catch(() => null);
        if (!res.ok) throw new Error(body?.message || "Introuvable");
        return body;
      })
      .then((data) => setItem(data?.data ?? data))
      .catch((e) => {
        if (e.name !== "AbortError") setError(e.message || "Erreur");
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [id, token]);

  return (
    <Layout>
      <h2 style={{ marginBottom: 24 }}>Détails Type Antécédent</h2>

      {loading && <div>Chargement ...</div>}
      {error && <div style={{ color: "red" }}>{error}</div>}

      {!loading && !error && item && (
        <>
          <div style={{ marginBottom: 16 }}>
            <b>ID:</b> {item.id}
          </div>

          {"code" in item && (
            <div style={{ marginBottom: 16 }}>
              <b>Code:</b> {item.code || "-"}
            </div>
          )}

          <div style={{ marginBottom: 16 }}>
            <b>Libellé:</b> {item.libelle}
          </div>
        </>
      )}

      <BackButton />
    </Layout>
  );
}
