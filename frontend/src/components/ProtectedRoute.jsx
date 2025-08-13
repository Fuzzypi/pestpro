import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../lib/auth';

const ProtectedRoute = () => {
  const { user } = useAuth();

  if (!user) {
    // If no user is logged in, redirect to the /login page
    return <Navigate to="/login" />;
  }

  // If a user is logged in, render the child component (e.g., the Layout)
  return <Outlet />;
};

export default ProtectedRoute;
