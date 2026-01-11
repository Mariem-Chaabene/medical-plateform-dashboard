import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Layout from "../components/Layout";

export default function Home() {
  const { role } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!role) return;

    if (role === "medecin") navigate("/medecin", { replace: true });
    else if (role === "infirmier") navigate("/salle-attente", { replace: true });
    else if (role === "admin") navigate("/users", { replace: true });
    else if (role === "patient") navigate("/mon-dme", { replace: true });
  }, [role, navigate]);

  return (
    <Layout>
      <h1>Bienvenue</h1>
    </Layout>
  );
}
