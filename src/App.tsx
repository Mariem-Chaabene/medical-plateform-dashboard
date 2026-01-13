import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Login from "./pages/Login";
import ProtectedRoute from "./components/ProtectedRoute";
import Users, { PrivateRoute } from "./pages/Users";
import UserDetail from "./pages/UserDetail";

import UserProfile from "./pages/UserProfile";
import CreateUser from "./pages/CreateUser";
import Home from "./pages/Home";
import Patients from "./pages/Patients";
import CreatePatient from "./pages/CreatePatient";
import PatientShow from "./pages/PatientShow";
import PatientEdit from "./pages/PatientEdit";
import SalleAttente from "./pages/SalleAttente";
import RendezVous from "./pages/RendezVous";
import MedecinDashboard from "./pages/MedecinDashboard";
import ConsultationForm from "./pages/ConsultationForm";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route
          path="/home"
          element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          }
        />

        <Route
          path="/users"
          element={
            <PrivateRoute requiredRole="admin">
              <Users />
            </PrivateRoute>
          }
        />

        <Route
          path="/users/create"
          element={
            <PrivateRoute requiredRole="admin">
              <CreateUser />
            </PrivateRoute>
          }
        />

        <Route
          path="/users/:id/edit"
          element={
            <ProtectedRoute>
              <UserDetail />
            </ProtectedRoute>
          }
        />

        <Route
          path="/users/:id"
          element={
            <ProtectedRoute>
              <UserProfile />
            </ProtectedRoute>
          }
        />

        <Route
          path="/patients"
          element={
            <ProtectedRoute>
              <Patients />
            </ProtectedRoute>
          }
        />

        <Route
          path="/patients/create"
          element={
            <ProtectedRoute>
              <CreatePatient />
            </ProtectedRoute>
          }
        />

        <Route
          path="/patients/:id"
          element={
            <ProtectedRoute>
              <PatientShow />
            </ProtectedRoute>
          }
        />

        <Route
          path="/patients/:id/edit"
          element={
            <ProtectedRoute>
              <PatientEdit />
            </ProtectedRoute>
          }
        />

        {/* ✅ Dashboard médecin */}
        <Route
          path="/medecin"
          element={
            <PrivateRoute requiredRole="medecin">
              <MedecinDashboard />
            </PrivateRoute>
          }
        />

        {/* ✅ Page consultation */}
        <Route
          path="/consultations/:id"
          element={
            <PrivateRoute requiredRole="medecin">
              <ConsultationForm />
            </PrivateRoute>
          }
        />

        <Route
          path="/salle-attente"
          element={
            <ProtectedRoute>
              <SalleAttente />
            </ProtectedRoute>
          }
        />

        <Route
          path="/rendez-vous"
          element={
            <ProtectedRoute>
              <RendezVous />
            </ProtectedRoute>
          }
        />

        <Route path="/" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
