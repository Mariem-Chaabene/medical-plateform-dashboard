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

        <Route path="/users" element={<PrivateRoute requiredRole="admin"><Users /></PrivateRoute>}/>

        <Route path="/users/:id/edit" element={<UserDetail />} />
        
        <Route path="/users/:id" element={<UserProfile />} />

        <Route path="/users/create" element={<CreateUser />} />

        <Route path="/patients" element={ <ProtectedRoute> <Patients /> </ProtectedRoute> }/>

        <Route path="/patients/create" element={ <ProtectedRoute><CreatePatient /></ProtectedRoute> } />
        
        <Route path="/patients/:id" element={<PatientShow />} />

        <Route path="/patients/:id/edit" element={<PatientEdit />} />
        <Route path="/medecin" element={<MedecinDashboard />} />

        <Route path="/salle-attente" element={<ProtectedRoute><SalleAttente /></ProtectedRoute>} />
        <Route path="/rendez-vous" element={ <ProtectedRoute> <RendezVous /></ProtectedRoute>}/>
        <Route path="/" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
