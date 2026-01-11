import { useCallback, useEffect, useState } from "react";
import Layout from "../components/Layout";
import { useAuth } from "../context/AuthContext";
import KpiCard from "../components/ui/KpiCard/KpiCard";
import Spinner from "../components/ui/Spinner/Spinner";
import "./MedecinDashboard.css";

const CalendarIcon = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <path d="M7 2v3M17 2v3M3 9h18" stroke="white" strokeWidth="2" strokeLinecap="round" />
    <path
      d="M5 6h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2Z"
      stroke="white"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
);

const UsersIcon = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <path
      d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"
      stroke="white"
      strokeWidth="2"
      strokeLinecap="round"
    />
    <path
      d="M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z"
      stroke="white"
      strokeWidth="2"
      strokeLinecap="round"
    />
    <path
      d="M23 21v-2a4 4 0 0 0-3-3.87"
      stroke="white"
      strokeWidth="2"
      strokeLinecap="round"
    />
    <path
      d="M16 3.13a4 4 0 0 1 0 7.75"
      stroke="white"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
);

export default function MedecinDashboard() {
  const { token } = useAuth();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadDashboard = useCallback(async () => {
    try {
      setError("");

      const res = await fetch("http://127.0.0.1:8000/api/medecin/dashboard", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const txt = await res.text();
        console.error("Dashboard API error:", txt);
        throw new Error("Erreur API dashboard");
      }

      const json = await res.json();
      setData(json);
    } catch (e) {
      console.error(e);
      setError("Impossible de charger le dashboard médecin.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    setLoading(true);
    loadDashboard();
  }, [loadDashboard]);

  // ✅ auto-refresh (pour voir quand le secrétaire passe en_consultation)
  useEffect(() => {
    const t = setInterval(() => {
      loadDashboard();
    }, 5000);
    return () => clearInterval(t);
  }, [loadDashboard]);

  const rdvToday = data?.kpis?.rdv_today ?? 0;
  const salleToday = data?.kpis?.salle_today ?? 0;
  const date = data?.date ?? "";

  return (
    <Layout>
      <h2>Accueil</h2>

      <div className="medecin-kpi-row">
        <KpiCard
          title="Nbr de Rendez-vous"
          value={
            loading ? (
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Spinner size={16} color="#fff" />
                Chargement...
              </div>
            ) : (
              rdvToday
            )
          }
          subtitle=""
          icon={CalendarIcon}
          variant="blue"
        />

        <KpiCard
          title="Nbr de patient en Salle d’attente"
          value={
            loading ? (
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Spinner size={16} color="#fff" />
                Chargement...
              </div>
            ) : (
              salleToday
            )
          }
          subtitle=""
          icon={UsersIcon}
          variant="purple"
        />
      </div>

      {error && (
        <div style={{ color: "red", fontWeight: "bold", marginTop: 10 }}>
          {error}
        </div>
      )}

      {/* Tu peux ajouter ici plus tard: patient actuel, liste d'attente, etc. */}
    </Layout>
  );
}
