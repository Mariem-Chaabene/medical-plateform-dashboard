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
import Roles from "./pages/Roles";
import RoleCreate from "./pages/RoleCreate";
import RoleShow from "./pages/RoleShow";
import RoleEdit from "./pages/RoleEdit";
import TypeAnalyses from "./pages/TypeAnalyses";
import TypeAnalyseCreate from "./pages/TypeAnalyseCreate";
import TypeAnalyseShow from "./pages/TypeAnalyseShow";
import TypeAnalyseEdit from "./pages/TypeAnalyseEdit";

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
          path="/roles"
          element={
            <PrivateRoute requiredRole="admin">
              <Roles />
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
          path="/roles"
          element={
            <PrivateRoute requiredRole="admin">
              <Roles />
            </PrivateRoute>
          }
        />

        <Route
          path="/roles/create"
          element={
            <PrivateRoute requiredRole="admin">
              <RoleCreate />
            </PrivateRoute>
          }
        />

        <Route
          path="/roles/:id"
          element={
            <PrivateRoute requiredRole="admin">
              <RoleShow />
            </PrivateRoute>
          }
        />

        <Route
          path="/roles/:id/edit"
          element={
            <PrivateRoute requiredRole="admin">
              <RoleEdit />
            </PrivateRoute>
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
        <Route
          path="/type_analyses"
          element={
            <ProtectedRoute>
              <TypeAnalyses />
            </ProtectedRoute>
          }
        />

        <Route
          path="/type_analyses/create"
          element={
            <PrivateRoute requiredRole="admin">
              <TypeAnalyseCreate />
            </PrivateRoute>
          }
        />

        <Route
          path="/type_analyses/:id"
          element={
            <ProtectedRoute>
              <TypeAnalyseShow />
            </ProtectedRoute>
          }
        />

        <Route
          path="/type_analyses/:id/edit"
          element={
            <PrivateRoute requiredRole="admin">
              <TypeAnalyseEdit />
            </PrivateRoute>
          }
        />

        <Route path="/" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
