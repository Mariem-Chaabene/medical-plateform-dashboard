import { Navigate } from "react-router-dom";
import React from "react";


type ProtectedRouteProps = {
  children: React.ReactNode;
  roleRequired?: string;
};

export default function ProtectedRoute({ children, roleRequired }: ProtectedRouteProps): JSX.Element | null {
  const token = localStorage.getItem("token");
  const role  = localStorage.getItem("role");

  if (!token) {
    return <Navigate to="/login" replace />;
  }
  if (roleRequired && role !== roleRequired) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>; // Toujours retourne un JSX
}