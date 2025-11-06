import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children, roleRequired }) {
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");

  // Securité front, le backend doit aussi protéger
  if (!token || role !== roleRequired) {
    // Redirige automatiquement vers /login si pas connecté ou mauvais rôle
    return <Navigate to="/login" replace />;
  }
  return children;
}
