import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Login from "./pages/Login";
import AdminDashboard from "./pages/AdminDashboard";
import ProtectedRoute from "./components/ProtectedRoute";
import Users, { PrivateRoute } from "./pages/Users";
import UserDetail from "./pages/UserDetail";

import UserProfile from "./pages/UserProfile";
import CreateUser from "./pages/CreateUser";


function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route
          path="/home"
          element={
            <ProtectedRoute roleRequired="admin">
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        {/* <Route path="/users" element={<Users />} /> */}

        <Route path="/users" element={<PrivateRoute requiredRole="admin"><Users /></PrivateRoute>}/>

        <Route path="/users/:id/edit" element={<UserDetail />} />
        
        <Route path="/users/:id" element={<UserProfile />} />

        <Route path="/users/create" element={<CreateUser />} />

        {/* Option : rediriger la racine vers /login */}
        <Route path="/" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
