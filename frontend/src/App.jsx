import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import MainLayout from './layouts/MainLayout';
import AuthLayout from './layouts/AuthLayout';
import Spinner from './components/common/Loader';
import ErrorBoundary from './components/common/ErrorBoundary';

// Pages
import Home from './pages/Home';
import Explore from './pages/Explore';
import PropertyDetails from './pages/PropertyDetails';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import MyBookings from './pages/MyBookings';
import MyProperties from './pages/MyProperties';
import RenterDashboard from './pages/RenterDashboard';
import OwnerDashboard from './pages/OwnerDashboard';
import AdminDashboard from './pages/AdminDashboard';
import AddEditProperty from './pages/AddEditProperty';
import NotFound from './pages/NotFound';

// Protected Route Guard
const ProtectedRoute = ({ children, requiredRole = null }) => {
  const { isAuthenticated, user, isHost, isAdmin, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  if (requiredRole === 'admin' && !isAdmin) {
    return <Navigate to="/dashboard/renter" replace />;
  }

  if (requiredRole === 'host' && !isHost && !isAdmin) {
    return <Navigate to="/dashboard/renter" replace />;
  }

  return children;
};

// Intelligent Dashboard Switcher
const DashboardRedirect = () => {
  const { isHost, isAdmin, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (isAdmin) return <Navigate to="/dashboard/admin" replace />;
  if (isHost) return <Navigate to="/dashboard/owner" replace />;
  return <Navigate to="/dashboard/renter" replace />;
};

// Guest Only Guard
const GuestRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return children;
};

function App() {
  return (
    <Routes>
      {/* Main Application Layout for General & Dashboard Pages */}
      <Route element={<MainLayout />}>
        {/* Public Pages */}
        <Route path="/" element={<Home />} />
        <Route path="/explore" element={<Explore />} />
        <Route path="/properties" element={<Navigate to="/explore" replace />} />
        <Route path="/properties/:id" element={<PropertyDetails />} />

        {/* Dashboard root redirect */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardRedirect />
            </ProtectedRoute>
          }
        />

        {/* Dedicated Separate Role Dashboards */}
        <Route
          path="/dashboard/renter"
          element={
            <ProtectedRoute>
              <ErrorBoundary>
                <RenterDashboard />
              </ErrorBoundary>
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/owner"
          element={
            <ProtectedRoute requiredRole="host">
              <ErrorBoundary>
                <OwnerDashboard />
              </ErrorBoundary>
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/admin"
          element={
            <ProtectedRoute requiredRole="admin">
              <ErrorBoundary>
                <AdminDashboard />
              </ErrorBoundary>
            </ProtectedRoute>
          }
        />

        {/* Convenient Route Aliases (Underscores & Short URLs) */}
        <Route path="/renter" element={<Navigate to="/dashboard/renter" replace />} />
        <Route path="/renter_dashboard" element={<Navigate to="/dashboard/renter" replace />} />
        <Route path="/owner" element={<Navigate to="/dashboard/owner" replace />} />
        <Route path="/owner_dashboard" element={<Navigate to="/dashboard/owner" replace />} />
        <Route path="/host" element={<Navigate to="/dashboard/owner" replace />} />
        <Route path="/admin" element={<Navigate to="/dashboard/admin" replace />} />
        <Route path="/admin_dashboard" element={<Navigate to="/dashboard/admin" replace />} />

        {/* Management Pages */}
        <Route
          path="/my-bookings"
          element={
            <ProtectedRoute>
              <ErrorBoundary>
                <MyBookings />
              </ErrorBoundary>
            </ProtectedRoute>
          }
        />
        <Route path="/my_bookings" element={<Navigate to="/my-bookings" replace />} />

        <Route
          path="/my-properties"
          element={
            <ProtectedRoute requiredRole="host">
              <ErrorBoundary>
                <MyProperties />
              </ErrorBoundary>
            </ProtectedRoute>
          }
        />
        <Route path="/my_properties" element={<Navigate to="/my-properties" replace />} />

        <Route
          path="/properties/new"
          element={
            <ProtectedRoute>
              <ErrorBoundary>
                <AddEditProperty />
              </ErrorBoundary>
            </ProtectedRoute>
          }
        />
        <Route
          path="/properties/:id/edit"
          element={
            <ProtectedRoute>
              <ErrorBoundary>
                <AddEditProperty />
              </ErrorBoundary>
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <ErrorBoundary>
                <Profile />
              </ErrorBoundary>
            </ProtectedRoute>
          }
        />

        {/* 404 Catch-All */}
        <Route path="*" element={<NotFound />} />
      </Route>

      {/* Auth Layout for Sign In & Sign Up */}
      <Route
        element={
          <GuestRoute>
            <AuthLayout />
          </GuestRoute>
        }
      >
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Route>
    </Routes>
  );
}

export default App;
