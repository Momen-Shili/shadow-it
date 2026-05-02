import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import RtlLayout from "layouts/rtl";
import AdminLayout from "layouts/admin";
import AuthLayout from "layouts/auth";
import { useAuth } from "context/AuthContext";

function PrivateRoute({ children }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/auth/sign-in" replace />;
}

const App = () => {
  return (
    <Routes>
      <Route path="auth/*" element={<AuthLayout />} />
      <Route
        path="admin/*"
        element={
          <PrivateRoute>
            <AdminLayout />
          </PrivateRoute>
        }
      />
      <Route
        path="rtl/*"
        element={
          <PrivateRoute>
            <RtlLayout />
          </PrivateRoute>
        }
      />
      <Route path="/" element={<Navigate to="/admin/default" replace />} />
    </Routes>
  );
};

export default App;
