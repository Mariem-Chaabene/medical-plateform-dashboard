import { useAuth } from "../context/AuthContext";
import Layout from "../components/Layout";

export default function Home() {
  const { user, role } = useAuth();

  return (
      <Layout>
      <h1>Bienvenue </h1>
    </Layout>
  );
}


