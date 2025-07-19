import React from 'react'
import { useAuth } from "../context/UseAuth";
import { Navigate } from "react-router-dom";


function ProtectedRoutes({ children, requireAdmin = false }) {
    const { userLoggedIn, currentUser, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (!userLoggedIn) {
    return <Navigate to="/login" replace />;
  }

  if (requireAdmin && !currentUser?.isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;

}

export default ProtectedRoutes;