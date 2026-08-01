import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

// =============================================================================
// VLRK - Protected Route Component
// =============================================================================
// Wraps routes to enforce authentication and role-based access
// - If not authenticated → redirect to /login
// - If authenticated but wrong role → redirect to user's dashboard
// =============================================================================

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, user, loading, dashboardPath } = useAuth();
  const location = useLocation();

  // Show nothing while checking auth state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Not logged in → go to login
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Logged in but role not allowed → go to own dashboard
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={dashboardPath} replace />;
  }

  return children;
};

export default ProtectedRoute;
